import { createMockApi } from './api'
import type { GriQuantitativeTemplate } from '@/types'

export const griQuantitativeApi = createMockApi<GriQuantitativeTemplate>([
  { id: '1', templateName: 'GRI 305: Emisi', period: 'FY2026 Q1', status: 'submitted' },
  { id: '2', templateName: 'GRI 303: Air', period: 'FY2026 Q1', status: 'draft' },
])
