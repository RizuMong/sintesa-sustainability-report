import type { MasterUnit } from '@/types'

const units: MasterUnit[] = [
  { id: 'unit-person', name: 'Person' },
  { id: 'unit-percent', name: '%' },
  { id: 'unit-gj', name: 'GJ' },
  { id: 'unit-tonco2e', name: 'Ton CO2e' },
  { id: 'unit-m3', name: 'm3' },
]

export const masterUnitApi = {
  index: async (): Promise<{ data: MasterUnit[] }> => ({ data: units }),
}
