# Release Notes — v1.1.0

| | |
|---|---|
| **Build branch** | `release-1.1.0` |
| **Tag** | `v1.1.0` _(to be created)_ |
| **Baseline** | `8c6ae1f` — previous `production` tip |
| **Commits** | 2 (2 features) |
| **Author** | Likhith Thammegowda |
| **Date** | 2026-08-06 |

> Baseline is the previous `production` tip rather than a tag. The repo's only existing tag, `Release-1.0.0`, sits 32 commits behind `production`, so it would not describe what this release contains. `v1.1.0` starts the `release-X.Y.Z` / `vX.Y.Z` convention for this repo.

## Summary

Adds a new MNC Attendance Report page to the MDO portal, visible only to users granted a specific role. The report itself is a file the client refreshes daily; the portal displays it inside the page, served through the backend so it is never exposed as a public link. A left-menu entry is included so the intended users can reach it directly.

## ✨ Features

- **MNC attendance report page** — new `/app/home/mnc-attendance-report` route displaying the report in a sandboxed iframe, served from the `ui-proxy` backend. Gated by `GeneralGuard` on `mnc_report_viewer`, with handled states for forbidden and failed loads (`db96a3e`).
- **Left-menu entry and display refinements** — surfaces the page in the left navigation via the existing `MenuConfigService` hook, gated on the same role; removes the duplicate page heading and timestamp, and removes the loading mechanism that could leave a spinner on screen indefinitely (`aac4cb7`).

## 🐛 Fixes

_None — new feature._

## 🏗️ Build / CI / Infra

_None._

## 📚 Docs / Chore

- **`CLAUDE.md`** — repo working agreements: branching, release runbook, test/build timing, Angular rules, code conventions and toolchain notes (`db96a3e`).
- **`report-viewer/README.md`** — S3 layout, backend endpoint contract, role setup and verification steps for the report feature (`db96a3e`).

## ⚠️ Deploy notes & risk

- **⚠ `MNC_REPORT_VIEWER` must be added to `window.env.portalRoles` before deploy.** At bootstrap `InitService.hasRole` intersects a user's roles against `environment.portalRoles` and calls `authSvc.logout()` on no match, so a user holding **only** this role is logged straight back out. The role is present in `DEFAULT_REQUIRED_ROLES` in `src/environments/env.util.ts` as a fallback, but the deployed value comes from DevOps config. **Uppercase — that check is case-sensitive.**
- **Requires ui-proxy v5.2.14 or later.** The page calls `/apis/protected/v8/report/mnc-attendance` and `/meta`. Against an older ui-proxy those return `403` and the page shows its "no access" state — degraded, not broken.
- **Shared code touched: `MenuConfigService` was dormant and is now active.** Its import, injection and `mergeMenus` call in `home.component.ts` were all commented out; this release re-enables them. Its pre-existing Playlist and Competency entries are set `enabled: false`, since the merge had never run and their real entries come from the host-served page config — leaving them enabled would have duplicated nav items. **Worth a specific look at the left menu after deploy**, as this affects every user's navigation, not only report viewers.
- **Route role name is lowercase (`mnc_report_viewer`)** in both the route guard and the menu entry: `GeneralGuard` tests a lowercased set without lowercasing its input, so an uppercase entry silently never matches.
- No dependency, schema, or build-config changes.

## ✅ Pre-deploy checklist

- [ ] Lint + unit tests + production build pass on `production` at the release commit.
- [ ] `MNC_REPORT_VIEWER` present in `window.env.portalRoles` (uppercase) for the target environment.
- [ ] ui-proxy **v5.2.14 or later** is deployed.
- [ ] A user with the role sees the menu entry and the report renders.
- [ ] A user **without** the role is redirected away from `/app/home/mnc-attendance-report`.
- [ ] Left menu verified for an existing `MDO_ADMIN` user — no missing or duplicated items after the `MenuConfigService` change.
- [ ] Rollback reference confirmed: previous `production` tip `8c6ae1f`.

## Release & rollback

- **Deploy source:** `release-1.1.0`, cut from `production` at the release commit and tagged `v1.1.0`. Jenkins targets the branch, not the tag.
- **Rollback:** re-run the deploy pipeline against a build of `8c6ae1f`. No data migration or config change needs reverting; leaving `MNC_REPORT_VIEWER` in `portalRoles` after a rollback is harmless.
