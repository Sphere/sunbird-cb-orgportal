# Playlist Module — Angular 16 Modernization Migration

This document records the seven pull requests that modernized the playlist module
after it was introduced. Each section covers motivation, the precise change made,
before/after code examples drawn from the actual files, and the list of affected
files.

---

## Summary Table

| PR | Title | Key Pattern | Files Touched |
|----|-------|-------------|---------------|
| PR-1 | Subscription lifecycle cleanup | `DestroyRef` + `takeUntilDestroyed` | 4 page components |
| PR-2 | RxJS `.toPromise()` safety | `.pipe(take(1)).toPromise()` | `manage-course-order`, `manage-competency-order`, `course-api.service` |
| PR-3 | Typed reactive forms | `NonNullableFormBuilder` + `FormGroup<FilterForm>` | `playlist-filters` (.ts + .html) |
| PR-4 | Signals and computed for UI state | `signal()` / `computed()` | 4 page components + templates |
| PR-5 | `ChangeDetectionStrategy.OnPush` | `OnPush` on all page components | 5 page components + templates |
| PR-6 | Standalone components | `standalone: true` on all 9 components | All 9 components, `PlaylistModule`, `RoutePlaylistStandaloneModule` |
| PR-7 | Dead code cleanup | Deleted `playlist-shared.module.ts`; `playlist-summary` gains `OnPush` | `playlist-summary`, deleted shared module |

---

## PR-1 — Subscription Lifecycle Cleanup

### Motivation

All four screen components managed RxJS subscriptions with a `Subject` + `takeUntil`
pattern tied to `ngOnDestroy`. This required boilerplate in every component and was
error-prone: if a developer forgot to call `this.destroy$.next()` in `ngOnDestroy`,
subscriptions leaked.

Angular 16 introduced `DestroyRef` and the `takeUntilDestroyed` interop helper,
which replaces the pattern with a single `inject(DestroyRef)` call and a pipe
operator.

### What Changed

- `DestroyRef` injected via `inject()` as a `private readonly` class field.
- `takeUntilDestroyed(this.destroyRef)` replaces `takeUntil(this.destroy$)` in
  every `.pipe()`.
- The `Subject<void> destroy$` field and the `ngOnDestroy` lifecycle hook were
  deleted from all four components.

### Before

```typescript
// Old pattern (each of the four page components)
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

export class SelectCoursesComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>()

    ngOnDestroy(): void {
        this.destroy$.next()
        this.destroy$.complete()
    }

    private setupPaginatorSubscription(): void {
        this.paginator.page
            .pipe(takeUntil(this.destroy$))
            .subscribe(pageEvent => { ... })
    }
}
```

### After

```typescript
// New pattern — select-courses.component.ts (line 1, 44, 71)
import { DestroyRef, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

export class SelectCoursesComponent implements OnInit, AfterViewInit {
    private readonly destroyRef = inject(DestroyRef)

    private setupPaginatorSubscription(): void {
        this.paginator.page
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(pageEvent => { ... })
    }
    // ngOnDestroy and destroy$ are gone
}
```

### Files Affected

| File | Change |
|------|--------|
| `pages/select-courses/select-courses.component.ts` | Removed `destroy$`/`ngOnDestroy`; added `destroyRef`; `takeUntilDestroyed` on paginator subscription (line 71) |
| `pages/select-competencies/select-competencies.component.ts` | Same; `takeUntilDestroyed` on paginator (line 70) and API observable (line 97) |
| `pages/manage-course-order/manage-course-order.component.ts` | Same; `takeUntilDestroyed` on `afterClosed()` subscriptions (lines 218, 252) |
| `pages/manage-competency-order/manage-competency-order.component.ts` | Same; `takeUntilDestroyed` on save and auto-save subscriptions (lines 409, 476) |

---

## PR-2 — RxJS `.toPromise()` Safety

### Motivation

`.toPromise()` resolves only when the source observable **completes**. Several
observables in the codebase — notably `MatDialog.afterClosed()` and HTTP calls
wrapped with `catchError` — are `Subject`-based streams or cold observables that
can stay open indefinitely. Calling `.toPromise()` on them without a completion
boundary means the promise may never settle.

The safe fix is `.pipe(take(1)).toPromise()`, which forces the observable to
complete after the first emission. RxJS was kept at `~6.5.x`; no upgrade was
required.

### What Changed

- Every `.toPromise()` call is now preceded by `.pipe(take(1))`.
- `MatDialog.afterClosed()` was the critical case: it is a `Subject` that emits
  once when the dialog closes but never calls `complete()`. Without `take(1)` the
  `await` would hang forever.
- `import { take } from 'rxjs/operators'` was added to affected files.

### Before

```typescript
// manage-course-order.component.ts — old (would hang if dialog never re-emits)
const confirmed = await dialogRef.afterClosed().toPromise()

await this.playlistApi.savePlaylist(...).toPromise()
```

### After

```typescript
// manage-course-order.component.ts (lines 162, 189, 198)
import { take } from 'rxjs/operators'

const confirmed = await dialogRef.afterClosed().pipe(take(1)).toPromise()

await this.playlistApi.savePlaylist(...).pipe(take(1)).toPromise()

const freshPlaylists = await this.playlistApi.searchPlaylist(...)
    .pipe(take(1)).toPromise()
```

```typescript
// manage-competency-order.component.ts (lines 162, 383)
const response = await this.courseApi.searchCoursesByCompetency(...)
    .pipe(take(1)).toPromise()

const confirmed = await dialogRef.afterClosed().pipe(take(1)).toPromise()
```

### Files Affected

| File | `.toPromise()` call sites patched |
|------|-----------------------------------|
| `pages/manage-course-order/manage-course-order.component.ts` | `afterClosed()` (line 162), `savePlaylist` (line 189), `searchPlaylist` re-fetch (line 198) |
| `pages/manage-competency-order/manage-competency-order.component.ts` | `searchCoursesByCompetency` (line 162), `afterClosed()` (line 383) |
| `services/course-api.service.ts` | Internal `.toPromise()` calls in `loadAllCourses` |

---

## PR-3 — Typed Reactive Forms (`NonNullableFormBuilder`)

### Motivation

The filter form used the untyped `FormBuilder` / `FormGroup`, which causes every
`.value` access to return `Partial<T>` (all fields possibly `undefined`). This
produced two concrete bugs:

1. `role` was inferred as `never[]` because TypeScript could not resolve its type
   without an explicit generic.
2. `filterForm.value.district` had type `string | undefined` but the `PlaylistFilters`
   model expected `string[] | undefined`, so `patchValue` assigned the wrong shape.

`NonNullableFormBuilder` combined with an explicit `FormGroup<FilterForm>` type
alias resolves both issues at compile time.

### What Changed

- Introduced `FilterForm` type alias mapping each key to `FormControl<T>` with
  concrete generics.
- `FormBuilder` replaced with `NonNullableFormBuilder` in the constructor.
- `this.fb.group<FilterForm>(...)` with explicit per-field controls replaces the
  old untyped `this.fb.group({...})`.
- `role` control uses `this.fb.control<string[]>([])` to avoid the `never[]`
  inference bug.
- All reads of form values switch from `this.filterForm.value` to
  `this.filterForm.getRawValue()`, which guarantees non-null, non-partial types
  even when controls are disabled.
- `patchValue` for `district` corrected: the state model stores `district` as
  `string[]` but the form control is `FormControl<string>` (a single select),
  so the patch uses `previousFilters.district?.[0] ?? ''`.
- The `ngModel` two-way binding on the org-search input inside the reactive form
  was replaced with `[value]="orgSearchTerm"` + `(input)="orgSearchTerm = ..."`,
  eliminating the mixed-form-type warning Angular emits when `ngModel` and
  `ReactiveFormsModule` are used together on the same element.

### Before

```typescript
// Old (untyped)
import { FormBuilder, FormGroup } from '@angular/forms'

export class PlaylistFiltersComponent {
    filterForm!: FormGroup

    constructor(private fb: FormBuilder) {}

    private initForm(): void {
        this.filterForm = this.fb.group({
            orgId: ['', Validators.required],
            role: [[]],           // inferred as never[]
            district: [''],
            block: [''],
            language: ['', Validators.required],
        })
    }

    async onContinue(): Promise<void> {
        const v = this.filterForm.value   // Partial<{orgId?: string, role?: never[], ...}>
        const filters = { orgId: v.orgId!, role: v.role! }
    }

    private loadPreviousFilters(): void {
        this.filterForm.patchValue({
            district: previousFilters.district,  // wrong: string[] assigned to string control
        })
    }
}
```

### After

```typescript
// playlist-filters.component.ts (lines 14-29, 63, 117-124, 132-138, 151)
import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms'

type FilterForm = {
    orgId:    FormControl<string>
    role:     FormControl<string[]>
    district: FormControl<string>
    block:    FormControl<string>
    language: FormControl<string>
}

export class PlaylistFiltersComponent {
    filterForm!: FormGroup<FilterForm>

    constructor(private fb: NonNullableFormBuilder) {}

    private initForm(): void {
        this.filterForm = this.fb.group<FilterForm>({
            orgId:    this.fb.control('', Validators.required),
            role:     this.fb.control<string[]>([], Validators.required),
            district: this.fb.control(''),
            block:    this.fb.control(''),
            language: this.fb.control('', Validators.required),
        })
    }

    async onContinue(): Promise<void> {
        const rawValue = this.filterForm.getRawValue()  // fully typed, no Partial
        const filters: PlaylistFilters = {
            orgId:    rawValue.orgId,
            role:     rawValue.role,
            district: rawValue.district ? [rawValue.district] : undefined,
            language: rawValue.language,
        }
    }

    private loadPreviousFilters(): void {
        this.filterForm.patchValue({
            district: previousFilters.district?.[0] ?? '',  // string[], take first element
        })
    }
}
```

### Files Affected

| File | Change |
|------|--------|
| `pages/playlist-filters/playlist-filters.component.ts` | `FilterForm` type alias; `NonNullableFormBuilder`; `getRawValue()`; district patch fix |
| `pages/playlist-filters/playlist-filters.component.html` | org-search `ngModel` replaced with `[value]` + `(input)` |

---

## PR-4 — Signals and Computed for UI State

### Motivation

UI flags like `loading: boolean`, `saving: boolean`, and derived predicates like
`get isNextEnabled()` were plain class fields or getters. Angular's change
detection (still `Default` at this point) had to dirty-check these on every cycle.
More critically, boolean flags mutated inside `async`/`subscribe` callbacks are
invisible to `OnPush` change detection (introduced in PR-5), which only triggers
on input reference changes or explicit `markForCheck()`.

`signal()` and `computed()` introduced in Angular 16 integrate with the reactive
graph so the view updates automatically whenever a signal's value changes, with
zero extra CD boilerplate.

### What Changed

Each component gained specific signals and computed signals:

#### `select-courses.component.ts`

```typescript
// Before
loading = false
get isNextEnabled(): boolean { return this.selection.selected.length > 0 }

// After (lines 40-42)
readonly loading = signal(false)
readonly searchTerm = signal('')
readonly isNextEnabled = computed(() => this.selection.selected.length > 0)
```

Template: `*ngIf="loading"` → `*ngIf="loading()"`;
search input: `[(ngModel)]="searchTerm"` → `[value]="searchTerm()"` +
`(input)="searchTerm.set($event.target.value)"`.

#### `select-competencies.component.ts`

```typescript
// Before
loading = false
get hasSelection(): boolean { return this.selection.selected.length > 0 }

// After (lines 39-41)
readonly loading = signal(false)
readonly searchTerm = signal('')
readonly hasSelection = computed(() => this.selection.selected.length > 0)
```

#### `manage-course-order.component.ts`

```typescript
// Before
saving = false
get isSaveEnabled(): boolean { return this.orderedCourses.length > 0 && !this.saving }

// After (lines 35-37)
readonly saving = signal(false)
readonly searchTerm = signal('')
readonly isSaveEnabled = computed(() => this.orderedCourses.length > 0 && !this.saving())
```

Template: `[disabled]="!isSaveEnabled"` → `[disabled]="!isSaveEnabled()"`;
`saving` → `saving()`.

#### `manage-competency-order.component.ts`

```typescript
// Before
saving = false
autoSaving = false
loadingCourses = false
get allCompetenciesComplete(): boolean {
    return this.competencies.length > 0 &&
           this.competencies.every(c => this.isCompetencyComplete(c))
}

// After (lines 48-54)
readonly loadingCourses = signal(false)
readonly searchTerm = signal('')
readonly saving = signal(false)
readonly autoSaving = signal(false)
readonly allCompetenciesComplete = computed(() =>
    this.competencies.length > 0 &&
    this.competencies.every(c => this.isCompetencyComplete(c))
)
```

Internal uses of `this.autoSaving` / `this.saving` / `this.loadingCourses` were
updated to `.set()` and call-site reads updated to `()` invocations.

### Files Affected

| File | Signals Added | Computed Added |
|------|---------------|----------------|
| `pages/select-courses/select-courses.component.ts` | `loading`, `searchTerm` | `isNextEnabled` |
| `pages/select-courses/select-courses.component.html` | Template call-sites updated | — |
| `pages/select-competencies/select-competencies.component.ts` | `loading`, `searchTerm` | `hasSelection` |
| `pages/select-competencies/select-competencies.component.html` | Template call-sites updated | — |
| `pages/manage-course-order/manage-course-order.component.ts` | `saving`, `searchTerm` | `isSaveEnabled` |
| `pages/manage-course-order/manage-course-order.component.html` | Template call-sites updated | — |
| `pages/manage-competency-order/manage-competency-order.component.ts` | `saving`, `autoSaving`, `loadingCourses`, `searchTerm` | `allCompetenciesComplete` |
| `pages/manage-competency-order/manage-competency-order.component.html` | Template call-sites updated | — |

---

## PR-5 — `ChangeDetectionStrategy.OnPush`

### Motivation

With `Default` change detection Angular re-evaluates every component's template on
every CD cycle triggered anywhere in the application. `OnPush` limits re-renders to
three cases: an `@Input()` reference changes, an event originates from the
component's subtree, or a signal/async pipe in the template produces a new value.

Because PR-4 already converted all mutable UI flags to signals, signals can drive
`OnPush` correctly with no additional `ChangeDetectorRef` calls.

`playlist-filters` needed three additional signal conversions before `OnPush` could
be applied safely, because those flags were still plain booleans that mutated
inside subscribe callbacks (invisible to `OnPush`).

### What Changed

`changeDetection: ChangeDetectionStrategy.OnPush` was added to the `@Component`
decorator of all five page components.

`playlist-filters.component.ts` additionally converted these three plain fields to
signals:

```typescript
// Before (playlist-filters)
loading = false
errorMessage = ''
loadingOrganizations = false

// After (lines 33-39)
readonly loading = signal(false)
readonly errorMessage = signal('')
readonly loadingOrganizations = signal(false)
```

All reads of these three in the template were updated:
`loading` → `loading()`, `errorMessage` → `errorMessage()`,
`loadingOrganizations` → `loadingOrganizations()`.

No `ChangeDetectorRef` was injected in any component; signals handle scheduling.

### Files Affected

| File | `OnPush` Added | Extra Signal Conversions |
|------|---------------|--------------------------|
| `pages/playlist-filters/playlist-filters.component.ts` | Yes | `loading`, `errorMessage`, `loadingOrganizations` |
| `pages/playlist-filters/playlist-filters.component.html` | — | 3 signal call-sites updated |
| `pages/playlist-summary/playlist-summary.component.ts` | Gained `OnPush` in PR-7 (see note in PR-7) | None needed |
| `pages/select-courses/select-courses.component.ts` | Yes | None (signals from PR-4) |
| `pages/select-competencies/select-competencies.component.ts` | Yes | None (signals from PR-4) |
| `pages/manage-course-order/manage-course-order.component.ts` | Yes | None (signals from PR-4) |
| `pages/manage-competency-order/manage-competency-order.component.ts` | Yes | None (signals from PR-4) |

---

## PR-6 — Standalone Components

### Motivation

NgModule-based components require every template dependency (directives, pipes,
Material modules) to be declared or imported in a shared module that every
consuming module must then import. This creates invisible, transitive coupling.
Standalone components self-declare their imports, making the dependency graph
explicit and enabling tree-shaking per component rather than per module.

Angular 16 allows `standalone: true` in `@Component` without any framework flag.

### What Changed

All 9 components in the playlist module were converted:

**Per-component change:**
- Added `standalone: true` to `@Component`.
- Added `imports: [...]` to `@Component` listing only the Angular/Material modules
  that component's template actually uses.
- Removed the component from `PlaylistSharedModule` (or `PlaylistModule`)
  `declarations`.

**`PlaylistModule` change:**
- `declarations: [PlaylistFiltersComponent, PlaylistSummaryComponent]` removed.
- The two standalone components added directly to `imports: [...]`.

**`RoutePlaylistStandaloneModule` change:**
- Same treatment: `declarations` removed; all 7 standalone components (4 pages +
  3 dialogs) added to `imports`.

### Before

```typescript
// Old PlaylistModule (simplified)
@NgModule({
    declarations: [
        PlaylistFiltersComponent,
        PlaylistSummaryComponent,
    ],
    imports: [
        RouterModule,
        PlaylistRoutingModule,
        PlaylistSharedModule,   // pulled in all shared Material modules
    ],
})
export class PlaylistModule {}
```

```typescript
// Old component decorator (no standalone field, no imports)
@Component({
    selector: 'app-playlist-filters',
    templateUrl: './playlist-filters.component.html',
    styleUrls: ['./playlist-filters.component.scss'],
})
export class PlaylistFiltersComponent implements OnInit { ... }
```

### After

```typescript
// playlist-filters.component.ts (lines 22-30) — representative example
@Component({
    selector: 'app-playlist-filters',
    templateUrl: './playlist-filters.component.html',
    styleUrls: ['./playlist-filters.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
})
export class PlaylistFiltersComponent implements OnInit { ... }
```

```typescript
// playlist.module.ts (current, lines 13-20)
@NgModule({
    imports: [
        RouterModule,
        PlaylistRoutingModule,
        PlaylistFiltersComponent,   // standalone component in imports[]
        PlaylistSummaryComponent,
    ],
})
export class PlaylistModule {}
```

```typescript
// route-playlist-standalone.module.ts (current, lines 17-28)
@NgModule({
    imports: [
        RouterModule.forChild(STANDALONE_PLAYLIST_ROUTES),
        SelectCoursesComponent,
        ManageCourseOrderComponent,
        SuccessDialogComponent,
        RoleConfirmDialogComponent,
        ErrorDialogComponent,
        SelectCompetenciesComponent,
        ManageCompetencyOrderComponent,
    ],
})
export class RoutePlaylistStandaloneModule {}
```

### Standalone Import Breakdown

| Component | `imports` array in decorator |
|-----------|------------------------------|
| `PlaylistFiltersComponent` | `CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule` |
| `PlaylistSummaryComponent` | `CommonModule` |
| `SelectCoursesComponent` | `CommonModule, MatPaginatorModule` |
| `SelectCompetenciesComponent` | `CommonModule, MatPaginatorModule` |
| `ManageCourseOrderComponent` | `CommonModule, DragDropModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule` |
| `ManageCompetencyOrderComponent` | `CommonModule, FormsModule, DragDropModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatIconModule` |
| `SuccessDialogComponent` | `MatDialogModule, MatButtonModule` |
| `RoleConfirmDialogComponent` | `CommonModule, MatDialogModule, MatButtonModule, MatIconModule` |
| `ErrorDialogComponent` | `CommonModule, MatDialogModule, MatButtonModule, MatIconModule` |

### Files Affected

All 9 component `.ts` files; `playlist.module.ts`;
`route-playlist-standalone.module.ts`.

---

## PR-7 — Dead Code Cleanup

### Motivation

After PR-6, `PlaylistSharedModule` had zero importers. Keeping it in the repo
created a false impression that it was still needed and could tempt future
developers to add new dependencies to it rather than to individual component
`imports` arrays.

`playlist-summary` had also been missed in PR-5's `OnPush` pass.

### What Changed

1. **Deleted** `playlist-shared.module.ts`. Confirmed zero importers via codebase
   search before deletion.
2. **Added** `changeDetection: ChangeDetectionStrategy.OnPush` to
   `PlaylistSummaryComponent` (the component has no mutable signals and reads
   all data synchronously in `ngOnInit`, so `OnPush` is safe without further
   changes).

### After (`playlist-summary.component.ts` decorator, lines 7-14)

```typescript
@Component({
    selector: 'app-playlist-summary',
    templateUrl: './playlist-summary.component.html',
    styleUrls: ['./playlist-summary.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule],
})
```

### Files Affected

| File | Change |
|------|--------|
| `pages/playlist-summary/playlist-summary.component.ts` | Added `OnPush` |
| `playlist-shared.module.ts` | Deleted |

---

## Patterns Reference

These are the canonical patterns now enforced across the module. All new code added
to the playlist module must follow them.

### Subscription lifecycle management

```typescript
import { DestroyRef, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

private readonly destroyRef = inject(DestroyRef)

// In any method:
someObservable$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(...)
```

Do not use `Subject` + `takeUntil` + `ngOnDestroy`.

### Safe `.toPromise()`

```typescript
import { take } from 'rxjs/operators'

const result = await someObservable$.pipe(take(1)).toPromise()
```

Always add `take(1)` before `.toPromise()`. This is mandatory for
`MatDialog.afterClosed()` because it is a `Subject` that never completes.

### Typed reactive forms

```typescript
import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms'

type MyForm = {
    name:  FormControl<string>
    tags:  FormControl<string[]>   // use explicit generic to avoid never[]
}

export class MyComponent {
    form!: FormGroup<MyForm>

    constructor(private fb: NonNullableFormBuilder) {}

    private init(): void {
        this.form = this.fb.group<MyForm>({
            name: this.fb.control('', Validators.required),
            tags: this.fb.control<string[]>([]),
        })
    }

    onSubmit(): void {
        const v = this.form.getRawValue()  // not .value — getRawValue() is non-partial
    }
}
```

### Signal-based UI state

```typescript
import { signal, computed } from '@angular/core'

readonly loading  = signal(false)
readonly term     = signal('')
readonly canSave  = computed(() => this.items.length > 0 && !this.loading())

// Mutate:
this.loading.set(true)
this.term.set(event.target.value)

// Template:
// {{ loading() }}   *ngIf="canSave()"   [value]="term()"
```

Use `signal()` for any boolean or string flag that mutates inside async callbacks
or subscribe handlers. Use `computed()` for derived predicates that previously
were `get` accessors.

Search inputs inside reactive forms must use `[value]="term()"` + `(input)="term.set()"`.
Do not use `[(ngModel)]` inside a `[formGroup]` context.

### `OnPush` change detection

```typescript
import { ChangeDetectionStrategy } from '@angular/core'

@Component({
    ...
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
```

All page and dialog components use `OnPush`. No `ChangeDetectorRef` is required
when state is managed via `signal()`.

### Standalone components

```typescript
@Component({
    selector: 'app-my-component',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        // Only the Material modules this template actually uses
        MatFormFieldModule,
        MatSelectModule,
    ],
})
```

Import only what the component's own template needs. Do not import a shared
"kitchen-sink" module to pull in multiple Material modules at once.

---

## What Was NOT Changed

The following were explicitly out of scope for all seven PRs:

| Area | Status |
|------|--------|
| **Routing URLs** | Unchanged. `/app/home/playlist/filters`, `/app/home/playlist/summary`, `/app/playlist/select-courses`, `/app/playlist/manage-course-order`, `/app/playlist/select-competencies`, `/app/playlist/manage-competency-order` are identical. |
| **API payloads** | Unchanged. The shape of requests to `searchPlaylist`, `savePlaylist`, `searchCoursesByCompetency`, and `searchOrganizations` is identical. |
| **Angular Material legacy modules** | All Material imports remain on the `@angular/material/legacy-*` path (e.g., `MatLegacyDialogModule`, `MatLegacyPaginatorModule`). Migration to non-legacy Material APIs is a separate workstream. |
| **RxJS version** | Kept at `~6.5.x`. No upgrade to RxJS 7 was performed. `.toPromise()` is still present (deprecated in RxJS 7 but functional). |
| **`PlaylistRoutingModule`** | Structure and route definitions unchanged. `HOME_PLAYLIST_ROUTES` and `STANDALONE_PLAYLIST_ROUTES` exports are unmodified. |
| **Service layer** | `PlaylistApiService`, `PlaylistStateService`, `CourseApiService`, `CompetencyApiService` were not architecturally changed (except the `take(1)` fix in `course-api.service` noted in PR-2). |
| **`PlaylistModule` and `RoutePlaylistStandaloneModule` existence** | Both NgModules still exist as entry points for lazy-loaded routing; only their `declarations`/`imports` arrays changed. |
