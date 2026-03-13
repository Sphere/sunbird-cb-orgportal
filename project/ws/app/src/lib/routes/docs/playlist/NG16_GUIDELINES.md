# Playlist Module Angular 16 Guidelines

Purpose: enforce Angular 16-first implementation in playlist so new work does not reintroduce legacy patterns.

Scope: all files under `project/ws/app/src/lib/routes/playlist/` including pages, components, services, models, routing, and docs.

## 0) Package Versions (from package.json)

| Package | Version | Notes |
|---|---|---|
| `@angular/core` | `^16.2.12` | Signals, standalone, `inject()` available |
| `@angular/cdk` | `^16.2.14` | DragDrop, Overlay, Portal |
| `@angular/material` | `^16.2.14` | MDC-based components (no legacy) |
| `rxjs` | `~6.5.4` | **RxJS 6** — `firstValueFrom` is NOT available |
| `typescript` | `^4.9.3` | |
| `zone.js` | `~0.13.3` | |

**Critical constraint: `rxjs ~6.5.4`**
`firstValueFrom` and `lastValueFrom` were added in RxJS 7. Do not use them. Use `.pipe(take(1)).toPromise()` instead (see Section 8).

Angular 16 ships `@angular/core/rxjs-interop` (`toSignal`, `takeUntilDestroyed`) which is compatible with RxJS 6.

## 1) Core Rules (Must Follow)

1. Use standalone components for all new UI units.
2. Use `ChangeDetectionStrategy.OnPush` for all new components.
3. Prefer signals for local UI state (`signal`, `computed`) instead of mutable primitive fields.
4. Use `takeUntilDestroyed` for live subscriptions in components.
5. Do not use Angular Material legacy imports (`@angular/material/legacy-*`).
6. Do not create new feature wrapper NgModules for playlist routing.
7. Keep playlist routing in `playlist.routes.ts` (`Routes` constants) only.
8. Keep service and model contracts strongly typed; avoid `any` unless unavoidable and documented.
9. Use `.pipe(take(1)).toPromise()` for all Observable-to-Promise bridges. **Do not use `firstValueFrom` — it requires RxJS 7, this project uses RxJS 6.5.x.**
10. Do not use browser `alert()` in playlist UI; use existing dialog/toast patterns.

## 2) Component Guidelines

Every new component should follow this structure:

```ts
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...],
})
```

Required patterns:

1. Inject dependencies using `inject(...)` when practical.
2. Keep local state as signals:
   - `readonly loading = signal(false)`
   - `readonly canSubmit = computed(...)`
3. For stream subscriptions:
   - `observable$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...)`
4. Keep template bindings signal-aware:
   - `loading()`, `errorMessage()`, etc.
5. Avoid direct mutation when state ordering/filtering can be expressed immutably.

## 3) Service Guidelines

1. Keep service methods fully typed (request and response).
2. Do not introduce `any` in public method signatures.
3. Encode payload unions in models (example: course payload vs competency payload).
4. API path/constants must be centralized as `readonly` fields.
5. Keep transformation logic inside services/utils, not scattered in components.
6. For Observable-to-Promise bridges in services, use `obs$.pipe(take(1)).toPromise()` — `firstValueFrom` is RxJS 7+ and not available in this project (RxJS `~6.5.4`).

## 4) Forms Guidelines

1. Use typed reactive forms only.
2. Prefer `NonNullableFormBuilder`.
3. Use explicit form types:

```ts
type MyForm = {
  field: FormControl<string>
}
```

4. Avoid mixed reactive/template form patterns unless justified.
5. Convert outgoing form payload to API contract shape in one place (component/service boundary).

## 5) Material + Styling Guidelines

1. Use only modern Material imports:
   - `@angular/material/dialog`
   - `@angular/material/button`
   - `@angular/material/form-field`
   - `@angular/material/select`
   - `@angular/material/input`
   - `@angular/material/paginator`
   - etc.
2. Never add new `MatLegacy*` symbols.
3. If deep styling is needed, target MDC classes (`mat-mdc-*` / `mdc-*`), not old `.mat-*` internals.
4. Keep component styles scoped; use `::ng-deep` only when there is no alternative.

## 6) Routing Guidelines

1. Add/modify playlist routes in:
   - `playlist.routes.ts`
2. Do not add:
   - `playlist.module.ts`
   - `playlist-routing.module.ts`
   - standalone wrapper route modules for playlist
3. Keep lazy loading via route arrays:
   - home flow -> `HOME_PLAYLIST_ROUTES`
   - standalone flow -> `STANDALONE_PLAYLIST_ROUTES`

## 7) State Management Guidelines

1. Use `PlaylistStateService` as the workflow state source of truth.
2. Keep write methods explicit (`setX`, `clearX`).
3. Add typed models before adding new state fields.
4. If adding cached data, include clear/reset path in `clearState()`.

## 8) RxJS Promise Bridge Pattern (Mandatory)

**RxJS version constraint:** This project uses **RxJS 6**. `firstValueFrom` and `lastValueFrom` are RxJS 7+ only and must NOT be used.

**Rule: use `obs$.pipe(take(1)).toPromise()` for all Observable-to-Promise bridges.**

```ts
// ✅ Correct — RxJS 6 compatible
import { take } from 'rxjs/operators'

const result = await this.api.search(filters).pipe(take(1)).toPromise()
const confirmed = await dialogRef.afterClosed().pipe(take(1)).toPromise()

// ❌ Forbidden — RxJS 7+ only, not available in this project
import { firstValueFrom } from 'rxjs'
await firstValueFrom(obs$)

// ❌ Also forbidden — no take(1) guard means unbounded subscription
await obs$.toPromise()
```

When to use which:

| Observable type | Use |
|---|---|
| HTTP call (completes after 1 emission) | `.pipe(take(1)).toPromise()` |
| Dialog `afterClosed()` (emits once on close) | `.pipe(take(1)).toPromise()` |
| Long-lived stream that should stay open | `.pipe(takeUntilDestroyed(...)).subscribe(...)` |

If the project is ever upgraded to RxJS 7+, migrate all `.pipe(take(1)).toPromise()` call sites to `firstValueFrom(obs$)` in one pass and update this section.

## 9) Observable-to-Signal Bridge (`toSignal`)

Use `toSignal()` from `@angular/core/rxjs-interop` to bind an observable directly to a signal in a component. This eliminates manual subscribe/unsubscribe boilerplate and keeps templates purely signal-based.

```ts
import { toSignal } from '@angular/core/rxjs-interop'

@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, ... })
export class MyComponent {
  // ✅ Observable → signal, automatically cleaned up with component lifetime
  readonly organizations = toSignal(this.playlistApi.searchOrganizations(), { initialValue: [] })

  // Template: {{ organizations() }}  — no async pipe, no subscribe
}
```

**When to use `toSignal` vs other patterns:**

| Scenario | Pattern |
|---|---|
| Observable bound to template display value | `toSignal(obs$, { initialValue: ... })` |
| Observable that drives a one-shot async action | `.pipe(take(1)).toPromise()` |
| Long-lived stream needing side effects | `.pipe(takeUntilDestroyed()).subscribe(...)` |

Rules:
1. Always provide `initialValue` so the signal type is non-nullable.
2. `toSignal` must be called in an injection context (constructor, field initializer, or `runInInjectionContext`). Do not call it inside lifecycle hooks or event handlers.
3. Do not wrap `toSignal` output in an additional `computed` just to read the value — use it directly in the template.
4. For observables that can error, handle errors upstream (e.g. `catchError`) before passing to `toSignal`.

## 10) Review Checklist (Paste in PR Description)

- [ ] No `@angular/material/legacy-*` import in changed files
- [ ] No new `NgModule` created for playlist routing
- [ ] Routes updated only in `playlist.routes.ts` (if routing changed)
- [ ] New components are `standalone: true` + `OnPush`
- [ ] Subscriptions use `takeUntilDestroyed` where needed
- [ ] Promise bridges use `.pipe(take(1)).toPromise()` — no bare `.toPromise()` and no `firstValueFrom` (RxJS 7+ only)
- [ ] Observable display bindings use `toSignal()` where appropriate (not `async` pipe on new components)
- [ ] Public service/model APIs are typed (no broad `any`)
- [ ] Form groups are typed reactive forms
- [ ] No `alert()` in UI flow
- [ ] Existing playlist flows tested:
  - [ ] `/app/home/playlist/filters`
  - [ ] `/app/home/playlist/summary`
  - [ ] `/app/playlist/select-courses`
  - [ ] `/app/playlist/manage-course-order`
  - [ ] `/app/playlist/select-competencies`
  - [ ] `/app/playlist/manage-competency-order`

## 11) Anti-Patterns (Do Not Add)

1. `MatLegacy*` imports
2. `.mat-form-field*` legacy deep CSS selectors
3. New playlist feature NgModules for routing
4. Untyped payloads in service contracts
5. Unbounded subscriptions in components
6. Direct ad-hoc API payload construction repeated in many components
7. `.toPromise()` without `take(1)` — always guard with `.pipe(take(1)).toPromise()`
8. `import { firstValueFrom } from 'rxjs'` — RxJS 7+ only, not available in this project
9. `async` pipe in new standalone component templates — use `toSignal()` instead
10. Calling `toSignal()` outside an injection context (e.g. inside `ngOnInit` or event handlers)

## 12) Ownership

When adding/changing playlist features, update this file if:

1. project RxJS major version changes,
2. routing strategy changes,
3. state management strategy changes,
4. UI component standards change.
