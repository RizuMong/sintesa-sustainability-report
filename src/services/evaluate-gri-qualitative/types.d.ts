declare global {
  // AC-90/91: None mode has no answer_mode value of its own in the already-shipped
  // MkiGriQualAnswerMode ('Single' | 'Conditional') — extend locally rather than redeclare
  // the global (mki-gri-qualitative owns that type).
  type GriQualAnswerMode = MkiGriQualAnswerMode | 'None'

  interface GriQualSubmissionQuestion {
    id: string
    title: string
    answer_mode: GriQualAnswerMode
    follow_up: string // used when answer_mode = 'Single'
    follow_up_yes: string // used when answer_mode = 'Conditional', answer = true
    follow_up_no: string // used when answer_mode = 'Conditional', answer = false
    answer: boolean | null // AC-90: must be non-null before submit
    note: string // AC-91: always optional
  }

  interface GriQualSubmissionDisclosure {
    id: string
    gri_code: string
    disclosure_title: string
    questions: GriQualSubmissionQuestion[]
  }

  // ponytail: Ref2 ({id;name} pair) is Stream C's global (src/services/evaluate-gri-quantitative/types.d.ts).
  // Inlined here per plan §3 until Stream C merges — swap to Ref2 at merge, do not declare a second Ref2.
  interface GriQualSubmission {
    id: string
    entity_id: { id: string; name: string }
    period_id: { id: string; name: string }
    template_id: { id: string; name: string }
    // ponytail: SubmissionFlowStatus is Stream C's global (same file as Ref2 above) — referenced
    // here assuming Stream C lands; reconcile the import at merge per plan §6.
    flow_status: SubmissionFlowStatus
    disclosures: GriQualSubmissionDisclosure[]
  }
}

export {}
