// Verbatim from api/Evaluate GRI - Quantitative/*.yml — do not change field names.
// Approval/Ref2 globals (§3 of the impl plan) are declared here; Stream C owns this file.
declare global {
  type SubmissionFlowStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
  // one union for both the stage status and an approver's action — the API emits the same
  // enum in both slots, so keep them aliased rather than drifting into two half-lists
  type ApprovalStatus = 'WAITING_APPROVAL' | 'PENDING' | 'APPROVE' | 'APPROVED' | 'REJECTED' | 'CANCEL'
  type ApprovalAction = ApprovalStatus
  type ApprovalStageStatus = ApprovalStatus
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
  }

  // one filled cell of the matrix — Update.yml's items[].values[] shape
  interface EvaluateGriQuantitativeValue {
    row_key: string
    metric_key: string
    value_number: number | null
    value_text: string | null
    value_date: number | null
    unit: string | null
  }

  // one disclosure line of the submission matrix (Stream A's GriDisclosure, evaluated for one entity/period)
  interface EvaluateGriQuantitativeItem {
    id: string
    ids: string
    company_id: number
    created_at: number
    created_by: number
    category_id: Ref2
    parent_id: Ref2
    columns: EvaluateGriQuantitativeColumn[]
    metrics: MkiQuantMetric[]
    rows: EvaluateGriQuantitativeRow[]
    updated_at: number
    updated_by: number
    // ponytail: Detail.yml's item objects carry no title of their own (only category_id/parent_id),
    // so the heading falls back through description -> name -> code. Drop the fallbacks once the
    // backend confirms which one it sends.
    description?: string
    name?: string
    code?: string
    // ponytail: unconfirmed — Detail.yml's seeded example is an unfilled draft, so no saved values
    // come back on it. Assumed the backend echoes them under the same items[].values[] shape Update
    // sends; reconcile if a filled example surfaces a different one.
    values?: EvaluateGriQuantitativeValue[]
    // ponytail: unconfirmed — no evidence_attachment on the item in the contract. Assumed
    // denormalized from the MKI behind the disclosure.
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
    items: { item_id: string; values: EvaluateGriQuantitativeValue[] }[]
  }
}

export {}
