import { http, unwrap } from '@/lib/http'

export { ACCESS_MANAGEMENT_APPS, buildAccessManagementCatalog } from './catalog'

export type SaveAccessGrantsPayload = { position_id: string; pages: { app: string; page: string }[] }

const accessManagementApi = {
  async getAccessGrants() {
    return unwrap<AccessGrant[]>(http.get('/v1/access-management/index'))
  },
  // no dedicated contract yet (flagged) — bulk-replaces one Position's full grant set (AC-15/AC-17)
  async saveAccessGrants(payload: SaveAccessGrantsPayload) {
    return unwrap<AccessGrant[]>(http.post('/v1/access-management/save', payload))
  },
}

export { accessManagementApi }
