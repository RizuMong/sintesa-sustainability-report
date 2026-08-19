import type { MasterCategory } from '@/types'

const categories: MasterCategory[] = [
  { id: 'cat-ohs', name: 'OHS' },
  { id: 'cat-hr', name: 'Human Resources' },
  { id: 'cat-env', name: 'Environment' },
  { id: 'cat-social', name: 'Social' },
]

export const masterCategoryApi = {
  index: async (): Promise<{ data: MasterCategory[] }> => ({ data: categories }),
}
