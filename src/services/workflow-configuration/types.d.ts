declare global {
  type WorkflowName = 'GRI_QUANTITATIVE' | 'GRI_QUALITATIVE' | 'SDG_ACTION_PLAN' | 'SDG_REALIZATION'
  type ApprovalType = 'Holding Approval' | 'By PIC'

  interface WorkflowApprovalLine {
    approval_type: ApprovalType
    employee_ids: string[]
  }

  // status is inlined as the literal union rather than referencing Stream B's `MasterStatus` global,
  // since that module hasn't merged yet — structurally identical, swap to `MasterStatus` at merge time.
  interface WorkflowConfig {
    id: string
    workflow_name: WorkflowName
    entity_id: string
    status: 'Active' | 'Inactive'
    approval_lines: WorkflowApprovalLine[]
  }
}

export {}
