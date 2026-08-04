// ponytail: in-memory mock, swap for real HTTP client (axios/fetch to backend) when API exists
export function createMockApi<T extends { id: string }>(seed: T[]) {
  let items = [...seed]

  return {
    list: async () => items,
    get: async (id: string) => items.find((i) => i.id === id),
    create: async (item: T) => {
      items.push(item)
      return item
    },
    update: async (id: string, patch: Partial<T>) => {
      items = items.map((i) => (i.id === id ? { ...i, ...patch } : i))
      return items.find((i) => i.id === id)
    },
    remove: async (id: string) => {
      items = items.filter((i) => i.id !== id)
    },
  }
}
