import { http, unwrap } from '@/lib/http'
import { toDeactivatedPeriod } from './validation'

// ponytail: api/Master Period only has an Index.yml contract confirmed
// (GET /v1/master-period/index) — Create/Update follow the sibling
// {{base_url}}/v1/<module>/create|update convention until backend confirms.

export { isDuplicatePeriodYear, toDeactivatedPeriod } from './validation'

const masterPeriodApi = {
  async getMasterPeriod() {
    return unwrap<MasterPeriod[]>(http.get('/v1/master-period/index'))
  },
  async createMasterPeriod(payload: { year: number; realization_window: 'Open' | 'Closed' }) {
    return unwrap<MasterPeriod>(http.post('/v1/master-period/create', payload))
  },
  async updateMasterPeriod(payload: MasterPeriod) {
    return unwrap<MasterPeriod>(http.post('/v1/master-period/update', payload))
  },
  async deactivateMasterPeriod(item: MasterPeriod) {
    return unwrap<MasterPeriod>(http.post('/v1/master-period/update', toDeactivatedPeriod(item)))
  },
}

export { masterPeriodApi }
