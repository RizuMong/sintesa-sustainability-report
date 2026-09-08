// pure, dependency-free — kept separate from api.ts so requester-label.check.ts can import it via a
// relative path without Node having to resolve the '@/' tsconfig alias.

// ponytail: the backend returns no requester email on detail/create (api/Evaluate GRI -
// Quantitative/{Detail,Create}.yml — created_by_project_user only), so a just-created draft has
// nothing but the raw id to show. In the requestor context the viewer IS the requester, so their
// own profile email stands in. Delete this branch the moment BE ships created_by_user on detail.
export function requesterLabel(
  submission: Pick<EvaluateGriQuantitativeSummary, 'created_by_user' | 'submitted_by' | 'created_by_project_user'>,
  viewerEmail: string | undefined,
  isOwnContext: boolean,
): string {
  if (submission.created_by_user?.email) return submission.created_by_user.email
  if (submission.submitted_by) return submission.submitted_by
  if (isOwnContext && viewerEmail) return viewerEmail
  return submission.created_by_project_user
}
