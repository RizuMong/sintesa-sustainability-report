declare global {
  // image27.png (GRI Qualitative detail mockup) shows exactly one level of nesting under each
  // question: a Title + Answer Mode, then either a single free-text "Follow Up" note (Answer Mode
  // = Single) or a Yes/No branch with two follow-ups (Answer Mode = Conditional). No deeper nesting
  // is shown, so the schema stays flat at that one level rather than a recursive sub-question tree.
  type MkiGriQualAnswerMode = 'Single' | 'Conditional'

  interface MkiGriQualQuestion {
    title: string
    answer_mode: MkiGriQualAnswerMode
    follow_up: string // used when answer_mode = 'Single'
    follow_up_yes: string // used when answer_mode = 'Conditional'
    follow_up_no: string // used when answer_mode = 'Conditional'
  }

  interface MkiGriQualitative {
    id: string
    // AC-21: GRI_QUAL has no Unit/Input Type — this is the field the mockup labels "Code", used here
    // as the Variable Code (unique, SNAKE_CASE — AC-19, shared rule across MKI SDG and MKI GRI-Qual).
    code: string
    name: string
    questions: MkiGriQualQuestion[]
    status: 'Active' | 'Inactive'
    updated_at: string
    // ponytail: stubbed always false — real "used in a Published template" linkage doesn't exist yet
    // (GRI/SDG Framework Creator, Module 2, isn't built). Follow-up: wire from a real check once
    // Module 2 lands.
    locked: boolean
  }

  interface MkiGriQualitativePayload {
    id?: string
    code: string
    name: string
    questions: MkiGriQualQuestion[]
  }
}

export {}
