---
name: migrate-feature-module
description: Migrate one Angular feature module/folder for the orgportal 16→20 upgrade — swap MatLegacy* Material to MDC, fix RxJS/TS compile errors. Use when grinding through project/ws/app feature modules during the Angular 20 migration. Pass the module folder path as the argument.
---

# Migrate one feature module to Angular 20

Goal: make a single feature module/folder compile and behave identically under Angular 20, following
the repo-wide rules in `CLAUDE.md`. Keep changes mechanical and minimal — no standalone conversion,
no `@if`/`@for` rewrites, no refactors beyond what the compiler requires.

**Argument:** a folder path (e.g. `project/ws/app/src/lib/routes/users`). If omitted, ask which module.

## Steps

1. **Scope it.** List the `.ts`/`.html` files under the target folder. Read the module file(s)
   (`*.module.ts`) and note declarations, imports, providers.

2. **Sunbird imports stay as-is.** Do NOT rewrite `@sunbird-cb/*` specifiers — the upgraded npm
   packages (`collection@0.0.9-ang-17-20`, `utils@0.0.1-ang-17-20`, `resolver@0.0.1-ang-17-20`) keep the
   same names and export surface. If a symbol genuinely fails to resolve, check the package's `.d.ts`
   first; flag it rather than rewriting call sites.

3. **Material legacy → MDC.** Replace `@angular/material/legacy-<x>` → `@angular/material/<x>` and
   `MatLegacyFoo` / `MAT_LEGACY_*` → `MatFoo` / `MAT_*` using the swap map in `CLAUDE.md`. Cross-check the
   same module in the reference repo `D:\tarento projects\sunbird-cb-creationportal-old` for the exact
   symbols when unsure.

4. **RxJS 7 / TS 5.9 fixes (only if the compiler complains):**
   - Fix `rxjs/internal/*` deep imports → public `rxjs` / `rxjs/operators` entry points.
   - `.toPromise()` → `firstValueFrom()`/`lastValueFrom()` only if flagged.
   - Address `strict`-family and typing errors minimally; preserve runtime behavior.

5. **Standalone guard.** Any component/directive/pipe decorator that is touched and lacks an explicit
   flag should get `standalone: false` (match the reference). Do not toggle anything to standalone.

6. **Verify the module compiles.** Build the owning project (`@ws/app` lib or the `mdo` app) and confirm
   no new errors originate from this folder:
   `$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path"; npx ng build @ws/app` (or the app build).
   Iterate until this folder is clean. Don't chase errors outside the assigned folder unless they're
   caused by this folder's changes.

7. **Report** a short summary: files touched, Material symbols swapped, any symbol that needed
   reconciliation in the vendored libs, and any behavior-risky MDC component for visual QA.

## Don'ts
- Don't convert to standalone or `@if`/`@for`.
- Don't upgrade/replace third-party libs here (handled centrally in the plan's Phase 5).
- Don't reformat untouched code; keep the diff tight.
