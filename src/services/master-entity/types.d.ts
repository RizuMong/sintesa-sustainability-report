declare global {
  type EntityType = 'Subsidiary' | 'Business Unit' | 'Branch'
  type MasterStatus = 'Active' | 'Inactive'

  interface MasterEntity {
    id: string
    parent_entity_id: string | null
    name: string
    type: EntityType
    address: string
    status: MasterStatus
  }
}

export {}
