declare global {
  interface MasterPosition {
    id: string
    domain: string
    role: string
    entity_id: string | null // FK MasterEntity, nullable = generic cross-entity position
    name: string // computed label, e.g. "PIC Ekonomi - MPP"
    // ponytail: literal union inlined instead of `MasterStatus` — Stream B (Master Entity) owns
    // that global and hasn't merged yet; this shape is identical so it's a no-op swap once it lands.
    status: 'Active' | 'Inactive'
  }
}

export {}
