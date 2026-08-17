# CLAUDE.md — sunbird-cb-orgportal

Working agreements for this repo. These are **hard rules**; ask before deviating.

---

## 1. Workflow

### Branch before editing
Cut the branch **first**, before the first edit — never work directly on `production`.

```bash
git checkout -b feat/<short-desc>    # or fix/<short-desc>
```

| Branch | Role |
|---|---|
| `production` | Stable trunk. **Cut all feature/fix branches from here.** PRs target it. |
| `release-X.Y.Z` | Frozen build branch. Jenkins deploys from this. **Never advance after deploy.** |
| `main` | Exists but is **not** the dev base. Do not branch from it. |

If edits were already started on `production`, `git checkout -b` carries them over — do that immediately rather than continuing.

### Show the diff before applying it
Show proposed changes as before/after code blocks in chat and wait for explicit confirmation ("yes", "go ahead") before calling Edit/Write.

**Exception:** an approved plan (plan mode / ExitPlanMode) *is* the confirmation for the files that plan names. Anything outside the approved scope goes back to diff-first.

### Commit and release are explicit triggers
Never commit, push, or release on your own. Make the edits, report, and stop.

| User says | Means |
|---|---|
| **"commit"** | `git commit` **and** `git push` for the current work. No PR, no release, unless asked. |
| **"release"** | The full runbook in §6. |

### No AI attribution, anywhere
No `Co-Authored-By: Claude`, no "Generated with Claude Code", in commits, PR bodies, release notes, or docs.

---

## 2. Angular 16 → 20 migration — landed on this branch

The Angular 16.2 → 20.3.x migration is **complete on `feat/angular-21-migration`** (branch name kept for
history; the actual target was Angular 20, not 21 — the Sunbird libs only ship `-ang-17-20` builds) and is
being merged in via `fix/mergeng21Sonar`. Toolchain reality, verified in this tree:

- Angular `20.3.25`, builder `@angular/build:application` (esbuild), dev-server `@angular/build:dev-server`.
- TypeScript `5.9.3`, RxJS `7.8.2`, zone.js `0.15.1`.
- Unit tests: **Jest** (`jest.config.js`, `jest-preset-angular`) — **Karma/Jasmine are gone**, `npm test` runs `jest`.
- Lint/format: **ESLint** (`.eslintrc.json`, `@angular-eslint/builder:lint`) — **tslint is gone**.
- e2e: Protractor removed (Cypress optional/deferred).

Config-shape template used during the migration (Angular 21): `D:\tarento projects\sunbird-cb-creationportal-old`
(pkg `cbp`) — its builder/jest/eslint/tsconfig SHAPES were copied but pinned to 20.3.x; its
`library/ws-widget` vendoring was ignored (we don't vendor).

### Standing rules carried forward from the migration (do not deviate without asking)
These aren't migration-scoped — they're the permanent architecture of this repo, pre- and post-20:
- **Stay NgModule-based.** Do NOT convert to standalone components. Every component/pipe/directive sets
  `standalone: false` (ESLint `prefer-standalone` is off).
- **Keep legacy control flow** `*ngIf` / `*ngFor` / `*ngSwitch`. **Never** `@if`/`@for`/`@switch`
  (template `prefer-control-flow` is off).
- **Constructor-based DI. Never `inject()`.**
- **Sunbird libs come from npm — do NOT vendor, do NOT rewrite import specifiers.** Imports stay
  `@sunbird-cb/{collection,resolver,utils}`. Verified-working versions:
  `collection@0.0.9-ang-17-20`, `utils@0.0.1-ang-17-20`, `resolver@0.0.1-ang-17-20`
  (NOT the `-v2` packages — `resolver-v2` is missing `WidgetResolverService/Module`).
  `@sunbird-cb/design-system@0.0.3` (CSS only) and `@project-sunbird/telemetry-sdk` stay as-is.
- **Output path stays `dist/www/en`** (the Express/static server expects `/en`). In angular.json use
  `outputPath: { base: "dist/www/en", browser: "" }`.
- Build flags are kebab-case only (`--configuration=…`, `--base-href=/`). The old
  `--outputPath` / `--baseHref` / `--i18nLocale` flags are invalid on this builder.
- Material theming stays on the **M2** API (`mat.m2-define-palette`, …) — see the theming section below.
  Do not migrate to M3.

> `project/ws/app/src/lib/routes/docs/common/ANGULAR_MODULE_GUIDELINES.md` §8.2 mandates standalone +
> `loadComponent` and forbids feature modules. **The rules above win.** That doc reflects an aspiration
> for the newest Playlist/FRAC code, not the standard for this repo.

### Material legacy → MDC swap map (Angular 17 removed `MatLegacy*`)
Replace every `@angular/material/legacy-<x>` import with `@angular/material/<x>`, and `MatLegacyFoo` /
`MAT_LEGACY_*` symbols with `MatFoo` / `MAT_*`:
`legacy-button→button`, `legacy-card→card`, `legacy-menu→menu`, `legacy-select→select`,
`legacy-input→input`, `legacy-form-field→form-field`, `legacy-tooltip→tooltip`,
`legacy-checkbox→checkbox`, `legacy-slider→slider`, `legacy-progress-bar→progress-bar`,
`legacy-progress-spinner→progress-spinner`, `legacy-tabs→tabs`, `legacy-dialog→dialog`,
`legacy-snack-bar→snack-bar`, `legacy-table→table`, `legacy-paginator→paginator`,
`legacy-list→list`, `legacy-radio→radio`, `legacy-chips→chips`, `legacy-autocomplete→autocomplete`,
`legacy-slide-toggle→slide-toggle`, `legacy-dialog`'s `MatLegacyDialogRef`→`MatDialogRef`, etc.
MDC markup/sizing differs — visually QA buttons, form-fields, tabs, dialogs after swapping.

When MDC layout can't be fixed with reasonable CSS, **replace the component with native HTML** rather than
escalating `!important` hacks.

### Theming stays on Material's M2 (Material 2) API — not M3
Angular Material 17+ defaults its Sass theming API to M3 ("Material You"), exposing the old API under
an `m2-` prefix (`mat.m2-define-light-theme`, `mat.m2-define-palette`, `mat.$m2-blue-palette`,
`mat.m2-get-color-from-palette`, `mat.m2-define-typography-config/level`, etc., via
`@angular/material`'s `@forward './core/m2' as m2-*`). All 9 files under `src/themes/` (`theme-*.scss`,
`_theme-mixins.scss`) and `src/styles/mat-typography.scss` use this M2-compatible API, not the M3
`mat.define-theme`/bare palette names — every component's CSS was authored against M2's type-scale/
shape/spacing tokens, and M3 changes those tokens app-wide. Do NOT migrate these files to M3 without
a full visual QA pass across all 9 themes (`day-mode`/`night-mode`) and the font-scale classes
(`.x-small-typography` … `.x-large-typography`, driven by `host.config.json`'s `fontSizes`).
Each `theme-*.scss` must call both `mat.all-component-themes($theme)` AND
`theme-based-configurations($theme)` (the latter from `_theme-mixins.scss`, generating the
`.ws-mat-*` utility classes ~80 components rely on) — a prior migration pass dropped the second call
from every theme file, silently breaking those utility classes app-wide without a build error.

### HttpClient
In `src/app/app.module.ts`, prefer `provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())`
over `HttpClientModule`/`HttpClientJsonpModule`. Keep the DI-based `HTTP_INTERCEPTORS`.

### The `!important` trap
Global utility classes carry `!important` and win over component-level `!important` because of stylesheet
injection order. Don't fight it — add a custom class instead.

### Code style
ESLint (not tslint): **no semicolons**, max line length **140**, 2-space indent.

---

## 3. Tests and builds — timing matters

**Tests come after confirmation, not with the fix.** Ship the code change alone, let the user verify it in the running app, and add specs once they say it works.

**Do not run the test suite or the production build until the user says "commit".** During the diagnose → fix loop, make edits and report. A fast type-check is fine; `jest` and a prod build take minutes each and stall the loop. They batch into the commit step, where the build is the real gate.

**Exception:** if an edit breaks an existing spec (e.g. a new constructor arg), fix that spec in the same change. Leaving the suite red is not "waiting", it is handing over broken work.

When tests *are* requested:

- Runner is **Jest** (`jest.config.js`, `jest-preset-angular`) — Karma/Jasmine are gone.
- `npm test` / `npm run test-watch` / `npm run test-coverage` run Jest across the whole workspace (both `src/` and `project/ws/app/**` are covered by the one Jest config — there's no separate `@ws/app` test command like the old Karma setup had).
- Mock objects: use `createSpyObj` from `src/test-utils/create-spy-obj.ts` (returns `jest.Mocked<T>` via `jest.fn()`), not `jasmine.createSpyObj`.
- Service specs: copy [frac-api.service.spec.ts](project/ws/app/src/lib/routes/frac/services/frac-api.service.spec.ts) — `HttpClientTestingModule`/`HttpTestingController` still apply under Jest, this is the reference for HTTP-backed services.
- Component specs: copy [activity-upload.component.spec.ts](project/ws/app/src/lib/routes/frac/pages/activity/activity-upload/activity-upload.component.spec.ts) — `jest.Mocked<T>` typed spies, `createSpyObj`, `of(...)`/`throwError(...)` from rxjs, `NO_ERRORS_SCHEMA`.
- **Do not** copy `iframe-loader.component.spec.ts` or `frac.component.spec.ts` — stale CLI boilerplate that omits its own providers and throws `NullInjectorError`.

---

## 4. Code conventions

**API endpoints** — module-level `API_END_POINTS` const of relative `/apis/...` strings; parameterized ones are arrow functions. See [event.service.ts](project/ws/app/src/lib/routes/home/services/event.service.ts#L6-L18). Endpoint URLs **never** come from `environment` in this repo. Never inline routes, limits, timeouts, or dialog dimensions in components.

**`environment`** holds only `production`, `sitePath`, `karmYogiPath`, `cbpPath`, `portalRoles` — values injected at runtime via `window.env`. Feature toggles live in `instanceConfig` (read through `ConfigurationsService`), not `environment`.

**Access control** — three levers, weakest to strongest:
1. Menu visibility — `requiredRoles` on the menu item (host-served `assets/configurations/feature/home.json`).
2. Page gate — `canActivate: [GeneralGuard]` + `data: { requiredRoles: ['some_role'] }`. **Lowercase required:** [general.guard.ts:124-132](src/app/guards/general.guard.ts#L124-L132) tests a lowercased Set without lowercasing the input, so an uppercase entry silently never matches.
3. Within-page — the `FEATURE_ACCESS` / `FEATURE_KEY` / `*appHideForViewOnly` pattern in [feature-access.ts](project/ws/app/src/lib/shared/access/feature-access.ts). Note it hides *mutations* from read-role users; it does not gate a page, and `isViewOnly` fails **open**.

**⚠ Adding a new role is a two-step job.** [env.util.ts](src/environments/env.util.ts) holds `DEFAULT_REQUIRED_ROLES`; at bootstrap `InitService.hasRole` intersects the user's roles against `environment.portalRoles` and calls `authSvc.logout()` on no match. A user holding **only** a role missing from that list is logged straight back out. Add it there (**uppercase** — that check is case-sensitive) *and* to DevOps `window.env.portalRoles`.

**No i18n.** This repo has no translate pipe or i18n JSON — new strings go in templates directly. (Differs from the eagle-fusion sibling.)

**Design work restyles existing components in place.** Do not scaffold new shared components or page sections for a design/token task.

---

## 5. Build / run environment

- Node is managed by **nvs**; `node`/`npm` are not on the default PATH in scripted shells. Prepend the
  nvs default before any node/npm/ng command:
  `$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path"` (currently node 20.20.1 / npm 10.8.2).
- Heap: builds use `--max_old_space_size` (see package.json scripts); keep that for large builds.

| Command | Use |
|---|---|
| `npm run start:mdo-dev` | Dev server, proxies `/apis/*` to the stage host |
| `npm run build` | Production build |
| `npm test` | Jest, whole workspace |
| `npm run test-watch` / `npm run test-coverage` | Jest watch mode / coverage |
| `npm run tailwind` | Regenerate `src/styles.scss` after new Tailwind classes |

**Dev proxy cookie expires.** `proxy/localhost.proxy.json` hardcodes a session cookie for `/apis/*`. On local 401/403: log in to the stage host, copy the session cookie, update the `Cookie` header.

**Path aliases:** `@ws/app` → `project/ws/app` public API. Relative imports only *within* the same feature.

---

## 6. Release runbook

Trigger: user says "release" or "release X.Y.Z". Run through to the PR without stopping on automatable steps.

| Artifact | Name |
|---|---|
| Build branch (Jenkins source) | `release-X.Y.Z` |
| Tag | `vX.Y.Z` |
| GitHub Release title | `Release-X.Y.Z` — version only, no date or description |
| Notes file | `RELEASE_NOTES/release-X.Y.Z.md` |

Branch name and tag name are always different — same name is an ambiguous git ref.

1. **Verify green** — lint, unit tests, production build.
2. **Work on a `feat/`/`fix/` branch.** Write `RELEASE_NOTES/release-X.Y.Z.md` on that **same** branch and commit it before opening the PR — one PR per release, not a separate notes PR.
3. **One PR → merge into `production`.**
4. **Wait for the merge.** Human-gated; do not proceed on an unmerged branch.
5. **Cut artifacts from `production`** after merge: `git branch release-X.Y.Z origin/production && git tag vX.Y.Z origin/production`. Never cut from the feature branch.
6. **Publish the GitHub Release** from the tag, body = the notes file, `--title "Release-X.Y.Z"` (it defaults to the tag name otherwise).
7. **Deploy is manual** — Jenkins targets the **branch**, not the tag.
8. **Never advance a frozen release branch.** Each release gets a fresh `release-X.Y.Z`.

Older `cbrelease-X.Y.Z` / `Release-X.Y.Z` branches exist on the remote — no longer the convention.

### Release notes structure
Start from `RELEASE_NOTES/TEMPLATE.md` if present. Nine sections in order:

1. Header table — build branch, tag, baseline, commit count, author
2. **Summary** — 2–3 plain sentences for a non-engineer stakeholder
3. ✨ Features (`_None — patch release._` if empty)
4. 🐛 Fixes (`_None._` if empty)
5. 🏗️ Build / CI / Infra
6. 📚 Docs / Chore
7. ⚠️ Deploy notes & risk — tick only what was actually touched
8. ✅ Pre-deploy checklist — fill in the rollback ref
9. Release & rollback — deploy source branch + rollback command

Each bullet: `**<scope>** — <plain description> (\`<short-sha>\`)`. Always include the short SHA. Delete inapplicable deploy-note lines rather than leaving unchecked boxes.

---

## 7. Local asset/config serving

The 6 runtime config JSONs (`host.config.json`, `site.config.json`, `features.config.json`,
`widgets.config.json`, `feature/apps.json`, `feature/home.json`) and every image/script referenced via
an `assets/...` path in app code (icons, app/source logos, flag PNGs, hero/login banner images,
`js/ie-check.js`) live under `src/assets/` and are tracked in git so a fresh clone runs without
proxying to a backend for them.
- **`src/assets/env.js`** stays **untracked** (`.gitignore`: `/src/assets/env.js`) — it's per-deployment
  runtime config (sets `window['env'].sitePath` etc.) and must not be set via an IIFE keyed on `this`
  (that resolved to `undefined` in some load contexts and crashed `environment.ts`); assign `window['env']`
  directly. Each environment needs its own local `env.js` copy before `npm start`.
- `angular.json`'s app `assets` array must include `"src/assets"` (it was missing, causing 404s under
  `ng serve`) — **`ng serve` caches that glob list at process startup**, so adding new entries/folders
  under `src/assets/` requires a full restart, not just a save/HMR reload.
- `proxy/localhost.proxy.json` must NOT proxy `/assets/**` to a backend — that shadows the local files
  with the backend's SPA-fallback HTML.
- The Express server (`dist/server.js`, used for `node dist/server.js` / preview builds) serves `/assets`
  from `dist/assets/` via `express.static`, separately from `dist/www/en/` — local-only file additions
  under `src/assets/` need a build (or a manual copy into `dist/assets/`) to reach that server.
- `@sunbird-cb/collection` hardcodes a profile-placeholder path at
  `assets/images/profile/karmayogi-image.svg` — keep that file present or list/grid widgets 404-flood.
- When adding a new feature/component, grep for new `assets/...` literals in its `.html`/`.scss`
  (`src=`, `url(...)`, background-image) and add a matching file under `src/assets/` — missing ones
  fail silently as broken images/backgrounds, not build errors.

---

## 8. Repo layout

- `src/` — the `mdo` application (root project, prefix `ws`).
- `project/ws/app/` — the `@ws/app` workspace library (~142 components / ~48 modules; prefix `ws-app`).
- `library/ws-widget/{collection,resolver,utils}/` — vendored Sunbird libs (added during migration).
- `proxy/` — dev-server proxy configs. `src/environments/` — per-env files (dev/preprod/np/benchmark/prod).
- The production Express server is committed at [dist/server.js](dist/server.js) — static gzip serving plus `http-proxy` for `/LA` and `/ScormCoursePlayer`. It has **no session awareness**; anything needing auth belongs in the sbportal backend behind `/apis/*`.
- `assets/configurations/**` (menus, features, site config) is **host-served, not in this repo** — menu and nav changes are DevOps config, not code.
- Existing S3 references point at `aastar-assets`, a **public** bucket. Never put personal or restricted data there.
- `app/events` is declared twice in [app-routing.module.ts](src/app/app-routing.module.ts) (lines ~90 and ~162); the first wins, so the whole `app-event` feature is unreachable dead code. Don't add duplicate paths.
- `home.rounting.module.ts` — filename misspelling is load-bearing; leave it.

---

## 9. UI design reference — copy these, don't reinvent

Four already-shipped components implement this project's modern design language end-to-end. When
redesigning/modernizing any other page, match their literal values instead of inventing new ones:
- `project/ws/app/src/lib/routes/frac/pages/frac-dashboard/frac-dashboard.component.{html,scss}` —
  page container, h1 title, subtitle, responsive card-grid
- `project/ws/app/src/lib/routes/frac/pages/position/position-upload/position-upload.component.{html,scss}` —
  manage-mode card grid, custom dropdown, empty/loading states, shimmer skeletons, pill buttons
- `project/ws/app/src/lib/routes/playlist/pages/playlist-filters/playlist-filters.component.{html,scss}` —
  form page with a custom native `<select>` styled as a card field with a floating mini-label (replaces
  `mat-select` to avoid MDC's uncontrollable internal padding — see the Material legacy→MDC swap map in §2)
- `project/ws/app/src/lib/routes/frac/components/frac-table/frac-table.component.{html,scss}` —
  canonical table layout: blue header `#dfedf9`, 40px rows, `border: 1px solid #e0e0e0`, `border-radius: 8px`

**Design system file: `src/styles/_ws-design-system-v2.scss`** — import with `@import 'ws-design-system-v2'`.
Provides all tokens AND ready-to-use mixins so components never hard-code values. Use these mixins first:

| Element | Mixin | Key values |
|---|---|---|
| Page container | `@include v2-page-container` | `padding: 32px`, flex column, gap 24px, responsive |
| h1 title | `@include v2-page-title` | `40px / 500 / #000` → 32px@768 → 24px@480 |
| Subtitle | `@include v2-page-subtitle` | `20px / 400 / #000` → 16px@768 |
| Section label | `@include v2-section-title` | `18px / 500 / $v2-color-text` |
| Modal title | `@include v2-modal-title` | `28px / 500 / #000` |
| Form label | `@include v2-form-label` | `13px / 500`, display block, 6px bottom margin |
| Text input | `@include v2-input-field` | `height 40px`, `border: 1px solid $v2-color-border`, `border-radius: 8px`, FRAC focus ring |
| Card grid | `@include v2-card-grid` | `repeat(3,1fr)` → 2-col@1024 → 1-col@480, `gap: 24px` |
| Action card | `@include v2-action-card` | `padding: 24px`, border, shadow, hover lift `0 4px 16px rgba(28,93,149,0.14)` |
| Card action btn | `@include v2-card-action-btn` | outlined `#1c5d95`, `height: 40px`, pill |
| Table wrapper | `@include v2-table-container` | `border: 1px solid #e0e0e0`, `border-radius: 8px` |
| Table inner | `@include v2-table-inner` | header `#dfedf9 / bold / sticky`, rows `40px`, hover `#f9fbff` |
| Primary button | `@include v2-btn-primary` | filled `#1c5d95`, pill `50px`, hover lift |
| Secondary button | `@include v2-btn-secondary` | outlined `#1c5d95`, pill, hover tint |
| Danger button | `@include v2-btn-danger` | outlined `#ca0000`, pill |
| Custom select (wrapper) | `@include v2-custom-select-wrapper` | `position: relative; width: 100%` — structural only |
| Custom select (input) | `@include v2-custom-select-input` | `height: 52px`, `border: 1px solid #E1DFDF`, floating-label padding |
| Empty state card | `@include v2-empty-state-card` | dashed `#c8d6e6` border, `border-radius: 8px`, center-aligned |
| Empty state icon | `@include v2-empty-state-icon` | 56px circle, `background: #eef4fb`, `border: 1px solid #d5e3f3` |
| Shimmer skeleton | `@include v2-shimmer` | gradient sweep animation `1.5s linear`, `border-radius: 6px` |

**Never** use `mat-select` for dropdowns — use a native `<select>` with the playlist-filters pattern:
wrapper `@include v2-custom-select-wrapper` + floating `<span class="select-label">` (13px/`#808080`,
`top:7px left:16px absolute`) + select `@include v2-custom-select-input` + chevron SVG/span at `right:14px`.

Note: `playlist-filters.component.ts` already uses Angular signals — this is existing shipped code, not
a license to introduce signals elsewhere in this migration.
