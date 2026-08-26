declare global {
  type GriTemplateStatus = 'Draft' | 'Published'
  type GriDisclosureCategory = 'GRI_QUANT' | 'GRI_QUAL'
  // AC-41: adds a third mode on top of mki-gri-qualitative's Single/Conditional — toggle-only,
  // no follow-up textarea. Local to this module, does not redeclare the global MkiGriQualAnswerMode.
  type GriQualAnswerMode = 'Single' | 'Conditional' | 'None'

  interface GriQualQuestion {
    title: string
    answer_mode: GriQualAnswerMode
    follow_up: string // used when answer_mode = 'Single'
    follow_up_yes: string // used when answer_mode = 'Conditional'
    follow_up_no: string // used when answer_mode = 'Conditional'
  }

  // AC-39: GRI_QUANT disclosure — input_type/unit/evidence are read-only, auto-filled from the
  // picked MKI record. AC-40/41: GRI_QUAL disclosure — those three stay blank, `questions` is used
  // instead. Denormalized as display strings rather than importing the old-shape MkiInputType
  // enum ('NUMBER'|'TEXT'|...) or the newer global MkiInputType ('Number'|'Text'|..., owned by
  // mki-sdg) — the two don't agree on casing and this field is read-only display, not re-validated.
  interface GriDisclosure {
    id: string
    mki_id: string
    mki_name: string
    gri_code: string
    input_type: string
    unit: string
    evidence: 'Optional' | 'Required' | ''
    questions: GriQualQuestion[]
  }

  // GET /v1/master-template-quantitative/index row shape (confirmed contract) — no disclosures.
  interface GriReleaseSummary {
    id: string
    template_name: string
    // ponytail: swap to Ref2 once Stream C lands (owns the global Ref2 {id,name} pair)
    period_id: { id: string; name: string }
    status: GriTemplateStatus
  }

  // GET .../detail (unconfirmed) + create/update response — full record with disclosures.
  interface GriRelease extends GriReleaseSummary {
    category: GriDisclosureCategory
    disclosures: GriDisclosure[]
  }
}

export {}
