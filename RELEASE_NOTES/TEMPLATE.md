# Release <version> — <YYYY-MM-DD>

|                              |                                              |
| ---------------------------- | -------------------------------------------- |
| **Build branch deployed**    | `release-<X.Y.Z>` (Jenkins deploy source)      |
| **Tag**                      | `v<X.Y.Z>` (immutable marker + GitHub Release) |
| **Baseline (previous prod)** | `v<previous X.Y.Z>`                            |
| **Commits**                  | `<n>`                                        |
| **Author**                   | <name>                                       |

## Summary

<2–3 line, plain-language overview a non-engineer stakeholder can read. What does this
release change for users / org admins, and why does it matter?>

## ✨ Features

- **<scope>** — <user-facing description of the change> (`<short-sha>`)

## 🐛 Fixes

- **<scope>** — <what was broken, now fixed> (`<short-sha>`)

## 🏗️ Build / CI / Infra

- <change> (`<short-sha>`)

## 📚 Docs / Chore

- <change> (`<short-sha>`)

## ⚠️ Deploy notes & risk

> Delete the lines that don't apply; keep this section honest — it's the part on-call reads.

- **Migration/deploy gotchas touched?**
  - [ ] `outputPath` must be `dist/www/en` with `browser: ""` (Express server expects `/en`)
  - [ ] Build flags must be kebab-case only (`--configuration=production`, `--base-href=/`); old `--outputPath`/`--baseHref` flags are invalid on `@angular/build:application`
  - [ ] Sunbird libs stay as `@sunbird-cb/{collection,utils,resolver}` non-v2 packages (do NOT switch to `-v2` variants — `resolver-v2` is missing `WidgetResolverService`)
  - [ ] Node via nvs: `$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path"` before any build/lint
- **Config / env / secret changes:** <none | describe>
- **Backend / API contract dependencies:** <none | describe + which service version>
- **Breaking changes:** <none | describe + migration step>

## ✅ Pre-deploy checklist

- [ ] Build verified (`$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path" && npm run build`)
- [ ] `npm run lint` clean
- [ ] Unit tests green (`npm test`)
- [ ] Smoke-tested on preprod (login, navigate MDO portal, check key flows)
- [ ] Rollback ref confirmed (re-runnable in Jenkins): `<previous release-X.Y.Z branch>`

## Release & rollback

**Deploy** — a human runs the manual Jenkins job (`Jenkinsfile-sun`) pointed at the **build branch** `release-<X.Y.Z>` (deploy is from a branch, not a tag). Each release gets its own new build branch + a `v<X.Y.Z>` tag; the previous `release-<prev X.Y.Z>` branch stays frozen.

**Rollback** — re-run the same manual Jenkins job against the previous release branch `release-<prev X.Y.Z>`.

---
_File naming: this file is `RELEASE_NOTES/release-<X.Y.Z>.md` — name matches the deploy branch._
