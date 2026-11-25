# Release 3.1.0 — 2026-11-25

|                              |                                                |
| ---------------------------- | ---------------------------------------------- |
| **Build branch deployed**    | `release-3.1.0` (Jenkins deploy source)        |
| **Tag**                      | `v3.1.0` (immutable marker + GitHub Release)   |
| **Baseline (previous prod)** | `v3.0.0`                                       |
| **Commits**                  | `9` (6 changes + 3 PR merges)                  |
| **Author**                   | Ajoymaity (notifications), Pavithra Prakash (FRAC fix, Sonar fixes, tests) |

## Summary

Org admins get a new **Notification** section for sending push notifications to learners about
a course, competency, program or certificate. On the FRAC mapping screens (Map Role to Activities
and Map Role to Positions), each activity, position and role card can now be clicked anywhere,
not only on its text. The release also clears Sonar issues: the Notification feature now has full
test coverage, and the participant-upload email check no longer risks slow validation.

## ✨ Features

- **notifications** — new **Notification** left-menu entry (`/app/home/notifications`, visible to
  `admin` / `mdo_admin`) with a dashboard and send screens for course, competency, program and
  certificate notifications. Sends push notifications by user token or by topic (`833b0bf`, PR #59).

## 🐛 Fixes

- **frac / mapping lists** — activity, position and role cards were only clickable on their text;
  the whole card is now clickable, and keyboard focus is visible (`862f1d9`, PR #62).
- **events / add participants** — the email check on uploaded participant sheets could backtrack
  badly on long malformed input (Sonar S5852); it now runs in linear time. The only behaviour change:
  an email whose domain starts with a dot (e.g. `a@.b.com`) is now reported as invalid (`148d915`).

## 🏗️ Build / CI / Infra

- None.

## 📚 Docs / Chore

- **tests / notifications** — specs for the Notification feature (API service, push service, send and
  dashboard screens, module): new-code line coverage for the feature goes from 0% to 100% (`adf0803`).
- **tests / events** — three near-identical event-dashboard filter-panel tests merged into one
  parameterized test (Sonar maintainability) (`3a1a37c`).
- **release notes** — this file.
- `package.json` was not bumped for this release and still reads `3.0.0`.

## 📊 Sonar / Code Quality Report

Not filled in: the live dashboard could not be read at release-cut time. Pull the numbers from the
[live dashboard](https://sonar.aastrika.org/dashboard?id=sphere-cb-orgPortal) after the next analysis
of `production`; new-code coverage should now clear the 80% gate.

## ⚠️ Deploy notes & risk

- **Config / env / secret changes:** none.
- **Backend / API contract dependencies:** the Notification screens call
  `POST /apis/protected/v8/pushNotification/send-by-token` and `.../send-by-topic`. These must be
  available behind the portal proxy on the target environment, or sending fails.
- **Access:** the `/app/home/notifications` route has no route guard; only the menu entry is
  restricted to `admin` / `mdo_admin`.
- **Breaking changes:** none.

## ✅ Pre-deploy checklist

- [x] Build verified (`npm run build`)
- [ ] `npm run lint` clean — one pre-existing error remains (empty `ngOnInit` in `add-participants.component.ts`)
- [x] Unit tests green (`npm test`) — 235 suites, 3650 tests
- [ ] Smoke-tested on preprod (login, Notification menu and send flow, FRAC mapping screens, participant upload)
- [ ] Rollback ref confirmed (re-runnable in Jenkins): `release-3.0.0`

## Release & rollback

**Deploy** — a human runs the manual Jenkins job (`Jenkinsfile-sun`) pointed at the **build branch**
`release-3.1.0` (deploy is from a branch, not a tag). The previous `release-3.0.0` branch stays frozen.

**Rollback** — re-run the same manual Jenkins job against the previous release branch `release-3.0.0`.

---

_File naming: this file is `RELEASE_NOTES/release-3.1.0.md` — name matches the deploy branch._
