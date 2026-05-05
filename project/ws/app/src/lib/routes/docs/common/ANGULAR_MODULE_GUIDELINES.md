# Angular Module Engineering Guidelines

**Version:** 1.0
**Scope:** All new feature modules under `project/ws/app/src/lib/routes/`
**Stack:** Angular 16 · RxJS 6.5.x · Angular Material MDC · Angular CDK · TypeScript 4.9

This document is the single source of truth for writing new Angular modules in this codebase. Every new module, page, component, service, and model must follow these rules. When there is a conflict with older module patterns, this document takes precedence for new code.

---

## Table of Contents

1. [Package Version Constraints](#1-package-version-constraints)
2. [Folder Structure](#2-folder-structure)
3. [Core Design Principles](#3-core-design-principles)
4. [Component Rules](#4-component-rules)
5. [Service Rules](#5-service-rules)
6. [State Management Rules](#6-state-management-rules)
7. [Forms Rules](#7-forms-rules)
8. [Routing Rules](#8-routing-rules)
9. [RxJS Rules](#9-rxjs-rules)
10. [Typing Rules](#10-typing-rules)
11. [Constants and Config Rules](#11-constants-and-config-rules)
12. [Styling Rules](#12-styling-rules)
13. [Shared / Common Module Plan](#13-shared--common-module-plan)
14. [Logging Rules](#14-logging-rules)
15. [File Size Rules](#15-file-size-rules)
16. [JSDoc Rules](#16-jsdoc-rules)
17. [Testing Rules](#17-testing-rules)
18. [PR Checklist](#18-pr-checklist)
19. [Anti-Patterns](#19-anti-patterns)
20. [Definition of Done](#20-definition-of-done)

---

## 1. Package Version Constraints

These are fixed for the project. Never assume a newer API is available.

| Package | Version | Critical Constraint |
|---|---|---|
| `@angular/core` | `^16.2.12` | Signals, `inject()`, `takeUntilDestroyed` available |
| `@angular/cdk` | `^16.2.14` | DragDrop, Overlay, Portal, SelectionModel |
| `@angular/material` | `^16.2.14` | MDC-based only — no legacy imports |
| `rxjs` | `~6.5.4` | **`firstValueFrom` / `lastValueFrom` are NOT available** |
| `typescript` | `^4.9.3` | No TS 5.x features |
| `zone.js` | `~0.13.3` | |

**Do not use `firstValueFrom` or `lastValueFrom`** — they require RxJS 7.
Use `.pipe(take(1)).toPromise()` for all Observable → Promise bridges.

---

## 2. Folder Structure

Every new feature module must use this structure exactly:

```
routes/
└── my-feature/
    ├── components/          # Reusable UI blocks (no routing logic here)
    │   └── my-widget/
    │       ├── my-widget.component.ts
    │       ├── my-widget.component.html
    │       ├── my-widget.component.scss
    │       └── my-widget.component.spec.ts
    ├── pages/               # Route-level containers (one per route)
    │   └── my-page/
    │       ├── my-page.component.ts
    │       ├── my-page.component.html
    │       └── my-page.component.scss
    ├── services/            # API calls + workflow orchestration
    │   ├── my-feature-api.service.ts
    │   └── my-feature-state.service.ts
    ├── models/              # Interfaces, types, enums only
    │   └── my-feature.model.ts
    ├── constants/           # All hardcoded values live here
    │   └── my-feature.constants.ts
    ├── utils/               # Pure transformation helpers
    │   └── my-feature.utils.ts
    ├── pipes/               # Presentation-only transforms
    │   └── my-feature.pipe.ts
    ├── config/              # Feature-level config values (if needed)
    │   └── my-feature.config.ts
    ├── docs/                # PRD, README for the module
    │   └── README.md
    └── my-feature.routes.ts # Route definitions only
```

**Rules:**
- `pages/` components own routing and page-level composition only.
- `components/` holds every reusable block that appears in 2+ pages.
- `services/` holds everything that talks to an API or manages shared state.
- `utils/` holds pure functions with zero side effects.
- `constants/` holds all magic values — never inline them.

---

## 3. Core Design Principles

### 3.1 Config-first

Every value that can change per client or per environment lives in `constants/` or `config/`.

**Never hardcode in component or service:**
- API endpoint paths
- Route strings
- Debounce durations (e.g. `300`)
- Timeout values (e.g. `20000`)
- Dialog dimensions (e.g. `'400px'`)
- Pagination limits (e.g. `9999`)
- Shimmer row counts
- Language lists

```ts
// ✅ constants/my-feature.constants.ts
export const MY_FEATURE = {
  API: {
    BASE: '/apis/protected/v8/my-feature',
    SEARCH_LIMIT: 100,
  },
  UI: {
    DIALOG_WIDTH: '480px',
    SHIMMER_ROWS: 8,
    SEARCH_DEBOUNCE_MS: 300,
  },
  ROUTES: {
    FILTERS: '/app/home/my-feature/filters',
    SUMMARY: '/app/home/my-feature/summary',
  },
} as const

// ✅ In service
private readonly BASE = MY_FEATURE.API.BASE

// ❌ Never do this
this.http.get('/apis/protected/v8/my-feature')
this.router.navigate(['/app/home/my-feature/filters'])
```

### 3.2 Single Responsibility

| Layer | Owns |
|---|---|
| Page component | Route state, page composition, user events |
| Shared component | Isolated UI behavior, `@Input`/`@Output` contracts |
| API service | HTTP requests and response parsing |
| State service | Shared in-memory workflow state |
| Utils | Pure data transformation functions |
| Models | TypeScript interfaces and types only |
| Constants | Primitive values and enums |

If a file does more than one job from the table above, split it.

### 3.3 Keep It Simple

- Prefer clear code over clever code.
- Avoid nested conditions beyond 3 levels. Use early returns.
- Avoid one-liner chains that require explanation to read.
- A new developer should understand any method in one read.

---

## 4. Component Rules

### 4.1 Required Skeleton

Every new component must follow this shape:

```ts
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-my-component',
  standalone: true,
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ...],
})
export class MyComponent {
  // 1. Injected deps
  private readonly myService = inject(MyService)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  // 2. Signals — local UI state
  readonly loading = signal(false)
  readonly errorMessage = signal('')

  // 3. Computed — derived state
  readonly canSave = computed(() => !this.loading() && this.selectedItems().length > 0)

  // 4. Methods
}
```

### 4.2 Signals for Local State

Use `signal()` for all mutable local UI state. Use `computed()` for derived values. Do not use plain class fields for state that drives the template.

```ts
// ✅
readonly saving = signal(false)
readonly isFormValid = computed(() => this.filterForm.valid && !this.saving())

// ❌
saving = false
get isFormValid() { return this.filterForm.valid && !this.saving }
```

### 4.3 Template Rules

- No complex expressions in templates. Move logic to typed getters or `computed()`.
- No `async` pipe in new standalone components. Use `toSignal()` instead.
- All signal reads in templates must use `()` call syntax.

```html
<!-- ✅ -->
<button [disabled]="!canSave()">Save</button>
<div *ngIf="loading()">...</div>

<!-- ❌ -->
<button [disabled]="!(filterForm.valid && !saving && selectedItems.length > 0)">Save</button>
```

### 4.4 Page Component Size

- Hard limit: **500 lines** per `.ts` file.
- Preferred: below **350 lines**.
- If exceeded, extract reusable pieces to `components/` and heavy logic to `services/` or `utils/`.

### 4.5 Input/Output Typing

Always type `@Input()` and `@Output()`. Never use untyped `EventEmitter`.

```ts
// ✅
@Input({ required: true }) course!: Course
@Output() courseSelected = new EventEmitter<Course>()

// ❌
@Input() course: any
@Output() courseSelected = new EventEmitter()
```

---

## 5. Service Rules

### 5.1 API Services

- One service per API domain. Do not merge unrelated API calls into one service.
- All public methods must have typed request and response.
- API endpoint paths must be `private readonly` constants (not literals inside methods).
- Parse and shape API responses inside the service. Components must not know about raw API response shapes.

```ts
// ✅
@Injectable({ providedIn: 'root' })
export class MyApiService {
  private readonly http = inject(HttpClient)
  private readonly BASE = MY_FEATURE.API.BASE

  searchItems(filters: SearchFilters): Observable<SearchResult[]> {
    return this.http.post<RawApiResponse>(`${this.BASE}/search`, this.buildPayload(filters))
      .pipe(map(res => this.parseResponse(res)))
  }

  private buildPayload(filters: SearchFilters): SearchPayload { ... }
  private parseResponse(res: RawApiResponse): SearchResult[] { ... }
}
```

### 5.2 State Services

- One state service per workflow/feature.
- All write methods must be named `setX(value)` or `clearX()`.
- All reads are BehaviorSubject observables or getters — no direct property access.
- Always include `clearState()` that resets all subjects to initial values.

```ts
// ✅
private readonly _selectedItems = new BehaviorSubject<Item[]>([])
readonly selectedItems$ = this._selectedItems.asObservable()

setSelectedItems(items: Item[]): void {
  this._selectedItems.next(items)
}

clearState(): void {
  this._selectedItems.next([])
}
```

### 5.3 No Side Effects in Utils

Utils in `utils/` must be pure functions only:
- No HTTP calls
- No router navigation
- No dialog opens
- No state writes

---

## 6. State Management Rules

### 6.1 Workflow State

Use a dedicated `my-feature-state.service.ts` for all cross-page state in a multi-step workflow. Do not pass state via query params or `history.state` unless it is truly URL-shareable data.

### 6.2 Component Local State

Use `signal()` / `computed()` for state that does not need to persist across navigation.

### 6.3 Cache Management

If a service caches API data (e.g. language-specific courses), always include:
1. A cache key that includes all cache-busting dimensions (e.g. `${orgId}_${language}`)
2. An explicit `clearCache()` or `clearState()` method
3. Documentation of what invalidates the cache

---

## 7. Forms Rules

### 7.1 Typed Reactive Forms Only

All forms must use typed `FormGroup` with `NonNullableFormBuilder`.

```ts
// ✅
type MyForm = {
  name: FormControl<string>
  roles: FormControl<string[]>
}

this.form = this.fb.group<MyForm>({
  name: this.fb.control('', Validators.required),
  roles: this.fb.control([] as string[], this.nonEmptyArrayValidator),
})

// ❌
this.form = this.fb.group({
  name: [''],
  roles: [[]]
})
```

### 7.2 Custom Validators

Extract multi-use validators to `utils/` as pure functions. Inline validators are acceptable for single-use cases.

```ts
// utils/form-validators.ts
export function nonEmptyArray(control: AbstractControl): ValidationErrors | null {
  return Array.isArray(control.value) && control.value.length > 0
    ? null
    : { required: true }
}
```

### 7.3 Form-to-API Mapping

Convert `form.getRawValue()` to API contract shape at one place — the component method that calls the API. Do not scatter field mapping across multiple methods.

---

## 8. Routing Rules

### 8.1 Route File

Every module must define its routes in a single `my-feature.routes.ts` file. Export one or more named `Routes` constants.

```ts
// my-feature.routes.ts
export const MY_FEATURE_ROUTES: Routes = [
  {
    path: 'my-feature',
    children: [
      { path: 'filters', loadComponent: () => import('./pages/filters/filters.component').then(m => m.FiltersComponent) },
      { path: 'summary', loadComponent: () => import('./pages/summary/summary.component').then(m => m.SummaryComponent) },
    ]
  }
]
```

### 8.2 No NgModule Routing

Do not create `my-feature.module.ts` or `my-feature-routing.module.ts`. Angular 16 standalone routing with `loadComponent` is the only accepted pattern.

### 8.3 Route String Constants

Route paths used in `router.navigate()` must be in `constants/my-feature.constants.ts`, not inline strings.

---

## 9. RxJS Rules

### 9.1 Observable-to-Promise Bridge

**RxJS `~6.5.4` is installed. `firstValueFrom` and `lastValueFrom` do NOT exist.**

Always use:

```ts
// ✅ RxJS 6 compatible
const result = await this.api.search(filters).pipe(take(1)).toPromise()

// ❌ RxJS 7+ only — will fail at runtime
const result = await firstValueFrom(this.api.search(filters))
```

### 9.2 Long-lived Subscriptions

Use `takeUntilDestroyed` for any subscription inside a component that must be cleaned up when the component is destroyed.

```ts
this.state.items$.pipe(
  takeUntilDestroyed(this.destroyRef)
).subscribe(items => { ... })
```

### 9.3 Observable → Signal Binding (`toSignal`)

For observables that feed directly into the template, use `toSignal()` instead of `async` pipe or manual subscribe.

```ts
import { toSignal } from '@angular/core/rxjs-interop'

readonly organizations = toSignal(
  this.api.getOrganizations(),
  { initialValue: [] as OrgOption[] }
)
```

Rules for `toSignal`:
1. Always provide `initialValue` to keep the type non-nullable.
2. Must be called in an injection context (constructor or field initializer). Never inside `ngOnInit`, `ngOnChanges`, or event handlers.
3. Handle errors upstream with `catchError` before passing to `toSignal`.

### 9.4 Search Debounce

Every search input that triggers an API call must debounce using the constant value.

```ts
this.searchControl.valueChanges.pipe(
  debounceTime(MY_FEATURE.UI.SEARCH_DEBOUNCE_MS),
  takeUntilDestroyed(this.destroyRef)
).subscribe(term => this.loadResults(term))
```

---

## 10. Typing Rules

### 10.1 No `any` in New Code

- `any` is forbidden in new public service method signatures and model interfaces.
- In complex transformation functions where `any` is unavoidable (e.g. flexible JSON parsers), add a comment explaining why.
- Use `unknown` at external API boundaries and narrow immediately with a type guard.

```ts
// ✅
function parseApiResponse(raw: unknown): SearchResult[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isValidResult)
}

// ❌
function parseApiResponse(raw: any): any[] {
  return raw.map((x: any) => x)
}
```

### 10.2 Event Handlers

Never use `any` for event handler parameters. Use the specific DOM event type or Angular event type.

```ts
// ✅
onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
}

// ❌
onInput(event: any): void {
  const value = event.target.value
}
```

### 10.3 API Response Types

Define an interface for every API response shape in `models/`. Never rely on `Record<string, any>` or `object` for API responses that will be consumed in business logic.

---

## 11. Constants and Config Rules

### 11.1 Constants File Template

```ts
// constants/my-feature.constants.ts

export const MY_FEATURE = {
  API: {
    BASE: '/apis/protected/v8/my-feature',
    ORG_SEARCH_LIMIT: 100,
  },
  UI: {
    DIALOG_WIDTH: '480px',
    SHIMMER_ROWS: 8,
    SEARCH_DEBOUNCE_MS: 300,
    FOCUS_DELAY_MS: 50,
  },
  ROUTES: {
    HOME_FILTERS: '/app/home/my-feature/filters',
    HOME_SUMMARY: '/app/home/my-feature/summary',
    SELECT: '/app/my-feature/select',
    MANAGE_ORDER: '/app/my-feature/manage-order',
  },
} as const
```

### 11.2 Config File Template (for feature-level tuneable values)

```ts
// config/my-feature.config.ts

export interface MyFeatureConfig {
  maxSelectable: number
  defaultLanguage: string
  supportedLanguages: { value: string; label: string }[]
}

export const MY_FEATURE_DEFAULTS: MyFeatureConfig = {
  maxSelectable: 20,
  defaultLanguage: 'en',
  supportedLanguages: [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
  ],
}

/**
 * Returns config merged with any client overrides.
 * @param overrides Partial client config to merge.
 */
export function resolveConfig(overrides?: Partial<MyFeatureConfig>): MyFeatureConfig {
  return { ...MY_FEATURE_DEFAULTS, ...overrides }
}
```

---

## 12. Styling Rules

### 12.1 Scoping

- Use `ViewEncapsulation.Emulated` (default) unless the component styles need to pierce child components.
- Use `::ng-deep` only when targeting Angular Material internal elements and only within a scoped host selector.

```scss
// ✅ Scoped ng-deep
:host ::ng-deep .mat-mdc-form-field { ... }

// ❌ Global ng-deep
::ng-deep .mat-mdc-form-field { ... }
```

### 12.2 No Legacy Material Classes

Target only MDC-based classes: `mat-mdc-*`, `mdc-*`. Never add styles targeting old `.mat-form-field`, `.mat-select-panel`, or `.mat-option` (pre-MDC).

### 12.3 Design Tokens

Use the established color palette. Do not introduce new brand colors inline:

| Token | Value | Usage |
|---|---|---|
| Primary blue | `#1C5D95` | Buttons, active states, borders |
| Primary hover | `#164d7a` | Button hover |
| Light blue bg | `#DFEDF9` | Card headers, highlights |
| Subtle blue bg | `#EFF6FC` | Page top bars |
| Disabled | `#BFBFBF` / `#808080` | Disabled buttons |
| Border | `#E1DFDF` | Cards, tables, inputs |
| Error | `#d32f2f` | Error messages |

### 12.4 Shimmer Pattern

Use the standard shimmer animation for loading states. Copy from the shared location (see Section 13) instead of duplicating.

```scss
.shimmer-box {
  border-radius: 3px;
  background: linear-gradient(90deg, #e9eff6 25%, #dfe8f3 37%, #e9eff6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
```

---

## 13. Shared / Common Module Plan

The following UI blocks are used in 2+ existing modules (frac, playlist). They must be extracted to a shared library rather than duplicated.

### 13.1 Components to Extract → `shared/components/`

| Component | Description | Used In |
|---|---|---|
| `ShimmerTableRowsComponent` | Renders N shimmer rows inside a `<tbody>` | frac, playlist |
| `EmptyStateCardComponent` | Dashed-border card with icon, title, message | frac, playlist |
| `BackNavButtonComponent` | Pill back button with arrow icon | playlist (2 pages) |
| `SearchWrapperComponent` | Pill search input with magnifier icon | playlist (2 pages) |
| `PillButtonComponent` | Rounded action button (primary/disabled states) | playlist, frac |
| `ConfirmDialogComponent` | Generic confirmation dialog | playlist, frac |
| `ErrorDialogComponent` | Generic error dialog with message | playlist |
| `SuccessDialogComponent` | Generic success dialog | playlist |

### 13.2 Extracting a Shared Component

When extracting, follow this pattern:

```ts
// shared/components/empty-state-card/empty-state-card.component.ts

@Component({
  selector: 'app-empty-state-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `...`,
  styles: [`...`]
})
export class EmptyStateCardComponent {
  @Input({ required: true }) icon!: string          // mat-icon name
  @Input({ required: true }) title!: string
  @Input() message = ''
}
```

Usage from any module:

```html
<app-empty-state-card
  icon="search_off"
  title="No results found"
  message="Try changing your search or filters.">
</app-empty-state-card>
```

### 13.3 Shared Utils to Extract → `shared/utils/`

| Utility | Description |
|---|---|
| `timeAgo(date: Date): string` | Human-readable time diff |
| `nonEmptyArrayValidator` | Reactive form validator for required arrays |
| `shimmerRows(count: number)` | Returns `Array(count).fill(0)` with typed constant |
| `safeJson(value: unknown): string` | JSON.stringify with fallback for error logging |

### 13.4 When to Use Shared vs Local

| Scenario | Use |
|---|---|
| Same component in 2+ modules | Move to `shared/components/` |
| Same util function in 2+ files | Move to `shared/utils/` |
| Unique to one module | Keep in module's own `components/` or `utils/` |
| Will be used only once and is trivial | Inline is acceptable |

**Do not prematurely abstract.** Only move to shared when second usage exists or is confirmed in planning.

---

## 14. Logging Rules

### 14.1 No Direct `console.*`

Do not use `console.log`, `console.warn`, or `console.error` in pages, components, or services for new code.

Use the application's logger utility (or create one if it does not exist for the module).

```ts
// ✅
this.logger.error('Failed to load courses', { error, context: 'SelectCoursesComponent' })

// ❌
console.error('Failed to load courses', error)
```

### 14.2 Temporary Debug Logging

If you add `console.*` during development, remove it before raising the PR. The PR checklist item will catch it.

---

## 15. File Size Rules

| File type | Hard limit | Preferred |
|---|---|---|
| Page component `.ts` | 500 lines | < 350 lines |
| Shared component `.ts` | 300 lines | < 200 lines |
| Service `.ts` | 400 lines | < 300 lines |
| Utils `.ts` | 600 lines | < 400 lines |
| Model `.ts` | No limit | Keep one domain per file |

**If a file exceeds the limit:**
1. Extract pure helpers to `utils/`.
2. Extract shared orchestration to a service.
3. Split large page into sub-components in `components/`.

---

## 16. JSDoc Rules

Add JSDoc for any method whose behavior is not obvious from its name alone.

### 16.1 Template

```ts
/**
 * What this method does in plain words.
 * @param x Short description of the input.
 * @returns What it returns (omit if void and the name is clear).
 * Side effects: navigation / API call / dialog open / state write (list only what applies).
 */
```

### 16.2 Rules

1. Max 4-6 lines for normal methods.
2. Plain English only. No technical jargon unless required.
3. Do not describe what the code does line by line.
4. Do not add JSDoc to simple getters or obvious one-liners.
5. Always document side effects (API calls, navigation, dialog, state mutation).

### 16.3 Examples

```ts
// ✅ Good JSDoc
/**
 * Loads course list from API and updates the component table.
 * @param page Zero-based page index to load.
 * Side effects: sets loading signal, calls course API, updates courses signal.
 */
loadCourses(page: number): void { ... }

// ❌ Bad JSDoc (obvious restatement of code)
/**
 * Sets loading to true, calls the courses API endpoint with the given page number,
 * then maps the response using the parseCourse helper and sets the courses array.
 */
loadCourses(page: number): void { ... }
```

---

## 17. Testing Rules

Every module must include tests for the following critical paths at minimum:

### 17.1 Service Tests

- API method builds correct payload for known inputs.
- API response is parsed into the correct typed output.
- Empty/null/malformed API response does not throw; returns safe default.

### 17.2 Component Tests

- Loading state shows shimmer; loaded state shows data.
- Empty state card shows when data is empty.
- Save/submit button is disabled until required fields are filled.
- Navigation fires correct route after successful submit.

### 17.3 State Service Tests

- State is set correctly via `setX()`.
- `clearState()` resets all fields to initial values.

### 17.4 Test Style

- Test names must be action-oriented: `should show shimmer rows while loading`.
- Test behavior, not implementation details.
- Do not test that a private method was called. Test observable outcomes.

---

## 18. PR Checklist

Paste this in every PR description for a new or modified module:

```
## Angular Module Checklist

### Typing
- [ ] No new `any` in public service/model signatures
- [ ] Event handlers use specific DOM types, not `any`
- [ ] All API response shapes have interfaces in models/

### Component
- [ ] Standalone: true on all new components
- [ ] ChangeDetectionStrategy.OnPush on all new components
- [ ] Local state uses signal() / computed()
- [ ] No async pipe in new components (use toSignal())
- [ ] Template has no complex expressions (moved to getters)

### RxJS
- [ ] Live subscriptions use takeUntilDestroyed
- [ ] Observable-to-Promise uses .pipe(take(1)).toPromise() — no firstValueFrom
- [ ] Search input uses debounceTime with constant value

### Constants
- [ ] No hardcoded route strings in components/services
- [ ] No magic numbers inline (dialog size, debounce, limit, timeout)
- [ ] New constants added to constants/ file

### Services
- [ ] API paths are readonly constants, not inline strings
- [ ] Response parsing happens inside service, not component
- [ ] clearState() covers any new state fields added

### Routing
- [ ] Routes defined only in my-feature.routes.ts
- [ ] No new NgModule created for routing
- [ ] Lazy loading via loadComponent

### Styling
- [ ] No global ::ng-deep (must be scoped to :host)
- [ ] No legacy mat-* CSS selectors (use mat-mdc-*)
- [ ] No new brand colors (use design token values)

### Code Quality
- [ ] No direct console.* in components/services
- [ ] No file exceeds 500 lines
- [ ] Reusable UI blocks are in components/ (not duplicated across pages)
- [ ] JSDoc added for all non-trivial methods

### Testing
- [ ] Loading state behavior tested
- [ ] Empty state behavior tested
- [ ] Save/submit guard behavior tested
- [ ] State service set/clear behavior tested
```

---

## 19. Anti-Patterns

Never introduce these into new code:

| Anti-Pattern | Why | What to Do Instead |
|---|---|---|
| `any` in service method signatures | Breaks type safety, hides bugs | Define interface for request/response |
| Inline route strings in components | Breaks refactoring | Use `CONSTANTS.ROUTES.*` |
| Magic numbers inline (timeouts, limits, sizes) | Unreadable, hard to tune | Move to `constants/` |
| `console.error/log/warn` in components/services | Not guarded, leaks in prod | Use app logger utility |
| `.toPromise()` without `take(1)` | Unbounded subscription | `.pipe(take(1)).toPromise()` |
| `firstValueFrom` | RxJS 7+ only | `.pipe(take(1)).toPromise()` |
| `async` pipe in new components | Not signal-aware | `toSignal()` |
| `toSignal()` inside `ngOnInit` or handlers | Must be in injection context | Move to field initializer |
| Duplicating shimmer/empty-state code | Maintenance burden | Use shared components (see §13) |
| NgModule for new routing | Legacy pattern | Standalone + `loadComponent` |
| `MatLegacy*` imports | Deprecated | Use MDC Material imports |
| `::ng-deep` without `:host` scope | Styles leak globally | Always prefix with `:host ::ng-deep` |
| API payload building in template components | Couples UI to API | Move to service or adapter |
| God component > 500 lines | Hard to test and read | Split into pages + components + services |
| `districts = []` untyped array | Weak typing | `districts: DistrictOption[] = []` |
| `window.location` forced reload as routing hack | Hides real routing bug | Fix the root routing issue |

---

## 20. Definition of Done

A feature module is **done** only when all of the following are true:

1. Folder structure matches §2.
2. All constants are in `constants/` — no magic values inline.
3. All models have typed interfaces — no `any` in public contracts.
4. All components are `standalone: true` + `OnPush`.
5. All signals are used for local UI state; no mutable primitive fields driving the template.
6. RxJS bridges use `.pipe(take(1)).toPromise()` — no `firstValueFrom`.
7. No file exceeds 500 lines.
8. Reusable UI blocks live in `components/` (or `shared/` if used cross-module).
9. JSDoc is present for all non-trivial service and component methods.
10. No `console.*` calls remain.
11. PR checklist (§18) is fully checked.
12. Critical path tests are written and passing.

---

*Maintained by the platform engineering team. Update this document when package versions change, new shared components are created, or routing strategy changes.*
