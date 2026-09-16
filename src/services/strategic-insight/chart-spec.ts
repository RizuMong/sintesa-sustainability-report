// Pure, dependency-free chart-card builder for GriQuantitativePage.vue — see
// docs/dashboard-gri-quantitative-mockup-spec.md sections 2 and 4 for the contract this file
// implements. No '@/' alias, no vue: this must load under a plain `node --experimental-strip-types`
// runner (see chart-spec.check.ts).
import { aggregateItems, itemsAt, periodsOf, totalsByEntity } from './aggregate.ts'

export type ChartCardWidth = 'half' | 'full'
export type ChartCardKind = 'bar' | 'bar-stacked' | 'bar-horizontal' | 'line' | 'doughnut' | 'pie'

export interface ChartCardSeries {
  label: string
  data: number[]
}

export interface ChartCard {
  id: string
  title: string
  caption: string
  kind: ChartCardKind
  width: ChartCardWidth
  labels: string[]
  datasets: ChartCardSeries[]
}

type Member = { key: string; name: string }

// One series per member of `dimensionKey`, one point per period, values combined through
// aggregateItems() (never summed directly) so AVERAGE metrics (salary ratios, training hours)
// stay averages rather than turning into out-of-range sums (spec §4).
function seriesOverPeriods(
  items: StrategicInsightGriItem[],
  dimensionKey: string,
  members: Member[],
  periods: number[],
): ChartCardSeries[] {
  return members.map((member) => ({
    label: member.name,
    data: periods.map((period) =>
      aggregateItems(itemsAt(items, dimensionKey, member.key).filter((i) => i.period === period)),
    ),
  }))
}

// One value per member, summed/averaged across every period — for donut/pie/single-bar cards that
// show a totals breakdown rather than a trend.
function totalsOverMembers(
  items: StrategicInsightGriItem[],
  dimensionKey: string,
  members: Member[],
): ChartCardSeries {
  return {
    label: 'Total',
    data: members.map((member) => aggregateItems(itemsAt(items, dimensionKey, member.key))),
  }
}

// One value per period, combining every item regardless of dimension — the "Total" line in trend
// charts (e.g. total headcount across both genders).
function totalPerPeriod(items: StrategicInsightGriItem[], periods: number[]): number[] {
  return periods.map((period) => aggregateItems(items.filter((i) => i.period === period)))
}

function byMetric(items: StrategicInsightGriItem[], metricKey: string): StrategicInsightGriItem[] {
  return items.filter((i) => i.metric_key === metricKey)
}

function membersOf(category: StrategicInsightGriCategory, dimensionKey: string): Member[] {
  return category.dimensions.find((d) => d.key === dimensionKey)?.members ?? []
}

function allZero(datasets: ChartCardSeries[]): boolean {
  return datasets.every((ds) => ds.data.every((v) => v === 0))
}

// A card is dropped rather than plotted flat when every dataset it carries is all-zero/empty
// (spec §4 last bullet) — e.g. a dimension member the current filter/period never populated.
function card(input: Omit<ChartCard, 'datasets'> & { datasets: ChartCardSeries[] }): ChartCard | null {
  if (input.datasets.length === 0 || allZero(input.datasets)) return null
  return input
}

// ---- tab resolver ----
//
// Keyed on `gri_codes`, not `category_id.name`: the name is a localized, editable master-data
// label (mki-master-category), while gri_codes are the stable disclosure numbers the mockup and
// this spec are actually organized around. A renamed "General" tab must still get the General
// layout; a category the resolver doesn't recognize falls through to the generic renderer instead
// of silently rendering nothing.
export type GriTabKey =
  | 'general'
  | 'energy'
  | 'waste'
  | 'water'
  | 'diversity'
  | 'employment'
  | 'ohs'
  | 'training'
  | null

function resolveTab(category: StrategicInsightGriCategory): GriTabKey {
  const codes = category.gri_codes
  const has = (prefix: string) => codes.some((c) => c === prefix || c.startsWith(`${prefix}-`))
  if (has('2-7') || has('2-8')) return 'general'
  if (has('302-1')) return 'energy'
  if (has('306-4') || has('306-5')) return 'waste'
  if (has('303-3') || has('303-4')) return 'water'
  if (has('405-1') || has('405-2')) return 'diversity'
  if (has('401-1') || has('401-3')) return 'employment'
  if (has('403-9')) return 'ohs'
  if (has('404-1')) return 'training'
  return null
}

const CAPTIONS: Record<Exclude<GriTabKey, null>, string> = {
  general: 'Total employees & non-employee workers',
  energy: 'Energy consumption within the organization',
  waste: 'Waste management',
  water: 'Water withdrawal & discharge',
  diversity: 'Diversity & equal opportunity',
  employment: 'Recruitment & parental leave',
  ohs: 'Occupational health & safety',
  training: 'Employee training & education',
}

export function categoryCaption(category: StrategicInsightGriCategory): string {
  const tab = resolveTab(category)
  return tab ? CAPTIONS[tab] : ''
}

// ---- per-tab card builders ----

function generalCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = category.items
  const periods = periodsOf(items)
  const gender = membersOf(category, 'gender')
  const status = membersOf(category, 'employment_status')
  const workerType = membersOf(category, 'worker_type')
  const entities = totalsByEntity(items)

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-general-gender-per-tahun',
      title: 'Gender by year',
      caption: 'GRI 2-7a',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'gender', gender, periods),
    }),
    card({
      id: 'gri-quant-general-status-karyawan-per-tahun',
      title: 'Employment status by year',
      caption: 'GRI 2-7b',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'employment_status', status, periods),
    }),
    card({
      id: 'gri-quant-general-tren-jumlah-karyawan',
      title: 'Employee headcount trend',
      caption: '',
      kind: 'line',
      width: 'half',
      labels: periods.map(String),
      datasets: [
        { label: 'Total', data: totalPerPeriod(itemsAt(items, 'gender', 'MALE').concat(itemsAt(items, 'gender', 'FEMALE')), periods) },
        {
          label: 'Permanent',
          data: periods.map((p) =>
            aggregateItems(itemsAt(items, 'employment_status', 'PERMANENT').filter((i) => i.period === p)),
          ),
        },
      ],
    }),
    card({
      id: 'gri-quant-general-komposisi-gender',
      title: 'Gender composition (%)',
      caption: '',
      kind: 'doughnut',
      width: 'half',
      labels: gender.map((m) => m.name),
      datasets: [totalsOverMembers(items, 'gender', gender)],
    }),
    entities.length > 1
      ? card({
          id: 'gri-quant-general-perbandingan-antar-pt',
          title: 'Total employees comparison across entities',
          caption: '',
          kind: 'bar-horizontal',
          width: 'full',
          labels: entities.map((e) => e.code),
          datasets: [{ label: 'Total employees', data: entities.map((e) => e.value) }],
        })
      : null,
    card({
      id: 'gri-quant-general-tipe-pekerja-non-karyawan',
      title: 'Non-employee worker type',
      caption: 'GRI 2-8a',
      kind: 'bar',
      width: 'half',
      labels: workerType.map((m) => m.name),
      datasets: [totalsOverMembers(items, 'worker_type', workerType)],
    }),
    card({
      id: 'gri-quant-general-komposisi-status-karyawan',
      title: 'Employment status composition (%)',
      caption: '',
      kind: 'pie',
      width: 'half',
      labels: status.map((m) => m.name),
      datasets: [totalsOverMembers(items, 'employment_status', status)],
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

function energyCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = category.items
  const periods = periodsOf(items)
  const renewability = membersOf(category, 'renewability')
  const fuelType = membersOf(category, 'fuel_type')

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-energy-konsumsi-per-tahun',
      title: 'Energy consumption by year (GJ)',
      caption: 'GRI 302-1a/b — Non-renewable vs Renewable',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'renewability', renewability, periods),
    }),
    card({
      id: 'gri-quant-energy-tren-konsumsi',
      title: 'Energy consumption trend',
      caption: 'GRI 302-1 — Total energy by year',
      kind: 'line',
      width: 'half',
      labels: periods.map(String),
      datasets: [{ label: 'Total', data: totalPerPeriod(items, periods) }],
    }),
    card({
      id: 'gri-quant-energy-breakdown-bahan-bakar',
      title: 'Non-renewable fuel type breakdown',
      caption: 'GRI 302-1a',
      kind: 'bar',
      width: 'full',
      labels: fuelType.map((m) => m.name),
      datasets: [totalsOverMembers(items, 'fuel_type', fuelType)],
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

function wasteCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = category.items
  const periods = periodsOf(items)
  const wasteRoute = membersOf(category, 'waste_route')
  const divertKeys = new Set(['RECYCLED', 'COMPOSTED', 'RECOVERY'])
  const disposalKeys = new Set(['LANDFILL', 'INCINERATION', 'OTHER'])
  const divertItems = byMetric(items, 'waste_diverted')
  const disposalItems = byMetric(items, 'waste_directed_to_disposal')

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-waste-dialihkan',
      title: 'Waste diverted from disposal (ton)',
      caption: 'GRI 306-4a — By composition',
      kind: 'bar-stacked',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(
        divertItems,
        'waste_route',
        wasteRoute.filter((m) => divertKeys.has(m.key)),
        periods,
      ),
    }),
    card({
      id: 'gri-quant-waste-dibuang',
      title: 'Waste directed to disposal (ton)',
      caption: 'GRI 306-5a — By composition',
      kind: 'bar-stacked',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(
        disposalItems,
        'waste_route',
        wasteRoute.filter((m) => disposalKeys.has(m.key)),
        periods,
      ),
    }),
    card({
      id: 'gri-quant-waste-tren-total',
      title: 'Total waste trend by year (ton)',
      caption: 'GRI 306-4 & 306-5 — Divert vs Disposal',
      kind: 'line',
      width: 'full',
      labels: periods.map(String),
      datasets: [
        { label: 'Divert', data: totalPerPeriod(divertItems, periods) },
        { label: 'Disposal', data: totalPerPeriod(disposalItems, periods) },
      ],
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

function waterCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = category.items
  const periods = periodsOf(items)
  const waterSource = membersOf(category, 'water_source')
  const withdrawal = itemsAt(items, 'water_flow', 'WITHDRAWAL')
  const discharge = itemsAt(items, 'water_flow', 'DISCHARGE')

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-water-penarikan-per-sumber',
      title: 'Water withdrawal by source (ML)',
      caption: 'GRI 303-3a',
      kind: 'bar-stacked',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(withdrawal, 'water_source', waterSource, periods),
    }),
    card({
      id: 'gri-quant-water-pembuangan-per-tujuan',
      title: 'Water discharge by destination (ML)',
      caption: 'GRI 303-4a',
      kind: 'bar-stacked',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(discharge, 'water_source', waterSource, periods),
    }),
    card({
      id: 'gri-quant-water-tren-penggunaan',
      title: 'Water usage trend (ML)',
      caption: 'GRI 303-3 & 303-4',
      kind: 'line',
      width: 'full',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'water_flow', membersOf(category, 'water_flow'), periods),
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

function diversityCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = category.items
  const periods = periodsOf(items)
  const gender = membersOf(category, 'gender')
  const ageBand = membersOf(category, 'age_band')
  const employeeCategory = membersOf(category, 'employee_category')

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-diversity-governance-gender',
      title: 'Governance body composition by gender',
      caption: 'GRI 405-1a',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(byMetric(items, 'governance_body_composition'), 'gender', gender, periods),
    }),
    card({
      id: 'gri-quant-diversity-distribusi-umur',
      title: 'Employee age group distribution',
      caption: 'GRI 405-1b',
      kind: 'bar-stacked',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(byMetric(items, 'employee_age_distribution'), 'age_band', ageBand, periods),
    }),
    card({
      id: 'gri-quant-diversity-rasio-gaji',
      title: 'Female-to-male salary ratio by category',
      caption: 'GRI 405-2a',
      kind: 'bar',
      width: 'full',
      labels: periods.map(String),
      datasets: seriesOverPeriods(
        byMetric(items, 'salary_ratio_female_to_male'),
        'employee_category',
        employeeCategory,
        periods,
      ),
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

function employmentCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = category.items
  const gender = membersOf(category, 'gender')
  const parentalStage = membersOf(category, 'parental_stage')
  const hireItems = byMetric(items, 'new_employee_hires')
  const parentalItems = byMetric(items, 'parental_leave')
  const hirePeriods = periodsOf(hireItems)

  // Parental leave: x-axis is parental_stage, series is gender — the one card whose axes are
  // both dimension members rather than periods, so it is built directly rather than via
  // seriesOverPeriods (which always puts periods on x).
  const parentalDatasets: ChartCardSeries[] = gender.map((g) => ({
    label: g.name,
    data: parentalStage.map((stage) =>
      aggregateItems(itemsAt(parentalItems, 'parental_stage', stage.key).filter((i) => i.labels['gender'] === g.key)),
    ),
  }))

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-employment-karyawan-baru',
      title: 'New employees by gender & age group',
      caption: 'GRI 401-1a',
      kind: 'bar',
      width: 'half',
      labels: hirePeriods.map(String),
      datasets: seriesOverPeriods(hireItems, 'gender', gender, hirePeriods),
    }),
    card({
      id: 'gri-quant-employment-cuti-orang-tua',
      title: 'Parental leave — entitled, took, and returned',
      caption: 'GRI 401-3a/b/c',
      kind: 'bar',
      width: 'half',
      labels: parentalStage.map((m) => m.name),
      datasets: parentalDatasets,
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

function ohsCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = byMetric(category.items, 'work_related_injuries')
  const periods = periodsOf(items)
  const incidentType = membersOf(category, 'incident_type').filter((m) => m.key !== 'HOURS_WORKED')
  const employmentStatus = membersOf(category, 'employment_status')
  const recordable = itemsAt(items, 'incident_type', 'RECORDABLE')

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-ohs-insiden-per-tahun',
      title: 'Occupational safety incidents by year',
      caption: 'GRI 403-9a',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'incident_type', incidentType, periods),
    }),
    card({
      id: 'gri-quant-ohs-tetap-vs-kontrak',
      title: 'Permanent vs contract incidents',
      caption: 'GRI 403-9a',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(recordable, 'employment_status', employmentStatus, periods),
    }),
    card({
      id: 'gri-quant-ohs-tren-kecelakaan',
      title: 'Hours worked & accident rate trend',
      caption: 'GRI 403-9a',
      kind: 'line',
      width: 'full',
      labels: periods.map(String),
      datasets: [
        {
          label: 'Recordable',
          data: periods.map((p) => aggregateItems(recordable.filter((i) => i.period === p))),
        },
      ],
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

function trainingCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = byMetric(category.items, 'avg_training_hours')
  const periods = periodsOf(items)
  const gender = membersOf(category, 'gender')
  const employeeCategory = membersOf(category, 'employee_category')

  const cards: (ChartCard | null)[] = [
    card({
      id: 'gri-quant-training-per-gender',
      title: 'Average training hours by gender',
      caption: 'GRI 404-1a',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'gender', gender, periods),
    }),
    card({
      id: 'gri-quant-training-per-kategori',
      title: 'Average training hours by employee category',
      caption: 'GRI 404-1a',
      kind: 'bar',
      width: 'half',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'employee_category', employeeCategory, periods),
    }),
    card({
      id: 'gri-quant-training-tren',
      title: 'Training hours trend by year',
      caption: 'GRI 404-1',
      kind: 'line',
      width: 'full',
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, 'gender', gender, periods),
    }),
  ]

  return cards.filter((c): c is ChartCard => c !== null)
}

// Fallback for a category the resolver doesn't recognize (new backend category, or the tab
// order/name changed) — one grouped bar chart per declared dimension, same as the page's
// original behaviour, so nothing renders empty just because it isn't one of the eight known tabs.
function genericCards(category: StrategicInsightGriCategory): ChartCard[] {
  const items = category.items
  const periods = periodsOf(items)
  const cards = category.dimensions.map((dimension, index) =>
    card({
      id: `gri-quant-generic-${index}-${dimension.key}`,
      title: dimension.name,
      caption: '',
      kind: 'bar' as ChartCardKind,
      width: 'half' as ChartCardWidth,
      labels: periods.map(String),
      datasets: seriesOverPeriods(items, dimension.key, dimension.members, periods),
    }),
  )
  return cards.filter((c): c is ChartCard => c !== null)
}

export function chartCardsFor(category: StrategicInsightGriCategory): ChartCard[] {
  switch (resolveTab(category)) {
    case 'general':
      return generalCards(category)
    case 'energy':
      return energyCards(category)
    case 'waste':
      return wasteCards(category)
    case 'water':
      return waterCards(category)
    case 'diversity':
      return diversityCards(category)
    case 'employment':
      return employmentCards(category)
    case 'ohs':
      return ohsCards(category)
    case 'training':
      return trainingCards(category)
    default:
      return genericCards(category)
  }
}
