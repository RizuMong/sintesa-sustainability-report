import { http, unwrap } from '@/lib/http'

export { isEditingLocked, validateDisclosuresForPublish } from './validation'

export type GriReleasePayload = {
  id?: string
  template_name: string
  period_id: { id: string }
  category: GriDisclosureCategory
  disclosures: GriDisclosure[]
}

// ponytail: only Index is confirmed (§2.4) — detail/create/update/publish follow the sibling
// {{base_url}}/v1/master-template-quantitative/<action> convention until backend confirms.
const griReleaseApi = {
  async getGriReleases() {
    return unwrap<GriReleaseSummary[]>(http.get('/v1/master-template-quantitative/index'))
  },
  async getGriReleaseDetail(id: string) {
    return unwrap<GriRelease>(http.get('/v1/master-template-quantitative/detail', { params: { id } }))
  },
  async createGriRelease(payload: GriReleasePayload) {
    return unwrap<GriRelease>(http.post('/v1/master-template-quantitative/create', payload))
  },
  async updateGriRelease(payload: GriReleasePayload & { id: string }) {
    return unwrap<GriRelease>(http.post('/v1/master-template-quantitative/update', payload))
  },
  // ponytail: distribution/notification assumed backend-side on publish; UI only shows a success toast
  async publishGriRelease({ id }: { id: string }) {
    return unwrap<GriRelease>(http.post('/v1/master-template-quantitative/publish', { id }))
  },
}

export { griReleaseApi }
