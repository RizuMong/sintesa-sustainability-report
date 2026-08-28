import { http, unwrap } from '@/lib/http'

// Read-only lookup — api/Master Category/ only has Index.yml.
const masterCategoryApi = {
  async getMasterCategory() {
    return unwrap<MasterCategory[]>(http.get('/v1/master-category/index'))
  },
}

export { masterCategoryApi }
