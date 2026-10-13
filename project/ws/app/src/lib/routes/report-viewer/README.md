# MNC Attendance Report Viewer

Displays a client-supplied HTML dashboard, held in a **private S3 bucket** and overwritten daily
at a fixed key, to a small set of users.

Route: `/app/home/mnc-attendance-report` — gated on role `mnc_report_viewer`.

## Why it is built this way

The report is a single **self-contained** 9.9 MB HTML file: one 9.87 MB line of base64-of-gzip roster
data, inflated in-browser via `atob` + `DecompressionStream("gzip")`. It has no `<script src>`,
`<link>`, `<img>`, no `url()`, no `fetch`/XHR, and no `localStorage`/cookie/parent-frame access.

| Consequence | Design outcome |
|---|---|
| No sibling objects to fetch | One object served from one endpoint is enough |
| Needs no same-origin capability | `sandbox="allow-scripts"` alone → opaque origin, real isolation |
| Contains a **named attendance roster** | Access must be gated server-side, not by URL secrecy |
| Same URL, content changes daily | Stable URL + `ETag` → `304` revalidation is the caching strategy |

**A presigned S3 URL was rejected deliberately.** A signed URL is a bearer credential: shareable, and
it lands in browser history and server logs — wrong for personal data restricted to a few people. It
also *breaks* caching here: the signature lives in the query string, so each freshly-minted URL is a
new cache key and every view re-downloads the whole file.

## Part 1 — S3 setup (one-time infra)

> **Do not reuse the `aastar-assets` bucket.** Existing S3 references in this repo treat it as a
> **public** bucket. Putting a personal-data roster there would publish it.

New bucket in `ap-south-1`:

| Setting | Value |
|---|---|
| Block Public Access | **All four ON** |
| Versioning | **Enabled** — rollback for a bad daily upload |
| Default encryption | SSE-S3 |
| Key (stable, overwritten daily) | `reports/mnc-cne-attendance/latest.html` |
| Lifecycle rule | Expire **noncurrent** versions after 30 days |

Without the lifecycle rule, ~10 MB/day of versions accumulates indefinitely.

**IAM — two principals, least privilege:**

- sbportal: `s3:GetObject` on `reports/mnc-cne-attendance/*` only. (`HeadObject` needs no extra permission.)
- The client's upload identity: `s3:PutObject` on that one key only — no read, no delete.

S3 overwrites are strongly read-after-write consistent, so a new upload is visible immediately.

The daily upload mechanism itself is the client's responsibility. **The backend must therefore not
depend on them setting the right object metadata** — see the compression note below.

## Part 2 — Backend endpoints (`org-sphere/sbportal` — separate repo)

Both routes sit behind the existing session middleware **and** a `MNC_REPORT_VIEWER` role check.

### `GET /apis/protected/v8/report/mnc-attendance/meta`

Returns `{ lastModified, etag, sizeBytes }`, backed by `HeadObject` (no body transfer).

This exists because **an iframe cannot report an HTTP status** — it would render a 403 body as if it
were the report. The component probes this first, so authorization failures become a handled error
state, and the `lastModified` drives the "Last updated" label that tells users whether today's data
actually landed.

### `GET /apis/protected/v8/report/mnc-attendance`

1. **403** if the session lacks the role. Do not fall through to serving.
2. `HeadObject` → ETag. If the request's `If-None-Match` matches, return **304 with no body.**
   This is the whole caching win — implement it before anything else.
3. Otherwise `GetObject` and stream:

| Header | Value |
|---|---|
| `Content-Type` | `text/html; charset=utf-8` |
| `ETag` | S3's ETag, verbatim |
| `Cache-Control` | `private, no-cache` |
| `X-Content-Type-Options` | `nosniff` |
| `Content-Disposition` | `inline` |

`no-cache` means "cache the bytes but always revalidate" — **not** "don't cache". That is exactly right
for daily-changing content at a fixed URL: a full local copy, a tiny revalidation request, and a
re-download only when the content actually changed.

**Compression — robust to either upload style.** Read the object's `ContentEncoding`. If it is already
`gzip`, pass the bytes through and set `Content-Encoding: gzip`; otherwise let the standard compression
middleware gzip on the fly. Measured: 9.9 MB → **7.13 MB**. The ratio is modest because the payload is
already-gzipped data that was then base64'd, so re-compressing only claws back part of base64's 33%
expansion.

> ⚠ Verify the compression middleware does not rewrite the `ETag`. If it does, 304s silently stop
> working and every view re-downloads ~7 MB.

## Part 3 — The role

`MNC_REPORT_VIEWER` (uppercase from the API) → `mnc_report_viewer` (lowercase in `configSvc.userRoles`).
Create it in the Sunbird/Keycloak role master and assign it to the designated users.

### ⚠ Two-step, or those users cannot log in at all

`InitService.hasRole` intersects the user's raw API roles against `environment.portalRoles` at bootstrap
and calls `authSvc.logout()` on no match. A user holding **only** this role would be logged straight
back out.

1. ✅ Added to `DEFAULT_REQUIRED_ROLES` in [env.util.ts](../../../../../../../src/environments/env.util.ts) (**uppercase** — that check is case-sensitive).
2. ⬜ **DevOps must also add it to `window.env.portalRoles`**, which is merged with the defaults at runtime.

## Part 4 — Navigation entry (outside this repo)

The left menu is driven by host-served `assets/configurations/feature/home.json`. Add an item pointing
at `/app/home/mnc-attendance-report` with `requiredRoles: ['mnc_report_viewer']`. This is the same path
FRAC uses — it has no in-repo menu entry either.

Until that lands the page is reachable by direct link, which is acceptable for a handful of users.

## Verification

1. **Role gate** — without the role, `/app/home/mnc-attendance-report` redirects to `/page/home`; with it, the page renders.
2. **Login blocker** — log in as a user holding *only* `MNC_REPORT_VIEWER` and confirm you are not
   immediately logged out. Most likely step to fail; validates Part 3.
3. **Rendering** — charts draw, light and dark both legible, no console errors. Confirms
   `DecompressionStream` runs under the sandbox's opaque origin.
4. **Caching** — DevTools Network: first load ~7 MB; reload → **304**, near-zero transfer; overwrite the
   S3 object and reload → full body with new content. If reload 2 re-downloads everything, ETag
   propagation is broken (check the compression middleware).
5. **Direct access** — request the content URL with no portal session → **403**, not HTML.
6. **Isolation** — confirm the iframe cannot reach `parent.document`.

## Out of scope

Upload tooling (client's responsibility), browsable history of past days, and CloudFront + signed
cookies — worth revisiting only if the audience grows well beyond a few people.
