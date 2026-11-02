# Form Configuration — Feature Reference

Developer reference for the Form module. For a plain-language overview (what it is, who it's for, why it
exists) see [FORM_MODULE_OVERVIEW.md](FORM_MODULE_OVERVIEW.md).

Branch: `feat/form-feature-module`. Route: `/app/home/form/config` (`FormConfigComponent`).
**Developer tool** — it edits live form-service config for every org. The menu entry is currently visible
to all roles (`requiredRoles: []`) and the route has no guard; see "Known follow-ups".

## What this feature does — Browse → Edit, on one page

### 1. Browse
The page opens on a **Browse** card with three scopes (`FORM_BROWSE_SCOPES`):

| Scope | Call | Shows |
|---|---|---|
| **Public** (default) | `listForms()` → `POST /apis/v1/form/list` with an empty body | the public forms (`root_org: '*'`) — 18 on staging |
| **Organization** | `listForms(rootOrgId)` → body `{ request: { rootOrgId } }` | one org's forms — shown after an org is picked from a searchable org dropdown |
| **All forms** | `fetchAllForms()` → `POST /apis/v1/form/fetchAll` | every stored form across all orgs — ~109 rows / ~2 MB, so only on demand |

Rows show **Org** (name looked up from the org-search list; `*` → "Public"), Type, Component, Framework,
Action, Last changed (formatted with `DatePipe`; `list` rows carry no timestamps, `fetchAll` rows do), and
an **Edit** button. A text filter (type/component/framework/org) and a Type filter narrow the table
client-side. Loading shimmer, empty state and inline error + Retry are built in.

### 2. Edit
**Edit** on a row calls `read` with that row's **exact** keys (`type`, `subtype`, `action`, `component`,
`framework`, `rootOrgId`) — nothing is guessed. This matters because **one org often has two forms for the
same layout, one with `framework: '*'` and one with `framework: 'v2'`** (e.g. org
`014095104385122304968` has web_layout/ekshamata under both). The old "pick selectors → Load Form" flow
hard-coded `v2` for Private and could never open the `*` one.

The editor (unchanged in substance):
- An **Editing** bar — `type · component · framework · org` — with **Back to forms**.
- A **details panel** with every top-level field except `data`.
- **Section tabs** — one per top-level key of `data` (real shape: `{ orgData, LAYOUT_HEADER, LAYOUT_BODY,
  LAYOUT_FOOTER }`).
- `FormNodeEditorComponent` per section — fully recursive (see "Why a recursive node editor"), with
  **Expand all / Collapse all** in the section toolbar (`setFormNodeCollapsed()`; Collapse all keeps the
  section root open).
- **Bulk add for string lists** — any list that is empty or holds only text items (e.g.
  `competencyIds`) shows a "Paste values, comma-separated" box + **Add Values**; `C1, C2, C3` becomes
  three text items (`addBulkStrings()` splits on commas/newlines, trims, skips blanks).

### 3. Save
**Update Form** validates the tree (`findFormNodeIssue()`), opens `FormPreviewDialogComponent` with a
per-section diff, and only on **Confirm & Save** posts to the create endpoint (stamping
`last_modified_on`). Then:
- **Success** → a "Form saved successfully." notice; the editor **stays open**; the saved data becomes
  the new baseline (for the diff and unsaved-change checks); the Browse list refreshes.
- **Failure** → an inline error with the API's message; the edits are kept.

### 4. Protecting edits
- **Unsaved-change guard** — Back to forms, opening another form, or New Form asks for confirmation
  (`window.confirm`) when the edited data differs from the loaded data (`hasUnsavedChanges()` — the same
  serialization the diff uses; deliberately *not* bound in the template, since serializing ~1000 nodes on
  every change-detection pass would be wasteful).
- **Discard changes** — rebuilds the editor from the loaded data (after confirming).
- **Download JSON** — downloads the form *as loaded* (not the edits), as a backup before overwriting it.

### 5. New Form (guarded create)
**New Form** opens the Type / Application Type (web_layout only) / Access / Framework / Org selectors.
Framework is now an **explicit** choice (`FORM_FRAMEWORKS`: `*` / `v2`) — Access only sets the default
(Public → `*`, Private → `v2`). **Create Form**:
1. calls `listForms(rootOrgId)` (or `listForms()` for Public) and looks for the exact combination
   (type, action, component, framework, rootOrgId — subtype ignored, see below);
2. **if one exists** → shows "A form already exists for this combination" with **Open existing**, and
   creates nothing;
3. **if none** → seeds the new form in the editor from the **Start from** choice (below) — marked
   "New form (not saved yet)"; its save button reads **Create Form**. Nothing is saved until then;
4. **if the check itself fails** → shows the error and creates nothing.

#### Start from: Empty form / Upload JSON, and Download sample JSON
The `data` shape depends on **Type** (confirmed on staging):

| Type | `data` top-level keys |
|---|---|
| `web_layout` (ekshamata / web) | `orgData`, `LAYOUT_HEADER`, `LAYOUT_BODY`, `LAYOUT_FOOTER` |
| `app_layout` (app) | `orgData`, `schemas` (`APP_UPDATE_INFO`, `NOTIFICATION_INFO`, `LAYOUT_HEADER`, `LAYOUT_DATA`, `TABS`) |

Once Type is picked, New Form shows a **Start from** row:
- **Empty form** (default) → `FORM_EMPTY_DATA[type]`. (Before this, app_layout was wrongly seeded with the
  web_layout `LAYOUT_*` sections.)
- **Upload JSON** → a file picker (`.json`). `applyUploadText()` accepts **either** a bare `data`
  object/array **or** a full form export — an object with a string `type` and a `data` object, i.e. what
  **Download JSON** produces — and then uses its `data`. So a form can be **copied between orgs**: Download
  JSON on org A's form → New Form for org B → Upload JSON. Invalid JSON or a non-object value shows an error
  and keeps **Create Form** disabled (`canCreate` requires a valid upload in this mode). Top-level keys not
  in the Type's sample only **warn** (real forms vary — e.g. `web` vs `ekshamata` differ inside
  `LAYOUT_BODY`); the warning re-checks if Type changes. A valid file shows "file.json — N sections: …"
  with **Remove**.
- **Download sample JSON** → `sample_<type>.json` with `FORM_SAMPLE_DATA[type]`.

Samples live in `constants/samples/{web_layout,app_layout}.sample.json` (imported via
`resolveJsonModule`, re-exported by `constants/form-samples.constants.ts`). They were generated from real
staging forms — web_layout/ekshamata org `013979705730662400309` and app_layout/app org
`014005962721189888281`, framework `*` — with every list of objects trimmed to its first 2 items (~18 KB /
~10 KB → ~7.5 KB / ~10 KB pretty-printed) and every value inside `orgData` emptied (keys and nesting kept: text → `""`, numbers → `0`, flags → `false`, lists → `[]`; the org-keyed `roleSourceConfig.sources` map → `{}`), so a new org fills in its own. Edit the
`.json` files to change them. They're kept out of `src/assets` so they ship in the lazy Form chunk and
avoid the `ng serve` restart / Express `/assets` issues in CLAUDE.md §7.

This replaces the old "Create Form for this Org" button, which was offered after **any** read failure —
including an expired session — and could overwrite a real form with an empty skeleton.

## Request/response contract (all confirmed against staging)

All form-service calls append a cache-busting `?v=${Date.now()}` (from the original curls'
`?v=%24{new%20Date().getTime()`).

### List — `POST /apis/v1/form/list`
- Empty body → the public forms. `{ "request": { "rootOrgId": "<id>" } }` → that org's forms; an org with
  none returns `{ forms: [], count: 0 }` (a clean empty list — this is the reliable "does it exist?" check).
  Other body shapes tried (`root_org`, `type`, `filters.rootOrgId`) are ignored and return the public list.
- Response: `result.forms[]` + `result.count`. Each row: `type`, `subtype`, `action`, **`root_org`**
  (snake_case — *not* `rootOrgId`), `framework`, `component`, and `data` **as a JSON string**. No
  `created_on`/`last_modified_on`.

### Fetch all — `POST /apis/v1/form/fetchAll`
- Empty body. Same row shape as `list` plus `created_on`/`last_modified_on`. ~1.9 MB for 109 forms because
  every row carries its full `data` string.
- `FormApiService` maps both responses through `toFormSummary()` → `IFormSummary` (`root_org` →
  `rootOrgId`, `data` dropped immediately so the 2 MB isn't held in memory).

### Read — `POST /apis/v1/form/read`
```
{ "request": { "type", "subtype", "action", "component", "framework", "rootOrgId" } }
```
- Returns `result.form` with `data` **as an object**, plus `created_on`/`last_modified_on` and `rootOrgId`.
- **`subtype` falls back**: `v1` and `*` both return the stored `*` form.
- **`framework` is exact**: `*` and `v2` return *different* forms when both exist.
- **A missing form is not a clean 404** — the form-service fails with
  `params.err: "ERR_READ_FORM_DATA"`, `params.errmsg: { message: "data.toJSON is not a function", stack }`.
  That's why "no form exists" is decided from `list`, never from a read failure.
- `action` is typed `string` (not `'get'`): non-layout forms use actions like `config_public` / `create`.

### Update / Create — `POST /apis/proxies/v8/ext-forms/v1/form/create`
- `request` is the exact object `read` returned as `result.form`, with `data` replaced by the edited JSON
  and `last_modified_on` set to now (`{ ...this.layout, data, last_modified_on }` in `saveForm()`).
- A brand-new form sends `subtype: 'v1'` (`FORM_LAYOUT_DEFAULTS.subtype`, from the original create curl);
  stored forms all carry `subtype: '*'`, which is why the New Form duplicate check ignores subtype.
- Auth/org/rootOrg/wid headers come from the app's HTTP interceptors.

### Errors — `formApiErrorMessage()`
401/403 → "Your session has expired…"; otherwise `params.errmsg` when it's a string, or
`params.errmsg.message` when it's an object; otherwise a per-call fallback.

## Why a recursive node editor

The editor went through three designs before landing here, each superseded by a more specific ask:
1. An Ace-powered raw JSON editor (copied from Playlist's manage-search) — replaced because the ask was
   explicitly to edit "the data as form fields, not as a json editor".
2. Fixed field rows (Code/Type/Label/Placeholder/Default/Required) for array sections, and key/value rows
   for object sections — any *other* property, or any *nested* object/array, had no dedicated input.
3. **This**: "each and every field, whether array, object, everything should be accessible in a form" —
   `FormNodeEditorComponent` renders itself recursively over `models/form-node.model.ts`'s `FormNode` tree:
   - `buildFormNode(value)` converts any JSON-compatible value into a `FormNode` (`'string' | 'number' |
     'boolean' | 'null' | 'object' | 'array'`).
   - The component switches on `node.kind`: primitives get a typed control; `'object'` renders an editable
     Key input + a nested `<ws-app-form-node-editor>` per entry; `'array'` renders a nested
     `<ws-app-form-node-editor>` per item with reorder/remove. A `standalone: false` component declared in
     an `NgModule` can reference its own selector in its own template.
   - `formNodeToValue(node)` serializes an edited tree back to plain JSON — `buildEditedData()` calls it
     once per section.
   - `findFormNodeIssue(node)` checks for empty/duplicate object keys anywhere in the tree before the
     preview opens.
   - The `FORM_FIELD_TEMPLATES` picker survives as a convenience on any array's Add row.

## Why collapsible

Real `data` measured **~1050 nodes, up to 11 levels deep** (`LAYOUT_BODY.sections.homeTab` alone is 8
heavily-nested objects). So `FormNode` has a UI-only `collapsed` flag (never read by `formNodeToValue()`);
`buildFormNode(value, depth)` collapses everything **below the section root** by default; new nodes start
expanded; each object/array renders a `.node-header` (chevron + count) that toggles `.node-body`, so a
collapsed subtree costs one header row. Expand all / Collapse all (`setFormNodeCollapsed()`) flips a whole
section at once.

## Why one page, not two

Originally two routed screens (`config` → `manage` via a `FormStateService` hand-off). The ask was to show
the editor inline on the same page, so `ManageFormDataComponent`, `form-state.service.ts` and the
`'manage'` route were deleted and merged into `FormConfigComponent`. `FORM_ROUTES` has only `config`.
Browse → Edit → Back keeps it to one page.

## Why NgModule-based, not standalone

CLAUDE.md §2 requires `standalone: false` components in an `NgModule`, lazy-loaded via `loadChildren`.
Structure follows **FRAC** (`frac.module.ts` + `frac-routing.module.ts`), not Playlist's standalone wiring.

## Files

| File | Purpose |
|---|---|
| `models/form.model.ts` | `FormApplicationType`, `FormAccessType`, `FormLayoutType`, `IFormReadRequest` (`action: string`), `IFormLayoutResult`, `IFormUpdateRequest`, `IFormSummary` (Browse row), `IFormListApiItem` / `IFormListApiResponse` (raw list/fetchAll), `IFormFieldConfig`, `IFormApiResponse`. |
| `models/form-node.model.ts` | `FormNode` tree + `buildFormNode()`, `formNodeToValue()`, `emptyFormNode()`, `findFormNodeIssue()`, `setFormNodeCollapsed()`. |
| `constants/form-samples.constants.ts` + `constants/samples/*.sample.json` | `FORM_SAMPLE_DATA` (Download sample JSON) and `FORM_EMPTY_DATA` (Empty form skeleton), per Type. |
| `constants/form.constants.ts` | `FORM_APPLICATION_TYPES`, `FORM_ACCESS_TYPES`, `FORM_LAYOUT_TYPES`, `FORM_FRAMEWORKS`, `FORM_BROWSE_SCOPES` / `FormBrowseScope`, `FORM_PREVIEW_DIALOG`, `FORM_COMPONENT_BY_APP_TYPE`, `FORM_LAYOUT_DEFAULTS`, `FORM_FIELD_TEMPLATES`, `FORM_ROUTES`. |
| `services/form-api.service.ts` | `readForm()`, `listForms(rootOrgId?)`, `fetchAllForms()`, `updateForm()`, `searchOrganizations()`; plus `formApiErrorMessage()`. Endpoints in a module-level `API_END_POINTS` (CLAUDE.md §4). |
| `pages/form-config/*` (`ws-app-form-config`) | The page: Browse (scopes, org picker, filters, table) → Edit (editing bar, details, section tabs, editor, Download/Discard/Update) → save notices; New Form panel with the duplicate check. v2 design-system mixins; native `<select>`, never `mat-select`. |
| `components/form-node-editor/*` (`ws-app-form-node-editor`) | The recursive editor, incl. bulk add for string lists. |
| `components/form-preview-dialog/*` (`ws-app-form-preview-dialog`) | Pre-submit per-section diff dialog; closing with `true` triggers the save. |
| `utils/diff-lines.util.ts` | Line diff + side-by-side rows for the preview dialog. |
| `form-routing.module.ts`, `form.module.ts` | `'' → 'config'`; module declares the three components, imports `CommonModule`, `RouterModule`, `FormsModule`, `MatIconModule`, `MatDialogModule`. |

Selectors use the `ws-app-` prefix (ESLint `@angular-eslint/component-selector`); they were `app-form-*`,
which failed lint.

Wiring outside the folder: `home.rounting.module.ts` (`'form'` child route → `FormModule`),
`public-api.ts` (barrel export), `menu-config.service.ts` (`Form` local menu, `requiredRoles: []`).

## Tests

Jest specs live next to each file: `form-config.component.spec.ts` (browse scopes, exact-key read, error
messages, unsaved-change guard, discard, expand/collapse, New Form duplicate check, save success/failure),
`form-api.service.spec.ts` (read/list/fetchAll/update/org search, error helper),
`form-node-editor.component.spec.ts` (incl. bulk add), `form-node.model.spec.ts`,
`form-preview-dialog.component.spec.ts`, `diff-lines.util.spec.ts`.

## Known follow-ups / open questions

- **Developer-only is by convention, not enforced.** Menu `requiredRoles: []`, no route guard. Once the
  exact developer role name exists: set it (lowercase) on the menu entry, add
  `canActivate: [GeneralGuard]` + `data: { requiredRoles: [...] }` on the `'form'` route, and add it
  (uppercase) to `DEFAULT_REQUIRED_ROLES` in `env.util.ts` + DevOps `portalRoles` (see CLAUDE.md §4).
- New forms are created with `subtype: 'v1'` while every stored form has `'*'`. Read treats them the same,
  but confirm with the backend whether create should send `'*'`.
- `fetchAll` downloads every form's full `data` (~2 MB) just to list it; a lighter backend endpoint would
  help if the form count grows.
- No search *inside* a form's tree (find a key/value and jump to it) — the next most useful addition for
  ~1000-node forms.
- `FORM_FIELD_TEMPLATES` (Name/Email/Mobile/…) was invented for this feature and doesn't map onto real
  `data` (menu items, sections, layout toggles); revisit or remove.
- No schema awareness: an enum-like property (e.g. a menu item's `type`) is just a free-text string.
- `null` values render as a text input; typing turns them into strings. No explicit "set to null".
- Validation runs on Update Form, not per keystroke.
- **`brace`/Ace note (historical):** an earlier iteration used an Ace JSON editor, which exposed a
  `ReferenceError: ace is not defined` race under esbuild code-splitting. The fix in Playlist's
  `manage-search.component.ts` (sequencing `brace`'s dynamic imports with `await`) stands on its own and
  should stay.
