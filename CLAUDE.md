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
| **"release"** | The full runbook in §5. |

### No AI attribution, anywhere
No `Co-Authored-By: Claude`, no "Generated with Claude Code", in commits, PR bodies, release notes, or docs.

---

## 2. Tests and builds — timing matters

**Tests come after confirmation, not with the fix.** Ship the code change alone, let the user verify it in the running app, and add specs once they say it works.

**Do not run the test suite or the production build until the user says "commit".** During the diagnose → fix loop, make edits and report. A fast type-check is fine; `ng test` and a prod build take minutes each and stall the loop. They batch into the commit step, where the build is the real gate.

**Exception:** if an edit breaks an existing spec (e.g. a new constructor arg), fix that spec in the same change. Leaving the suite red is not "waiting", it is handing over broken work.

When tests *are* requested:

- Runner is **Karma + Jasmine** (`karma.conf.js`), not Jest. Angular 16 on this branch.
- `npm test` → `ng test` runs the **`mdo` project only**; `tsconfig.spec.json` includes just `src/**/*.spec.ts`.
- Specs under `project/ws/app/**` require **`ng test @ws/app`**. Flag this rather than silently editing config.
- Service specs: copy [frac-api.service.spec.ts](project/ws/app/src/lib/routes/frac/services/frac-api.service.spec.ts) — the only spec using `HttpClientTestingModule`.
- Component specs: copy [activity-upload.component.spec.ts](project/ws/app/src/lib/routes/frac/pages/activity/activity-upload/activity-upload.component.spec.ts) — `async beforeEach` + `await compileComponents()`, `jasmine.createSpyObj` + `of(...)`, `NO_ERRORS_SCHEMA`.
- **Do not** copy `iframe-loader.component.spec.ts` or `frac.component.spec.ts` — stale CLI boilerplate that omits its own providers and throws `NullInjectorError`.

---

## 3. Angular rules (hard)

Angular **16.2.12** on `production`; a 20.3.x migration is in flight. Either way:

**Always:**
- `standalone: false` on every component/pipe/directive. NgModule architecture is preserved.
- `*ngIf` / `*ngFor` / `*ngSwitch`. **Never** `@if` / `@for` / `@switch`.
- Constructor-based DI. **Never** `inject()`.
- Stay NgModule-based — do not convert modules to standalone.
- Import specifiers stay `@sunbird-cb/{collection,resolver,utils}`.
- Material theming stays on the **M2** API (`mat.m2-define-palette`, …). Do not migrate to M3.

> `project/ws/app/src/lib/routes/docs/common/ANGULAR_MODULE_GUIDELINES.md` §8.2 mandates standalone +
> `loadComponent` and forbids feature modules. **The rules above win.** That doc reflects an aspiration
> for the newest Playlist/FRAC code, not the standard for this repo.

**Material legacy → MDC:** Angular 17 drops `MatLegacy*`. Replace `@angular/material/legacy-<x>` with `@angular/material/<x>` and `MatLegacyFoo`/`MAT_LEGACY_*` with `MatFoo`/`MAT_*`. Visually QA after — MDC markup and sizing differ.

When MDC layout can't be fixed with reasonable CSS, **replace the component with native HTML** rather than escalating `!important` hacks.

### The `!important` trap
Global utility classes carry `!important` and win over component-level `!important` because of stylesheet injection order. Don't fight it — add a custom class instead.

### Code style
tslint (not eslint): **no semicolons**, max line length **140**, 2-space indent.

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

## 5. Release runbook

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

## 6. Toolchain

Node/npm come from **nvs** and are not on `PATH` by default. Prepend it in each command:

```powershell
$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path"
```

| Command | Use |
|---|---|
| `npm run start:mdo-dev` | Dev server, proxies `/apis/*` to the stage host |
| `npm run build` | Production build |
| `npm test` | Karma, `mdo` project only |
| `ng test @ws/app` | Specs under `project/ws/app/**` |
| `npm run tailwind` | Regenerate `src/styles.scss` after new Tailwind classes |

**Dev proxy cookie expires.** `proxy/localhost.proxy.json` hardcodes a session cookie for `/apis/*`. On local 401/403: log in to the stage host, copy the session cookie, update the `Cookie` header.

**Path aliases:** `@ws/app` → `project/ws/app` public API. Relative imports only *within* the same feature.

---

## 7. Repo layout notes

- The production Express server is committed at [dist/server.js](dist/server.js) — static gzip serving plus `http-proxy` for `/LA` and `/ScormCoursePlayer`. It has **no session awareness**; anything needing auth belongs in the sbportal backend behind `/apis/*`.
- `assets/configurations/**` (menus, features, site config) is **host-served, not in this repo** — menu and nav changes are DevOps config, not code.
- Existing S3 references point at `aastar-assets`, a **public** bucket. Never put personal or restricted data there.
- `app/events` is declared twice in [app-routing.module.ts](src/app/app-routing.module.ts) (lines ~90 and ~162); the first wins, so the whole `app-event` feature is unreachable dead code. Don't add duplicate paths.
- `home.rounting.module.ts` — filename misspelling is load-bearing; leave it.
