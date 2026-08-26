import { http, unwrap } from '@/lib/http'

export { canDeactivateSdgGoal } from './validation'

// ponytail: unconfirmed contract — no `api/SDG Adoption/` folder exists yet. Follows the sibling
// {{base_url}}/v1/<module>/index|update convention (CLAUDE.md). The 17-goal list is backend-seeded
// (AC-43) — there is deliberately no create/delete endpoint, only a toggle-style update.
const sdgAdoptionApi = {
  async getSdgAdoption() {
    return unwrap<SdgGoal[]>(http.get('/v1/sdg-adoption/index'))
  },
  async updateSdgAdoption(payload: { id: string; adopted: boolean }) {
    return unwrap<SdgGoal>(http.post('/v1/sdg-adoption/update', payload))
  },
}

export { sdgAdoptionApi }
