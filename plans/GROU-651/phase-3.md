# GROU-651 · Phase 3 — Builder: Section editor, Unit-mode config, grouped Live Preview

## Goal

In the MKI Quantitative builder, let an admin add/reorder/delete Sections with rows nested inside
them, choose a Unit mode (`Tidak ada` / `Seragam` / `Per baris`), and see both reflected in the Live
Preview — while an existing indicator opened for edit round-trips byte-identically if untouched.

## Files owned

- `src/pages/master-key-indicator-quantitative/DetailPage.vue`
- `docs/mki-quantitative.md` (append an "As Built" section for this change)

## Depends on

Phase 1 (types + `toDisplayRows`), Phase 2 (`QuantSchemaTable.vue`).

## Context

Ticket text: *"Add a 'Tambah Section' option (alongside 'Tambah Baris') so rows can be grouped
under a Section header (e.g. 'Limbah Non B3' containing 'Digunakan Kembali', 'Didaur Ulang',
'Komposting')"* and a `Satuan (Unit)` setting with the three modes, options from Master Unit.

What exists now, all in this one file:
- `form` reactive at `:337` — `rows: { labels }[]`, no sequence held in state.
- `addRow`/`removeRow` at `:383-392`, row editor markup at `:163-200`.
- `buildPayload()` at `:400` assigns `sequence: i + 1` **on every save**.
- `watch(detail, …)` at `:394` seeds the form and today **drops** `sequence` on read.
- Units already loaded: `useGetMasterUnit()` at `:330`.

**The critical constraint.** `buildPayload` renumbering rows `1..n` is what breaks already-submitted
data, because Evaluate stores cells keyed `row_<sequence>` (`validation.ts:93`). Once rows can be
reordered and interleaved with sections, renumbering is guaranteed. So:

> Carry `sequence` in form state. Rows loaded from `detail` keep the sequence they came with,
> forever. New rows/sections get `max(existing sequence) + 1`. `buildPayload` **must not**
> renumber. Display order is the array order, persisted separately — reorder by array position,
> not by rewriting sequence.

If ordering must be persisted as a number for the BE, add a separate `display_order` field rather
than reusing `sequence` — and flag it under the open questions in `plan.md`.

No drag-and-drop dependency exists in this repo. Implement reordering as up/down `MpButton`s with
`arrows-up`/`arrows-down` icons; moving a section moves its children with it. Do not add a DnD
package.

Follow the existing section-block idiom in this file (`MpDivider` + `MpText size="h3"` heading +
dashed full-width ghost add button, e.g. `:100-104`).

## Steps

1. Extend `form`: `rows: { sequence: number; row_type: 'SECTION' | 'ROW'; title: string; parentSequence: number | null; labels: Record<string,string>; unitId: string }[]`, plus
   `unitMode: MkiQuantUnitMode` and `unitId: string` at form level. Update `watch(detail)` to seed
   all of them, defaulting `row_type` to `'ROW'` and `unitMode` to `'NONE'` for legacy records.
2. Add the Unit block above Rows: an `MpSelect`/radio for the three modes (labels
   `Tidak ada` / `Seragam` / `Per baris`) and, when `Seragam`, a Master Unit `MpSelect` bound to
   `form.unitId`.
3. Rows section: render sections and their child rows as one ordered list. Section entries edit a
   `title`; row entries keep today's per-column inputs, plus a Master Unit select shown only when
   `unitMode === 'PER_ROW'`. Add `Tambah Section` next to the existing add-row button; a new row
   attaches to the section it was added under.
4. Add move-up / move-down / delete per entry. Deleting a section deletes or unparents its children
   (pick one, state it in the docs; unparenting is the safer default).
5. Rewrite `buildPayload`'s `rows` mapping to emit the new optional fields and **preserve
   `sequence`** as described above.
6. Replace the Live Preview table body with `<QuantSchemaTable>` from phase 2, passing
   `form.unitMode`/resolved unit, and keeping the existing input-type icon in the `#metric-cell`
   slot.
7. Append the As Built notes to `docs/mki-quantitative.md`: the sequence-stability rule, the
   move-buttons-not-DnD decision, and the unconfirmed BE shape.

## Acceptance

- `pnpm build` clean.
- Open an existing indicator, change nothing, hit Update: the payload's `rows` is identical to what
  was loaded (same sequences, same order, no new fields materially changed). Verify in the network
  tab or by logging `buildPayload()` before the call.
- Add a section `Limbah Non B3` with three rows under it and a `Per baris` unit on each; Live
  Preview shows the header row, the three indented rows, and a Satuan column.
- Reorder the section: its child rows move with it and no `sequence` value changes.
