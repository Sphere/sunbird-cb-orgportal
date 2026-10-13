# Release 2.1.0 — 2026-08-17

|                              |                                                |
| ---------------------------- | ---------------------------------------------- |
| **Build branch deployed**    | `release-2.1.0` (Jenkins deploy source)      |
| **Tag**                      | `v2.1.0` (immutable marker + GitHub Release) |
| **Baseline (previous prod)** | `v2.0.0`                                     |
| **Commits**                  | `2`                                          |
| **Author**                   | Pavithra Prakash                             |

## Summary

Follow-up release on top of 2.0.0: fixes all 9 jest specs left failing after the Angular
20 migration (no production code changed — the fixes were all in the tests themselves),
and documents the README/ARCHITECTURE refresh and Sonar quality-gateway setup that shipped
in `v2.0.0` but wasn't captured in that release's notes.

## 🐛 Fixes

- **tests** — Fixed all 9 failing jest specs left over from the Angular 20 migration; zero
  production source changes. Root causes: a broken `Object.defineProperty` Blob-mock hack
  that silently swallowed its own read, a `jest.mock('moment')` missing a proper `.default`
  export shape, an incorrect assertion in a competency-labels test that didn't match the
  component's actual (correct) branch behavior, a couple of loose TS types on mock call
  tuples, and 4 specs that all failed identically because `ngx-export-as` transitively pulls
  in `html2pdf.js`, a CJS bundle Jest can't parse — mocked out `ngx-export-as` in those 4.
  Full suite: 248/248 suites, 3840/3841 tests passing (1 pre-existing skip). (`ae4bc29`)

## 📚 Docs / Chore

- **docs** — Verified and corrected README.md and ARCHITECTURE.md against the actual
  Angular 20 codebase (tech-stack versions, corrected a stale claim that standalone
  components/signals were repo-wide — they're a documented Playlist-module-only exception
  per `MIGRATION.md` PR-6/PR-4), and added a Code Quality Gateway section documenting the
  GitHub Actions + SonarCloud/SonarQube gate and two real config gaps found while verifying
  (stale Karma/Jasmine flags in the CI test step, and a coverage-path mismatch between
  `sonar-project.properties` and the actual Jest output directory). Also added a
  `📊 Sonar / Code Quality Report` section to `RELEASE_NOTES/TEMPLATE.md` for future
  releases to fill in at cut time. _(Note: this commit predates this release's baseline —
  it already shipped inside `v2.0.0` via PR #44, but wasn't mentioned in that release's
  notes; documented here for completeness.)_ (`1cd8637`)

## 📊 Sonar / Code Quality Report

> Pulled 2026-08-17 from the [live dashboard](https://sonar.aastrika.org/dashboard?id=sphere-cb-orgPortal)
> (last analysis 2026-08-10). Sonar analyses on this project aren't tied to release tags
> (all recorded runs show `projectVersion: "1.0"`), so this snapshot predates this specific
> commit and should be re-pulled once a fresh analysis runs against `release-2.1.0`.

| Metric | Value |
|---|---|
| Quality Gate | ❌ FAIL — 187 new-code violations (gate: 0) |
| New code coverage | 83.8% (gate: ≥ 80% — passing) |
| New duplicated lines | 0.15% (gate: ≤ 3% — passing) |
| Overall coverage | 90.5% |
| Bugs / Vulnerabilities | 0 / 0 |
| Code smells | 2,716 |
| Security hotspots reviewed | 100% |

## ⚠️ Deploy notes & risk

- **Migration/deploy gotchas touched?** None — no production source changed in this release.
- **Config / env / secret changes:** none.
- **Backend / API contract dependencies:** none.
- **Breaking changes:** none.

## ✅ Pre-deploy checklist

- [x] Build verified (`npm run build`)
- [ ] `npm run lint` — not clean (154 pre-existing errors/warnings, unrelated to this
      release; see `README.md` Code Quality Gateway section)
- [x] Unit tests green (`npm test` — 248/248 suites, 3840/3841 passing)
- [ ] Smoke-tested on preprod
- [ ] Rollback ref confirmed (re-runnable in Jenkins): `release-2.0.0`

## Release & rollback

**Deploy** — a human runs the manual Jenkins job (`Jenkinsfile-sun`) pointed at the **build branch** `release-2.1.0` (deploy is from a branch, not a tag). Each release gets its own new build branch + a `v2.1.0` tag; the previous `release-2.0.0` branch stays frozen.

**Rollback** — re-run the same manual Jenkins job against the previous release branch `release-2.0.0`.
