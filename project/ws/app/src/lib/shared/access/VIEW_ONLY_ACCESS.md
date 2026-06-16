# Role-Based View-Only Access

Some roles can **only view** a feature. They can browse and navigate everything, but every way to change data is removed or locked: mutating buttons are hidden, and input controls (checkboxes, dropdowns, drag-reorder, editors) are disabled. Everyone else is unaffected.

## Roles

| Role | FRAC feature | Playlist feature |
|------|--------------|------------------|
| `FRAC_ADMIN` | Full access (view + edit) | — unaffected — |
| `FRAC_READ` | **View only** | — unaffected — |
| `PLAYLIST_ADMIN` | — unaffected — | Full access (view + edit) |
| `PLAYLIST_READ` | — unaffected — | **View only** |
| any other role | unaffected | unaffected |

**Rule:** a user is view-only for a feature when they have its `*_READ` role **and not** its `*_ADMIN` role. Each feature is independent — `FRAC_READ` never affects Playlist, and vice versa.

## What "view only" does

Navigation and data stay visible so the user can read and explore everything. Mutating buttons are **hidden**; input controls are **disabled** (shown but greyed out).

### FRAC (`FRAC_READ`)
Covers the FRAC tab + Manage Positions.

| Hidden (mutations) | Disabled (inputs) | Stays visible |
|--------------------|-------------------|---------------|
| Upload, Save, Edit, Remove | Row-selection checkboxes (manage tables) | View, Manage (navigation), Search |
| Add (mapping pages) | Mapping checkboxes | Download sample, Language, Back |
| Confirm & Upload (modal) | | All data cards / tables |

### Playlist (`PLAYLIST_READ`)
View-only users can open Manage and walk through **every** screen to see lists, dropdowns and the search query — they just can't change anything.

| Hidden (mutations) | Disabled (inputs) | Stays visible |
|--------------------|-------------------|---------------|
| Save (all screens) | Selection checkboxes | Manage / Create, View, Change |
| Assign courses (order screen)\* | Course dropdowns | Next, Assign courses (select screen) |
| Format (JSON) | Drag-reorder | Back, Search, Clear Search |
| | JSON editor (read-only) | All data, lists, current order |

\* The "Assign courses" button on **Manage Competency Order** is a mutation (marks courses assigned), so it's hidden; the same-named button on **Select Competencies** is navigation, so it stays.

## How it works

Two directives read the current feature automatically (no per-element config), plus a component flag for Angular Material controls:

- `*appHideForViewOnly` — **removes** an action button for view-only users.
- `appDisableForViewOnly` — **disables** a control but keeps it visible. Works on native inputs and `<mat-checkbox>`; only ever *adds* the disabled state, so existing `[disabled]` logic is preserved.
- `get isViewOnly()` — components expose this (it calls `FeatureAccessService.isViewOnly()`) to bind Material controls that can't take an attribute directive cleanly: `[cdkDropListDisabled]`, `mat-select [disabled]`, and the Ace editor's `setReadOnly()`.

## Where things live

| What | File |
|------|------|
| Role config (single source of truth) | `shared/access/feature-access.ts` |
| Hide directive (buttons) | `shared/directives/hide-for-view-only.directive.ts` |
| Disable directive (checkboxes) | `shared/directives/disable-for-view-only.directive.ts` |
| Role onboarding (login gate) | `src/environments/env.util.ts` |

## Adding a new feature later

1. Add one line to `FEATURE_ACCESS` in `feature-access.ts`:
   ```ts
   reports: { admin: 'reports_admin', read: 'reports_read' },
   ```
2. Provide its key in that feature's module/routes:
   ```ts
   { provide: FEATURE_KEY, useValue: 'reports' }
   ```
3. Add the new roles to `DEFAULT_REQUIRED_ROLES` in `env.util.ts` (and the DevOps `portalRoles` env).

Nothing else changes — existing buttons need no edits.
