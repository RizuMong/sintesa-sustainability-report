import { http, unwrap } from '@/lib/http'
import { toDeactivatedPillar } from './validation'

// ponytail: no Create/Update/Delete contract in api/ yet for Master Pillar
// (only a future Index would exist) — following the sibling
// {{base_url}}/v1/<module>/index|create|update convention until backend confirms.

export { isDuplicatePillarCode, toDeactivatedPillar } from './validation'

const masterPillarApi = {
  async getMasterPillar() {
    return unwrap<MasterPillar[]>(http.get('/v1/master-pillar/index'))
  },
  async createMasterPillar(payload: { code: string; name: string }) {
    return unwrap<MasterPillar>(http.post('/v1/master-pillar/create', payload))
  },
  async updateMasterPillar(payload: MasterPillar) {
    return unwrap<MasterPillar>(http.post('/v1/master-pillar/update', payload))
  },
  async deactivateMasterPillar(item: MasterPillar) {
    return unwrap<MasterPillar>(http.post('/v1/master-pillar/update', toDeactivatedPillar(item)))
  },
}

export { masterPillarApi }
