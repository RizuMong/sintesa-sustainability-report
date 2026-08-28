import { http, unwrap } from '@/lib/http'
import { toDeactivatedGri } from './validation'

// GET index confirmed in api/Master GRI/Index.yml — it answers the code under `code`, not
// `gri_code`, so it is mapped on the way in/out. Create/Update follow the sibling
// {{base_url}}/v1/<module>/create|update convention until backend confirms.
type RawMasterGri = Omit<MasterGri, 'gri_code'> & { code: string }

const fromRaw = ({ code, ...rest }: RawMasterGri): MasterGri => ({ ...rest, gri_code: code })
const toRaw = ({ gri_code, ...rest }: MasterGri): RawMasterGri => ({ ...rest, code: gri_code })

export { isDuplicateGriCode, toDeactivatedGri } from './validation'

const masterGriApi = {
  async getMasterGri() {
    return (await unwrap<RawMasterGri[]>(http.get('/v1/master-gri/index'))).map(fromRaw)
  },
  async createMasterGri(payload: { gri_code: string; gri_series: GriSeries; disclosure_title: string }) {
    const { gri_code, ...rest } = payload
    return fromRaw(await unwrap<RawMasterGri>(http.post('/v1/master-gri/create', { ...rest, code: gri_code })))
  },
  async updateMasterGri(payload: MasterGri) {
    return fromRaw(await unwrap<RawMasterGri>(http.post('/v1/master-gri/update', toRaw(payload))))
  },
  async deactivateMasterGri(item: MasterGri) {
    return fromRaw(await unwrap<RawMasterGri>(http.post('/v1/master-gri/update', toRaw(toDeactivatedGri(item)))))
  },
}

export { masterGriApi }
