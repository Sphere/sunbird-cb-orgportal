# MDO Portal (sunbird-cb-orgportal)

Angular-based MDO (Ministries, Departments, and Organisations) admin portal for the Sphere MDO portal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular **20.3.x** (`@angular/build:application`, esbuild) |
| Language | TypeScript **5.9.x** |
| UI Library | Angular Material **20.x** (MDC, M2 theming) |
| State / Async | RxJS **7.8.x** |
| Node | **≥ 20.19.0** (managed via [nvs](https://github.com/jasongin/nvs)) |
| Package manager | npm **10.x** |
| Unit tests | Jest + `jest-preset-angular` |
| Linting | ESLint 9 + `@angular-eslint/20` |
| Sunbird libs | `@sunbird-cb/collection@0.0.9-ang-17-20`, `utils@0.0.1-ang-17-20`, `resolver@0.0.1-ang-17-20` |

---

## Local Development Setup

### 1. Node (via nvs)

```powershell
# Install nvs if not present: https://github.com/jasongin/nvs
nvs add 20.20.1
nvs use 20.20.1

# In every new shell session before running npm/ng commands:
$env:Path = "$env:LOCALAPPDATA\nvs\default;$env:Path"
```

### 2. Install dependencies

```powershell
npm install --legacy-peer-deps
```

### 3. Runtime config (`env.js`)

Copy your environment's `env.js` into `src/assets/env.js` before starting the dev server. This file is gitignored (per-deployment config):

```js
// src/assets/env.js — example
window['env'] = {
  sitePath: 'https://your-backend.example.com',
  karmYogiPath: '...',
  cbpPath: '...',
}
```

Everything else under `src/assets/` (runtime config JSONs, icons, logos, banners) is checked into git — a fresh clone runs locally without proxying to a backend for those files.

### 4. Dev server

```powershell
npm start
# Runs: ng serve --proxy-config proxy/localhost.proxy.json
# Opens: http://localhost:4200
```

The proxy config forwards `/apis/**` to the backend defined in `proxy/localhost.proxy.json`. Do NOT use `node dist/server.js` for local dev — the Express server does not proxy API calls.

---

## Available Commands

| Command | What it does |
|---|---|
| `npm start` | Dev server on port 4200 with API proxy |
| `npm run build` | Production build → `dist/www/en/` |
| `npm run build:dev` | Dev-config build |
| `npm test` | Jest unit tests |
| `npm run test-coverage` | Jest with coverage report |
| `npm run lint` | ESLint across all source files |
| `npm run lint:fix` | ESLint with auto-fix |

> **Build flags:** use kebab-case only (`--configuration=production`, `--base-href=/`). The old `--outputPath`/`--baseHref` flags are invalid on the esbuild builder.

---

## Project Structure

```
src/                          Root application (prefix: ws)
  app/
    component/                Shared layout components (nav bar, footer, etc.)
    plugins/                  Skill / competency plugins
    routes/                   Top-level routes (features, public, signup, tnc)
    services/                 App-level services (init, auth, config)
  assets/                     Runtime config JSONs, images, icons (tracked in git)
  environments/               Per-env TypeScript environment files
  styles/                     Global SCSS, design system, themes (9 × M2 themes)

project/ws/app/               @ws/app workspace library (prefix: ws-app)
  src/lib/routes/             Feature modules: FRAC, Playlist, Events, Home, Search…
  src/lib/shared/             Shared directives, pipes, components

proxy/                        Dev-server proxy configs
RELEASE_NOTES/                Release notes per version (release-X.Y.Z.md)
```

---

## Key Architecture Notes

- **NgModule-based** — no standalone components. All declarations set `standalone: false`.
- **Legacy control flow** — uses `*ngIf` / `*ngFor` / `*ngSwitch` (not `@if` / `@for`).
- **M2 theming** — all 9 themes under `src/styles/theme-*.scss` use `mat.m2-*` APIs. Do not migrate to M3.
- **Output path** — build outputs to `dist/www/en` with `browser: ""`. The Express production server (`dist/server.js`) expects `/en`.
- **Sunbird libs** — imported from npm as `@sunbird-cb/{collection,utils,resolver}` (`-ang-17-20` builds). Do not vendor or rewrite import paths.

---

## Initialization Flow

On authenticated load:
1. Get Roles → Get Groups → Get Features → Get WidgetConfigs
2. Process Features by roles & groups
3. Process Widgets by features, roles, and groups
4. Initialize Widgets by widgetConfig → reset static injection flow

Feature availability check:
- Not available → check if denied or simply absent
- Available → check current page rendering → render or stop

---

## FRAC Module

Manages framework entities and their mappings:

- Competency · Activity · Role · Position
- Position → Role · Role → Activity · Activity → Competency

### FRAC API Calls (`frac-api.service.ts`)

Endpoints are resolved from `resolveFracClientConfig`.

| Method | Endpoint | Purpose |
|---|---|---|
| `PUT` | `/apis/proxies/v8/entity/v1/update` | Update competency / activity / role / position |
| `DELETE` | `/apis/proxies/v8/entity/v1/delete` | Delete entity records |
| `POST` | `/apis/proxies/v8/entity/v1/upload` | Upload Excel / entity sheet |
| `POST` | `/apis/proxies/v8/entity/v1/search` | Search by type (Competency, Activity, Role, Position) |
| `POST` | `/apis/proxies/v8/entity/v1/mapping` | Save parent-child mappings |
| `POST` | `/apis/proxies/v8/entity/v1/mapping/search` | Search saved mappings |
| `POST` | `/apis/proxies/v8/entity/v1/hierarchy` | Fetch full entity hierarchy |

### Map Role → Position Flow

1. Search positions → user selects one
2. Load existing mapped roles for that position
3. User searches and checks roles
4. Validate each selected role has an activity mapping before saving
5. If any role lacks an activity mapping → show warning modal
6. Build and save Position → Role payload

### Upload / Edit / Delete Flow (per entity type)

1. Search existing entities (`searchEntities(type, keyword, language)`)
2. Upload sheet (`uploadFile(file, language)`)
3. Parse response → show success / error modal
4. Edit: `updateEntity(payloads)` · Delete: `deleteEntity(payload)`

---

## Playlist Module

Creates and manages learner playlists for an org, role/position, language, and optional district.

### Playlist API Calls

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/apis/proxies/v8/org/v1/search` | Load root organisations for dropdown |
| `POST` | `/apis/proxies/v8/entity/v1/search` | Load positions and competencies |
| `POST` | `/apis/protected/v8/playlist/search` | Search existing playlist by orgId / role / language / playlistId |
| `POST` | `/apis/protected/v8/playlist/create` | Create new playlist |
| `PUT` | `/apis/protected/v8/playlist/update` | Update existing playlist |
| `POST` | `/apis/proxies/v8/sunbirdigot/search` | Search all courses or by competency levels |

### Filters → Summary Flow

1. User opens playlist filters
2. App loads organisations and positions
3. User selects org, role/position, language, district
4. On Continue: validate form → save filters in state → search course + competency playlists
5. If playlist exists → store existing playlist and payload IDs
6. If not → playlist state stays `null`
7. User goes to Summary → chooses course or competency playlist management
8. On Save: call create (no existing) or update (existing); confirm if roles changed

### Course Playlist Flow

1. Load all courses by language (use cache if available)
2. Preselect courses already in existing playlist
3. User selects / unselects / orders courses
4. Save payload = ordered course identifiers → create or update playlist

### Competency Playlist Flow

1. Load competencies by language
2. Preselect from existing playlist by competency code
3. User selects and orders competencies
4. For each competency, load mapped courses by level
5. User assigns courses to levels
6. Save payload = competency details + level data + course assignments + order
7. On reorder auto-save (if all competencies complete) → final create / update

---

## Code Quality Gateway

SonarCloud/SonarQube is the standardized quality gate for this repo, run via
[`.github/workflows/build.yml`](.github/workflows/build.yml) on every push to
`main`/`master`/`production` and on PR open/sync/reopen. Config:
[`sonar-project.properties`](sonar-project.properties) (project key
`sphere-cb-orgPortal`), scanning `src` + `project`, coverage from Jest's lcov report.

⚠️ Known gaps in the current setup:
- The workflow's `Test with coverage` step runs `npm test -- --watch=false --browsers=ChromeHeadless`
  — stale Karma/Jasmine flags from the pre-Jest setup; Jest ignores `--browsers`, and
  `continue-on-error: true` means a broken test step won't block the Sonar scan.
- `sonar-project.properties` expects coverage at `coverage/mdo/lcov.info`; `npm run
  test-coverage` (`jest --coverage`) writes to Jest's default `coverage/` dir instead.
- The older `SonarQube analysis` + `Quality Gate` stages in [`Jenkinsfile`](Jenkinsfile)
  are commented out — Sonar runs only through GitHub Actions now, not Jenkins.

Current gate status/metrics aren't tracked here — see the per-release `📊 Sonar / Code
Quality Report` section in `RELEASE_NOTES/release-X.Y.Z.md` (from `TEMPLATE.md` onward),
or the [live dashboard](https://sonar.aastrika.org/dashboard?id=sphere-cb-orgPortal).

---

## Release Process

See [`RELEASE_NOTES/TEMPLATE.md`](RELEASE_NOTES/TEMPLATE.md) and the full runbook in `CLAUDE.md`.

**Naming convention:**
- Deploy branch: `release-X.Y.Z`
- Immutable tag: `vX.Y.Z`
- Release notes file: `RELEASE_NOTES/release-X.Y.Z.md`

Jenkins deploys from the **branch** (`release-X.Y.Z`), not the tag.
