import { http, unwrap } from '@/lib/http'
import { toDeactivatedGri } from './validation'

// ponytail: no api/ contract at all yet for Master GRI — following the sibling
// {{base_url}}/v1/<module>/index|create|update convention until backend confirms.

export { isDuplicateGriCode, toDeactivatedGri } from './validation'

const masterGriApi = {
  async getMasterGri() {
    return unwrap<MasterGri[]>(http.get('/v1/master-gri/index'))
  },
  async createMasterGri(payload: { gri_code: string; gri_series: GriSeries; disclosure_title: string }) {
    return unwrap<MasterGri>(http.post('/v1/master-gri/create', payload))
  },
  async updateMasterGri(payload: MasterGri) {
    return unwrap<MasterGri>(http.post('/v1/master-gri/update', payload))
  },
  async deactivateMasterGri(item: MasterGri) {
    return unwrap<MasterGri>(http.post('/v1/master-gri/update', toDeactivatedGri(item)))
  },
}

export { masterGriApi }
