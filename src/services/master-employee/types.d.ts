declare global {
  interface MasterEmployee {
    id: string
    entity_id: string // FK MasterEntity
    position_id: string // FK MasterPosition
    full_name: string
    email: string // unique
    phone: string
    // ponytail: literal union inlined instead of `MasterStatus` — Stream B (Master Entity) owns
    // that global and hasn't merged yet; this shape is identical so it's a no-op swap once it lands.
    status: 'Active' | 'Inactive'
  }
}

export {}
