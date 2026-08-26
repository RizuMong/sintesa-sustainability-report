import { http, unwrap } from '@/lib/http'
import { buildExportPayload } from './validation'

// ponytail: unconfirmed contract — no api/Data Export/ folder exists yet;
// follows the sibling {{base_url}}/v1/<module>/generate|index convention.

export { buildExportPayload } from './validation'

const dataExportApi = {
  async generate(filter: ExportFilter) {
    return unwrap<ExportResult>(http.post('/v1/data-export/generate', buildExportPayload(filter)))
  },
  // ponytail: export audit persisted backend-side; this just reads back a recent-export list if the endpoint exists.
  async getExportHistory() {
    return unwrap<ExportHistoryItem[]>(http.get('/v1/data-export/index'))
  },
}

export { dataExportApi }
