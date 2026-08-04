import { createMockApi } from './api'
import type { MasterKeyIndicatorQuantitative } from '@/types'

export const masterKeyIndicatorQuantitativeApi = createMockApi<MasterKeyIndicatorQuantitative>([
  { id: '1', name: 'GHG Emission Scope 1', code: 'GRI-305-1', unit: 'tCO2e', category: 'Emisi' },
  { id: '2', name: 'Konsumsi Air', code: 'GRI-303-3', unit: 'm3', category: 'Air' },
])
