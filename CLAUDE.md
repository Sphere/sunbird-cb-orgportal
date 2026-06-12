# CLAUDE.md — sunbird-cb-orgportal

## Active effort: Angular 16 → 20 migration

This repo is being migrated from **Angular 16.2 → 20.3.x** on branch `feat/angular-21-migration`
(branch name kept; **target is Angular 20**, not 21 — the Sunbird libs only ship `-ang-17-20` builds).
Full plan: `~/.claude/plans/we-need-to-migrate-mighty-pancake.md`. Config-shape template (on Angular 21):
`D:\tarento projects\sunbird-cb-creationportal-old` (pkg `cbp`) — copy its builder/jest/eslint/tsconfig
SHAPES but pin versions to 20.3.x, and ignore its `library/ws-widget` vendoring (we don't vendor).

### Hard rules for this migration (do not deviate without asking)
- **Stay NgModule-based.** Do NOT convert to standalone components. New/edited declarations must set
  `standalone: false` (ESLint `prefer-standalone` is off).
- **Keep legacy control flow** `*ngIf` / `*ngFor` / `*ngSwitch`. Do NOT convert to `@if`/`@for`
  (template `prefer-control-flow` is off).
- **Sunbird libs come from npm — do NOT vendor, do NOT rewrite import specifiers.** Imports stay
  `@sunbird-cb/{collection,resolver,utils}`. Use these versions (verified to export every symbol
  orgportal uses): `collection@0.0.9-ang-17-20`, `utils@0.0.1-ang-17-20`, `resolver@0.0.1-ang-17-20`
  (NOT the `-v2` packages — `resolver-v2` is missing `WidgetResolverService/Module`).
  `@sunbird-cb/design-system@0.0.3` (CSS only) and `@project-sunbird/telemetry-sdk` stay as-is.
- **Output path stays `dist/www/en`** (the Express/static server expects `/en`). In angular.json use
  `outputPath: { base: "dist/www/en", browser: "" }`.
- Build flags are kebab-case only (`--configuration=…`, `--base-href=/`). The old
  `--outputPath` / `--baseHref` / `--i18nLocale` flags are invalid on the new builder.

### Target toolchain
- Angular `20.3.x`, builder `@angular/build:application` (esbuild), dev-server `@angular/build:dev-server`.
- TypeScript `5.8.x`/`5.9.x` (per Angular 20 support), RxJS `7.8.x`, zone.js `0.15.x`.
- Unit tests: **Jest** (`jest-preset-angular`) — Karma/Jasmine removed.
- Lint/format: **ESLint 9 + @angular-eslint 21 + Prettier 3** — TSLint/codelyzer removed.
- e2e: Protractor removed (Cypress optional/deferred).

### Material legacy → MDC swap map (Angular 17 removed `MatLegacy*`)
Replace every `@angular/material/legacy-<x>` import with `@angular/material/<x>`, and `MatLegacyFoo` /
`MAT_LEGACY_*` symbols with `MatFoo` / `MAT_*`:
`legacy-button→button`, `legacy-card→card`, `legacy-menu→menu`, `legacy-select→select`,
`legacy-input→input`, `legacy-form-field→form-field`, `legacy-tooltip→tooltip`,
`legacy-checkbox→checkbox`, `legacy-slider→slider`, `legacy-progress-bar→progress-bar`,
`legacy-progress-spinner→progress-spinner`, `legacy-tabs→tabs`, `legacy-dialog→dialog`,
`legacy-snack-bar→snack-bar`, `legacy-table→table`, `legacy-paginator→paginator`,
`legacy-list→list`, `legacy-radio→radio`, `legacy-chips→chips`, `legacy-autocomplete→autocomplete`,
`legacy-slide-toggle→slide-toggle`, `legacy-dialog`’s `MatLegacyDialogRef`→`MatDialogRef`, etc.
MDC markup/sizing differs — visually QA buttons, form-fields, tabs, dialogs after swapping.

### HttpClient
In `src/app/app.module.ts`, prefer `provideHttpClient(withInterceptorsFromDi(), withJsonpSupport())`
over `HttpClientModule`/`HttpClientJsonpModule`. Keep the DI-based `HTTP_INTERCEPTORS`.

## Build / run environment
- Node is managed by **nvs**; `node`/`npm` are not on the default PATH in scripted shells. Prepend the
  nvs default before any node/npm/ng command:
  `$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path"` (currently node 20.20.1 / npm 10.8.2).
- Heap: builds use `--max_old_space_size` (see package.json scripts); keep that for large builds.

## Repo layout
- `src/` — the `mdo` application (root project, prefix `ws`).
- `project/ws/app/` — the `@ws/app` workspace library (~142 components / ~48 modules; prefix `ws-app`).
- `library/ws-widget/{collection,resolver,utils}/` — vendored Sunbird libs (added during migration).
- `proxy/` — dev-server proxy configs. `src/environments/` — per-env files (dev/preprod/np/benchmark/prod).
