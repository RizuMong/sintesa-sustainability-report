import { createMockApi } from './api'
import type { EvaluationGriQuantitative } from '@/types'

export const evaluateGriQuantitativeApi = createMockApi<EvaluationGriQuantitative>([
  {
    id: '1',
    indicator: 'GHG Emission Scope 1',
    period: 'FY2026 Q1',
    value: '1.250 tCO2e',
    requestor: 'Aulia Rahman',
    note: '',
    status: 'submitted',
    actor: 'Aulia Rahman',
    updatedAt: '2026-01-02T09:12:00+07:00',
  },
  {
    id: '2',
    indicator: 'Konsumsi Air',
    period: 'FY2026 Q1',
    value: '340 m3',
    requestor: 'Dewi Lestari',
    note: '',
    status: 'draft',
    actor: 'Dewi Lestari',
    updatedAt: '2026-01-01T14:00:00+07:00',
  },
])
