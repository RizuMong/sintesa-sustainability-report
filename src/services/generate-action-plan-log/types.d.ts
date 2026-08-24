declare global {
  type GenerateActionPlanTriggerType = 'Manual' | 'Scheduled'
  type GenerateActionPlanLogStatus = 'Success' | 'Failed'

  interface GenerateActionPlanLog {
    id: string
    timestamp: string
    trigger_type: GenerateActionPlanTriggerType
    submission_type: string
    recipient_count: number
    status: GenerateActionPlanLogStatus
  }
}

export {}
