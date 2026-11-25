# Release 3.0.0 — 2026-10-13

|                              |                                                |
| ---------------------------- | ---------------------------------------------- |
| **Build branch deployed**    | `release-3.0.0` (Jenkins deploy source)      |
| **Tag**                      | `v3.0.0` (immutable marker + GitHub Release) |
| **Baseline (previous prod)** | `v2.1.2`                                     |
| **Commits**                  | `13` (10 changes + 3 merges of `production`) |
| **Author**                   | Likhith Thammegowda (Pavithra: form padding) |

## Summary

This is the MDO portal release that runs on the new Sunbird Spark platform, which went live on
9 October 2026 (it was deployed from `sunbird-spark/upgrade`; this release brings that code into
`production`). Event participants can now receive their QR certificate by email, and admins can
see who was emailed and when. It also fixes several events-screen bugs, and removes three admin
features that are no longer used: Users, Roles and access, and Competencies.

## ✨ Features

- **events / certificate email** — the participant upload sheet has an optional `email` column.
  When filled, the address is validated per row (header matched as `email` / `Email` / `E-mail`),
  and the participant is emailed their certificate as soon as it is generated (`e669371`).
- **events / participants** — separate **Email** and **Email Status** columns. Status is **Sent**
  (with date and time), **Not sent**, **Pending** or **No email**. A new **EMAIL STATUS** filter
  combines with the certificate filter and search, and search now matches email (`82c631a`, `7ce1e51`).

## 🐛 Fixes

- **auth / Sunbird Spark** — Spark's user-read response keeps roles under `organisations[]` and has
  no top-level `userId`, so every user was logged straight back out to Keycloak. Roles and user id
  are now read through a shared profile-shape helper (`061ea2a`).
- **events dashboard** — "No events found" and a 400 on "Create event" on Spark, both caused by the
  same undefined user id; now resolved through the same helper (`5ef83b2`).
- **events dashboard** — pagination did nothing, the filter panel would not close, and creating an
  event dropped the user back on the list instead of opening the new event (`2ff6184`).
- **events status** — `templateId` was never mapped, so every event showed "template pending";
  and an event whose certificates were never generated no longer shows "ready" (`893262a`).
- **events loading** — certificate download no longer looks frozen (it shows "Generating 12 of 152");
  added loading states to the events screens that had none (`9a57801`).
- **forms** — padding added to form field styles (`ae606ff`).

## 🏗️ Build / CI / Infra

- None in this release (the Jenkins / Sonar workflow change is already on `production`).

## 📚 Docs / Chore

- **removed features** — Users, Roles and access, and Competencies: their menu entries, routes,
  pages and all code reachable only through them (78 files) (`f552964`). See Breaking changes.
- **chore** — `package.json` bumped to `3.0.0`.

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

- **Migration/deploy gotchas touched?** None — no routing-base, `outputPath` or build-flag changes.
- **Config / env / secret changes:** none in this repo. The certificate email needs these on the
  backend (already set on Spark prod on 10 Oct): `ui-proxies-config` → `NOTIFICATION_SERVIC_API_BASE`,
  `CERT_EMAIL_TEMPLATE_URL`, `CERT_EMAIL_ENABLED=true`; email template
  `s3://aastar-assets/rc-mdo-templates/certificate-email.html`. Known open item: the host-served
  `assets/env.js` on prod still has old dev hosts for `karmYogiPath` / `cbpPath` (welcome-page links).
- **Backend / API contract dependencies:**
  - `sunbird-cb-uiproxy` ≥ `3762c38` (stores participant email, sends the email, returns
    `email` / `emailSentAt`). Spark prod runs `upgrade_5149fe8_1364`.
  - `sunbird-rc-proxy-mapper` `yugabyte-port-fix@37e9e7b` (PDF link, download header, no duplicate rows).
  - YCQL `sunbird.rc_events_users` columns `email text` and `emailsentat timestamp`.
  - Works only against **Sunbird Spark** (profile-shape fix `061ea2a`).
- **Breaking changes:**
  - **Removed:** the Users, Roles and access, and Competencies menus and pages. Bookmarks to
    `app/users`, `app/roles` or those child routes no longer resolve.
  - **Rollback caveat:** `v2.1.2` predates the Spark profile fix, so rolling the portal back to it
    on Spark logs every user out. Roll back to the previous Spark image instead (see below).

## ✅ Pre-deploy checklist

- [ ] Build verified (`$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path" && npm run build`)
- [ ] `npm run lint` clean — **not clean**: 152 errors / 3691 warnings workspace-wide, all pre-existing
      (down from 154 in 2.1.2). Only 3 sit in files this release touched, and all 3 already exist on
      `production` (`add-participants.component.ts:36` empty `ngOnInit`; `event-overview.component.ts:13,15`
      `@ts-ignore`). No new lint errors introduced.
- [x] Unit tests green (`npm test`) — 230/230 suites, 3581/3581 tests (fewer than 2.1.2's 248 suites
      because the removed Users / Roles / Competencies features took their specs with them).
- [x] Smoke-tested on Spark prod: participant upload with email, certificate generation, email sent,
      Email Status shown (10 Oct, event `b0b4b449`).
- [ ] Rollback ref confirmed (re-runnable in Jenkins): image `aastardev1/ui-mdo-igot:upgrade_0729be2_168`
      (last Spark build before the email features) — not `release-2.1.2`.

## Release & rollback

**Deploy** — a human runs the manual Jenkins job (`Jenkinsfile-sun`) pointed at the **build branch** `release-3.0.0` (deploy is from a branch, not a tag). Each release gets its own new build branch + a `v3.0.0` tag; the previous `release-2.1.2` branch stays frozen.

**Rollback** — re-deploy the previous Spark image `aastardev1/ui-mdo-igot:upgrade_0729be2_168`. Do **not** roll back to `release-2.1.2` on Spark: it predates the Spark profile fix and logs every user out.

---

_File naming: this file is `RELEASE_NOTES/release-3.0.0.md` — name matches the deploy branch._
