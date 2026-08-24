declare global {
  type PeriodicNotificationType = 'Action Plan' | 'Realization Report' | 'GRI Quant' | 'GRI Qual'

  interface PeriodicNotification {
    id: string
    title: string
    deadline_month: number // 1-12
    deadline_day: number // 1-31
    reminder_days_before: number
    notification_type: PeriodicNotificationType
    status: 'Active' | 'Inactive'
  }
}

export {}
