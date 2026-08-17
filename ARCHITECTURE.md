# MDO-Fusion: Complete Architecture & Developer Guide

> End-to-end reference for the Sunbird CB Organization Portal.
> Written so a fresher joining the team can understand every layer — from browser URL to API call and back.

---

## Table of Contents

1. [What is This App?](#1-what-is-this-app)
2. [Tech Stack](#2-tech-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Folder Structure](#4-folder-structure)
5. [App Bootstrap & Startup Flow](#5-app-bootstrap--startup-flow)
6. [Authentication & Guard System](#6-authentication--guard-system)
7. [HTTP Layer — Interceptors & Proxy](#7-http-layer--interceptors--proxy)
8. [Routing Architecture](#8-routing-architecture)
9. [Feature Modules Overview](#9-feature-modules-overview)
10. [Playlist Feature — Deep Dive](#10-playlist-feature--deep-dive)
    - [What is a Playlist?](#what-is-a-playlist)
    - [Folder Structure](#playlist-folder-structure)
    - [Data Models (All Interfaces)](#data-models-all-interfaces)
    - [User Journey Flow](#user-journey-flow)
    - [Component Logic — Page by Page](#component-logic--page-by-page)
    - [Services](#services)
    - [Utilities Layer](#utilities-layer)
    - [Constants Reference](#constants-reference)
11. [State Management](#11-state-management)
12. [FRAC Feature Overview](#12-frac-feature-overview)
13. [Root Component & PWA](#13-root-component--pwa)
14. [Environment Configuration](#14-environment-configuration)
15. [API Endpoints Reference](#15-api-endpoints-reference)
16. [Key Patterns & Conventions](#16-key-patterns--conventions)
17. [Local Setup Guide](#17-local-setup-guide)
18. [How to Add a New Feature](#18-how-to-add-a-new-feature)

---

## 1. What is This App?

**MDO-Fusion** is an **Angular 20 Organizational Learning Portal** built on the [Sunbird-CB](https://sunbird.org/) ecosystem. MDO stands for *Mission Delivery Organization* — the government bodies that use this portal.

| Feature | Purpose |
|---|---|
| **Playlist Management** | Curate role-based, language-specific learning paths (courses + competencies) |
| **FRAC Management** | Manage Frameworks: Roles, Activities, Competencies, Positions |
| **User Management** | Onboard users, assign roles, manage access |
| **Approvals Workflow** | Multi-step approval flows for enrollments and content |
| **Work Allocation** | Distribute tasks across team members |
| **Events** | Create and manage learning events / webinars |
| **Dashboards** | Analytics, competency heatmaps, reports |

**Who uses it?** HR Admins, L&D Managers, and MDO Administrators at central/state government organizations.

---

## 2. Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                          │
│                                                                 │
│  Angular 20.3.25          RxJS 7.8.2                           │
│  Angular Material 20.2.14  Angular CDK (drag-drop, selection)  │
│  Tailwind CSS              Angular Signals (Playlist module only)│
│  D3.js / Chart.js          video.js                            │
│  jsPDF                     ngx-quill                           │
│  Hammer.js (gestures)      Service Worker (PWA)                │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────────┐
│                    AUTH LAYER                                    │
│              Keycloak 25.0.6  (OAuth2 + OpenID Connect)         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│            BACKEND  (via Angular Dev Proxy)                      │
│         target: https://org-sphere.aastrika.org                 │
└─────────────────────────────────────────────────────────────────┘
```

**Sunbird Ecosystem Libraries** (shared npm packages):

| Package | Purpose |
|---|---|
| `@sunbird-cb/collection` | Shared UI: tables, breadcrumbs, avatars, left-nav, page components |
| `@sunbird-cb/resolver` | Widget resolver, permissions engine |
| `@sunbird-cb/utils` | Config service, auth service, pipes, logging utilities |

---

## 3. High-Level Architecture

### Block Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Angular Application                            │
│                                                                      │
│  ┌──────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│  │   app.module.ts   │   │app-routing       │   │ Root Components  │  │
│  │  (APP_INITIALIZER)│──▶│.module.ts        │──▶│ Navbar, Footer   │  │
│  │  Keycloak setup   │   │ (All top routes) │   │ Login, Dialogs   │  │
│  │  Interceptors reg │   └────────┬─────────┘   └──────────────────┘  │
│  └──────────────────┘            │                                    │
│                                  │ lazy loads                         │
│             ┌────────────────────▼───────────────────────┐           │
│             │        LAZY-LOADED FEATURE MODULES          │           │
│             │  (all from project/ws/app/src/lib/routes/)  │           │
│             │                                            │           │
│             │  HomeModule    FracModule    UsersModule   │           │
│             │  PlaylistModule  EventsModule  WorkAlloc   │           │
│             │  ApprovalsModule  NotificationModule  ...  │           │
│             └────────────────────────────────────────────┘           │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                   SHARED SERVICES LAYER                        │   │
│  │  InitService          ConfigurationsService    AuthService     │   │
│  │  AppInterceptor        RetryInterceptor        GlobalErrHndlr  │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
              │  HTTP (with org/rootOrg/locale/wid/hostPath headers)
              ▼
┌────────────────────────────────────┐
│   Angular Dev Proxy                 │
│  /apis/* → org-sphere.aastrika.org  │
│  /content-api/* → localhost:3004    │
│  /assets/* → org-sphere.aastrika.org│
└────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│       Backend API Server           │
│  https://org-sphere.aastrika.org   │
│  /playlist  /entity  /org          │
│  /users  /frac  /search            │
└────────────────────────────────────┘
```

### Two-Layer Project Structure

```
sunbird-cb-orgportal/
│
├── src/                   ◄── LAYER 1: Application Shell
│   └── app/                   Guards, interceptors, routing, root components
│
└── project/ws/app/        ◄── LAYER 2: Feature Library Workspace
    └── src/lib/routes/        Self-contained Angular feature modules
```

- **Layer 1 (`src/`)** = The skeleton. Handles startup, auth, routing shell, and wires in feature modules.
- **Layer 2 (`project/ws/app/`)** = The organs. Each feature (Playlist, FRAC, Home…) is a standalone Angular library module, lazy-loaded into Layer 1.

---

## 4. Folder Structure

```
sunbird-cb-orgportal/
│
├── src/
│   ├── app/
│   │   ├── app.module.ts                   # Root module — bootstraps the app
│   │   ├── app-routing.module.ts           # All top-level routes
│   │   │
│   │   ├── component/
│   │   │   ├── root/                       # AppComponent — layout wrapper
│   │   │   │   ├── root.component.ts       # PWA updates, navbar visibility, progress bar
│   │   │   │   └── root.component.html     # Template: progress bar + router-outlet + nav
│   │   │   ├── login/                      # LoginRootComponent
│   │   │   ├── navbar/                     # Top navigation bar
│   │   │   ├── footer/                     # Footer
│   │   │   └── app-dialogs/               # Global dialogs (session expiry, etc.)
│   │   │
│   │   ├── guards/
│   │   │   ├── general.guard.ts            # Main guard: auth + TNC + roles + features
│   │   │   ├── login.guard.ts              # Redirect to login if unauthenticated
│   │   │   └── empty-route.guard.ts        # Handles root '/' path
│   │   │
│   │   ├── services/
│   │   │   ├── init.service.ts             # APP_INITIALIZER — entire bootstrap logic
│   │   │   ├── app-interceptor.service.ts  # Adds org/locale headers; handles 419
│   │   │   ├── app-retry-interceptor.service.ts  # Retries 5xx with backoff
│   │   │   └── global-error-handling.service.ts  # Global error UI handler
│   │   │
│   │   ├── routes/                         # Lazy-loading wiring modules (one per feature)
│   │   │   ├── route-home.module.ts
│   │   │   ├── route-frac.module.ts
│   │   │   ├── route-users.module.ts
│   │   │   ├── route-approvals.module.ts
│   │   │   ├── route-workallocation.module.ts
│   │   │   └── ... (8+ more)
│   │   │
│   │   ├── constants/
│   │   └── models/
│   │
│   ├── environments/
│   │   ├── environment.ts                  # Dev: reads from window.env
│   │   └── environment.prod.ts             # Prod config
│   │
│   ├── styles/                             # Global SCSS
│   ├── themes/                             # CSS variables / theme tokens
│   └── mdo-assets/                         # Static images, icons, fonts, JSON data
│
├── project/ws/app/
│   └── src/lib/
│       ├── head/                           # Shared header-level components
│       │   ├── _services/                  # widget-content, widget-user, search, video
│       │   ├── app-button/                 # Reusable button
│       │   ├── btn-content-feedback-v2/    # Feedback with snackbar + dialog
│       │   └── work-allocation-table/      # Work allocation table widget
│       │
│       └── routes/
│           ├── playlist/                   # ◄── PLAYLIST FEATURE (deep dive below)
│           ├── home/                       # Dashboard with sidebar layout
│           ├── frac/                       # FRAC framework management
│           ├── users/
│           ├── access/
│           ├── approvals/
│           ├── events/
│           ├── workallocation/
│           └── notification-v2/
│
├── proxy/
│   └── localhost.proxy.json               # Dev proxy config
│
├── assets/
├── e2e/
├── custom_typings/                        # Azure, Brace custom type defs
├── angular.json
├── package.json
├── tsconfig.json
├── Dockerfile
└── Jenkinsfile
```

---

## 5. App Bootstrap & Startup Flow

When the browser loads the app, this is the exact sequence:

```
Browser loads index.html
        │
        ▼
main.ts bootstraps AppModule
        │
        ▼
AppModule setup:
  ├── APP_INITIALIZER → InitService.init()   (runs before any route renders)
  ├── KeycloakAngularModule                  (SSO auth)
  ├── HTTP_INTERCEPTORS:
  │     ├── AppInterceptorService            (adds headers, handles 419)
  │     └── AppRetryInterceptorService       (retries 5xx, max 1 retry, 5s delay)
  ├── MAT_SNACK_BAR: duration = 5000ms
  ├── MAT_PROGRESS_SPINNER: 55px dia, 4px stroke
  ├── GlobalErrorHandlingService             (ErrorHandler)
  └── HammerConfig: horizontal + vertical pan/swipe
        │
        ▼
APP_INITIALIZER fires: InitService.init()
        │
        ├─ 1. fetchDefaultConfig()
        │       └── GET /assets/configurations/host.config.json
        │             Sets: rootOrg, org, activeOrg, appSetup flag
        │
        ├─ 2. fetchStartUpDetails()
        │       └── GET /apis/proxies/v8/api/user/v2/read
        │             ├── Validates user has roles in environment.portalRoles
        │             ├── Sets userProfile, userProfileV2
        │             ├── Sets userRoles (Set of lowercase role names)
        │             ├── Sets hasAcceptedTnc from !completeProdata.promptTnC
        │             ├── Sets isActive from !!!completeProdata.isDeleted
        │             └── Returns false if user fetch fails (blocks app)
        │
        ├─ 3. fetchUserPreference()
        │       └── Gets user locale/language preference
        │
        ├─ 4. reloadAccordingToLocale()
        │       └── If user locale ≠ running locale → reloads page at correct path
        │             (e.g., user set Hindi → reload /hi/app/...)
        │
        ├─ 5. Parallel loads (all at once):
        │       ├── fetchAppsConfig()
        │       │     → /assets/configurations/feature/apps.json
        │       │     → filters disabled apps by disabledAppIds
        │       ├── fetchInstanceConfig()
        │       │     → ${sitePath}/site.config.json
        │       │     → updates page title, favicon, webmanifest
        │       ├── fetchWidgetStatus()
        │       │     → /assets/configurations/widgets.config.json
        │       └── fetchFeaturesStatus()
        │             → /assets/configurations/features.config.json
        │
        ├─ 6. processWidgetStatus()
        │       └── Filters widgets by hasPermissions()
        │             ⚠️ GOTCHA: 'restrictedWidgets' stores ALLOWED widgets (confusing name)
        │
        └─ 7. processAppsConfig()
                └── Filters features by permission
                      ⚠️ GOTCHA: 'restrictedFeatures' stores ALLOWED features (confusing name)
        │
        ▼
Promise resolved → Angular activates routes
        │
        ▼
app-routing.module.ts loads
  Router config:
    anchorScrolling: 'enabled'
    scrollPositionRestoration: 'top'
    onSameUrlNavigation: 'reload'
    scrollOffset: [0, 80]        ← 80px offset for sticky header
        │
        ▼
GeneralGuard.canActivate()
  (see next section for exact check order)
        │
        ▼
Feature module lazy-loaded → Component renders ✓
```

---

## 6. Authentication & Guard System

### Keycloak Authentication

This app uses **Keycloak** (OAuth2/OIDC). The session token is managed by `KeycloakAngularModule`. When a token expires, the backend returns **HTTP 419** (custom status for session expired), which the `AppInterceptorService` handles by redirecting to Keycloak.

### GeneralGuard — Exact Check Order

```
GeneralGuard.canActivate() runs for every protected route:

CHECK 1: Invalid user (lines 79-85)
  if (userProfile === null && !disablePidCheck)
    → redirect /app/invalid-user
    → return false

CHECK 2: Terms & Conditions (lines 89-106)
  if (!hasAcceptedTnc && not on /setup or /tnc routes)
    → save target URL to configSvc.userUrl
    → (implicitly redirects to TNC page)

CHECK 3: Deleted user (lines 107-111)
  if (unMappedUser.isDeleted === true)
    → call logout()
    → return false

CHECK 4: Required roles (lines 124-132)
  if (route.data.requiredRoles is set)
    → hasRole(requiredRoles)?
        YES → continue
        NO  → redirect /page/home → return false

CHECK 5: Required features (lines 135-143)
  if (route.data.requiredFeatures is set)
    → any feature in restrictedFeatures?
        YES → continue
        NO  → redirect /app/home → return false

All checks passed → return true ✓

Helper: hasRole(roles: string[]): boolean
  → checks configSvc.userRoles.has(role.toLowerCase())
  → returns true if user has ANY of the given roles
```

### Authentication Flow Diagram

```
User visits protected URL (e.g., /app/home)
        │
        ▼
GeneralGuard fires
        │
        ├── Keycloak token valid?
        │       NO  → redirect to Keycloak login page
        │              user enters credentials
        │              Keycloak issues JWT
        │              redirect back to app
        │
        ├── userProfile loaded? (from /api/user/v2/read)
        │       NO  → /app/invalid-user
        │
        ├── hasAcceptedTnc?
        │       NO  → store target URL → /app/tnc
        │
        ├── isDeleted?
        │       YES → logout
        │
        ├── has requiredRoles?
        │       NO  → /page/home
        │
        └── featureAllowed?
                NO  → /app/home
                YES → ✓ Route activates
```

---

## 7. HTTP Layer — Interceptors & Proxy

### Request Pipeline

```
Component calls HttpClient.post('/apis/...')
        │
        ▼
AppInterceptorService.intercept()
  Headers added to EVERY request:
  ├── org        : configSvc.activeOrg
  ├── rootOrg    : configSvc.rootOrg
  ├── locale     : "<primary-locale>,<selectedLangGroup>"
  │                 e.g. "en,hi,mr"  (deduped, comma-separated)
  ├── wid        : "" (was user ID, now empty)
  └── hostPath   : configSvc.hostPath

  Language header construction:
  1. Start with current locale (en-US → "en")
  2. Append user preference selectedLangGroup
  3. Remove duplicates
  4. Join with comma → "en,hi"

  Error handling for HTTP 419 (session expired):
  ├── On localhost: redirect to Keycloak with ?q=[localhost-origin]/app/home/welcome
  └── On production: redirect to Keycloak with ?q=/app/home/welcome
        │
        ▼
AppRetryInterceptorService.intercept()
  Configuration:
  ├── maxAttempts    = 1   (so 2 total attempts)
  └── scalingDuration = 5000ms

  Retry logic:
  ├── Only retries status > 499 (5xx server errors)
  ├── Skip if: request.body.excludeRetry === true
  ├── Delay per attempt: retryAttempt * 5000ms
  │     Attempt 1 → wait 5s then retry
  └── If maxAttempts exceeded OR status ≤ 499 → throw original error
        │
        ▼
Request sent to browser networking layer
        │
        ▼ (development only)
Angular Dev Proxy (proxy/localhost.proxy.json)
  /apis/*       → https://org-sphere.aastrika.org  (with Cookie header for auth)
  /content-api/* → http://localhost:3004
  /content-store/* → http://localhost:3005
  /chat-bot/*   → http://localhost:3006
  /assets/*     → https://org-sphere.aastrika.org
        │
        ▼
Backend API Server responds
        │
        ├── 200 OK     → passes through normally
        ├── 5xx        → RetryInterceptor retries once after 5s
        ├── 419        → AppInterceptor redirects to Keycloak
        └── other 4xx  → GlobalErrorHandlingService shows error UI
```

### Why a Proxy?

In development, the Angular app runs on `http://localhost:4200` but the backend is at `https://org-sphere.aastrika.org`. Without a proxy, browsers block cross-origin requests (CORS). The proxy sits in between, forwarding `/apis/*` calls to the backend and adding the `connect.sid` auth cookie automatically.

---

## 8. Routing Architecture

### Full Route Tree

```
/                               → LoginRootComponent  (EmptyRouteGuard)
│
├── /app/
│   ├── home/                   → HomeModule  (GeneralGuard)
│   │   └── playlist/           → PlaylistModule routes (see playlist section)
│   │       ├── filters         → PlaylistFiltersComponent
│   │       └── summary         → PlaylistSummaryComponent
│   │
│   ├── playlist/               → Standalone playlist routes (full-screen, no sidebar)
│   │   ├── select-courses             → SelectCoursesComponent
│   │   ├── manage-course-order        → ManageCourseOrderComponent
│   │   ├── select-competencies        → SelectCompetenciesComponent
│   │   ├── manage-competency-order    → ManageCompetencyOrderComponent
│   │   └── manage-search              → ManageSearchComponent
│   │
│   ├── roles/                  → RoleAccessModule  (GeneralGuard)
│   ├── approvals/              → ApprovalsModule   (GeneralGuard)
│   ├── users/                  → UsersModule       (GeneralGuard)
│   ├── events/                 → EventsModule      (GeneralGuard)
│   ├── notifications/          → NotificationsModule
│   ├── search/                 → SearchModule
│   ├── workallocation/         → WorkAllocationModule
│   ├── tnc                     → TncComponent       (first login)
│   └── invalid-user            → InvalidUserComponent
│
├── /page/:id                   → ContentPageComponent (PageResolve resolver)
│
├── /public/                    → No auth required
│   ├── about
│   ├── contact
│   ├── tnc
│   ├── faq/:tab
│   └── logout
│
└── Error routes
    ├── /error-access-forbidden
    ├── /error-content-unavailable
    ├── /error-feature-disabled
    ├── /error-feature-unavailable
    ├── /error-internal-server
    ├── /error-service-unavailable
    └── /error-somethings-wrong
```

### Lazy Loading — How It Works

```
Step 1: app-routing.module.ts declares a lazy route
  {
    path: 'home',
    loadChildren: () =>
      import('./routes/route-home.module').then(m => m.RouteHomeModule),
    canActivate: [GeneralGuard]
  }
                │
                │ Browser downloads home bundle ONLY when user
                │ navigates to /app/home for the first time
                ▼
Step 2: route-home.module.ts (the wiring module in src/app/routes/)
  @NgModule({
    imports: [HomeModule, RouterModule.forChild(HOME_ROUTES)]
  })
  // HomeModule imported from project/ws/app/src/lib/routes/home/

Step 3: HomeModule declares its own sub-routes including PlaylistModule

Result: Initial bundle stays small. Features download on demand.
```

---

## 9. Feature Modules Overview

```
┌───────────────────────────────────────────────────────────────┐
│                     Feature Modules Map                        │
│                                                               │
│  ┌─────────────────────┐    ┌───────────────────────────────┐ │
│  │  HOME MODULE         │    │  FRAC MODULE                  │ │
│  │  ─────────────────── │    │  ─────────────────────────── │ │
│  │  Dashboard           │    │  18 Components                │ │
│  │  Sidebar layout      │    │  Framework Entities           │ │
│  │  Event details       │    │  Competency mapping           │ │
│  │  Approvals view      │    │  Role mapping                 │ │
│  │  Competency view     │    │  Activity mapping             │ │
│  │  Self-assessment     │    │  Excel upload/download        │ │
│  │  Work allocation     │    │  Position hierarchy view      │ │
│  │  ┌─────────────────┐ │    │  Custom snackbar              │ │
│  │  │ PLAYLIST MODULE  │ │    └───────────────────────────────┘ │
│  │  │ (deep dive →)    │ │                                      │
│  │  └─────────────────┘ │    ┌───────────────────────────────┐ │
│  └─────────────────────┘    │  USERS MODULE                  │ │
│                              │  Onboarding, role assignment   │ │
│  ┌─────────────────────┐    └───────────────────────────────┘ │
│  │  APPROVALS MODULE    │                                      │
│  │  Multi-step workflows│    ┌───────────────────────────────┐ │
│  └─────────────────────┘    │  WORK ALLOCATION MODULE        │ │
│                              │  Task distribution             │ │
│  ┌─────────────────────┐    └───────────────────────────────┘ │
│  │  EVENTS MODULE       │                                      │
│  │  Webinars, workshops │    ┌───────────────────────────────┐ │
│  └─────────────────────┘    │  ACCESS MODULE                 │ │
│                              │  Permission management         │ │
│  ┌─────────────────────┐    └───────────────────────────────┘ │
│  │  NOTIFICATIONS V2    │                                      │
│  └─────────────────────┘                                      │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Playlist Feature — Deep Dive

### What is a Playlist?

A **Playlist** is a server-stored configuration that answers: *"For this organization, these roles, in this language — what learning content should be shown?"*

There are three playlist types:

| Type | `playlistId` value | Content |
|---|---|---|
| **Course Playlist** | `Playlist_Course` | Ordered array of course IDs |
| **Competency Playlist** | `COMPETENCY_PLAYLIST_V2` | Competencies with 5 levels, each level mapped to courses |
| **Search Playlist** | `SEARCH_PLAYLIST` | Dynamic query configuration |

Special domain-specific playlists also exist:
- `PREGENANCY_SUPPORT_COMPETENCIES` (competency type)
- `PREGNANCY_GUIDANCE_COURSES`, `MATERNAL_HEALTH_COURSES`, `MATERNAL_NORMAL_DELIVERY_COURSES` (course type)
- `CHILD_HEALTH_COMPETENCIES` (competency type)

---

### Playlist Folder Structure

```
project/ws/app/src/lib/routes/playlist/
│
├── components/                            # Dialog components
│   ├── error-dialog/                      # Show API error message
│   ├── success-dialog/                    # Show success + redirect home
│   ├── playlist-view-dialog/              # Preview existing playlist (courses or competencies)
│   └── role-confirm-dialog/              # Confirm when selected roles differ from existing
│
├── pages/                                 # One folder = one route
│   ├── playlist-filters/                  # STEP 1 — filter form
│   ├── playlist-summary/                  # STEP 2 — choose playlist type to manage
│   ├── select-courses/                    # STEP 3a — pick courses
│   ├── manage-course-order/              # STEP 4a — drag-drop course ordering
│   ├── select-competencies/              # STEP 3b — pick competencies
│   ├── manage-competency-order/          # STEP 4b — map courses to competency levels
│   └── manage-search/                    # STEP 3c — query playlist editor
│
├── services/
│   ├── playlist-api.service.ts           # All playlist CRUD HTTP calls
│   ├── playlist-state.service.ts         # In-memory state (BehaviorSubjects + caches)
│   ├── course-api.service.ts             # Course search / filter APIs
│   └── competency-api.service.ts         # Competency search API
│
├── models/
│   ├── playlist.model.ts                  # PlaylistFilters, Playlist, all request/response types
│   ├── course.model.ts                    # Course, SelectableCourse, OrderedCourse
│   └── competency.model.ts               # Competency, CompetencyLevel, SelectableCompetency
│
├── utils/
│   ├── competency-transformer.ts          # Raw API → Playlist V2 format conversion
│   ├── competency-transformer.types.ts    # Type definitions for transformer
│   ├── competency-merge.utils.ts          # Non-destructive merge (deep merge preserving all keys)
│   ├── competency-payload.utils.ts        # Build final API payload from UI state
│   ├── language.utils.ts                  # Normalize language codes and names
│   └── playlist-logger.utils.ts           # Debug logger (suppressed in production)
│
├── config/
│   └── competency.config.ts               # Level count (5), min/max, getLevelNumbers()
│
├── constants/
│   └── playlist.constants.ts              # All routes, limits, languages, UI values
│
└── playlist.routes.ts                     # Two route arrays: HOME + STANDALONE
```

---

### Data Models (All Interfaces)

#### PlaylistFilters — what the user selects

```typescript
interface PlaylistFilters {
  orgId: string        // e.g. "0137259942543032320"
  orgName?: string     // display name
  role: string[]       // e.g. ["Director", "Manager"]
  state?: string[]     // e.g. ["Karnataka"]
  district?: string[]  // e.g. ["Bengaluru"]
  language: string     // "en" | "hi" | "kn" | "tn"
  playlist?: string    // optional: specific playlist identifier override
}
```

#### Playlist — API response object

```typescript
interface Playlist {
  id: string
  playlistId?: string          // "Playlist_Course" | "COMPETENCY_PLAYLIST_V2" | ...
  name?: string
  orgId: string
  role: string[]
  state?: string[]
  district?: string[]
  language: string
  scope?: PlaylistScope        // orgId + role + state + district + language (nested)
  dataSource: {
    type: 'static' | 'dynamic' | 'competency' | 'query'
    payload: string[]           // for course playlists
           | PlaylistCompetencyPayload[]  // for competency playlists
           | Record<string, unknown>      // for query playlists
  }
  createdOn?: string
  updatedOn?: string
  updated_at?: string
}
```

#### PlaylistCompetencyPayload — one competency in a V2 playlist

```typescript
interface PlaylistCompetencyPayload {
  id: number | string
  code?: string
  name?: string
  description?: string
  type?: string
  index?: number               // order position (0-based)
  levels?: {
    level: number | string     // 1 through 5
    name?: string
    description?: string
    courseId?: string          // single course assigned to this level
  }[]
  [key: string]: unknown       // allows extra fields from API
}
```

#### Course

```typescript
interface Course {
  identifier: string
  name: string
  sourceName: string
  primaryCategory: string
  status: string
  lang: string
  createdOn: string
  updatedOn?: string
  description?: string
  thumbnail?: string
  competencies_v1?: string     // JSON string of competency mappings
  competencySearch?: string[]  // expanded competency+level search keys e.g. ["100-1","100-2"]
}

interface SelectableCourse extends Course {
  selected: boolean
  isPreselected: boolean       // was in existing playlist
  displayOrder?: number        // 1-based order index
}
```

#### Competency

```typescript
interface Competency {
  id: string
  code: string                 // used for matching (more stable than id)
  name: string
  description?: string
  type?: string
  status?: string
  levels?: CompetencyLevel[]
}

interface SelectableCompetency extends Competency {
  selected: boolean
  isPreselected?: boolean      // was in existing playlist
  displayOrder: number         // 1-based order index
  coursesAssigned: boolean     // all 5 levels have courses → explicit flag
  levels: CompetencyLevel[]    // L1–L5 slots with courseId assignments
}

interface CompetencyLevel {
  level: number
  name?: string
  description?: string
  courseId?: string
  courseName?: string
}
```

#### Course Search Request Bodies

```typescript
// Regular course search (by language)
interface CourseSearchRequest {
  request: {
    filters: {
      primaryCategory: string[]   // ["Course"]
      status?: string[]           // ["Live"]
      lang: string[]              // ["English"] — full name, not code
      competency?: boolean        // false for regular search
    }
    limit: number
    offset: number
    sort_by: { createdOn: string }
    fields: string[]
  }
}

// Course search by competency
interface CompetencyCourseSearchRequest {
  request: {
    filters: {
      competencySearch: string[]  // e.g. ["100-1","100-2","100-3","100-4","100-5"]
      lang: string[]
      primaryCategory: string[]
    }
    exists: string[]              // ["competencySearch"] — field must exist
    fields: string[]
  }
}
```

#### Role Comparison (for save confirmation dialog)

```typescript
interface RoleComparisonResult {
  newRoles: string[]           // selected by user, NOT in existing
  existingOnlyRoles: string[]  // in existing, NOT selected by user
  isExactMatch: boolean        // both sets are identical
  isNewPlaylist: boolean       // no existing playlist at all
}
```

---

### User Journey Flow

```
                  /app/home/playlist/filters
                           │
                    ┌──────▼──────┐
                    │   FILTERS   │  ← STEP 1
                    │   PAGE      │
                    │             │  Form: orgId, role[], language
                    │             │  API: load orgs + positions
                    │             │  On submit: search 3 playlist types
                    └──────┬──────┘
                           │ navigate to /summary
                    ┌──────▼──────┐
                    │   SUMMARY   │  ← STEP 2
                    │   PAGE      │
                    │             │  Shows: existing playlist counts
                    │             │  3 options: Course / Competency / Search
                    └──────┬──────┘
          ┌────────────────┼───────────────────┐
          │                │                   │
          ▼                ▼                   ▼
   /select-courses  /select-competencies  /manage-search
          │                │
   ┌──────▼──────┐  ┌──────▼──────────────┐
   │  SELECT     │  │  SELECT             │  ← STEP 3a / 3b
   │  COURSES    │  │  COMPETENCIES       │
   │             │  │                     │
   │ Load all    │  │ Load competencies   │
   │ courses for │  │ for language        │
   │ language    │  │                     │
   │             │  │ Match existing by   │
   │ Preselect   │  │ CODE (not id)       │
   │ from state  │  │                     │
   │             │  │ CDK SelectionModel  │
   │ CDK         │  │ for multi-select    │
   │ SelectModel │  └──────┬──────────────┘
   └──────┬──────┘         │ navigate to /manage-competency-order
          │                ▼
          │         ┌──────────────────────────────────────┐
          │         │  MANAGE COMPETENCY ORDER              │  ← STEP 4b
          │         │                                      │
          │         │  For selected competency:            │
          │         │  ├── Load courses by competency      │
          │         │  │    (competencyCoursesCache)        │
          │         │  ├── Organize by level               │
          │         │  │    (levelFilteredCourses map)      │
          │         │  └── User selects 1 course per level │
          │         │                                      │
          │         │  After all 5 levels assigned:        │
          │         │  ├── coursesAssigned = true          │
          │         │  └── Auto-select next incomplete     │
          │         │                                      │
          │         │  CDK drag-drop to reorder list       │
          │         │  Auto-save after reorder (if all     │
          │         │  competencies complete)               │
          │         └──────┬───────────────────────────────┘
          │                │
          └────────┬────────┘
                   │ navigate to save
          ┌────────▼───────────────────────────────────────┐
          │                 SAVE LOGIC                      │  ← FINAL STEP
          │                                                │
          │  1. Get filters + existing playlist from state │
          │                                                │
          │  2. state.compareRoles(filters.role)           │
          │       isExactMatch?                            │
          │       ├── YES → proceed                        │
          │       └── NO  → open RoleConfirmDialog         │
          │                    ├── Confirm → proceed       │
          │                    └── Cancel → abort          │
          │                                                │
          │  3. existingPlaylist exists?                   │
          │       ├── NO  → createPlaylist() API           │
          │       └── YES → updatePlaylist() API           │
          │                                                │
          │  4. Re-fetch playlist from API (fresh data)    │
          │     Update state with new playlist             │
          │                                                │
          │  5. Open SuccessDialog → navigate to /summary  │
          │     OR                                         │
          │     Open ErrorDialog → retry option            │
          └────────────────────────────────────────────────┘
```

---

### Component Logic — Page by Page

#### PlaylistFiltersComponent (`playlist-filters/`)

**Angular features used:** `standalone: true`, Angular Signals, Reactive Forms, `@HostListener`

```typescript
// Class properties (Signals)
loading       = signal(false)
errorMessage  = signal('')
organizations = signal<{ value: string; label: string }[]>([])
filteredOrganizations = signal<...[]>([])
positions     = signal<...[]>([])
districts     = signal<...[]>([])
orgSearchTerm = signal('')
orgDropdownOpen    = signal(false)
positionDropdownOpen = signal(false)

// Form structure
FilterForm = FormGroup {
  orgId:    [required]
  role:     [required, nonEmptyArray validator]
  district: [optional]
  block:    [optional]
  language: [required]
}
```

**Key method: `onContinue()`** — the main submit handler:
1. Validate form → mark all fields touched if invalid
2. Extract `PlaylistFilters` from form values
3. Clear course and competency cache in state
4. Save filters to `PlaylistStateService`
5. Make **3 parallel API calls** via `Promise.all`:
   - `searchPlaylist(filters, PlaylistType.COURSE)`
   - `searchPlaylist(filters, PlaylistType.COMPETENCY)`
   - `searchPlaylist(filters, PlaylistType.SEARCH)`
6. Extract course IDs, competency IDs, competency codes from results → store in state
7. Navigate to `PLAYLIST_ROUTES.HOME_SUMMARY`

**`@HostListener('document:click')`** — closes custom dropdowns when clicking outside.

**Custom dropdown behavior:**
- Organization uses a custom searchable dropdown (not `mat-select`), with its own open/close/search logic
- Position uses a custom multi-select with checkboxes and `toggleRole(value)` method

---

#### PlaylistSummaryComponent (`playlist-summary/`)

**Properties:** All signals — `filters`, `courseSummary`, `competencySummary`, `searchSummary`

**Key method: `timeAgo(dateString)`** — converts ISO date to relative label:
```
< 60 seconds    → "Just now"
< 60 minutes    → "X mins ago"
< 24 hours      → "1 hr ago" / "X hrs ago"
< 30 days       → "X days ago"
< 12 months     → "X months ago"
otherwise        → "X years ago"
```

**Preview Dialogs** — clicking "View" on an existing playlist opens `PlaylistViewDialogComponent`:
- Course playlist → `buildCourseRows()` → calls `searchCoursesByIds(courseIds, language)` → dialog width 980px
- Competency playlist → `buildCompetencyRows()` → normalizes payload, sorts by level → dialog width 1100px
- Handles wrapped payload format: `{ c1: {...}, c2: {...} }` and flat array format

**Navigation:**
- `onManageCourse()` → clears course cache → `/select-courses`
- `onCompetencyClick()` → `/select-competencies`
- `onSearchClick()` → `/manage-search`
- `onChangeFilters()` → `/filters`

---

#### SelectCoursesComponent (`select-courses/`)

**Angular CDK:** `SelectionModel<SelectableCourse>` for multi-select tracking

**Course preselection logic:**
1. `buildPreselectedCourseOrderMap()` — builds `Map<courseId, orderIndex>` from existing playlist payload (preserves original order)
2. `loadCourses()`:
   - Check state cache (`getCachedCourses(language)`) first
   - Fall back to `courseApi.loadAllCourses(language)` (async method that paginates)
   - Map each course to `SelectableCourse` with `isPreselected` flag
3. `applyPreselectionAndSort()`:
   - Look for saved selections from state
   - Fall back to `isPreselected` courses if no saved selections
4. `compareCourses(a, b)` — priority sort:
   - `isPreselected` courses first (sorted by existing order map)
   - `selected` courses second
   - unselected last
   - Tiebreak: `name.localeCompare()` then `sourceName.localeCompare()`

**`onNext()`** → filters selected courses in list order → saves to state → `/manage-course-order`

---

#### ManageCourseOrderComponent (`manage-course-order/`)

**Angular CDK:** `CdkDragDrop` + `moveItemInArray`

**Search-aware drag-drop** (`onDrop(event)`):
```
If search is active:
  1. moveItemInArray on filteredCourses only
  2. mergeFilteredOrderIntoFull(fullList, reorderedFiltered)
     → maps full list by identifier
     → inserts filtered items back in correct positions
     → preserves hidden items
  3. Recalculate displayOrder (1-based) on full list
  4. Re-run search to refresh filtered view
Else:
  Simple moveItemInArray on orderedCourses
  Recalculate displayOrder
```

**`onSave()`** — save to API:
1. Get filters + existing playlist from state
2. `state.compareRoles(filters.role)` → get `RoleComparisonResult`
3. If `!isExactMatch && !isNewPlaylist` → open `RoleConfirmDialogComponent`
   - Dialog shows: new roles being added, existing-only roles being replaced
   - `afterClosed()` → if confirmed: proceed; if cancelled: return
4. Save ordered courses to state
5. Merge roles: `state.getMergedRoles()`
6. **API**: `playlistApi.savePlaylist(filters, courseIds, existingPlaylist, COURSE)`
7. Re-fetch playlist from API → update state
8. Open `SuccessDialogComponent` (navigates to HOME_SUMMARY on close)
9. On error: open `ErrorDialogComponent` (has retry callback)

**Error message extraction** (from API response):
```
try:  result.errors[0].message
try:  params.errmsg
try:  error.message
fallback: "Failed to save playlist"
```

---

#### SelectCompetenciesComponent (`select-competencies/`)

**Key difference from courses:** Matching uses **code** not **id** for resilience.

```typescript
// On load, normalize existing codes to UPPERCASE
existingCodes = existingCompetencyCodes.map(c => c.toUpperCase())

// When preselecting:
isPreselected = existingCodes.includes(competency.code.toUpperCase())
```

**`buildPreselectedCompetencyOrderMap()`:**
- Handles both wrapped format `{ c1: {...}, c2: {...} }` and flat array format
- Maps `code.toUpperCase() → orderIndex`

**`compareCompetencies(a, b)` — priority sort:**
- `isPreselected` first (sorted by existing order map, keyed by code)
- `selected` second
- Unselected last
- Tiebreak: `code.localeCompare()` then `name.localeCompare()`

**`onAssignCourses()`** → saves selected competencies to state → `/manage-competency-order`

---

#### ManageCompetencyOrderComponent (`manage-competency-order/`)

This is the most complex page. It manages course assignment for each competency level.

**Local caches:**
```typescript
competencyCoursesCache: Map<competencyId, Course[]>   // avoid re-fetching
levelFilteredCourses:   Map<level, Course[]>           // courses per level for dropdowns
```

**`loadCompetencies()`** — initialization:
1. Get selected competencies from state
2. Get existing competency playlist (if editing)
3. For each selected competency:
   - `findExistingCompetency(code, id, existingPayload)` → match by code first, then id
   - `restoreSavedCourseAssignments(competency, existingData)` → re-populate level assignments
   - Check if `coursesAssigned === true` (explicit flag from `buildPlaylistPayload`)
4. Sort by `displayOrder`
5. Auto-select first competency → `loadCompetencyLevelCourses(first)`

**`loadCompetencyLevelCourses(competency)`:**
1. Check `competencyCoursesCache` first
2. If not cached → `courseApi.searchCoursesByCompetency(competency.id, language)`
3. Sets timeout guard: `COURSE_LOAD_TIMEOUT_MS = 15000ms`
4. Calls `updateLevelFilteredCourses(competencyId, courses)`:
   - For each level 1–5: `courseApi.filterCoursesByLevel(courses, competencyId, level)`
   - Stored in `levelFilteredCourses` Map
5. Cache results in `competencyCoursesCache`

**`onCourseSelect(level, courseId)`:**
- Looks up course details from `courses` signal
- Sets `level.courseId` and `level.courseName`
- Updates state with modified competencies

**`onAssignCourses()`** — mark current competency complete:
1. Set `selectedCompetency.coursesAssigned = true`
2. Find next incomplete competency (`!c.coursesAssigned`)
3. Auto-select it → load its courses

**Auto-save behavior:**
- After `onDrop()` (drag-drop reorder): if `allCompetenciesComplete()` → call `autoSaveOrder()`
- `autoSaveOrder()` builds payload and calls save API silently

**`onSave()`** — identical role-check + dialog flow as ManageCourseOrderComponent.

---

### Services

#### PlaylistApiService

| Method | Purpose | Endpoint |
|---|---|---|
| `searchOrganizations()` | Get all orgs (limit 9999) | `POST /apis/proxies/v8/org/v1/search` |
| `searchPositions(language)` | Get positions/roles | `POST /apis/proxies/v8/entity/v1/search` |
| `searchPlaylist(filters, type)` | Find existing playlist | `POST /apis/protected/v8/playlist/search` |
| `createPlaylist(...)` | Create new playlist | `POST /apis/protected/v8/playlist/create` |
| `updatePlaylist(...)` | Update existing playlist | `PUT /apis/protected/v8/playlist/update` |
| `savePlaylist(...)` | Create or update (smart) | calls create or update based on existing |
| `extractCourseIds(playlists)` | Pull course IDs from payload | — |
| `extractCompetencyIds(playlists)` | Pull competency IDs | — |
| `extractCompetencyCodes(playlists)` | Pull competency codes | — |
| `extractCompetencyData(playlists)` | Pull full competency objects | — |
| `buildCompetencyPayload(competencies)` | Wrap in `c1:{}, c2:{}` format | — |

**`PlaylistType` enum:**
```typescript
enum PlaylistType {
  COURSE     = 'COURSE',
  COMPETENCY = 'COMPETENCY',
  SEARCH     = 'SEARCH',
}
```

**Playlist scope object** (sent in create/update requests):
```typescript
scope = {
  orgId: filters.orgId,
  role: mergedRoles,
  state: filters.state,
  district: filters.district,
  language: filters.language,
}
```

#### CourseApiService

| Method | Purpose |
|---|---|
| `searchCourses(language, limit=20, offset=0)` | All courses for a language |
| `searchCoursesByCompetency(competencyId, language)` | Courses matching a competency |
| `searchCoursesByMultipleCompetencies(ids[], language)` | Batch competency course fetch |
| `searchCoursesByIds(courseIds, language)` | Fetch specific courses by ID (for view dialog) |
| `loadAllCourses(language)` | Async — paginates to load all courses |
| `buildCompetencySearchRequest(competencyId, language)` | Builds search request body |
| `parseCompetencyLevels(course)` | Parses `competencies_v1` JSON string → `CompetencyInfo[]` |
| `filterCoursesByLevel(courses, competencyId, level)` | Filter courses for specific level |
| `filterCourses<T>(courses, searchTerm)` | Client-side text search |

**Competency level expansion** (for search keys):
```
competencyId "100" → ["100-1", "100-2", "100-3", "100-4", "100-5"]
These are stored in course.competencySearch[] and used in API filter
```

#### CompetencyApiService

| Method | Purpose |
|---|---|
| `getCompetencyListByLanguage(language='en')` | All competencies for a language |
| `searchCompetencies(query?, limit=100)` | Search competencies by name |
| `mapToCompetency(entity)` | Raw entity → `Competency` object |
| `mapEntitySearchResponse(entity, language)` | Raw entity → `RawCompetencyEntity` |

---

### Utilities Layer

#### `competency-transformer.ts` — `CompetencyTransformer` (static class)

Converts raw API competency data to the Playlist V2 format.

**Language field logic:**
```
English (en):
  outer fields used: { name: "...", description: "..." }

Other languages (hi, kn, tn):
  additionalProperties used: { "lang-hi-name": "...", "lang-hi-description": "..." }

Output keyed by LOWERCASE code:
  { "c97": { id, code, name, levels: [...] }, "c42": {...} }
```

Key methods:
- `transformToPlaylistFormat(entity, language, existing?)` → full playlist entry
- `transformLevels(entity, language, existing?)` → level array with per-level language support
- `findExistingLevel(existing, levelNum)` → look up existing level data
- `updateLevelCourse(level, courseMapping)` → update course for a specific language
- `buildPlaylistPayload(entities, language, existing?)` → full payload object
- `validateCoursesComplete(payload, requiredLanguages)` → check all levels filled

#### `competency-merge.utils.ts` — Non-Destructive Merge

All functions preserve existing data — they only ADD or UPDATE, never remove.

- `deepMergePreserve(existing, updates)` — deep merge: existing keys win unless update specifies
- `mergeCourses(existingLevels, newLevels, language)` — update course mappings per level+language
- `mergeLevelDescriptions(existingLevels, newLevels)` — preserve all levels, update changed fields
- `mergeCompetency(existing, update)` — non-destructive single competency update
- `updatePayloadNonDestructive(existingPayload, newCompetencies)` — update full payload
- `changeCompetencyPosition(payload, code, newKey)` — rename root key (c2→c3) preserving all data

#### `competency-payload.utils.ts` — Payload Building

Extracted from `ManageCompetencyOrderComponent` for testability.

- `findExistingCompetency(code, id, payload)` — finds by code first, then id fallback
- `buildLevels(competency)` — builds levels array, includes `courseId` when assigned
- `buildCompetencyData(competency, existing?)` — builds V2 API format, **preserves original audit timestamps** (`createdDate`, `createdBy`, `updatedDate`, `updatedBy`, `reviewedDate`, `reviewedBy`)
- `buildPlaylistPayload(competencies, authToken, existingPlaylist?)` — adds `index` field per position
- `restoreSavedCourseAssignments(competency, existingData)` — re-populates level course assignments when editing

#### `language.utils.ts` — Language Normalization

```typescript
normalizeLanguage('English') → 'en'
normalizeLanguage('en')      → 'en'
normalizeLanguage('HINDI')   → 'hi'   // case-insensitive

expandLanguageFilter('en')   → ['en', 'english']  // both variants for API filters
expandLanguageFilters(['en','hi']) → ['en','english','hi','hindi']
```

#### `playlist-logger.utils.ts` — Conditional Logging

```typescript
// All methods suppressed in production
log.error(msg) // only if !window.isProduction → console.error('[Playlist] ...')
log.warn(msg)
log.info(msg)
```

---

### Constants Reference

```typescript
// ROUTES
PLAYLIST_ROUTES = {
  HOME_FILTERS:            '/app/home/playlist/filters',
  HOME_SUMMARY:            '/app/home/playlist/summary',
  SELECT_COURSES:          '/app/playlist/select-courses',
  MANAGE_COURSE_ORDER:     '/app/playlist/manage-course-order',
  SELECT_COMPETENCIES:     '/app/playlist/select-competencies',
  MANAGE_COMPETENCY_ORDER: '/app/playlist/manage-competency-order',
  MANAGE_SEARCH:           '/app/playlist/manage-search',
}

// API
PLAYLIST_API = {
  ORG_SEARCH_LIMIT:   9999,
  DEFAULT_AUTH_TOKEN: 'system',    // used in payload builds
}

// UI
PLAYLIST_UI = {
  SHIMMER_ROWS:            8,
  DIALOG_WIDTH:            '450px',
  SUCCESS_DIALOG_WIDTH:    '323px',
  ERROR_DIALOG_WIDTH:      '400px',
  LOADING_GUARD_MS:        20000,   // 20s timeout guard for course loads
  COURSE_LOAD_TIMEOUT_MS:  15000,   // 15s timeout for competency course loads
  FOCUS_DELAY_MS:          50,      // delay before focussing search input
}

// COMPETENCY LEVEL CONFIG
COMPETENCY_CONFIG = {
  DEFAULT_LEVEL_COUNT: 5,
  MIN_LEVEL: 1,
  MAX_LEVEL: 10,
}
// getLevelNumbers() → [1, 2, 3, 4, 5]

// LANGUAGES
PLAYLIST_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'kn', label: 'Kannada' },
  { value: 'tn', label: 'Tamil' },
]

// COMPETENCY DEFAULTS (for new entries)
PLAYLIST_COMPETENCY_DEFAULTS = {
  AREA:     'Management',
  STATUS:   'UNVERIFIED',
  LEVEL:    'INITIATE',
  LEVEL_ID: 0,
  TYPE:     'Domain',
}

// TIME DISPLAY
TIME_UNITS = {
  MINUTE:          60,
  HOUR:            60,
  DAY:             24,
  MONTH_THRESHOLD: 30,
}
```

---

## 11. State Management

The entire playlist feature uses **RxJS BehaviorSubjects** via `PlaylistStateService`. No NgRx, no Akita.

### Full State Map

```
PlaylistStateService (singleton, providedIn: 'root')
│
├── FORM DATA
│   ├── filters$: BehaviorSubject<PlaylistFilters | null>
│   │     set by: PlaylistFiltersComponent.onContinue()
│   │     read by: ALL downstream components
│   │
├── EXISTING PLAYLISTS (from API search)
│   ├── existingPlaylist$: BehaviorSubject<Playlist | null>
│   │     = the current COURSE playlist from server
│   ├── existingCompetencyPlaylist$: BehaviorSubject<Playlist | null>
│   │     = the current COMPETENCY playlist from server
│   └── existingSearchPlaylist$: BehaviorSubject<Playlist | null>
│         = the current SEARCH playlist from server
│
├── EXTRACTED IDs (for preselection)
│   ├── existingCourseIds$: BehaviorSubject<string[]>
│   ├── existingCompetencyIds$: BehaviorSubject<string[]>
│   └── existingCompetencyCodes$: BehaviorSubject<string[]>
│
├── SELECTION STATE (user's current choices)
│   ├── selectedCourses$: BehaviorSubject<SelectableCourse[]>
│   ├── orderedCourses$: BehaviorSubject<SelectableCourse[]>
│   └── selectedCompetencies$: BehaviorSubject<SelectableCompetency[]>
│
└── CACHES (avoid redundant API calls)
    ├── courseCache: Course[]  +  courseCacheLanguage: string
    └── competencyCache: RawCompetencyEntity[]  +  competencyCacheLanguage: string
```

### Role Comparison Logic

```typescript
state.compareRoles(selectedRoles): RoleComparisonResult
  ├── existingPlaylist = getExistingPlaylist() (or competency playlist)
  ├── isNewPlaylist = existingPlaylist is null
  ├── existingRoles = existingPlaylist?.role ?? []
  ├── newRoles = selectedRoles not in existingRoles
  ├── existingOnlyRoles = existingRoles not in selectedRoles
  └── isExactMatch = newRoles.length === 0 && existingOnlyRoles.length === 0

state.getMergedRoles(selectedRoles): string[]
  └── union of selected + existing (no duplicates)
      used when saving to avoid wiping existing role assignments
```

---

## 12. FRAC Feature Overview

FRAC = **Framework for Roles, Activities, Competencies**

Located at: `project/ws/app/src/lib/routes/frac/`

### Purpose
Manage the organizational framework: define roles, map activities to roles, map competencies to activities, define positions in a hierarchy, and upload bulk data via Excel.

### Key Components (18 total)

| Component | Purpose |
|---|---|
| `frac` + `frac-table` | Main FRAC list and table view |
| `activity-mapping-list` + `activity-mapping-table` | Map activities to roles |
| `competency-mapping-table` | Map competencies to activities |
| `role-mapping-list` + `role-mapping-table` | Role management and mapping |
| `position-mapping-list` | Position management |
| `frac-upload` | Upload popup component |
| `upload-activity-list-table` + `upload-competency-list-table` | Show upload preview |
| `upload-result-modal` | Show upload results |
| `hierarchy-chip-details-modal` | View hierarchy path |
| `position-hierarchy-view-modal` | Full position hierarchy viewer |
| `mapping-required-modal` | Alert when required mapping missing |
| `unsaved-changes-modal` | Guard against leaving with unsaved changes |
| `custom-snackbar` | Domain-specific notification |

### Services

| Service | Purpose |
|---|---|
| `frac-api.service.ts` | All HTTP calls for FRAC |
| `frac.service.ts` | Main FRAC orchestration service |
| `frac-upload.service.ts` | File upload handling |
| `frac-entity-upload-orchestrator.service.ts` | Orchestrates multi-step bulk uploads |
| `custom-snackbar.service.ts` | Notification service |

### Utilities

| Utility | Purpose |
|---|---|
| `frac-payload-builder.util.ts` | Build API payloads for create/update |
| `frac-response-parser.util.ts` | Parse complex API responses |
| `frac-upload-helper.ts` + `frac-upload-ui.util.ts` | Excel upload processing |
| `frac-position-hierarchy.helper.ts` | Build position hierarchy tree |
| `frac-edit-tracker.util.ts` | Track unsaved changes |
| `frac-client-config.util.ts` | Client-side config |
| `table-transform.util.ts` | Transform data for table display |
| `common.util.ts` | Shared helpers |
| `frac-logger.util.ts` | FRAC-specific logging |

---

## 13. Root Component & PWA

`src/app/component/root/root.component.ts`

### Responsibilities

1. **Route progress bar** — subscribes to `Router.events`:
   - `NavigationStart` → show progress bar
   - `NavigationEnd` / `NavigationCancel` / `NavigationError` → hide progress bar

2. **Navbar visibility** — hides navbar for certain route patterns:
   - `/preview/*` routes
   - `/embed/*` routes
   - `/author/*` routes
   - Hides for iframe context (`window.self !== window.top`)

3. **Responsive layout** — subscribes to `BreakpointObserver` for `isXSmall$`

4. **Setup page detection** — detects `/app/setup` routes to adjust layout

5. **PWA update mechanism** (using Angular Service Worker `SwUpdate`):
   ```
   Every 6 hours: check for new app version
       │
       ├── New version available?
       │       YES → open "App Update Available" dialog
       │              user clicks OK → window.location.reload()
       └── Current version confirmed? → log it
   ```

### Template Structure

```html
<mat-progress-bar *ngIf="isNavigating" />        <!-- Route change indicator -->
<ws-app-navbar *ngIf="showNavbar" />             <!-- Top nav (large screens) -->
<div class="content-wrapper">
  <router-outlet />                               <!-- Feature pages render here -->
</div>
<ws-app-footer />
<ws-app-bottom-nav *ngIf="isXSmall" />           <!-- Mobile bottom nav -->
```

---

## 14. Environment Configuration

`src/environments/environment.ts`

```typescript
// Values loaded from window.env (injected by server at runtime)
export const environment = {
  production:    false,
  sitePath:      window.env?.sitePath,       // path for site.config.json
  karmYogiPath:  window.env?.karmYogiPath,
  cbpPath:       window.env?.cbpPath,
  portalRoles:   env.util.getPortalRoles(),  // roles allowed to access portal
}
```

`window.env` is a runtime injection — the server sets this object in a `<script>` tag in `index.html` before Angular boots. This allows the same built bundle to point at different backends in dev/preprod/prod without a rebuild.

---

## 15. API Endpoints Reference

### Playlist

| Method | Endpoint | Body / Purpose |
|---|---|---|
| POST | `/apis/protected/v8/playlist/search` | `{ request: { filters: { orgId, role[], language, playlistId } } }` |
| POST | `/apis/protected/v8/playlist/create` | Full playlist object with scope + dataSource |
| PUT | `/apis/protected/v8/playlist/update` | Full playlist object with id + scope + dataSource |

### Organization & Entities

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/apis/proxies/v8/org/v1/search` | Search organizations (limit: 9999) |
| POST | `/apis/proxies/v8/entity/v1/search` | Search entities: positions, competencies |
| PUT | `/apis/proxies/v8/entity/v1/update` | Update entity records |
| DELETE | `/apis/proxies/v8/entity/v1/delete` | Delete entity records |
| POST | `/apis/proxies/v8/entity/v1/mapping` | Save entity→competency mappings |
| POST | `/apis/proxies/v8/entity/v1/mapping/search` | Search entity mappings |
| POST | `/apis/proxies/v8/entity/v1/upload` | Bulk upload entities via Excel |

### Course Search

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/apis/proxies/v8/sunbirdigot/search` | Search courses by language, competency, or IDs |

### User

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/apis/proxies/v8/api/user/v2/read` | Fetch logged-in user profile (called at startup) |

### Typical Course Search Body

```json
{
  "request": {
    "filters": {
      "primaryCategory": ["Course"],
      "status": ["Live"],
      "lang": ["English"],
      "competency": false
    },
    "limit": 20,
    "offset": 0,
    "sort_by": { "createdOn": "desc" },
    "fields": ["identifier", "name", "sourceName", "primaryCategory",
               "status", "lang", "createdOn", "thumbnail", "competencies_v1"]
  }
}
```

### Typical Competency Course Search Body

```json
{
  "request": {
    "filters": {
      "competencySearch": ["100-1", "100-2", "100-3", "100-4", "100-5"],
      "lang": ["English"],
      "primaryCategory": ["Course"]
    },
    "exists": ["competencySearch"],
    "fields": ["identifier", "name", "sourceName", "competencySearch"]
  }
}
```

---

## 16. Key Patterns & Conventions

### 1. Standalone Components — Playlist module only, not repo-wide

All 9 Playlist components (pages + dialogs) are `standalone: true` — a deliberate,
documented modernization (see `project/ws/app/src/lib/routes/docs/playlist/MIGRATION.md`
PR-6). This is an isolated exception: FRAC, Home, and every other feature module in
this repo remain NgModule-based with `standalone: false`, per the standing rule in
CLAUDE.md. Do not standalone-ify other modules off the back of this example.

```typescript
@Component({
  standalone: true,
  selector: 'app-playlist-filters',
  imports: [CommonModule, ReactiveFormsModule]
})
```

### 2. Angular Signals — also Playlist-only

Playlist pages use `signal()`/`computed()` for local reactive state (MIGRATION.md
PR-4). Elsewhere in the repo, components still use plain class properties + RxJS —
this is existing shipped code for one module, not a repo-wide pattern to extend.

```typescript
loading  = signal(false)           // writable signal
hasRoles = computed(() => this.roles().length > 0)  // derived (read-only)

// Update a signal:
this.loading.set(true)
// Read a signal:
if (this.loading()) { ... }
```

Signals work well with `OnPush` change detection — Angular only re-renders when a signal value actually changes.

### 3. Angular CDK SelectionModel

Used instead of a manual `Set<T>` for multi-select tracking:

```typescript
selection = new SelectionModel<SelectableCourse>(true) // true = multiple select

selection.toggle(course)          // add or remove
selection.isSelected(course)      // check membership
selection.selected                // get array of selected items
selection.clear()                 // deselect all
```

### 4. Angular CDK Drag-Drop (with Search Safety)

```typescript
// Simple case (no search active):
moveItemInArray(this.orderedCourses(), event.previousIndex, event.currentIndex)

// Complex case (search is active — user sees filtered subset):
// 1. moveItemInArray on filteredCourses only
// 2. mergeFilteredOrderIntoFull(full, filtered)
//    → uses Map<id, item> to put filtered items back in correct positions
//    → hidden items remain in place
// 3. Recalculate displayOrder on full list
```

### 5. Non-Destructive Updates

When editing an existing playlist, the app **never wipes data it didn't explicitly change**:

```
Existing:  Competency A → Level 1: [course1]  Level 3: [course3]  lang-hi-name: "..."
User adds: Competency B, keeps A

Result:
  Competency A → Level 1: [course1]  Level 3: [course3]  lang-hi-name: "..."  ← PRESERVED
  Competency B → (new, empty)                                                  ← ADDED
```

Implemented in `competency-merge.utils.ts` and `competency-payload.utils.ts`.

### 6. Audit Field Preservation

Every competency entry carries audit timestamps. When updating:
```typescript
// buildCompetencyData() preserves original audit fields
{
  createdDate: existing?.createdDate ?? now,
  createdBy:   existing?.createdBy ?? authToken,
  updatedDate: now,                              // always updated
  updatedBy:   authToken,                        // always updated
  reviewedDate: existing?.reviewedDate,          // preserved
  reviewedBy:   existing?.reviewedBy,            // preserved
}
```

### 7. Language-Aware API Fields

The API stores content in different places depending on language:

```
English:            { name: "Data Analysis", description: "..." }
Hindi (hi):         { additionalProperties: { "lang-hi-name": "डेटा विश्लेषण", "lang-hi-description": "..." } }
Kannada (kn):       { additionalProperties: { "lang-kn-name": "...", "lang-kn-description": "..." } }
Tamil (tn):         { additionalProperties: { "lang-tn-name": "...", "lang-tn-description": "..." } }
```

`CompetencyTransformer.buildLanguageFields(language, name, desc)` handles this mapping.

### 8. Confusing Naming Gotcha

In `InitService`:
- `restrictedFeatures` → actually stores **ALLOWED** features (not restricted ones)
- `restrictedWidgets` → actually stores **ALLOWED** widgets

When `GeneralGuard` checks `restrictedFeatures`, it checks if the feature IS in the set (meaning it's allowed).

### 9. Naming: `window.isProduction`

The playlist logger checks `window.isProduction` (set by the server) to suppress debug logs. This is separate from Angular's `environment.production` flag.

---

## 17. Local Setup Guide

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20.19.0 (managed via nvs; current pin 20.20.1) |
| npm | 10.x |
| Angular CLI | 20.x (`@angular/build:application` esbuild builder) |
| Git | any |

### Steps

```bash
# 1. Clone
git clone <repo-url>
cd sunbird-cb-orgportal

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure the dev proxy
# Edit proxy/localhost.proxy.json
# Update the "Cookie" value with connect.sid from the staging site:
#   1. Open https://org-sphere.aastrika.org in your browser
#   2. Log in
#   3. Open DevTools → Application → Cookies → copy connect.sid value

# 4. Start dev server
npm start   # runs: ng serve --proxy-config proxy/localhost.proxy.json

# 5. Open browser
# http://localhost:4200
```

### Serving with a Specific Environment

```bash
# Development (default)
ng serve --proxy-config proxy/localhost.proxy.json

# Production build (outputs to dist/www/en)
npm run build   # runs: ng build --configuration=production
```

### Understanding the Environment at Runtime

At startup, the server injects `window.env` into `index.html`:

```html
<script>
  window.env = {
    sitePath: "/org-sphere",
    portalRoles: "MDO_ADMIN,ORG_ADMIN,....."
  }
</script>
```

Angular's `environment.ts` reads from this object. This means the same compiled bundle works across dev/preprod/prod — no rebuild needed for environment changes.

---

## 18. How to Add a New Feature

Example: adding a **Training Calendar** feature.

### Step 1 — Create the feature library module

```
project/ws/app/src/lib/routes/
└── training-calendar/
    ├── training-calendar.module.ts
    ├── training-calendar-routing.module.ts
    ├── pages/
    │   ├── calendar-view/
    │   └── add-event/
    ├── services/
    │   └── training-calendar-api.service.ts
    ├── models/
    │   └── training-event.model.ts
    └── constants/
        └── training-calendar.constants.ts
```

### Step 2 — Define feature routes

```typescript
// training-calendar-routing.module.ts
export const TRAINING_CALENDAR_ROUTES: Routes = [
  { path: '',        redirectTo: 'calendar', pathMatch: 'full' },
  { path: 'calendar', component: CalendarViewComponent },
  { path: 'add-event', component: AddEventComponent },
]
```

### Step 3 — Create the wiring module in `src/app/routes/`

```typescript
// src/app/routes/route-training-calendar.module.ts
@NgModule({
  imports: [
    TrainingCalendarModule,
    RouterModule.forChild(TRAINING_CALENDAR_ROUTES)
  ]
})
export class RouteTrainingCalendarModule {}
```

### Step 4 — Register the lazy route in app-routing

```typescript
// src/app/app-routing.module.ts
{
  path: 'training-calendar',
  loadChildren: () =>
    import('./routes/route-training-calendar.module')
    .then(m => m.RouteTrainingCalendarModule),
  canActivate: [GeneralGuard],
  data: {
    requiredRoles: ['MDO_ADMIN'],   // restrict to admins
    feature: 'trainingCalendar',    // matches feature flag key in features.config.json
  }
}
```

### Step 5 — Create the API service

```typescript
// training-calendar-api.service.ts
@Injectable({ providedIn: 'root' })
export class TrainingCalendarApiService {
  private http = inject(HttpClient)

  getEvents(orgId: string) {
    return this.http.post<EventResponse>(
      '/apis/proxies/v8/training/events/search',
      { request: { filters: { orgId } } }
    )
  }

  createEvent(event: TrainingEvent) {
    return this.http.post('/apis/protected/v8/training/events/create', event)
  }
}
// Note: AppInterceptorService will automatically add org/locale/auth headers
```

### Step 6 — Follow the pattern from PlaylistStateService

If your feature has multi-page flow, create a `training-calendar-state.service.ts` with `BehaviorSubject` fields for cross-page data (no need for NgRx for simple flows).

### Step 7 — Add navigation entry

Add a menu item in the home sidebar navigation config so users can reach the feature.

---

## Quick Reference Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                   MDO-Fusion: Key Facts                          │
│                                                                 │
│  Angular 20 SPA  │  Keycloak Auth  │  NgModule-based, RxJS-driven state │
│                                                                 │
│  App starts: InitService → /api/user/v2/read → Keycloak        │
│  Guard order: invalid-user → TNC → deleted → roles → features  │
│  HTTP: AppInterceptor adds org/locale headers; 419 → re-login  │
│  Retry: 5xx only, 1 retry, 5s delay                            │
│                                                                 │
│  Two-layer arch: src/app/ (shell) + project/ws/app/ (libs)     │
│  Features are lazy-loaded, role-gated, feature-flag-gated      │
│                                                                 │
│  Playlist flow:                                                 │
│    Filters → Summary → [Select → Order] → Save                 │
│    State: PlaylistStateService (BehaviorSubjects + caches)     │
│    Competency match: by CODE (not id) for resilience           │
│    Update: non-destructive (merge.utils preserves all data)    │
│    Save: role comparison → confirm dialog → create/update API  │
│                                                                 │
│  Proxy: /apis/* → org-sphere.aastrika.org (dev only)          │
│  Env: window.env injected at runtime (no rebuild for envs)     │
│  PWA: SwUpdate checks for new version every 6 hours            │
│                                                                 │
│  ⚠️  restrictedFeatures/Widgets = ALLOWED (confusing name)     │
│  ⚠️  window.isProduction controls playlist debug logging       │
└─────────────────────────────────────────────────────────────────┘
```

---

*Branch: fix/mergeng21Sonar | Last updated: 2026-08-17*
