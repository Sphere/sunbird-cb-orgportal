# Form Configuration — Feature Reference

Branch: `feat/form-feature-module` (cut from `sunbird-spark/upgrade`).

## What this feature does

A **single page** at `/app/home/form/config` (`FormConfigComponent`):

1. Pick a **Type** — `Web Layout` (`web_layout`) or `App Layout` (`app_layout`) — sent as the request's
   `type` field verbatim (`FORM_LAYOUT_TYPES` in `constants/form.constants.ts`; no longer a fixed
   `FORM_LAYOUT_DEFAULTS.type` constant). Comes **first**, since it decides what's asked next.
2. Pick an **Application Type** — `Ekshamata` or `Sphere` — **only shown when Type is `Web Layout`**
   (`showApplicationType` getter). For `App Layout`, `component` is always `'app'` regardless, so there's
   nothing for Application Type to influence; picking `App Layout` also clears any prior Application Type
   selection (`onLayoutTypeChange()`), so a stale pick can't linger into a request where it's ignored.
3. Pick an **Access** level — `Public` (before login) or `Private` (after login) — which drives
   `component`, `framework` and `rootOrgId` for the read request (see the request/response contract
   below).
4. **Load Form** calls the form-service **read** API and renders everything inline on this same page,
   directly below the selectors — no route navigation:
   - A **details panel** showing every top-level field on the fetched layout *except* `data`: Type,
     Subtype, Action, Component, Framework, Root Org Id, Created On, Last Modified On.
   - A row of **section buttons** — confirmed real shape: `data = { orgData, LAYOUT_HEADER, LAYOUT_BODY,
     LAYOUT_FOOTER }`, one button per top-level key of `data`, switching which section's editor is shown
     below. **Confirmed against a real fetch (`ekshamata.aastrika.org`, rootOrgId
     `0144024277797191683752`)**: all four are **objects**, not arrays — e.g. `LAYOUT_HEADER` has keys
     like `menuItems` (array of objects, each with a nested `image` object) and `webMenuItems` (array of
     strings); `LAYOUT_BODY.sections.homeTab` is an array of richly-nested config objects. The real `data`
     measured **~1050 nodes, up to 11 levels deep** — see "Why collapsible" below.
   - Each section is rendered by `FormNodeEditorComponent` — a **fully recursive** editor over an
     arbitrary JSON-compatible value (see "Why a recursive node editor" below): every array, object, or
     primitive, at any nesting depth, is a real editable form control. Arrays get reorder (up/down),
     remove, and Add (Text/Object/List, or a field-template picker); objects get an editable Key +
     recursively-rendered Value per entry, plus Add (Text/Group/List); primitives get a typed input
     (text/number/checkbox). Nothing falls back to read-only JSON. Every object/array node has a
     **collapsible header** (chevron + property/item count) — see "Why collapsible" below.
5. **Update Form** validates the whole tree (every object's keys must be non-empty and unique — see
   `findFormNodeIssue()`), then opens `FormPreviewDialogComponent` — a read-only dialog showing
   `component`, `framework`, `rootOrgId` and the pretty-printed final JSON (rebuilt from every section),
   modeled on Playlist's `playlist-view-dialog` (header/scrollable body/footer). Only on **Confirm &
   Save** does the update API actually fire — which also stamps `last_modified_on` to the current time
   (`new Date().toISOString()`, same shape as `created_on`) in `saveForm()`, alongside the edited `data`.
6. On a successful save, the page resets back to the plain selector state (no route navigation — see
   "Why one page, not two" below for what "then navigate" was interpreted as).

## Why a recursive node editor

The editor went through three designs before landing here, each superseded by a more specific ask:
1. An Ace-powered raw JSON editor (copied from Playlist's manage-search) — replaced because the ask was
   explicitly to edit "the data as form fields, not as a json editor".
2. Fixed field rows (Code/Type/Label/Placeholder/Default/Required) for array sections, and key/value rows
   for object sections — covered the real `{ orgData, LAYOUT_HEADER, LAYOUT_BODY, LAYOUT_FOOTER }` shape,
   but any *other* property on a field object, or any *nested* object/array inside `orgData`, had no
   dedicated input (nested values collapsed into a single JSON textarea per key).
3. **This**: the ask was "each and every field, whether array, object, everything should be accessible in
   a form" — so the fixed-shape editors were replaced with `FormNodeEditorComponent`, a single component
   that renders itself recursively (`models/form-node.model.ts`'s `FormNode` tree):
   - `buildFormNode(value)` converts any JSON-compatible value into a `FormNode` (`'string' | 'number' |
     'boolean' | 'null' | 'object' | 'array'`).
   - The component switches on `node.kind`: primitives get a typed control; `'object'` renders an
     editable Key input + a nested `<app-form-node-editor>` per entry; `'array'` renders a nested
     `<app-form-node-editor>` per item with reorder/remove. A `standalone: false` component declared in
     an `NgModule` can reference its own selector in its own template — Angular resolves it against the
     whole module's declarations — so no special recursion machinery is needed.
   - `formNodeToValue(node)` serializes an edited tree back to a plain JSON-compatible value —
     `FormConfigComponent.buildEditedData()` calls it once per section.
   - `findFormNodeIssue(node)` recursively checks for empty/duplicate object keys anywhere in the tree;
     `onUpdateForm()` runs it across every section before opening the preview dialog, so validation is no
     longer scattered across per-keystroke handlers.
   - The `FORM_FIELD_TEMPLATES` picker (Custom Field, Full Name, Email, Mobile Number, Designation,
     Department, Date of Birth, Gender) survives as a convenience on **any** array's Add row — it just
     seeds a template `FormNode` object rather than a fixed `IFormFieldConfig`.
   This also permanently removed Form's use of `brace`/Ace — see the `brace`/`ace` race-condition note
   further down, which affected an earlier iteration of this editor and prompted the same fix in
   Playlist's `manage-search.component.ts`.

## Why collapsible

A real fetch against `ekshamata.aastrika.org` (rootOrgId `0144024277797191683752`) measured `data` at
**~1050 nodes total, up to 11 levels deep** — `LAYOUT_BODY.sections.homeTab` alone is an array of 8
heavily-nested config objects. Rendering all of that expanded by default (the first cut of the recursive
editor) would be an unusable wall of inputs, not "good look and feel". So:
- `FormNode` gained a UI-only `collapsed` flag (never read by `formNodeToValue()`).
- `buildFormNode(value, depth)` collapses every object/array **below the section root** by default
  (`collapsed: depth >= 1`) — the root itself (what a section button reveals) stays expanded, so the
  immediate property/item list is visible right away, and everything nested one level deeper starts
  closed until clicked open.
- `emptyFormNode()` and `addTemplateItem()` create new nodes **expanded** (`collapsed: false`) — there's
  nothing to hide, and the admin just added it to fill it in.
- Every object/array node in `form-node-editor.component.html` now renders a `.node-header` (chevron +
  type icon + "N properties"/"N items" count) that's always visible and toggles `.node-body` — the
  actual entries/items and their Add controls only render when expanded, so a collapsed subtree costs
  nothing to keep in the DOM beyond its one header row.

## Why one page, not two

This was originally two routed screens: `/app/home/form/config` (selectors → Load Form → navigate) and
`/app/home/form/manage` (the editor, reached only via a `FormStateService` hand-off). The ask was
explicitly to show the loaded form's editor **inline in the same window** once Load Form is clicked, with
an Update button, and only navigate *after* that — so:
- `ManageFormDataComponent`, `form-state.service.ts`, and the `'manage'` route were **deleted**; their
  logic and template were merged directly into `FormConfigComponent`.
- "then navigate" is interpreted as: after a successful save, the page resets to its initial
  selector-only state (`resetLoadedState()`) rather than crossing to a different route — there was no
  second page left to navigate *to* once everything lives on one page. `FORM_ROUTES` now only has
  `config`.
- The preview-before-submit confirmation dialog behavior (a prior explicit ask, kept) is unchanged —
  Update Form still previews the exact JSON before the network call fires.

## Why NgModule-based, not standalone

CLAUDE.md's standing rule (§2) requires `standalone: false` components declared in an `NgModule`,
lazy-loaded via `loadChildren`. This was chosen explicitly over mirroring Playlist's actual wiring
(which uses `standalone: true` components with no NgModule) — see the "Component style" decision in
this feature's chat history. The structural template followed instead is **FRAC**
(`project/ws/app/src/lib/routes/frac/frac.module.ts` + `frac-routing.module.ts`), which is itself one
of the four canonical design-system references called out in CLAUDE.md §9.

## Request/response contract

### Read (confirmed against a real curl)

```
POST /apis/v1/form/read?v=<cache-busting timestamp>
{
  "request": {
    "type": "<web_layout | app_layout>",
    "subtype": "v1",
    "action": "get",
    "component": "<ekshamata | web>",
    "framework": "v2",
    "rootOrgId": "<'*' for public, the org's rootOrgId for private>"
  }
}
```

The response's `result.form` carries more than what was requested — confirmed real example:
```json
{
  "type": "web_layout",
  "subtype": "*",
  "action": "get",
  "component": "ekshamata",
  "framework": "*",
  "created_on": "2026-09-01T06:38:12.377Z",
  "last_modified_on": null,
  "rootOrgId": "014095108131266560969",
  "data": { "orgData": {}, "LAYOUT_HEADER": [], "LAYOUT_BODY": [], "LAYOUT_FOOTER": [] }
}
```
`created_on`/`last_modified_on` (snake_case, exactly as returned — not camelCase) were added to
`IFormLayoutResult` for this; both are shown read-only in the details panel.

- `type`: sent verbatim from the **Type** selector (`web_layout` or `app_layout`, `FORM_LAYOUT_TYPES`) —
  not defaulted or computed, the admin must pick one before Load Form is enabled (`canLoad` requires
  `layoutType` truthy).
- `component` mapping: **Type `app_layout` → always `app`**, regardless of Application Type/Access — takes
  priority over everything else. Otherwise (Type `web_layout`, the original rule): **Public → always
  `web`**, regardless of application type; **Private → Ekshamata → `ekshamata`, Sphere → `web`**
  (`FORM_COMPONENT_BY_APP_TYPE` in `constants/form.constants.ts`). Computed in
  `FormConfigComponent.loadForm()`, not stored as component state.
- `rootOrgId`: **Public → locked to `'*'`** (select disabled). **Private → a dropdown of known org ids**
  (`ROOT_ORG_IDS` in `constants/root-org-ids.constants.ts`), enabled only when Private is selected; the
  admin must pick one before Load Form is enabled (`canLoad` requires `rootOrgId` truthy).
- `framework`: **Public → `'*'`**, **Private → `'v2'`** (`FORM_LAYOUT_DEFAULTS.publicFramework` /
  `.privateFramework`). Both `rootOrgId` and `framework` are recomputed together in
  `FormConfigComponent.onAccessTypeChange()`.
- The `?v=` query param is a cache-buster copied from the original curl
  (`?v=%24{new%20Date().getTime()` → `?v=${Date.now()}`); the frontend generates it, it isn't user input.

### Update / Create (confirmed against a real curl)

```
POST /apis/proxies/v8/ext-forms/v1/form/create
{
  "request": {
    "type": "web_layout",
    "subtype": "v1",
    "action": "get",
    "component": "<same component the read call returned>",
    "framework": "<same framework the read call returned>",
    "rootOrgId": "<same rootOrgId the read call returned>",
    "data": { ...edited JSON... }
  }
}
```

Two things that were *not* the standard-contract guess made earlier in this feature's build, both
confirmed from the real curl:

- **The endpoint is `/apis/proxies/v8/ext-forms/v1/form/create`**, not `/apis/v1/form/update`.
- **`request` is the exact same object as `result.form` from the read response** — same `type`,
  `subtype`, `action`, `component`, `framework`, `rootOrgId` — with only `data` replaced by the edited
  JSON. There is no separate `action: 'update'` wrapper; `FormConfigComponent.saveForm()` builds this
  with `{ ...this.layout, data: editedData, last_modified_on: <now> }`.
- Auth/org/rootOrg/wid/locale headers seen in the curl are attached by the app's existing HTTP
  interceptors — nothing extra was added in `FormApiService` for them.

## Files added (all new — no existing model/service file was modified)

| File | Purpose |
|---|---|
| `models/form.model.ts` | Models for the layout/request contract: `FormApplicationType`, `FormAccessType`, `FormLayoutType`, `IFormReadRequest`, `IFormUpdateRequest`, `IFormLayoutResult` (including `created_on`/`last_modified_on`), `IFormFieldConfig`, `IFormApiResponse`. |
| `models/form-node.model.ts` | The generic editable-tree model: `FormNode`/`FormNodeKind`/`FormNodeEntry` (including the UI-only `collapsed` flag — see "Why collapsible"), plus pure helpers `buildFormNode()`, `formNodeToValue()`, `emptyFormNode()`, `findFormNodeIssue()`. |
| `constants/form.constants.ts` | `FORM_APPLICATION_TYPES`, `FORM_ACCESS_TYPES`, `FORM_LAYOUT_TYPES` (`web_layout`/`app_layout` — the Type selector), `FORM_COMPONENT_BY_APP_TYPE`, `FORM_LAYOUT_DEFAULTS` (`subtype`/`publicFramework`/`privateFramework`/`publicRootOrgId` — `type` moved out to `FORM_LAYOUT_TYPES` since it's now user-selected, not a fixed default), `FORM_FIELD_TEMPLATES` (the array Add-row's template picker), `FORM_ROUTES` (just `config`). |
| `constants/root-org-ids.constants.ts` | `ROOT_ORG_IDS` — the fixed list of selectable org ids for Private mode, deduplicated from the list provided for this feature. |
| `services/form-api.service.ts` | `FormApiService.readForm()` / `.updateForm()`. Endpoint paths follow the `API_END_POINTS` convention from CLAUDE.md §4 (see `event.service.ts`). |
| `pages/form-config/form-config.component.ts/html/scss` | The single page: selectors → Load Form (inline fetch, no navigation) → details panel → section tabs → `<app-form-node-editor>` → Update Form (validate → preview dialog → save → reset). Styled with `_ws-design-system-v2.scss` mixins (`v2-page-container`, `v2-page-title`, `v2-custom-select-wrapper/input` — native `<select>`, never `mat-select`, per CLAUDE.md §9). |
| `components/form-node-editor/form-node-editor.component.ts/html/scss` | The recursive tree editor — see "Why a recursive node editor" and "Why collapsible" above. Its own SCSS rebuilds the shared input/button/select primitives from the v2 mixins (Angular's emulated view encapsulation means it can't inherit `form-config.component.scss`'s classes), plus `.node-header`/`.node-body` for the collapse/expand chrome. |
| `components/form-preview-dialog/form-preview-dialog.component.ts/html/scss` | The pre-submit JSON preview dialog, modeled on `playlist-view-dialog.component`. Opened via `MatDialog`; closing with `true` (Confirm & Save) is what actually triggers the update call. |
| `form-routing.module.ts` | `FormRoutingModule` — `'' → redirect to 'config'`, `'config' → FormConfigComponent`. |
| `form.module.ts` | `FormModule` — declares `FormConfigComponent`, `FormPreviewDialogComponent`, `FormNodeEditorComponent`; imports `CommonModule`, `RouterModule`, `FormRoutingModule`, `FormsModule` (for `ngModel`), `MatIconModule`, `MatDialogModule`. |

## Files edited (wiring only)

| File | Change |
|---|---|
| `project/ws/app/src/lib/routes/home/home.rounting.module.ts` | Added a `'form'` child route under the `HomeComponent` node, `loadChildren` into `FormModule`, next to the existing `'playlist'`/`'frac'` entries. |
| `project/ws/app/src/public-api.ts` | Added `export * from './lib/routes/form/form.module'` to the `@ws/app` barrel. |
| `project/ws/app/src/lib/routes/home/services/menu-config.service.ts` | Added a `Form` entry to `localMenus` (`key: 'form'`, `routerLink: '/app/home/form/config'`, `enabled: true`, `requiredRoles: []` — visible to all roles, set directly by the user) — this is where `home.component.ts`'s `leftData` picks up new menu items via `menuConfig.mergeMenus()`. |

## Known follow-ups / open questions

- `requiredRoles` on the menu entry is currently `[]` (visible to all roles) — tighten if Form should be
  restricted to specific roles.
- No page-level `GeneralGuard` was added on the `form` route (mirrors Playlist, which is also unguarded
  at the route level) — add `canActivate: [GeneralGuard]` + `data: { requiredRoles: [...] }` on the
  `'form'` child route in `home.rounting.module.ts` if a hard page gate is needed later.
- `FORM_FIELD_TEMPLATES` is a starting set of common field kinds (Name/Email/Mobile/Designation/
  Department/DOB/Gender) invented for this feature, not sourced from a real form config. Now that a real
  fetch has been seen, it doesn't map cleanly onto anything actually in `data` — `LAYOUT_HEADER`/`BODY`/
  `FOOTER` are config objects (menu items, sections, layout toggles), not arrays of user-facing form
  fields with a `code`/`type`/`label` shape. The picker still works (it just seeds a template `FormNode`
  object into whichever array you're adding to) but may not be the right convenience for this data —
  revisit once it's clear which arrays, if any, actually hold field-like objects.
- Collapsing everything below the section root by default (`buildFormNode`'s `depth >= 1`) means a
  shallow but wide object (many direct properties, none of them containers) looks fine, but a section
  whose root itself needs review one level down (e.g. checking `menuItems` inside `LAYOUT_HEADER`)
  requires one click to open before anything about it is visible — intentional given the ~1050-node
  scale, but worth knowing.
- The node editor has no per-field/per-property "type" awareness beyond string/number/boolean/null/
  object/array — e.g. it can't tell that a `LAYOUT_HEADER` item's `type` property is meant to be one of a
  fixed enum (`text`/`select`/`checkbox`/...); that property is just another editable string. Add a
  schema layer if stricter guidance is needed later.
- `null` values render as a plain text input (with `null` shown only as a placeholder) — typing into it
  turns the value into a string, it doesn't stay `null` unless left untouched. There's no explicit
  "set to null" control.
- After a successful save, the page resets to the selector state entirely (`layout`/`sections` cleared) —
  the admin has to re-pick Application Type/Access/Root Org Id to load again, even to re-view the form
  they just saved. Revisit if staying on the just-saved form (re-fetch instead of reset) is preferred.
- Validation (`findFormNodeIssue`) only runs when Update Form is clicked, not per-keystroke — an invalid
  tree shows no error until submit is attempted.
- **`brace`/Ace note (historical):** an earlier iteration of this editor used an Ace-powered JSON editor
  (like Playlist's `manage-search`), which surfaced a real bug — see git history on this branch — where
  adding Form as a second lazy consumer of `brace` caused a `ReferenceError: ace is not defined` under
  esbuild's code-splitting. That was fixed in this component (since replaced entirely, no longer
  applicable) and in Playlist's `manage-search.component.ts` (still applicable — that fix stands on its
  own and should stay even though Form no longer uses `brace`) by sequencing `brace`'s dynamic imports
  with `await` instead of static side-effect imports.
