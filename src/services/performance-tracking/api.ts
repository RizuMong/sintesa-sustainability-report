import { http, unwrap } from '@/lib/http'

// ponytail: unconfirmed contract — no api/Performance Tracking/ folder exists yet;
// follows the sibling {{base_url}}/v1/<module>/index convention.

export { canNudge, clampCompletion } from './validation'

const performanceTrackingApi = {
  async getTrackingRows(params?: { period?: string; entity?: string }) {
    return unwrap<TrackingRow[]>(http.get('/v1/performance-tracking/index', { params }))
  },
  async nudge(row: Pick<TrackingRow, 'entity' | 'period' | 'submission_type'>) {
    return unwrap<{ sent: boolean }>(
      http.post('/v1/performance-tracking/nudge', {
        entity_id: row.entity.id,
        period_id: row.period.id,
        submission_type: row.submission_type,
      }),
    )
  },
}

export { performanceTrackingApi }
