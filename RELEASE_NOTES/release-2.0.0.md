# Release 2.0.0 — 2026-06-22

|                              |                                              |
| ---------------------------- | -------------------------------------------- |
| **Build branch deployed**    | `release-2.0.0` (Jenkins deploy source)      |
| **Tag**                      | `v2.0.0` (immutable marker + GitHub Release) |
| **Baseline (previous prod)** | `v1.0.0`                                     |
| **Commits**                  | `44`                                         |
| **Author**                   | Likhith Thammegowda                          |

## Summary

This is a **major platform release**: the MDO portal has been migrated from **Angular 16 to Angular 20.3.x**
(esbuild application builder, Jest, ESLint 9, Angular Material MDC). On top of the migration, the nav bar
was redesigned with role-gated feature icons and a styled profile dropdown, and a portal-wide design system
v2 was rolled out across FRAC, events, tables, and skeleton loading states. All Dockerfiles are updated to
Node 20.20.1.

## ✨ Features

- **navbar** — Rebuilt profile dropdown: blue initials avatar, `#eef4fb` header section, red logout icon; nav icons role-gated (`feature_home` = MDO_ADMIN, `feature_mydashboard` = MDO_DASHBOARD_VIEWER); removed native "toolbar" browser tooltip (`844017b`)
- **events** — Client-side pagination on events list; global dark mat-tooltip styling (`299edc1`)
- **ui** — Portal-wide uniform table design (blue `#dfedf9` header, 40 px rows, `border-radius: 8px`), shimmer skeleton loading states across all list views (`461caa1`)
- **ui** — Events UI overhaul and design system v2 rollout (FRAC dashboard, position upload, playlist filters, FRAC table) (`6fc8289`)
- **frac / playlist** — View-only read access for non-admin roles; `appHideForViewOnly` / `appDisableForViewOnly` directives gate all mutating actions (`d46e01c`)
- **playlist** — Full playlist management: course selection, ordering, state/district filters, competency level configuration, auto-save, and payload transformation (`47c71fa`, `2f36927`, `5add10d`, `daec51b`, `4154c2e`, `0575678`)
- **events** — Certificate status display; org search API integration with dropdown (`831b197`, `c72cdb6`)
- **assets** — Real production images replace placeholders; all runtime config JSONs and local image assets tracked in git for dev-without-backend (`24a42a5`, `2ca6799`, `d7974fe`)
- **migration** — Angular 16 → 20.3.x: `@angular/build:application` esbuild builder, Jest + `jest-preset-angular`, ESLint 9 + `@angular-eslint/21`, Sunbird `-ang-17-20` packages, NgModule-based (no standalone conversion), M2 Material theming retained (`4a8110a`, `b257c73`)

## 🐛 Fixes

- **theme** — Restored M2 Material theming, brand palettes, and all `ws-mat-*` utility-class mixin calls that a prior migration pass dropped silently from every theme file (`2286fbf`)
- **ui** — Matched production toolbar appearance, active-menu styling, sidebar logo (`b11c921`)
- **lint** — Resolved ESLint errors across src: wrapper types, empty lifecycle stubs, expression statements, var declarations (`e58972a`)
- **events** — Removed language filter from course read API; fixed CSS on search playlist view option (`17f921f`, `872c4ce`)

## 🏗️ Build / CI / Infra

- **docker** — Upgraded all Dockerfiles (`Dockerfile.dev`, `.np`, `.preprod`, `.benchmark`, `.build`, `.main`) from Node 10/12/18 → 20.20.1; `yarn` → `npm ci`; dropped dead `--prod --build-optimizer` flags (`c4003ac`)
- **npm** — Added `--legacy-peer-deps` to resolve `@sunbird-cb/collection` peer dep conflict (`3125fae`)

## 📚 Docs / Chore

- Added `BtnFeatureModule`, `ErrorResolverModule`, `StickyHeaderModule`, `TourModule` to `AppShellModule` (were missing, causing `ws-widget-btn-feature` to render as unknown element) (`844017b`)
- Added `MDO_ADMIN` and `MDO_DASHBOARD_VIEWER` to `DEFAULT_REQUIRED_ROLES` fallback so role checks pass without a backend-configured `portalRoles` (`844017b`)
- Added `@angular/localize/init` to Jest setup; replaced deprecated `async` with `waitForAsync` in 83 spec files (`setup-jest.ts`)

## ⚠️ Deploy notes & risk

- **Migration/deploy gotchas touched?**
  - [x] `outputPath` must be `dist/www/en` with `browser: ""` — set correctly.
  - [x] Build flags kebab-case only (`--configuration=production`) — old flags removed.
  - [x] Sunbird libs stay non-v2: `@sunbird-cb/collection@0.0.9-ang-17-20`, `utils@0.0.1-ang-17-20`, `resolver@0.0.1-ang-17-20` — correct.
  - [x] Node via nvs: `$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path"` — required on any build host.
- **Config / env changes:** `DEFAULT_REQUIRED_ROLES` now includes `MDO_ADMIN` and `MDO_DASHBOARD_VIEWER` in addition to the FRAC/playlist roles.
- **`src/assets/env.js`** must be present on deploy target (untracked — per-deployment runtime config). Assign `window['env']` directly; do not use an IIFE keyed on `this`.
- **Backend / API dependencies:** none changed.
- **Breaking changes:** Angular 20 requires Node ≥ 20.19.0 — update any CI/CD runner still on Node 16/18. Build command is now `ng build --configuration=production` (esbuild); the old webpack builder and `--outputPath`/`--baseHref` flags are invalid.
- **Known tech debt (non-blocking):** ~110 legacy spec files have pre-migration test failures (missing providers, `TestBed.get` removed in Angular 16+, `$localize` polyfill added in this release). These are pre-migration Angular 16 tests not yet updated for Angular 20 — to be addressed post-release.

## ✅ Pre-deploy checklist

- [ ] Build verified (`$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path" && npm run build`)
- [ ] `npm run lint` clean (or documented remaining warnings acceptable)
- [ ] `npm test -- --passWithNoTests` — nav bar spec and key unit tests pass
- [ ] Smoke-tested on preprod: login, nav bar icons (home visible for MDO_ADMIN, My Dashboard for MDO_DASHBOARD_VIEWER), profile dropdown (avatar + name + logout), FRAC, events list pagination, playlist management
- [ ] `src/assets/env.js` present on deploy target with correct `window['env'].sitePath`
- [ ] Rollback ref confirmed: `release-1.0.0` (or whichever previous Jenkins branch)

## Release & rollback

**Deploy** — a human runs the manual Jenkins job (`Jenkinsfile-sun`) pointed at the **build branch** `release-2.0.0` (deploy is from a branch, not a tag). Each release gets its own new build branch + a `v2.0.0` tag; the previous `release-1.0.0` branch stays frozen.

**Rollback** — re-run the same manual Jenkins job against the previous release branch `release-1.0.0`.
