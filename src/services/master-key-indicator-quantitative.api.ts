import { masterCategoryApi } from './master-category.api'
import { masterUnitApi } from './master-unit.api'
import type { MkiGriQuantitativeDetail, MkiGriQuantitativeSummary, MkiGriQuantitativePayload, MkiStatus } from '@/types'

let store: MkiGriQuantitativeDetail[] = [
  {
    id: 'mki-1',
    name: 'Work-related Injuries (403-9)',
    category: { id: 'cat-ohs', name: 'OHS' },
    code: '403-9',
    status: 'Active',
    columns: [{ key: 'employee_type', name: 'Employee Type', sequence: 1 }],
    metrics: [
      {
        key: 'number_of_injury',
        name: 'Number of Injury',
        input_type: 'NUMBER',
        unit: { id: 'unit-person', name: 'Person' },
        sequence: 1,
      },
      { key: 'rate', name: 'Rate', input_type: 'PERCENTAGE', unit: null, sequence: 2 },
    ],
    rows: [{ sequence: 1, labels: { employee_type: 'Contract' } }],
    updated_at: '2026-08-19T10:00:00Z',
  },
  {
    id: 'mki-2',
    name: 'New Hire and Employee Turnover (401-1)',
    category: { id: 'cat-hr', name: 'Human Resources' },
    code: '401-1',
    status: 'Active',
    columns: [
      { key: 'employee_type', name: 'Employee Type', sequence: 1 },
      { key: 'gender', name: 'Gender', sequence: 2 },
    ],
    metrics: [
      {
        key: 'new_hire_count',
        name: 'New Hire Count',
        input_type: 'NUMBER',
        unit: { id: 'unit-person', name: 'Person' },
        sequence: 1,
      },
      { key: 'turnover_rate', name: 'Turnover Rate', input_type: 'PERCENTAGE', unit: null, sequence: 2 },
      { key: 'effective_date', name: 'Effective Date', input_type: 'DATE', unit: null, sequence: 3 },
      { key: 'is_reported', name: 'Is Reported', input_type: 'YES_NO', unit: null, sequence: 4 },
    ],
    rows: [
      { sequence: 1, labels: { employee_type: 'Permanent', gender: 'Male' } },
      { sequence: 2, labels: { employee_type: 'Contract', gender: 'Female' } },
    ],
    updated_at: '2026-08-19T09:00:00Z',
  },
  {
    id: 'mki-3',
    name: 'Energy Consumption within Organization (302-1)',
    category: { id: 'cat-env', name: 'Environment' },
    code: '302-1',
    status: 'Inactive',
    columns: [{ key: 'energy_source', name: 'Energy Source', sequence: 1 }],
    metrics: [
      { key: 'consumption', name: 'Consumption', input_type: 'NUMBER', unit: { id: 'unit-gj', name: 'GJ' }, sequence: 1 },
    ],
    rows: [{ sequence: 1, labels: { energy_source: 'Electricity' } }],
    updated_at: '2026-08-18T08:00:00Z',
  },
]

function toSummary(item: MkiGriQuantitativeDetail): MkiGriQuantitativeSummary {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    code: item.code,
    status: item.status,
    updated_at: item.updated_at,
  }
}

async function resolvePayload(payload: MkiGriQuantitativePayload) {
  const [{ data: categories }, { data: units }] = await Promise.all([masterCategoryApi.index(), masterUnitApi.index()])
  return {
    name: payload.name,
    code: payload.code,
    category: categories.find((c) => c.id === payload.category.id) ?? { id: payload.category.id, name: '' },
    columns: payload.columns,
    metrics: payload.metrics.map((m) => ({
      ...m,
      unit: m.unit ? units.find((u) => u.id === m.unit!.id) ?? { id: m.unit.id, name: '' } : null,
    })),
    rows: payload.rows,
  }
}

export const masterKeyIndicatorQuantitativeApi = {
  async index(params?: {
    id?: string
    category_id?: string
    status?: MkiStatus
    search?: string
  }): Promise<{ data: MkiGriQuantitativeSummary[] } | MkiGriQuantitativeDetail | undefined> {
    if (params?.id) return store.find((i) => i.id === params.id)

    let filtered = store
    if (params?.category_id) filtered = filtered.filter((i) => i.category.id === params.category_id)
    if (params?.status) filtered = filtered.filter((i) => i.status === params.status)
    if (params?.search) {
      const q = params.search.toLowerCase()
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(q))
    }
    return { data: filtered.map(toSummary) }
  },

  async create(payload: MkiGriQuantitativePayload): Promise<MkiGriQuantitativeDetail> {
    const resolved = await resolvePayload(payload)
    const item: MkiGriQuantitativeDetail = {
      id: crypto.randomUUID(),
      ...resolved,
      status: 'Active',
      updated_at: new Date().toISOString(),
    }
    store.push(item)
    return item
  },

  async update(payload: MkiGriQuantitativePayload & { id: string }): Promise<MkiGriQuantitativeDetail | undefined> {
    const resolved = await resolvePayload(payload)
    store = store.map((i) => (i.id === payload.id ? { ...i, ...resolved, updated_at: new Date().toISOString() } : i))
    return store.find((i) => i.id === payload.id)
  },

  async remove({ id }: { id: string }): Promise<void> {
    store = store.map((i) => (i.id === id ? { ...i, status: 'Inactive', updated_at: new Date().toISOString() } : i))
  },
}
