# Release 2.1.2 — 2026-08-31

|                              |                                                |
| ---------------------------- | ---------------------------------------------- |
| **Build branch deployed**    | `release-2.1.2` (Jenkins deploy source)      |
| **Tag**                      | `v2.1.2` (immutable marker + GitHub Release) |
| **Baseline (previous prod)** | `v2.1.1`                                     |
| **Commits**                  | `10`                                         |
| **Author**                   | Pavithra Prakash                             |

## Summary

Reliability and accessibility cleanup release — no user-facing features. Fixes ~90
SonarQube-flagged issues across the app (missing form labels, keyboard-accessibility gaps,
duplicate DOM ids, deprecated API usage, and a couple of latent bugs the linter surfaced along
the way), and repairs the CI pipeline so SonarQube analysis and test coverage actually run and
report correctly going forward.

## ✨ Features

_None — patch release._

## 🐛 Fixes

- **CI/coverage** — `jest.config.js` was missing `coverageDirectory`, so `npm run test-coverage`
  wrote LCOV to the default `coverage/` path while `sonar-project.properties` looked for it at
  `coverage/mdo/lcov.info` — Sonar silently analysed with zero test coverage. Fixed the mismatch (`90ec4f1`).
- **`widget-content.service.ts`** — `continueLearning()` wrapped its body in
  `new Promise(async resolve => ...)` with a bare `.catch()`. When the inner save request
  errored, the async executor's own unawaited rejection crashed the process as an unhandled
  rejection — a real bug, not just a lint finding, confirmed by a previously-`skip`ped test that
  documented it. Replaced with `firstValueFrom(...).catch(() => undefined)` and un-skipped that
  test (`269108e`).
- **Accessibility** — added `id`/`aria-label`/`<label for>` associations to ~40 previously
  unlabeled `<input>`/`<textarea>`/`<select>` elements across users, events, FRAC, playlist,
  and workallocation routes so screen readers can identify each field (`fe46b77`, `bd0f420`, `eddc25b`).
- **Accessibility** — resolved duplicate DOM ids (`view-user` role card, `update-workallocation`
  add buttons) that broke `id`-based label association when more than one instance rendered (`fe46b77`).
- **Accessibility** — converted `div role="button"` custom dropdown triggers in
  `playlist-filters` to native `<button type="button">`, and added matching
  `(keydown.enter)`/`(keydown.space)` handlers to several click-only elements
  (`skill-table` row selection, `playlist-filters` position list) so they're keyboard-operable (`bd0f420`, `269108e`).
- **Accessibility** — removed `accesskey="+"` from three search routes; hardcoded access keys
  create real conflicts with screen-reader and browser keyboard shortcuts (`bd0f420`).
- **Code quality** — replaced `parseInt`/`isNaN`/`Array()`/`Date()` with their
  `Number.parseInt`/`Number.isNaN`/`new Array()`/`String(new Date())` equivalents, and
  `.replace(/literal/g, ...)` with `.replaceAll('literal', ...)` wherever the pattern had no
  actual regex metacharacters, across ~20 files in playlist, FRAC, and events (`fe46b77`, `eddc25b`, `269108e`).
- **`search-input.component.ts`** — removed a dead `ngOnChanges()` that iterated
  `SimpleChange` (a class constructor with no enumerable properties, so the loop body never ran)
  and, even if it had, only performed a no-op self-assignment (`bd0f420`).
- **SCSS** — fixed an invalid `size: 12px` declaration (should not have existed; removed) and
  moved a mid-file `@import` in `app-nav-bar.component.scss` back to the top of the file (`bd0f420`).
- **`_ws-design-system-v2.scss`** — every shared mixin (`v2-action-card`, `v2-input-field`,
  `v2-btn-*`, `v2-table-*`, etc.) is now a thin `@extend` wrapper around a `%placeholder` so its
  nested selectors (`&:hover`, `th`/`td`, `mat-icon`) have a real scoping root, instead of living
  directly in a bare `@mixin` body. No `@include v2-...` call site anywhere in the app changed —
  verified byte-for-byte CSS equivalence across all 18 real consumers except one pre-existing,
  unrelated bug (see Deploy notes below) (`269108e`).

## 🏗️ Build / CI / Infra

- **`.github/workflows/build.yml`** — modernised to `SonarSource/sonarqube-scan-action@v4`,
  added a Node 20 setup step, and replaced the stale Karma `--browsers=ChromeHeadless` test
  step (Karma is gone; tests are Jest) with `test-coverage` (`8fc5fc6`).
- **`Jenkinsfile`** — trimmed (`062d9aa`).

## 📚 Docs / Chore

- **chore** — `package.json` bumped to `2.1.2`.

## 📊 Sonar / Code Quality Report

> Pull these numbers from the [live dashboard](https://sonar.aastrika.org/dashboard?id=sphere-cb-orgPortal)
> at release-cut time — Sonar analyses on this project aren't tied to release tags, so this
> section must be filled in fresh each release, not carried over from the previous one.

| Metric | Value |
|---|---|
| Quality Gate | _fill in at cut time_ |
| New code coverage | _fill in at cut time_ (gate: ≥ 80%) |
| New violations | _fill in at cut time_ (gate: 0) |
| New duplicated lines | _fill in at cut time_ (gate: ≤ 3%) |
| Overall coverage | _fill in at cut time_ |
| Bugs / Vulnerabilities | _fill in at cut time_ |
| Code smells | _fill in at cut time_ |
| Security hotspots reviewed | _fill in at cut time_ |

## ⚠️ Deploy notes & risk

- **Migration/deploy gotchas touched?** None — no routing, module, or `outputPath`/build-flag changes.
- **Config / env / secret changes:** none.
- **Backend / API contract dependencies:** none — every change is frontend markup, styling, or
  internal refactor.
- **Breaking changes:** none functionally, but one known, deliberately-accepted visual deviation:
  `event-modal.component.scss` defines `.title`, `.subtext`, `.form-label`, and `.creat-btn` each
  **twice** in that one file (a pre-existing bug, not introduced by this release) — once by hand,
  once via `@include v2-modal-title` etc. The old mixin system happened to make the hand-written
  block lose by accident of source order; the new `@extend`-based system makes it win instead.
  Net effect on that one modal: title reverts from 28px/Inter to 32px/Roboto, subtitle from
  14px/Inter to 16px/Roboto, and the "Create" button loses its `!important` color override and
  picks up a lighter font-weight. Fixing the underlying duplicate-selector bug was explicitly
  deferred — see the comment block at the top of `_ws-design-system-v2.scss`.
- **Lint status:** `npm run lint` currently reports 154 errors / 3665 warnings workspace-wide.
  All pre-existing debt unrelated to this release (verified none fall in a file this release
  touched) — not something this patch attempts to clear.

## ✅ Pre-deploy checklist

- [x] Build verified (`npm run build`) — succeeds, all 10 themes compile.
- [ ] `npm run lint` clean — **not clean** (154 pre-existing errors; see Deploy notes above; not
      introduced by this release).
- [x] Unit tests green (`npm test`) — 248/248 suites, 3844/3844 tests.
- [ ] Smoke-tested on preprod (login, navigate MDO portal, check key flows).
- [ ] Visually confirm the accepted `event-modal.component.scss` styling change above is
      acceptable, or file a follow-up to fix the underlying duplicate selectors.
- [ ] Rollback ref confirmed (re-runnable in Jenkins): `release-2.1.1`.

## Release & rollback

**Deploy** — a human runs the manual Jenkins job (`Jenkinsfile-sun`) pointed at the **build branch** `release-2.1.2` (deploy is from a branch, not a tag). Each release gets its own new build branch + a `v2.1.2` tag; the previous `release-2.1.1` branch stays frozen.

**Rollback** — re-run the same manual Jenkins job against the previous release branch `release-2.1.1`.

---

_File naming: this file is `RELEASE_NOTES/release-2.1.2.md` — name matches the deploy branch._
