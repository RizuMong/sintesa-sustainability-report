// Pure mapping/business-logic for master-entity, split out from api.ts so it has zero axios/alias
// imports — lets master-entity.check.ts exercise it directly under plain `node`, no network/mocking needed.

// ponytail: the real GET /v1/master-entity/index response (api/Master Entity/Index.yml) doesn't match the
// plan §3 MasterEntity contract 1:1 yet — it uses uppercase `entity_type`
// (HOLDING/SUBSIDIARY/BRANCH/BUSINESS_UNIT) and nests parent_entity_id as {id, name}, and `address`
// has no backend source so it defaults to '' — flag that one for backend follow-up.
// `name` is the display field everywhere (it is what parent_entity_id/entity_id nest as); `code` is
// only the fallback for the seeded Index.yml example, which predates the `name` field.
export interface RawMasterEntity {
  id: string
  name?: string
  code: string
  entity_type: string
  parent_entity_id?: { id: string; name: string } | string | null
  status: MasterStatus
}

export const ENTITY_TYPE_MAP: Record<string, EntityType> = {
  SUBSIDIARY: 'Subsidiary',
  BUSINESS_UNIT: 'Business Unit',
  BRANCH: 'Branch',
}

// list-row shape: MasterEntity plus a resolved parent display name (denormalized), not a global type
// since only this module's pages need it.
export interface MasterEntityRow extends MasterEntity {
  parent_entity_name: string | null
}

export function parentIdOf(raw: RawMasterEntity): string | null {
  if (!raw.parent_entity_id) return null
  return typeof raw.parent_entity_id === 'string' ? raw.parent_entity_id : raw.parent_entity_id.id
}

export function parentNameOf(raw: RawMasterEntity): string | null {
  if (!raw.parent_entity_id || typeof raw.parent_entity_id === 'string') return null
  return raw.parent_entity_id.name
}

export function toRow(raw: RawMasterEntity): MasterEntityRow {
  return {
    id: raw.id,
    parent_entity_id: parentIdOf(raw),
    parent_entity_name: parentNameOf(raw),
    name: raw.name ?? raw.code,
    type: ENTITY_TYPE_MAP[raw.entity_type] ?? (raw.entity_type as EntityType),
    address: '',
    status: raw.status,
  }
}

// same cross-reference technique as the old master-key-indicator-quantitative.api.ts's resolvePayload():
// our guessed create/update contract might only echo the parent FK id (no nested name), so look it up
// against the full list to attach a display name for the UI without a second round trip from the caller.
// `lookupAll` is injected so this stays pure/testable — api.ts passes masterEntityApi.getMasterEntity.
export async function resolveRow(
  raw: RawMasterEntity,
  lookupAll: () => Promise<MasterEntityRow[]>,
): Promise<MasterEntityRow> {
  const row = toRow(raw)
  if (row.parent_entity_id && !row.parent_entity_name) {
    const all = await lookupAll()
    row.parent_entity_name = all.find((e) => e.id === row.parent_entity_id)?.name ?? null
  }
  return row
}

// AC-09: entities with active reporting data can't be hard-deleted — deactivate only, never delete.
export function toDeactivatePayload(entity: MasterEntity): MasterEntity {
  return { ...entity, status: 'Inactive' }
}
