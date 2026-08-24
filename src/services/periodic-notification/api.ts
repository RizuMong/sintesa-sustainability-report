import { http, unwrap } from '@/lib/http'
import { buildDeactivatePayload } from './validation'

export type PeriodicNotificationPayload = Omit<PeriodicNotification, 'id' | 'status'>

export { isValidDeadline, buildDeactivatePayload } from './validation'

// ponytail: no `api/` contract exists yet for this module (per plan §2) — endpoints follow the
// sibling `/v1/<module>/index|create|update` convention as a placeholder, flagged for backend confirmation.
const periodicNotificationApi = {
  async index() {
    return unwrap<PeriodicNotification[]>(http.get('/v1/periodic-notification/index'))
  },
  async create(payload: PeriodicNotificationPayload) {
    return unwrap<PeriodicNotification>(http.post('/v1/periodic-notification/create', payload))
  },
  async update(payload: PeriodicNotificationPayload & { id: string }) {
    return unwrap<PeriodicNotification>(http.post('/v1/periodic-notification/update', payload))
  },
  // no dedicated delete endpoint in the unconfirmed contract — deactivate via update, per soft-delete rule.
  async deactivate(id: string) {
    return unwrap<PeriodicNotification>(http.post('/v1/periodic-notification/update', buildDeactivatePayload(id)))
  },
}

export { periodicNotificationApi }
