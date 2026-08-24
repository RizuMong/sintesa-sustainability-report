import { http, unwrap } from '@/lib/http'
import { buildDeactivatePayload } from './validate-email'

export { isEmailUnique, isValidEmailFormat, buildDeactivatePayload } from './validate-email'

export type MasterEmployeeInput = {
  entity_id: string
  position_id: string
  full_name: string
  email: string
  phone: string
}

const masterEmployeeApi = {
  async getMasterEmployee() {
    return unwrap<MasterEmployee[]>(http.get('/v1/master-employee/index'))
  },
  async createMasterEmployee(payload: MasterEmployeeInput) {
    return unwrap<MasterEmployee>(http.post('/v1/master-employee/create', payload))
  },
  async updateMasterEmployee(payload: MasterEmployeeInput & { id: string }) {
    return unwrap<MasterEmployee>(http.post('/v1/master-employee/update', payload))
  },
  // soft-delete only (FSD 1.5, AC-14) — Inactive employees lose login access, row stays
  async deactivateMasterEmployee(id: string) {
    return unwrap<MasterEmployee>(http.post('/v1/master-employee/update', buildDeactivatePayload(id)))
  },
}

export { masterEmployeeApi }
