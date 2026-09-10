// Pure contract-diff layer for GET /v1/strategic-insight/gri-quantitative.
//
// Takes already-fetched payloads as plain arguments — no HTTP, no Bruno-env lookup, no network of
// any kind. scripts/verify-api.ts (the coordinator's module) owns fetching; this module only
// answers "given what the backend actually sent, does it match the contract, and would the real
// dashboard render from it?" Reuses the aggregate.ts/chart-spec.ts helpers the page itself uses,
// so a "renders fine" verdict here means the same thing it means on screen.
//
// Gap IDs referenced below (A2, A4, B2, ...) are docs/dashboard-gri-quantitative-api-gaps.md.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  orderedCategories,
  periodsOf,
  seriesByDimension,
  summaryValue,
} from '../../src/services/strategic-insight/aggregate.ts'
import { chartCardsFor, categoryCaption } from '../../src/services/strategic-insight/chart-spec.ts'
import { nextTabIndex } from '../../src/services/strategic-insight/tab-index.ts'

// ---- contract loader (shared with src/services/strategic-insight/contract.check.ts) ----
//
// fileURLToPath, not .pathname — the collection path contains a space, which .pathname
// percent-encodes instead of decoding back to a literal space.
const COLLECTION = fileURLToPath(
  new URL('../../api/Dashboard/GRI - Quantitative.yml', import.meta.url),
)

// The collection is a Bruno .yml with JSON embedded in a string field, and this repo has no YAML
// parser dependency. Python is already required by the repo's tooling, so shell out rather than
// add one for a single check. Extracted here (rather than left duplicated inside
// contract.check.ts) so there is exactly one place that knows how to read the normative example —
// contract.check.ts now imports this instead of carrying its own copy.
export function loadContractExample(
  exampleName = 'Response Dummy',
): StrategicInsightGriQuantitativeResponse {
  const out = execFileSync(
    'python3',
    [
      '-c',
      [
        'import yaml,json,sys',
        'd=yaml.safe_load(open(sys.argv[1]))',
        'name=sys.argv[2]',
        "ex=[e for e in d['examples'] if e['name']==name]",
        "assert ex, f'example {name!r} not found in {sys.argv[1]}'",
        "sys.stdout.write(json.dumps(json.loads(ex[0]['response']['body']['data'])['data']))",
      ].join('\n'),
      COLLECTION,
      exampleName,
    ],
    { encoding: 'utf8' },
  )
  return JSON.parse(out) as StrategicInsightGriQuantitativeResponse
}

// ---- report shapes ----

export type FindingSeverity = 'error' | 'warning' | 'info'

export interface Finding {
  severity: FindingSeverity
  code: string
  path: string
  message: string
  gap?: string
}

export interface KpiCardResult {
  key: string
  ok: boolean
  value?: number
}

export interface ChartResult {
  id: string
  ok: boolean
  seriesCount: number
  emptySeries: string[]
}

export interface CategoryRenderability {
  tab: string
  kpiCards: KpiCardResult[]
  charts: ChartResult[]
}

export interface DiffReport {
  findings: Finding[]
  summary: { categories: number; items: number; errors: number; warnings: number }
  renderability: CategoryRenderability[]
}

const AGGREGATIONS = new Set(['SUM', 'PERCENTAGE', 'AVERAGE'])
const INPUT_TYPES = new Set(['NUMBER', 'PERCENTAGE', 'TEXT', 'DATE', 'BOOLEAN'])

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function err(findings: Finding[], code: string, path: string, message: string, gap?: string) {
  findings.push({ severity: 'error', code, path, message, gap })
}
function warn(findings: Finding[], code: string, path: string, message: string, gap?: string) {
  findings.push({ severity: 'warning', code, path, message, gap })
}
// ponytail: no rule currently emits 'info' — Finding.severity still declares it per spec, and
// formatDiffReport already handles it, so a future rule (e.g. "unit missing from master unit
// vocabulary", gap B1) can add one without touching the report plumbing.

// ---- shape ----
//
// Reads the real shape from types.d.ts (StrategicInsightGriCategory) rather than guessing: a
// category needs category_id (Ref2 identity — A1), gri_codes[], sequence, dimensions[],
// summary[], items[].
function checkShape(
  live: unknown,
  findings: Finding[],
): live is StrategicInsightGriQuantitativeResponse {
  if (!Array.isArray(live)) {
    err(findings, 'SHAPE_NOT_ARRAY', 'data', 'top-level `data` must be an array of categories (no wrapper object)')
    return false
  }
  let ok = true
  live.forEach((raw, i) => {
    const path = `data.categories[${i}]`
    if (!isRecord(raw)) {
      err(findings, 'SHAPE_CATEGORY_NOT_OBJECT', path, 'category entry is not an object')
      ok = false
      return
    }
    if (!isRecord(raw.category_id) || typeof raw.category_id.id !== 'string' || typeof raw.category_id.name !== 'string') {
      err(
        findings,
        'SHAPE_MISSING_CATEGORY_ID',
        `${path}.category_id`,
        'category_id must be a Ref2 ({id, name}) resolved against master-category, not a bare string',
        'A1',
      )
      ok = false
    }
    if (!Array.isArray(raw.gri_codes)) {
      err(findings, 'SHAPE_MISSING_GRI_CODES', `${path}.gri_codes`, 'gri_codes[] is missing (drives the tab caption)')
      ok = false
    }
    if (typeof raw.sequence !== 'number') {
      err(findings, 'SHAPE_MISSING_SEQUENCE', `${path}.sequence`, 'sequence is missing or not a number')
      ok = false
    }
    if (!Array.isArray(raw.dimensions)) {
      err(findings, 'SHAPE_MISSING_DIMENSIONS', `${path}.dimensions`, 'dimensions[] is missing — no chart can be grouped', 'A2')
      ok = false
    }
    if (!Array.isArray(raw.summary)) {
      err(findings, 'SHAPE_MISSING_SUMMARY', `${path}.summary`, 'summary[] is missing — no KPI card can render', 'A3')
      ok = false
    }
    if (!Array.isArray(raw.items)) {
      err(findings, 'SHAPE_MISSING_ITEMS', `${path}.items`, 'items[] is missing — no chart has data')
      ok = false
    }
  })
  return ok
}

// ---- enums ----
function checkEnums(live: StrategicInsightGriQuantitativeResponse, findings: Finding[]) {
  live.forEach((category, ci) => {
    const cpath = `data.categories[${ci}]`
    for (const s of category.summary ?? []) {
      if (!AGGREGATIONS.has(s.aggregation)) {
        err(
          findings,
          'ENUM_UNKNOWN_AGGREGATION',
          `${cpath}.summary[key=${s.key}].aggregation`,
          `unknown aggregation '${s.aggregation}' (declared set: SUM|PERCENTAGE|AVERAGE)`,
          'B2',
        )
      }
    }
    ;(category.items ?? []).forEach((item, ii) => {
      const ipath = `${cpath}.items[${ii}]`
      if (!AGGREGATIONS.has(item.aggregation)) {
        err(
          findings,
          'ENUM_UNKNOWN_AGGREGATION',
          `${ipath}.aggregation`,
          `unknown aggregation '${item.aggregation}' on item ${item.id}`,
          'B2',
        )
      }
      const inputType = item.input_type as unknown
      if (inputType === 'YES_NO') {
        // MKI V2 uses YES_NO for the same concept this contract calls BOOLEAN — a real
        // disagreement between the two backends, not a generic unknown enum value (gap B2).
        err(
          findings,
          'ENUM_INPUT_TYPE_YES_NO',
          `${ipath}.input_type`,
          `input_type 'YES_NO' — this contract declares BOOLEAN for the same concept (gap B2)`,
          'B2',
        )
      } else if (!INPUT_TYPES.has(item.input_type)) {
        err(
          findings,
          'ENUM_UNKNOWN_INPUT_TYPE',
          `${ipath}.input_type`,
          `unknown input_type '${item.input_type}' (declared set: NUMBER|PERCENTAGE|TEXT|DATE|BOOLEAN)`,
          'B2',
        )
      }
    })
  })
}

// ---- grouping integrity (gap A2) ----
function checkGrouping(live: StrategicInsightGriQuantitativeResponse, findings: Finding[]) {
  live.forEach((category, ci) => {
    const cpath = `data.categories[${ci}]`
    const dimensions = category.dimensions ?? []
    const dimByKey = new Map(dimensions.map((d) => [d.key, d]))
    const usedMembers = new Map<string, Set<string>>() // dimensionKey -> member keys actually referenced

    ;(category.items ?? []).forEach((item, ii) => {
      const ipath = `${cpath}.items[${ii}]`
      for (const [labelKey, memberKey] of Object.entries(item.labels ?? {})) {
        const dimension = dimByKey.get(labelKey)
        if (!dimension) {
          err(
            findings,
            'LABEL_UNDECLARED_DIMENSION',
            `${ipath}.labels.${labelKey}`,
            `item ${item.id} labels on '${labelKey}', which is not a declared dimension — its chart series will silently render empty`,
            'A2',
          )
          continue
        }
        const memberOk = dimension.members.some((m) => m.key === memberKey)
        if (!memberOk) {
          err(
            findings,
            'LABEL_UNDECLARED_MEMBER',
            `${ipath}.labels.${labelKey}`,
            `item ${item.id} labels '${labelKey}' as '${memberKey}', which is not a declared member of that dimension`,
            'A2',
          )
          continue
        }
        if (!usedMembers.has(labelKey)) usedMembers.set(labelKey, new Set())
        usedMembers.get(labelKey)!.add(memberKey)
      }
    })

    for (const dimension of dimensions) {
      const used = usedMembers.get(dimension.key) ?? new Set()
      for (const member of dimension.members) {
        if (!used.has(member.key)) {
          warn(
            findings,
            'DIMENSION_MEMBER_UNUSED',
            `${cpath}.dimensions[key=${dimension.key}].members[key=${member.key}]`,
            `declared member '${member.key}' of '${dimension.key}' is referenced by no item — its chart series renders empty`,
          )
        }
      }
    }
  })
}

// ---- numeric sanity ----
function checkNumeric(live: StrategicInsightGriQuantitativeResponse, findings: Finding[]) {
  live.forEach((category, ci) => {
    const cpath = `data.categories[${ci}]`
    for (const s of category.summary ?? []) {
      const spath = `${cpath}.summary[key=${s.key}]`
      if (typeof s.value !== 'number' || !Number.isFinite(s.value)) {
        err(findings, 'NUMERIC_NON_FINITE', `${spath}.value`, `summary '${s.key}' value is not a finite number`)
        continue
      }
      if (s.key.includes('ratio') && (s.value < 0 || s.value > 100) && s.aggregation === 'PERCENTAGE') {
        err(findings, 'NUMERIC_PERCENTAGE_OUT_OF_RANGE', `${spath}.value`, `summary '${s.key}' percentage ${s.value} is outside 0..100`)
      }
    }
    ;(category.items ?? []).forEach((item, ii) => {
      const ipath = `${cpath}.items[${ii}]`
      // type agreement with input_type
      const t = item.input_type
      const v = item.value
      if ((t === 'NUMBER' || t === 'PERCENTAGE') && typeof v !== 'number') {
        err(findings, 'NUMERIC_TYPE_MISMATCH', `${ipath}.value`, `input_type '${t}' but value is ${typeof v}, not number`)
        return
      }
      if (t === 'BOOLEAN' && typeof v !== 'boolean') {
        err(findings, 'NUMERIC_TYPE_MISMATCH', `${ipath}.value`, `input_type 'BOOLEAN' but value is ${typeof v}, not boolean`)
        return
      }
      if ((t === 'TEXT' || t === 'DATE') && typeof v !== 'string') {
        err(findings, 'NUMERIC_TYPE_MISMATCH', `${ipath}.value`, `input_type '${t}' but value is ${typeof v}, not string`)
        return
      }
      if (typeof v !== 'number') return
      if (!Number.isFinite(v)) {
        err(findings, 'NUMERIC_NON_FINITE', `${ipath}.value`, `item ${item.id} value is not finite (NaN/Infinity)`)
        return
      }
      if (t === 'PERCENTAGE' && (v < 0 || v > 100)) {
        err(findings, 'NUMERIC_PERCENTAGE_OUT_OF_RANGE', `${ipath}.value`, `item ${item.id} percentage ${v} is outside 0..100`)
      }
      // SUM-combined absolute metrics (counts, tons, GJ, ML, hours) are never negative; AVERAGE
      // metrics (ratios) legitimately can carry small negatives only if the master data defines
      // them that way, which none of this contract's declared metrics do — so this check is
      // conservative and only fires on SUM.
      if (item.aggregation === 'SUM' && v < 0) {
        err(findings, 'NUMERIC_NEGATIVE_ABSOLUTE', `${ipath}.value`, `item ${item.id} is aggregation SUM but value ${v} is negative`)
      }
    })
  })
}

// ---- contract coverage ----
function categoryKey(category: { category_id?: { id?: string; name?: string } }): string {
  return category.category_id?.id ?? category.category_id?.name ?? '<unknown>'
}

function checkContractCoverage(
  live: StrategicInsightGriQuantitativeResponse,
  contract: StrategicInsightGriQuantitativeResponse,
  findings: Finding[],
) {
  const liveByKey = new Map(live.map((c) => [categoryKey(c), c]))
  const contractByKey = new Map(contract.map((c) => [categoryKey(c), c]))

  for (const [key, contractCategory] of contractByKey) {
    const liveCategory = liveByKey.get(key)
    if (!liveCategory) {
      err(
        findings,
        'CONTRACT_CATEGORY_MISSING',
        `data.categories[category_id=${key}]`,
        `category '${contractCategory.category_id.name}' is in the committed contract but absent from the live response`,
      )
      continue
    }
    const liveSummaryKeys = new Set((liveCategory.summary ?? []).map((s) => s.key))
    for (const s of contractCategory.summary ?? []) {
      if (!liveSummaryKeys.has(s.key)) {
        err(
          findings,
          'CONTRACT_SUMMARY_KEY_MISSING',
          `data.categories[category_id=${key}].summary[key=${s.key}]`,
          `KPI card '${s.key}' is in the contract but missing live — that card renders blank`,
        )
      }
    }
  }
  for (const key of liveByKey.keys()) {
    if (!contractByKey.has(key)) {
      warn(
        findings,
        'CONTRACT_CATEGORY_EXTRA',
        `data.categories[category_id=${key}]`,
        `category '${key}' appears live but is not in the committed contract example — update the contract`,
      )
    }
  }
}

// ---- scope rule (gap A4) ----
//
// items[] is documented as unfiltered by period/entity_id — every trend chart and the
// PT-comparison chart plot the full history regardless of the active filter. A backend that
// prunes items[] under a filter silently empties those charts.
export function diffFilterScope(
  unfiltered: unknown,
  filtered: unknown,
  filter: { period?: string | number; entity_id?: string; category_id?: string },
): DiffReport {
  const findings: Finding[] = []
  const base = diffGriQuantitative(unfiltered)
  if (!Array.isArray(unfiltered) || !Array.isArray(filtered)) {
    err(findings, 'SCOPE_NOT_ARRAY', 'data', 'both unfiltered and filtered responses must be arrays of categories')
    return finalizeReport(findings, [], base.renderability)
  }
  const baseByKey = new Map(
    (unfiltered as StrategicInsightGriQuantitativeResponse).map((c) => [categoryKey(c), c]),
  )
  for (const category of filtered as StrategicInsightGriQuantitativeResponse) {
    const key = categoryKey(category)
    const baseline = baseByKey.get(key)
    if (!baseline) continue // contract coverage already reports unknown categories
    const basePeriods = new Set(periodsOf(baseline.items ?? []))
    const basePeriodsForFilter =
      filter.period !== undefined ? basePeriods : basePeriods // period narrows nothing on items
    const filteredPeriods = new Set(periodsOf(category.items ?? []))
    const baseEntities = new Set((baseline.items ?? []).map((i) => i.entity.id))
    const filteredEntities = new Set((category.items ?? []).map((i) => i.entity.id))

    for (const p of basePeriodsForFilter) {
      if (!filteredPeriods.has(p)) {
        err(
          findings,
          'SCOPE_ITEMS_FILTERED',
          `data.categories[category_id=${key}].items[*].period`,
          `filter ${JSON.stringify(filter)} dropped period ${p} from items[] — trend charts on this tab will lose a data point`,
          'A4',
        )
      }
    }
    for (const e of baseEntities) {
      if (!filteredEntities.has(e)) {
        err(
          findings,
          'SCOPE_ITEMS_FILTERED',
          `data.categories[category_id=${key}].items[*].entity`,
          `filter ${JSON.stringify(filter)} dropped entity '${e}' from items[] — the PT-comparison chart will lose a bar`,
          'A4',
        )
      }
    }
  }
  return finalizeReport(findings, filtered as StrategicInsightGriQuantitativeResponse, base.renderability)
}

function finalizeReport(
  findings: Finding[],
  live: StrategicInsightGriQuantitativeResponse,
  renderability: CategoryRenderability[],
): DiffReport {
  const errors = findings.filter((f) => f.severity === 'error').length
  const warnings = findings.filter((f) => f.severity === 'warning').length
  const items = live.reduce((sum, c) => sum + (c.items?.length ?? 0), 0)
  return {
    findings,
    summary: { categories: live.length, items, errors, warnings },
    renderability,
  }
}

// ---- renderability ----
//
// Runs the live payload through the same helpers GriQuantitativePage.vue uses, so the report
// answers the headline question directly: would the real dashboard render from this?
function buildRenderability(live: StrategicInsightGriQuantitativeResponse): CategoryRenderability[] {
  const tabs = orderedCategories(live)
  const ids = tabs.map((c) => c.category_id?.id ?? categoryKey(c))
  // Sanity-check tab identity resolution the same way the page's tab strip does: after an
  // unfiltered render the first category should resolve to index 0 on first mount.
  nextTabIndex(ids, null, 0)

  return tabs.map((category) => {
    const caption = categoryCaption(category)
    const tab = caption || category.category_id?.name || categoryKey(category)

    const kpiCards: KpiCardResult[] = (category.summary ?? []).map((s) => {
      const kpi = summaryValue(category, s.key)
      return { key: s.key, ok: kpi !== undefined && Number.isFinite(kpi.value), value: kpi?.value }
    })

    const charts: ChartResult[] = (category.dimensions ?? []).map((dimension) => {
      const series = seriesByDimension(category, dimension.key)
      const emptySeries = series.filter((s) => s.data.every((v) => v === 0)).map((s) => s.key)
      return {
        id: dimension.key,
        ok: series.length === dimension.members.length,
        seriesCount: series.length,
        emptySeries,
      }
    })

    // chartCardsFor exercises the concrete per-tab card builders (widths, kinds, dropped-if-empty
    // rule) rather than just the raw per-dimension series above; a category chartCardsFor cannot
    // resolve to a known tab falls back to genericCards and still returns something rather than
    // throwing, so this call is safe even for a category not in the mockup's 8.
    chartCardsFor(category)

    return { tab, kpiCards, charts }
  })
}

// ---- entry point ----
export function diffGriQuantitative(
  live: unknown,
  opts?: {
    contract?: StrategicInsightGriQuantitativeResponse
    filter?: { period?: string | number; entity_id?: string; category_id?: string }
  },
): DiffReport {
  const findings: Finding[] = []
  const shapeOk = checkShape(live, findings)
  if (!shapeOk) {
    return finalizeReport(findings, [], [])
  }
  const data = live // narrowed by checkShape

  checkEnums(data, findings)
  checkGrouping(data, findings)
  checkNumeric(data, findings)
  if (opts?.contract) checkContractCoverage(data, opts.contract, findings)

  const renderability = buildRenderability(data)

  if (opts?.filter && opts.contract) {
    const scope = diffFilterScope(opts.contract, data, opts.filter)
    findings.push(...scope.findings)
  }

  return finalizeReport(findings, data, renderability)
}

// ---- terminal report formatting ----
//
// Plain ASCII; a tiny inline ANSI helper for color that degrades to no-op when the output is not
// a TTY or NO_COLOR is set — no color library, per the no-new-dependencies rule.
function colorize(useColor: boolean) {
  const wrap = (code: string) => (s: string) => (useColor ? `\u001b[${code}m${s}\u001b[0m` : s)
  return { red: wrap('31'), yellow: wrap('33'), cyan: wrap('36'), dim: wrap('90'), bold: wrap('1') }
}

export function formatDiffReport(report: DiffReport, opts?: { verbose?: boolean }): string {
  const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
  const c = colorize(useColor)
  const lines: string[] = []
  const { categories, items, errors, warnings } = report.summary
  lines.push(
    `${c.bold('summary')}  categories=${categories} items=${items} ` +
      `${errors ? c.red(`errors=${errors}`) : 'errors=0'} ` +
      `${warnings ? c.yellow(`warnings=${warnings}`) : 'warnings=0'}`,
  )

  const verbose = opts?.verbose ?? false
  const toShow = verbose ? report.findings : report.findings.filter((f) => f.severity !== 'info')
  for (const f of toShow) {
    const tag = f.severity === 'error' ? c.red('ERROR  ') : f.severity === 'warning' ? c.yellow('WARN   ') : c.dim('INFO   ')
    const gap = f.gap ? c.dim(` [${f.gap}]`) : ''
    lines.push(`  ${tag} ${f.code.padEnd(28)} ${f.path}${gap}`)
    lines.push(`           ${f.message}`)
  }

  if (verbose) {
    lines.push('')
    lines.push(c.bold('renderability'))
    for (const r of report.renderability) {
      const kpiOk = r.kpiCards.filter((k) => k.ok).length
      const chartOk = r.charts.filter((k) => k.ok).length
      lines.push(`  ${c.cyan(r.tab.padEnd(32))} kpi ${kpiOk}/${r.kpiCards.length}  charts ${chartOk}/${r.charts.length}`)
      for (const k of r.kpiCards.filter((k) => !k.ok)) {
        lines.push(`      ${c.yellow('kpi blank:')} ${k.key}`)
      }
      for (const ch of r.charts) {
        if (ch.emptySeries.length > 0) {
          lines.push(`      ${c.yellow('empty series:')} ${ch.id} -> ${ch.emptySeries.join(', ')}`)
        }
      }
    }
  }

  return lines.join('\n')
}
