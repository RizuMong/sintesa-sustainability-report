import { ref } from 'vue'

interface CrudApi<T> {
  list: () => Promise<T[]>
  create: (item: T) => Promise<T>
  update: (id: string, patch: Partial<T>) => Promise<T | undefined>
  remove: (id: string) => Promise<void>
}

// shared list/create/update/delete state + actions for any master-data-style page
export function useCrud<T extends { id: string }>(api: CrudApi<T>) {
  const items = ref<T[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    items.value = await api.list()
    loading.value = false
  }

  async function create(item: T) {
    await api.create(item)
    await fetchAll()
  }

  async function update(id: string, patch: Partial<T>) {
    await api.update(id, patch)
    await fetchAll()
  }

  async function remove(id: string) {
    await api.remove(id)
    await fetchAll()
  }

  return { items, loading, fetchAll, create, update, remove }
}
