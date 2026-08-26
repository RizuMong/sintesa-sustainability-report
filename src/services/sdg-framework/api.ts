import { http, unwrap } from '@/lib/http'

export {
  INVESTMENT_IMPACT_ENTITY_NAMES,
  isDuplicateMatrixRowCode,
  canDeleteMatrixRow,
  isApplicableEntitiesValid,
  isInvestmentImpactAllowed,
} from './validation'

// ponytail: unconfirmed contract — no `api/SDG Framework/` folder exists yet. Follows the sibling
// {{base_url}}/v1/<module>/index|detail|create|update|delete|publish convention (CLAUDE.md).
const sdgFrameworkApi = {
  async getSdgFrameworks() {
    return unwrap<SdgFramework[]>(http.get('/v1/sdg-framework/index'))
  },
  async getSdgFramework(id: string) {
    return unwrap<SdgFramework>(http.get('/v1/sdg-framework/detail', { params: { id } }))
  },
  async createSdgFramework(payload: Omit<SdgFramework, 'id' | 'status'>) {
    return unwrap<SdgFramework>(http.post('/v1/sdg-framework/create', payload))
  },
  async updateSdgFramework(payload: SdgFramework) {
    return unwrap<SdgFramework>(http.post('/v1/sdg-framework/update', payload))
  },
  async deleteSdgFramework(id: string) {
    return unwrap<Record<string, never>>(http.delete('/v1/sdg-framework/delete', { params: { id } }))
  },
  async publishSdgFramework(id: string) {
    return unwrap<SdgFramework>(http.post('/v1/sdg-framework/publish', { id }))
  },
}

export { sdgFrameworkApi }
