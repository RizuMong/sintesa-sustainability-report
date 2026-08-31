declare global {
  // ponytail: position/entity assumed to be nested {id, name} objects per product
  // ask (show .name) — no confirmed contract in api/ collection to verify against.
  interface UserProfile {
    name: string
    email: string
    position_id: { id: string; name: string } | null
    entity_id: { id: string; name: string } | null
  }
}

export {}
