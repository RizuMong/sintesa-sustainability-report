import { ref } from 'vue'
import { useRouter } from 'vue-router'

// detail pages get their record from the row clicked in the list, via history.pushState — no separate detail API call
export function useHistoryRecord<T>(fallbackPath: string) {
  const router = useRouter()
  const state = history.state as { record?: T } | null
  const record = ref<T | undefined>(state?.record)

  if (!record.value) router.replace(fallbackPath)

  return record
}
