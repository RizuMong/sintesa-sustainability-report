import { http, unwrap } from '@/lib/http'
import { resolveDecisionStatus } from './validation'

// ponytail: unconfirmed contract — no api/Action Plan Submission/ folder exists yet. Follows the
// sibling {{base_url}}/v1/<module>/index|detail|submit convention (CLAUDE.md §2.4) as a placeholder.

export { resolveDecisionStatus, skipRequiresJustification } from './validation'

const actionPlanSubmissionApi = {
  async getActionPlanSubmission() {
    return unwrap<ActionPlanSubmissionItem[]>(http.get('/v1/action-plan-submission/index'))
  },
  async getActionPlanSubmissionDetail(id: string) {
    return unwrap<ActionPlanSubmissionItem>(http.get('/v1/action-plan-submission/detail', { params: { id } }))
  },
  // Take/Skip is the one-shot decision itself (AC-92/93/94) — no separate draft/update step.
  async submitActionPlanDecision(payload: { id: string; decision: 'Take' | 'Skip'; skip_reason: string }) {
    return unwrap<ActionPlanSubmissionItem>(
      http.post('/v1/action-plan-submission/submit', { ...payload, status: resolveDecisionStatus(payload.decision) }),
    )
  },
}

export { actionPlanSubmissionApi }
