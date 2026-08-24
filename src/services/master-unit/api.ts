import { http, unwrap } from '@/lib/http'
import { toDeactivatedUnit } from './validation'

// ponytail: only Index is confirmed in api/Master Unit/ — Create/Update follow
// the sibling {{base_url}}/v1/<module>/create|update convention until backend confirms.

export { isDuplicateUnitCode, toDeactivatedUnit } from './validation'

const masterUnitApi = {
  async getMasterUnit() {
    return unwrap<MasterUnit[]>(http.get('/v1/master-unit/index'))
  },
  async createMasterUnit(payload: { name: string; code: string; category: string }) {
    return unwrap<MasterUnit>(http.post('/v1/master-unit/create', payload))
  },
  async updateMasterUnit(payload: MasterUnit) {
    return unwrap<MasterUnit>(http.post('/v1/master-unit/update', payload))
  },
  async deactivateMasterUnit(item: MasterUnit) {
    return unwrap<MasterUnit>(http.post('/v1/master-unit/update', toDeactivatedUnit(item)))
  },
}

export { masterUnitApi }
