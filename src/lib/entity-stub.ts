// ponytail: Stream B (Master Entity) hasn't merged into this worktree yet, so `@/services/master-entity`
// doesn't exist. Temporary local stand-in for its `getMasterEntity()` shape (see plan §3's MasterEntity
// contract) used only to resolve Employee/Position entity dropdown labels. Delete this file and swap
// callers to `import { masterEntityApi } from '@/services/master-entity'` once that stream merges.
export interface EntityStub {
  id: string
  name: string
  status: 'Active' | 'Inactive'
}

const MOCK_ENTITIES: EntityStub[] = [
  { id: 'ent-holding', name: 'PT Mekari Group (Holding)', status: 'Active' },
  { id: 'ent-mpp', name: 'PT Mekari Prima Perkasa (MPP)', status: 'Active' },
  { id: 'ent-sub-b', name: 'PT Mekari Subsidiary B', status: 'Active' },
]

export function getMasterEntityStub(): EntityStub[] {
  return MOCK_ENTITIES
}
