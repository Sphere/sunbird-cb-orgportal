# Release <version> — <YYYY-MM-DD>

|                              |                                                  |
| ---------------------------- | ------------------------------------------------ |
| **Build branch deployed**    | `cbrelease-<X.Y.Z>` (Jenkins deploy source)      |
| **Tag**                      | `Release-<X.Y.Z>` (immutable marker + GitHub Release) |
| **Baseline (previous prod)** | `<previous Release-X.Y.Z tag>`                   |
| **Commits**                  | `<n>`                                            |
| **Author**                   | <name>                                           |

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
- [ ] Rollback ref confirmed (re-runnable in Jenkins): `<previous cbrelease-X.Y.Z branch>`

## Release & rollback

**Deploy** — this release ships as the **`cbrelease-<X.Y.Z>`** branch; a human runs the
manual Jenkins job with `github_release_tag = cbrelease-<X.Y.Z>`.
Pushing the branch only provides the deploy source — it does not deploy on its own.

**Rollback** — re-run the same manual Jenkins job against the previous release branch:

```text
github_release_tag = cbrelease-<previous X.Y.Z>
```
