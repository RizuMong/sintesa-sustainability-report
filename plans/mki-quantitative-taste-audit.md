# MKI Quantitative — mekari-taste design audit

Verified against `~/.jcode/skills/mekari-taste/references/` (`mekari-screen.md`, `index-view.md`,
`form-view.md`, `empty-state.md`, `filter.md`) and the five visual principles in `SKILL.md`.

Pixel MCP is **not connected** in this environment, so Step 3.5 (`get-block` / `get-component` /
`get-icon-name`) could not be run. Every finding below is grounded in a reference file, not in MCP
output. Do not invent props — only use `Mp*` props already used elsewhere in this repo.

Context: this app is an iframe embed inside Officeless. `src/router/index.ts:13` documents that there
is deliberately **no shell layout wrapper** — no navbar, no sidebar. So `mekari-screen.md` §1–4
(navbar/sidebar) are **out of scope and not defects**. §5 (page header) and §6 (page content) still
apply, because each page renders its own header band and stage.

---

## A. `src/pages/master-key-indicator-quantitative/ListPage.vue`

| # | Severity | Finding | Reference |
|---|----------|---------|-----------|
| A1 | high | **No page header H1.** The header band (`:3-7`) contains only a right-floated `Create` button. `mekari-screen.md` §5 requires a title row: `Heading/H1` left + primary CTA right. | mekari-screen §5 |
| A2 | high | **Empty-state copy is broken and incomplete.** `"No available yet"` (`:65`) is not a sentence, has no helper text, and no CTA. Spec requires descriptive title + helper naming the literal button + primary CTA. | empty-state.md |
| A3 | high | **Filter-to-empty shows the blank-slate illustration.** `v-else` (`:55`) fires for both "never had data" and "filter matched nothing". These are distinct variants and the table header must stay visible for the not-found case. | index-view.md §Empty State, `showTable` pattern |
| A4 | med | **Page content area is missing its stage framing.** `:9` has no `borderTopWidth` / `borderLeftWidth` / `borderColor="border.default"` / `roundedTopLeft="md"`. `DetailPage.vue:21-31` does this correctly — the two pages disagree. | mekari-screen §6 |
| A5 | med | **Table sits directly on stage with no boundary.** No wrapping card, so it needs `border.default` 1px + `rounded="md"` itself. | index-view.md §Table |
| A6 | med | **Date format wrong.** `toLocaleString('sv-SE')` (`:122`) renders `2026-07-12 14:03`. Spec format is `12 Jul 2026`. | index-view.md §Cell content rules |
| A7 | med | **No error state.** Only `isLoading` is branched on. A failed fetch renders the blank-slate empty state, which lies to the user. Error ≠ empty. | index-view.md, empty-state.md |
| A8 | low | **Row click is wired per-cell, not per-row.** Five duplicated `@click` + `cursor` bindings (`:32-46`). Sibling `RequestorPage.vue` correctly puts them on `MpTableRow`. Whole row is the click target. | index-view.md §Body row |
| A9 | low | **No pagination.** List is fetched whole and rendered whole. Spec: paginate when total > 10. | index-view.md §Pagination |
| A10 | low | Empty numeric/absent cells render nothing rather than an em dash in `text.secondary`. `category_id?.name` (`:39`) and `description` can both be blank. | index-view.md §Cell content rules |

**Open gap (needs PM/design, do not guess):** there is no per-row action cell. Delete is reachable
only by opening the detail page. Whether the list needs an action column (and whether bulk select
applies) is a product decision — flag it, don't build it.

---

## B. `src/pages/master-key-indicator-quantitative/DetailPage.vue`

| # | Severity | Finding | Reference |
|---|----------|---------|-----------|
| B1 | **conflict — do not auto-fix** | **Form sections are boxed cards.** The `panel` / `subpanel` consts (`:376-392`) box every form section. Principle 4 is explicit: *"No cards for index lists or form sections. Form sections use dividers and sub-headings, not boxed containers."* **But** `c1f6c5c` restyled this page *to match a reviewed HTML mockup*, and the panels are that mockup. Design review beats the reference file. Needs a human decision. | SKILL.md principle 4, form-view.md §Section structure |
| B2 | **conflict — do not auto-fix** | **Custom stepper.** `stepBadge` (`:394-403`) hand-rolls numbered brand circles. *"Never create a new stepper style — use the Pixel stepper as-is."* Same caveat as B1: the numbered steps came from the reviewed mockup. Raise with design; if the numbering is decorative, these are just H3 sub-headings. | form-view.md §Common Mistakes |
| B3 | high | **No action footer.** A lone `Create`/`Update` button sits left-aligned mid-column (`:247-249`). Spec: right-aligned footer pair, `Cancel` (`variant="ghost"`) then Submit (`variant="primary"`), gap 16, sharing the form's width container. **Cancel is entirely missing.** | form-view.md §Action footer |
| B4 | high | **No validation and no error copy.** `canSave` (`:470`) only disables the button. No on-submit field errors, no helper text, no form-level error banner. A user cannot tell *which* required field is missing. | form-view.md §Form Validation |
| B5 | high | **Save failures are silent.** `save()` (`:609`) awaits `mutateAsync` with no `try`/`catch`. On rejection the toast and the redirect never run and the promise rejects unhandled — the user clicks Update and nothing at all happens. Same for `confirmDelete()` (`:621`). | form-view.md §Error display |
| B6 | med | **Two primary buttons.** The `Client View` toggle flips to `variant="primary"` (`:264`), competing with the real submit action. Use `secondary` vs `ghost` for the toggled state. | form-view.md §Common Mistakes; SKILL.md principle 2 |
| B7 | med | **Form controls default to `sm`.** No `size="md"` on any `MpInput` / `MpSelect` on the page. Pixel's internal default is `sm`; Mekari forms are `md`. | form-view.md §Input controls |
| B8 | med | **Identity fields stretch the full content width.** Category / Code / Description (`:39-63`) have no max width. Form groups must never exceed 6 columns (~440px, up to ~560px). The two-column builder+preview split is defensible; the plain identity fields are not. | form-view.md §Form column width |
| B9 | med | **No error state for the detail fetch.** Only `isLoading` is branched. A failed load silently renders an empty create-style form on an edit URL. | form-view.md |
| B10 | med | **Status has no accountability.** The badge (`:12-14`) shows `Active` with no actor and no timestamp. Principle 3: status fields say *who* and *when*. `updated_at` already exists on the list payload. | SKILL.md principle 3 |
| B11 | low | **No unsaved-changes guard on the edit form.** Spec default: confirm on navigate-away when dirty for edit forms (create forms exempt). Applies to the back button, the breadcrumb link, and Cancel. | form-view.md §Edge Cases |
| B12 | low | **Breadcrumb is a `MpButton variant="textLink"`** (`:7-9`), not `Label small/Regular` in `text.secondary`. Also the H1 shows the record description while the breadcrumb shows the parent — that part is correct, keep it. | mekari-screen §5 |

**Open gap (needs PM/design, do not guess):** `previewPeriod` (`:429`) invents the current year
client-side and the `Period {{ previewPeriod }}` badge presents it as if it were schema data. The
existing ponytail comment already flags that period belongs to the submission, not the schema.
Whether the preview should show a real period or an explicit `(example period)` placeholder is a
product decision.

---

## Not defects

- Missing navbar/sidebar — deliberate, see `src/router/index.ts:13`.
- `MpBadge for="tableStatus"` usage — correct for status pills in rows.
- Skeleton loading on both pages — correct, present on both.
- `ConfirmDeleteModal` on destructive delete — correct per `confirmation.md`.
- Two background tones on `DetailPage` — correct; `ListPage` gets it half right (see A4).
