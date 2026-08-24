import { http, unwrap } from '@/lib/http'
import { buildDeactivatePayload } from './compute-name'

export { computePositionName, buildDeactivatePayload } from './compute-name'

export type MasterPositionInput = { domain: string; role: string; entity_id: string | null; name: string }

const masterPositionApi = {
  async getMasterPosition() {
    return unwrap<MasterPosition[]>(http.get('/v1/master-position/index'))
  },
  async createMasterPosition(payload: MasterPositionInput) {
    return unwrap<MasterPosition>(http.post('/v1/master-position/create', payload))
  },
  async updateMasterPosition(payload: MasterPositionInput & { id: string }) {
    return unwrap<MasterPosition>(http.post('/v1/master-position/update', payload))
  },
  // soft-delete only (FSD 1.5/1.6 rule) — no dedicated delete contract yet, reuse update to flip status
  async deactivateMasterPosition(id: string) {
    return unwrap<MasterPosition>(http.post('/v1/master-position/update', buildDeactivatePayload(id)))
  },
}

export { masterPositionApi }
