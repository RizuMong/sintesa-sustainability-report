import { http, unwrap } from '@/lib/http'

const masterUnitApi = {
  async getMasterUnit() {
    return unwrap<MasterUnit[]>(http.get('/v1/master-unit/index'))
  },
}

export { masterUnitApi }
