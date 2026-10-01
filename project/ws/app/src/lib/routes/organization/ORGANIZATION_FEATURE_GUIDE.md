# Organization — Feature Reference

The **Organization** section of the Org Portal's left menu: list, search, create, edit and
deactivate/reactivate organizations. This is separate from the Form module (see
`../form/FORM_FEATURE_GUIDE.md`).

Route: `/app/home/organization/list` (`OrganizationListComponent`). Branch: `feat/form-feature-module`.

## What it does

| Action | How |
|---|---|
| **List** | One upfront fetch of all orgs (newest first), shown in a table: Name (+ id), Channel, Type / Sub-type, Tenant, Status, Created. Client-side paging, 20 per page. |
| **Search** | Filters the loaded list by name, channel or id as you type. |
| **Create** | **Create Organization** opens a dialog: Organization Name*, Channel*, Organisation Type, Organisation Sub-type, Is Tenant. Defaults: `mdo` / `department` / tenant on. |
| **Edit** | The pencil icon opens the same dialog prefilled. **Channel is read-only**, because Sunbird doesn't allow changing it after creation. |
| **Delete (deactivate)** | The bin icon asks for confirmation, then sets the org's status to **Inactive** (a soft delete; Sunbird has no hard delete). |
| **Reactivate** | Inactive orgs show a restore icon instead, which sets the status back to **Active**. |

Dialogs make the API call themselves: errors show inside the dialog, and it closes only on success. After
any successful change the list reloads. Loading shimmer, an empty state and an inline error with Retry
are built in.

## How it works

```
Left menu → Organization ──► OrganizationListComponent ──► OrganizationApiService.searchOrganizations()
                                   │
              ┌────────────────────┼─────────────────────────┐
              ▼                    ▼                         ▼
   Create Organization        Edit (pencil)          Deactivate / Activate
              │                    │                         │
   OrganizationEditDialog (create / edit mode)      OrganizationConfirmDialog
              │                    │                         │
     createOrganization()   updateOrganization()   updateOrganizationStatus(id, 0 | 1)
              └────────────── success → dialog closes(true) → list reloads ───┘
```

## API contract

All calls go through the portal proxy (`/apis/proxies/v8/...`). Auth, org, rootOrg and wid headers come
from the app's HTTP interceptors. The browser never uses service-account tokens.

| Op | Method + URL | Body | Status |
|---|---|---|---|
| List | `POST /apis/proxies/v8/org/v1/search` | `{ request: { filters: {}, fields: [], sortBy: { createdDate: 'Desc' }, limit: 9999 } }` | **Confirmed** (same call Form and Playlist use) |
| Create | `POST /apis/proxies/v8/org/v1/create` | `{ request: { orgName, channel, isTenant, organisationType, organisationSubType } }` | Body **confirmed** from a direct curl to `/api/org/v1/create`; the proxy path is assumed from the search path |
| Update | `PATCH /apis/proxies/v8/org/v1/update` | `{ request: { organisationId, orgName, organisationType, organisationSubType } }` | Standard Sunbird, **not yet confirmed** |
| Status (deactivate / reactivate) | `PATCH /apis/proxies/v8/org/v1/status/update` | `{ request: { organisationId, status: 0 \| 1 } }` | Standard Sunbird, **not yet confirmed** |

The search response is read as `result.response.content[]`; each org has `id`, `orgName`, `channel`,
`isTenant`, `organisationType`, `organisationSubType`, `status` (1 = Active, 0 = Inactive) and
`createdDate`. `createdDate` comes back as `YYYY-MM-DD HH:mm:ss:SSS+0000`, which isn't ISO, so the table
shows only the date part.

Error messages come from `orgApiErrorMessage()`: the API's `params.errmsg` if present, otherwise a
fallback for that action.

## Access

**No role restriction for now.** The menu entry has `requiredRoles: []` and the route has no guard, so
every portal user can see and use it. To restrict it later:
1. Set lowercase roles on the menu entry in `menu-config.service.ts`.
2. Add `canActivate: [GeneralGuard]` + `data: { requiredRoles: [...] }` to the `'organization'` route in
   `home.rounting.module.ts`.

## Files

| File | Purpose |
|---|---|
| `organization.module.ts` | `OrganizationModule`: declares the list page and both dialogs; imports `CommonModule`, `RouterModule`, `FormsModule`, `MatIconModule`, `MatDialogModule`. NgModule-based, `standalone: false` (CLAUDE.md §2). |
| `organization-routing.module.ts` | `'' → 'list'`, `'list' → OrganizationListComponent`. |
| `models/organization.model.ts` | `IOrganization`, `IOrgSearchResponse`, `IOrgCreateRequest`, `IOrgUpdateRequest`, `IOrgApiResponse`. |
| `constants/organization.constants.ts` | `ORG_STATUS`, `ORG_CREATE_DEFAULTS`, `ORG_PAGE_SIZE`, `ORG_EDIT_DIALOG`, `ORG_CONFIRM_DIALOG`. |
| `services/organization-api.service.ts` | `searchOrganizations()`, `createOrganization()`, `updateOrganization()`, `updateOrganizationStatus()`, and `orgApiErrorMessage()`. Endpoints are in a module-level `API_END_POINTS`; update/status are marked unconfirmed there. |
| `pages/organization-list/*` (`ws-app-organization-list`) | Header + Create button, search, table, paging, shimmer, empty and error states. |
| `components/organization-edit-dialog/*` (`ws-app-organization-edit-dialog`) | Create/Edit dialog. |
| `components/organization-confirm-dialog/*` (`ws-app-organization-confirm-dialog`) | Deactivate/Activate confirmation. |

Wiring outside the folder:
- `home.rounting.module.ts`: the `'organization'` child route, lazy-loading `OrganizationModule`.
- `public-api.ts`: barrel export.
- `menu-config.service.ts`: the `Organization` local menu (`/app/home/organization/list`,
  `requiredRoles: []`).

## Known limits / next steps

- **Confirm update and status update:** test them against staging, or get the real curls. If the paths or
  bodies differ, only `API_END_POINTS` / the request objects in the service need to change.
- **Proxy allow-list:** if the sbportal proxy doesn't forward `org/v1/create`, `update` or
  `status/update`, those calls return 404/403. The fix is on the backend, not in this repo.
- **Single fetch of up to 9999 orgs:** fine at the current size. Move to server-side search and paging if
  the org count grows a lot.
- **Duplicate org lookup:** the Form module has its own copy of the org-search call; it could reuse
  `OrganizationApiService`.
- **No specs yet:** Organization specs will be added once the feature is confirmed working in the app.
