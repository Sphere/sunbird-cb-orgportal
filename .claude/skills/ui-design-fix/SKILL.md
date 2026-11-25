---
name: ui-design-fix
description: Fix, modernize, or restyle a UI page/component in orgportal. Use whenever asked to fix a visual/UX/layout issue, "make this look modern", or redesign any page under src/ or project/ws/app. Enforces reusing the repo's already-shipped design tokens instead of inventing new ones, and never removing functionality.
---

# UI design fix workflow

Goal: any UI fix or redesign matches the design language already shipped in this repo and never
removes existing functionality.

## Step 1 — Use the design system mixins first

Add `@import 'ws-design-system-v2'` at the top of the component SCSS, then use these mixins
instead of hard-coding values. The mixins encode patterns validated across FRAC dashboard,
FRAC position-upload, playlist-filters, and FRAC table:

| Element | Mixin | Notes |
|---|---|---|
| Page container | `@include v2-page-container` | 32px padding, flex column, responsive |
| h1 page title | `@include v2-page-title` | 40px/500/black, responsive |
| Subtitle | `@include v2-page-subtitle` | 20px/400/black |
| Section label | `@include v2-section-title` | 18px/500 |
| Modal title | `@include v2-modal-title` | 28px/500/black |
| Modal subtitle | `@include v2-modal-subtitle` | 14px gray |
| Form label | `@include v2-form-label` | 13px/500, block, 6px bottom gap |
| Text input | `@include v2-input-field` | height 40px, bordered, focus ring |
| Search input | `@include v2-search-field` | same + 360px width |
| Card grid | `@include v2-card-grid` | 3→2→1 col, gap 24px, responsive |
| Action card tile | `@include v2-action-card` | padding 24px, border+shadow, hover lift |
| Card action btn | `@include v2-card-action-btn` | outlined primary, height 40px, pill |
| Table wrapper div | `@include v2-table-container` | border + 8px radius |
| table element | `@include v2-table-inner` | blue header, 40px rows, hover |
| Primary CTA | `@include v2-btn-primary` | filled blue, pill |
| Secondary action | `@include v2-btn-secondary` | outlined blue, pill |
| Danger action | `@include v2-btn-danger` | outlined red, pill |
| Custom select (wrapper) | `@include v2-custom-select-wrapper` | structural only: `position:relative; width:100%` |
| Custom select (input) | `@include v2-custom-select-input` | 52px, `#E1DFDF` border, floating-label padding |
| Empty state card | `@include v2-empty-state-card` | dashed `#c8d6e6` border, centered |
| Empty state icon | `@include v2-empty-state-icon` | 56px circle, `#eef4fb` fill |
| Shimmer skeleton | `@include v2-shimmer` | gradient sweep, 1.5s linear |

**Custom floating-label select structure** (playlist-filters pattern):
```html
<div class="select-wrapper">                     <!-- @include v2-custom-select-wrapper -->
  <span class="select-label">Field Name</span>   <!-- absolute top:7px left:16px, 13px #808080 -->
  <select class="custom-select" …>…</select>     <!-- @include v2-custom-select-input -->
  <!-- chevron: SVG or &#9660; span at right:14px top:50% -->
</div>
```
For a **simple 40px select without floating label** (e.g. inside a modal form field):
use `border:1px solid $v2-color-border; border-radius:$v2-radius-input; height:40px; appearance:none` directly.

Key variables always available: `$v2-shadow-card-hover`, `$v2-shadow-dropdown`,
`$v2-color-card-description`, `$v2-color-select-border`, `$v2-status-*-{bg,text}`, `$v2-font-micro`.

## Step 2 — Reference files (fallback only — mixin does not cover it yet)

- `frac-dashboard.component.{html,scss}` — card-grid layout, action card full implementation
- `position-upload.component.{html,scss}` — position card variant (12px radius, stronger hover shadow)
- `playlist-filters.component.{html,scss}` — full floating-label select: chevron SVG, multi-select panel
- `frac-table.component.{html,scss}` — grid-line variant classes (horizontal/vertical/both/none)

## Step 3 — Enhance, never remove

Every field, button, dropdown, filter, validation message, permission check, and existing user
flow must still work after the change. If something looks redundant, improve its discoverability —
don't delete it. Aesthetics vs functionality → functionality wins.

## Step 4 — Respect Angular 20 migration rules

While restyling, do not:
- Convert components to `standalone: true` or rewrite to `inject()` — keep constructor DI
- Convert `*ngIf`/`*ngFor` to `@if`/`@for`
- Migrate Material theming from M2 to M3

Swap any remaining `MatLegacy*`/`legacy-*` Material imports using the swap map in CLAUDE.md if
you touch a component that still has them.

## Step 5 — Fix null-safety in filter/search logic

When touching a component that filters a list: ensure every `event.field.toLowerCase()` is guarded
as `(event.field || '').toLowerCase()` — API fields can be null and Angular 20 won't swallow the
TypeError silently the way Angular 16 did.

## Step 6 — Validate before reporting done

- [ ] All existing functionality still present and wired up
- [ ] Every SCSS value comes from a `v2-*` mixin or a documented reference-file token — no ad-hoc colors/radii/shadows
- [ ] Responsive at the three standard breakpoints (1024 / 768 / 480)
- [ ] Loading / empty / error / success states all handled
- [ ] No `standalone`/`@if`/`inject()` introduced
- [ ] Accessibility preserved (focus states, contrast, keyboard nav)
- [ ] Null-safety on any filter/search methods

If a UI fix can't be verified visually (e.g. no browser session available), say so explicitly rather
than claiming it's confirmed — ask the user to check in their browser.
