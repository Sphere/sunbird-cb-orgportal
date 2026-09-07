# Release 2.1.1 — 2026-08-17

|                              |                                                |
| ---------------------------- | ---------------------------------------------- |
| **Build branch deployed**    | `release-2.1.1` (Jenkins deploy source)      |
| **Tag**                      | `v2.1.1` (immutable marker + GitHub Release) |
| **Baseline (previous prod)** | `v2.1.0`                                     |
| **Commits**                  | `1`                                          |
| **Author**                   | Likhith Thammegowda                          |

## Summary

Patch release fixing the "No Registration" event type. Events created with no registration
were being treated as registration-based, so adding participants demanded a 10-digit phone
number for every row and rejected otherwise valid upload files. Participant upload validation
has also been tightened so problems are reported against the right row and a missing surname
no longer produces a certificate with a blank name.

## ✨ Features

_None — patch release._

## 🐛 Fixes

- **events** — "No Registration" events are now recognised correctly. The API returns the
  registration mode as `eventType` while the UI reads `registrationType`; only the dashboard
  list mapped between them, and `event-details` refetches the event by id and overwrites the
  globally stored event with the raw response — leaving `registrationType` undefined so the
  no-registration branch never activated. Normalised once in `EventService.getEventById` so
  every consumer agrees. Symptoms fixed: participant upload demanding a phone number, and the
  certificate-status column appearing on no-registration events (`9e1dd19`).
- **events** — Participant upload now requires Last Name for no-registration events. Their
  certificates are rendered client-side from First + Last Name, so a missing surname
  previously printed blank with no warning (`9e1dd19`).
- **events** — Upload validation errors now cite the actual sheet row (`index + 2`) instead of
  the data-array index, which was always one lower than the row shown in the file (`9e1dd19`).
- **events** — CSV parsing skips empty lines; a trailing newline previously created a phantom
  row that failed validation against a line the user could not see (`9e1dd19`).
- **events** — A file containing no participant rows is now rejected instead of being treated
  as valid (`9e1dd19`).
- **events** — The sample workbook is event-type aware: `phone` and `location` are omitted for
  no-registration events, where they are never read (`9e1dd19`).
- **events** — `phone` is only stringified when a value is present; previously
  `String(undefined)` sent the literal string `"undefined"` to the backend (`9e1dd19`).

## 🏗️ Build / CI / Infra

_None._

## 📚 Docs / Chore

- **chore** — `package.json` bumped to `2.1.1`.

## ⚠️ Deploy notes & risk

- **Migration/deploy gotchas touched?** None. No routing, module, or Material changes.
- **Config / env / secret changes:** none.
- **Backend / API contract dependencies:** none — the fix adapts to the existing
  `eventType` response field rather than asking the backend to change.
- **Breaking changes:** none. `registrationType` is still honoured when already present, so
  the dashboard list path is unaffected.
- **Behavioural change to verify:** no-registration participant uploads now **require Last
  Name**. Any existing upload file with blank surnames will be rejected where it previously
  passed — this is deliberate, since those rows produced certificates with missing names.
- **Not included:** the generated `src/styles.scss` and `yarn.lock` were deliberately left out
  of this release; neither relates to these fixes.

## ✅ Pre-deploy checklist

- [ ] Lint + jest pass on `production` at the release commit.
- [ ] Create a "No Registration" event; upload participants **without** a phone column and
      confirm the file is accepted.
- [ ] Confirm the certificate-status column is **not** shown on that event's participants tab.
- [ ] Upload a file with a blank Last Name and confirm it is rejected with the correct row number.
- [ ] Regression: a "Registration based" event still requires a valid 10-digit phone.
- [ ] Rollback reference confirmed: previous release branch `release-2.1.0` / tag `v2.1.0`.

## Release & rollback

- **Deploy source:** `release-2.1.1`, cut from `production` at the release commit and tagged
  `v2.1.1`. Jenkins targets the branch, not the tag.
- **Rollback:** re-run the deploy pipeline against `release-2.1.0`. Safe — the change is
  frontend-only with no config or contract dependency, so reverting simply restores the
  previous (broken) no-registration behaviour.
