# Pixel 3 Tabs (`@mekari/pixel3-tabs@0.0.25`) — verified from installed package

Source verified: `node_modules/.pnpm/@mekari+pixel3-tabs@0.0.25.../dist/*.d.ts` and `dist/chunk-*.mjs`
(tab-list.mjs, tab.mjs, chunk-MJLY4BUV.mjs `useTabs/useTabList/useTab`, chunk-FSG5ZJLB.mjs `MpTab`).
Recipe CSS traced into `@mekari+pixel3-styled-system@0.3.1` (`recipes/tab-recipe.mjs`,
`recipes/tab-list-slot-recipe.mjs`) — these are Panda-CSS atomic recipes with no static CSS shipped
in this package; actual class rules are generated at the consuming app's own build time, so no
overflow/scroll rule could be confirmed from node_modules alone.

## 1. Exports and exact props/emits

- `MpTabs` — root. Props: `modelValue?: number`, `defaultValue: number = 0`, `id?: string`,
  `isManual?: boolean`, `variantColor?: 'blue'|'green'|'orange'|'red'|'gray' = 'blue'`,
  `isShowBorder: boolean = false`, `hasMarginBottom: boolean = false`.
  Emits: `change`, `update:modelValue` — **both fire with the tab `index: number`**, not an id/string.
  If `isManual` is true, `selectedTab` becomes `computed(() => props.modelValue)` (fully controlled);
  otherwise it's internal `ref(defaultValue)` and `v-model` still works via the emits.
- `MpTabList` — no props. Filters children to only `MpTab` (warns on anything else, even through
  `<template v-for>` fragments — it does unwrap `v-fgt` fragments though, so `v-for` over `MpTab` is fine).
  Clones each child with `isSelected`, `index`, `aria-selected`, and an injected `onClick` that calls
  `onChangeTab(index)`. Renders `<div rootAttrs><div tabListAttrs>{tabs}</div></div>` (two nested divs).
- `MpTab` — props: `id?: string`, `isDisabled: boolean = false`, `isSelected: boolean = false`
  (overridden by `MpTabList` clone), `value?: string` (present in types but **not read** by
  `useTab`/render — only `props.isSelected`, `props.id`, `attrs.index`, `props.isDisabled` are used).
  Renders a `<button role="tab">` plus an `MpTabSelectedBorder` div for the underline.
- `MpTabPanels` — no props, just a wrapper div (`data-pixel-component="MpTabPanels"`).
- `MpTabPanel` — props: `isSelected?: boolean`, `value?: string` (also unread by logic — panel
  show/hide is **not automatic**, see below), `isKeepAlive: boolean = false`.

## 2. Minimal snippet (index-based v-model)

`MpTabPanel`'s `isSelected` is a plain prop, not auto-wired by `MpTabPanels` the way `MpTabList`
wires `MpTab`. You must bind it yourself from the same index used by `MpTabs`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MpTabs, MpTabList, MpTab, MpTabPanels, MpTabPanel } from '@mekari/pixel3-tabs'

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'targets', label: 'Targets' },
    { id: 'gri-201', label: 'GRI 201' },
    { id: 'gri-302', label: 'GRI 302' },
    { id: 'gri-303', label: 'GRI 303' },
    { id: 'gri-305', label: 'GRI 305' },
    { id: 'gri-306', label: 'GRI 306' },
    { id: 'gri-403', label: 'GRI 403' },
]

const activeIndex = ref(0)
</script>

<template>
    <MpTabs v-model="activeIndex" variant-color="blue">
        <div class="overflow-x-auto">
            <MpTabList>
                <MpTab v-for="(tab, i) in tabs" :key="tab.id" :id="tab.id">
                    {{ tab.label }}
                </MpTab>
            </MpTabList>
        </div>
        <MpTabPanels>
            <MpTabPanel
                v-for="(tab, i) in tabs"
                :key="tab.id"
                :is-selected="activeIndex === i"
                :is-keep-alive="true"
            >
                <!-- panel content for tab.id -->
            </MpTabPanel>
        </MpTabPanels>
    </MpTabs>
</template>
```

Note: without `is-keep-alive`, `MpTabPanel`'s `useTabPanel` sets `style.display` to `''` regardless
of selection (the `unset`/`none` toggle only applies when `isKeepAlive` is true), so **you should
pass `is-keep-alive="true"` and conditionally render only the panels you want mounted**, or wrap
with `v-if="activeIndex === i"` yourself if you don't want all 8 panels mounted at once.

## 3. Horizontal scroll on overflow — not automatic, confirmed no built-in fix

`MpTabList`'s only styling comes from `tabListSlotRecipe()` (`root`, `list` slot classnames), a
Panda-CSS **slot recipe with zero variants and zero compound variants** (`variantKeys: []`,
`defaultVariants: {}`). There is no `overflowX`, `whiteSpace`, or `flexWrap` logic anywhere in the
component or hook code — it's purely `<div class="tab-list__root"><div class="tab-list__list">…`.
Whatever wrapping/overflow behavior exists is entirely up to the atomic CSS the *consuming app's*
Panda build generates for those classes, which isn't present in this package's dist. Bottom line:
**do not assume horizontal scroll is built in.**

Smallest correct fix — wrap `MpTabList` in a `div` styled with `css()` from `@mekari/pixel3`:

```vue
<script setup lang="ts">
import { css } from '@mekari/pixel3'

const scrollWrapClass = css({ overflowX: 'auto', whiteSpace: 'nowrap' })
</script>

<template>
    <div :class="scrollWrapClass">
        <MpTabList> ... </MpTabList>
    </div>
</template>
```

## 4. Variant/size props affecting underline look

- `variantColor` on `MpTabs` (`'blue'|'green'|'orange'|'red'|'gray'`, default `'blue'`) — propagated
  via `useTabsContext` into both `tabRecipe` (label color when selected) and
  `tabSelectedBorderRecipe` (the underline bar color). This is the only color/style variant.
- `isShowBorder` on `MpTabs` — toggles `data-border` on the `MpTabList` root wrapper (likely a bottom
  border line under the whole strip, defined by the consumer's Panda build).
- `hasMarginBottom` on `MpTabs` — toggles `data-has-margin-bottom` on the list.
- No `size` prop exists anywhere in `MpTabs`/`MpTab`/`MpTabList` types.

## 5. Verdict

**Use `MpTabs` (with `MpTabList`/`MpTab`/`MpTabPanels`/`MpTabPanel`), not `MpButtonGroup`.**

Justification from the types actually read:
- `MpTabs` ships a real underline-style selected indicator (`MpTabSelectedBorder` +
  `tabSelectedBorderRecipe`, keyed off `variantColor`), which is exactly the "underline-style tab
  look" the mockup spec wants — `MpButtonGroup` has no such concept, it's discrete buttons.
- `v-model` is index-based (`number`), which maps cleanly onto an 8-item array of GRI tab defs
  without needing string-id plumbing.
- It correctly emits both `change` and `update:modelValue` so existing button-group `@click`
  handlers migrate to a single `v-model="activeIndex"` binding.

Caveat: the package does **not** give horizontal scroll for free — that must be added explicitly
with a `css({ overflowX: 'auto' })` wrapper around `MpTabList` as shown in §3. Also remember panel
visibility is manual (`:is-selected` + `is-keep-alive`), unlike some tab libraries that auto-hide.
