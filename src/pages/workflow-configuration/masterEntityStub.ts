import { ref } from 'vue'

// ponytail: temporary stand-in for Stream B's `@/services/master-entity` (`useGetMasterEntity()`), which
// hasn't merged yet. Shape matches plan §3's `MasterEntity` structurally, but deliberately does NOT
// declare a global `MasterEntity`/`EntityType`/`MasterStatus` — Stream B owns those globals.
// Delete this file and swap callers to the real `useGetMasterEntity()` once Stream B lands.
interface StubEntity {
  id: string
  parent_entity_id: string | null
  name: string
  type: 'Subsidiary' | 'Business Unit' | 'Branch'
  address: string
  status: 'Active' | 'Inactive'
}

const stubEntities: StubEntity[] = [
  { id: 'entity-holding', parent_entity_id: null, name: 'Sintesa Holding', type: 'Subsidiary', address: '-', status: 'Active' },
  { id: 'entity-sub-1', parent_entity_id: null, name: 'Subsidiary A', type: 'Subsidiary', address: '-', status: 'Active' },
  { id: 'entity-branch-1', parent_entity_id: 'entity-sub-1', name: 'Branch A1', type: 'Branch', address: '-', status: 'Active' },
]

export function useMasterEntityStub() {
  return { data: ref(stubEntities) }
}
