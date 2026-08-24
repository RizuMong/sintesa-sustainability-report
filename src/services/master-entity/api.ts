import { http, unwrap } from '@/lib/http'
import { toDeactivatePayload, toRow, resolveRow, type MasterEntityRow, type RawMasterEntity } from './mapping'

export type { MasterEntityRow }

const masterEntityApi = {
  async getMasterEntity(): Promise<MasterEntityRow[]> {
    const raw = await unwrap<RawMasterEntity[]>(http.get('/v1/master-entity/index'))
    return raw.map(toRow)
  },

  // ponytail: no Create/Update/Delete contract exists in api/Master Entity/ yet (only Index.yml) — guessed
  // REST convention (`/v1/master-entity/create|update`, same envelope) per CLAUDE.md, unconfirmed against backend.
  async create(payload: Omit<MasterEntity, 'id'>): Promise<MasterEntityRow> {
    const raw = await unwrap<RawMasterEntity>(http.post('/v1/master-entity/create', payload))
    return resolveRow(raw, masterEntityApi.getMasterEntity)
  },

  async update(payload: MasterEntity): Promise<MasterEntityRow> {
    const raw = await unwrap<RawMasterEntity>(http.put('/v1/master-entity/update', payload))
    return resolveRow(raw, masterEntityApi.getMasterEntity)
  },

  // AC-09: entities with active reporting data can't be hard-deleted — always deactivate, never delete.
  async remove(entity: MasterEntity): Promise<MasterEntityRow> {
    return masterEntityApi.update(toDeactivatePayload(entity))
  },
}

export { masterEntityApi }
