// pure, dependency-free — kept separate from api.ts so api.check.ts can import it via a
// relative path without Node having to resolve the '@/' tsconfig alias.

// AC-90: every question's toggle (answer) must be non-null before the submission can be submitted.
// AC-91: textarea notes are always optional, never checked here.
export function canSubmitGriQualSubmission(disclosures: GriQualSubmissionDisclosure[]): boolean {
  return disclosures.every((disclosure) => disclosure.questions.every((question) => question.answer !== null))
}

// AC-84/AC-111 sibling rule: once submitted, the form is read-only; only a rejected submission reopens.
export function isGriQualSubmissionLocked(flow_status: SubmissionFlowStatus): boolean {
  return flow_status !== 'draft' && flow_status !== 'rejected'
}

// AC-87/88/89: label swap for the Conditional textarea; Single always shows `follow_up`;
// None has no textarea at all (returns null).
export function textareaLabelFor(
  question: Pick<GriQualSubmissionQuestion, 'answer_mode' | 'follow_up' | 'follow_up_yes' | 'follow_up_no' | 'answer'>,
): string | null {
  if (question.answer_mode === 'None') return null
  if (question.answer_mode === 'Single') return question.follow_up
  return question.answer === false ? question.follow_up_no : question.follow_up_yes
}
