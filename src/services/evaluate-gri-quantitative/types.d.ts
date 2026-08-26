// Verbatim from api/Evaluate GRI - Quantitative/*.yml — do not change field names.
// Approval/Ref2 globals (§3 of the impl plan) are declared here; Stream C owns this file.
declare global {
  type SubmissionFlowStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
  type ApprovalAction = 'PENDING' | 'APPROVED' | 'REJECTED'
  type ApprovalStageStatus = 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED'
  interface Ref2 {
    id: string
    name: string
  } // the {id,name} pair the API returns for every FK

  interface ApprovalApprover {
    acted_at: number | null
    action: ApprovalAction
    notes: string | null
    position: Ref2
    user: { id: string; name: string; email: string }
  }
  interface ApprovalLog {
    approval_type: ApprovalType // reuse workflow-configuration's global
    approvers: ApprovalApprover[]
    decided_at?: number | null
    minimum_action: number
    request_id: string
    stage_order: number
    status: ApprovalStageStatus
  }

  interface EvaluateGriQuantitativeColumn {
    key: string
    name: string
    sequence: number
  }

  interface EvaluateGriQuantitativeRow {
    labels: Record<string, string>
    sequence: number
    // ponytail: unconfirmed — the seeded Detail.yml example is an unfilled draft, so no per-row
    // value field appears in the contract yet. Assumed the backend accepts/echoes it back under
    // `value` once the requestor fills the matrix in; reconcile the key name if a filled example
    // surfaces a different one.
    value?: string | number | boolean | null
  }

  // one disclosure line of the submission matrix (Stream A's GriDisclosure, evaluated for one entity/period)
  interface EvaluateGriQuantitativeItem {
    id: string
    ids: string
    company_id: number
    created_at: number
    created_by: number
    category_id: Ref2
    name: string
    parent_id: Ref2
    columns: EvaluateGriQuantitativeColumn[]
    rows: EvaluateGriQuantitativeRow[]
    updated_at: number
    updated_by: number
    // ponytail: unconfirmed — Detail.yml's item objects carry only name/columns/rows, no
    // input_type/unit/evidence_attachment. Assumed denormalized onto the item (from the MKI behind
    // the disclosure) until the backend confirms the join; reconcile at merge if it instead needs a
    // separate lookup against Stream A's GriDisclosure/MKI record.
    input_type?: MkiInputType
    unit?: string | null
    evidence_attachment?: MkiEvidenceAttachment
  }

  // list-mode shape (Index Requestor / Index Approval) — no `items`, detail-only field
  interface EvaluateGriQuantitativeSummary {
    id: string
    ids: string
    company_id: number
    created_at: number
    created_by: number
    created_by_project_user: string
    current_stage_order: number
    entity_id: Ref2
    period_id: Ref2
    template_id: Ref2
    submission_type_id: Ref2
    flow_status: SubmissionFlowStatus
    approval_logs: ApprovalLog[]
    submitted_at: number | null
    submitted_by: string
    rejected_at?: number | null
    rejected_by?: string
    updated_at: number
    updated_by: number
  }

  interface EvaluateGriQuantitative extends EvaluateGriQuantitativeSummary {
    items: EvaluateGriQuantitativeItem[]
  }

  interface EvaluateGriQuantitativeCreatePayload {
    template_id: Ref2
    period_id: Ref2
    entity_id: Ref2
  }

  interface EvaluateGriQuantitativeUpdatePayload {
    id: string
    template_id: Ref2
    period_id: Ref2
    entity_id: Ref2
    items: EvaluateGriQuantitativeItem[]
  }
}

export {}
