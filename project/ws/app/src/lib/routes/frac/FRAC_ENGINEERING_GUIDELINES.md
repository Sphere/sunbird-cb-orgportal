# FRAC Engineering Guidelines

This document defines the coding rules for all new and updated FRAC code.

Goal:
- Keep FRAC generic for multiple clients.
- Keep code simple, readable, testable, and scalable.
- Prevent feature regressions while improving maintainability.

Scope:
- `project/ws/app/src/lib/routes/frac`

---

## 1. Core Design Principles

1. Zero behavior surprise:
- Refactors must not change user-visible behavior unless explicitly planned.
- Any functional change must be documented in PR notes and tests.

2. Config-first design:
- No hardcoded URLs, routes, labels, debounce values, dialog sizes, spinner sizes, or language lists in page code.
- Use FRAC constants and `instanceConfig.frac` override path.

3. Keep it simple:
- Prefer clear code over clever code.
- Avoid deeply nested logic and side-effect-heavy methods.

4. Single responsibility:
- Components handle UI state and user interaction.
- Services handle API and shared orchestration logic.
- Utilities stay pure and side-effect free.

5. Strong typing:
- No `any` in new code.
- Use shared typed models and response contracts.
- Use `unknown` only at external boundaries and narrow immediately.

---

## 2. File and Folder Rules

### 2.1 Folder structure

Use and maintain this structure:
- `components/` reusable UI blocks
- `pages/` route-level containers
- `services/` API + orchestration
- `utils/` pure helpers
- `models/` shared interfaces/types
- `constants/` routes, UI values, and defaults
- `pipes/` presentation transforms

### 2.2 File size limit

Hard rule:
- No TS file should exceed 500 lines.

Preferred:
- Keep most files below 350 lines.

If file grows:
1. Extract helper methods to `utils/` if pure.
2. Extract shared flow to `services/` if stateful/reusable.
3. Split large components into smaller focused components.

### 2.3 Naming

- Files: kebab-case and feature oriented.
- Classes: PascalCase.
- Methods/variables: camelCase.
- Avoid vague names like `data`, `item2`, `temp`.

---

## 3. Component Rules (UI Layer)

1. Components must stay thin:
- Avoid API payload construction in template-heavy components if reusable elsewhere.
- Move repeated flow to orchestrator service.

2. Keep templates clean:
- Avoid complex expressions in HTML.
- Move logic to typed getters/methods.

3. Input/Output contracts:
- Always type `@Input()` and `@Output()`.
- Reuse shared models (`models/frac-table.models.ts`, API models).

4. UI constants:
- No magic numbers in components/templates for dialog width, spinner size, debounce, wrap limits.
- Use FRAC constants only.

5. State clarity:
- Group state by concern:
  - route/mode
  - loading flags
  - table state
  - selection/edit state

---

## 4. Service and API Rules

1. API service contracts:
- Public service methods must use typed request/response contracts.
- Keep backend payload compatibility.

2. Client override support:
- Read overrides from `instanceConfig.frac` through resolver utility.
- Merge order must stay:
  - client override
  - FRAC defaults

3. Logging:
- No direct `console.*` usage in pages/components/services.
- Use guarded FRAC logger utility.

4. Side effects:
- Isolate navigation/dialog side effects from pure data parsing functions.

---

## 5. Utility Rules

1. Utility functions must be pure:
- No router, no dialog, no HTTP, no global mutable state.

2. Typed input/output:
- Every util function must declare clear parameter and return types.

3. Defensive parsing:
- For API parsing utilities, handle:
  - object response
  - string response
  - nested error payload
  - blob payload

---

## 6. Complexity and Readability Rules

1. Method complexity:
- Prefer methods below 60 lines.
- If method does more than one job, split it.

2. Conditional depth:
- Avoid nesting beyond 3 levels.
- Use early returns.

3. Duplication:
- If same logic appears in 2+ places, extract shared helper/service.

4. Comments and JSDoc:
- Write simple human language.
- Explain intent and effect, not obvious syntax.
- Avoid noisy comments and emojis.
- Avoid complex words and long sentences.
- Write comments so a new developer can understand in one read.

Use this JSDoc shape for non-trivial methods:
- What it does
- Inputs
- Output/effect
- Side effects (API/navigation/dialog/state)

### Human JSDoc Template (Use This)

Keep JSDoc short and easy.

Template:
```ts
/**
 * What this method does in simple words.
 * @param x Short meaning of input.
 * @returns Short meaning of output.
 * Side effects: mention only if this calls API, opens dialog, updates route, or changes shared state.
 */
```

Rules:
1. Use plain English, no technical jargon unless required.
2. Max 4-6 lines for normal methods.
3. Do not describe line-by-line code.
4. Do not add generic comments like "sets value to variable".
5. If method name is already clear, add JSDoc only when behavior is not obvious.

---

## 6A. Common Approach for New Changes

All new FRAC work must follow one common implementation approach:

1. First check existing constant/model/service before adding new code.
- Reuse first.
- Create new only when reuse is not possible.

2. New UI values must be config-driven.
- Put defaults in FRAC constants.
- Allow override via `instanceConfig.frac` when needed.

3. New API handling must follow same pattern.
- Define request/response type in models.
- Parse response in utility/adapter layer.
- Keep component free from response-shape complexity.

4. New page logic must follow same flow.
- UI event -> orchestrator/service -> typed util -> state update -> UI render.

5. New code must look similar to existing optimized code style.
- Same naming style.
- Same JSDoc style.
- Same test style.

6. If two files need same logic, create shared helper immediately.
- Do not duplicate and postpone cleanup.

---

## 7. Performance Rules

1. Avoid repeated heavy operations in template cycles.
2. Keep sorting/filtering deterministic and minimal.
3. Use debounce for search inputs through shared constants.
4. Reuse cached mappings where already available.
5. Avoid unnecessary array cloning in hot loops.

---

## 8. Testing Rules (Must-have)

Every critical change must include or update tests.

Minimum:
1. API service typing and response parsing behavior.
2. Upload page mode handling (`upload` vs `manage`).
3. Search trigger behavior (debounced vs immediate).
4. Save guard behavior (for empty payload, unsaved changes).
5. Config override resolution fallback behavior.

Testing style:
- Focus on behavior, not implementation details.
- Keep test names action-oriented and explicit.

---

## 9. Multi-Client Readiness Rules

1. New client-specific values must be configurable via `instanceConfig.frac`.
2. Never fork component logic per client unless unavoidable.
3. Use feature flags for optional client workflows.
4. Preserve safe defaults when no client override is provided.

---

## 10. PR Checklist (FRAC)

Before merge, confirm:
1. No new `any` added.
2. No new hardcoded UI/runtime magic values.
3. No direct `console.*` calls.
4. File size under 500 lines.
5. JSDoc added for complex methods.
6. `tsc` app compile passes.
7. Critical path tests added/updated.
8. No behavior regression in upload/map/manage flows.

---

## 11. Anti-Patterns to Avoid

- Large God components with mixed UI/API/parser logic.
- Copy-paste payload builders across pages.
- Hardcoded routes, URLs, labels, debounce values.
- Hidden side effects in util functions.
- Over-abstracted code that reduces readability.

---

## 12. Definition of Done for New FRAC Code

A change is done only when:
1. It is typed, readable, and follows folder boundaries.
2. It is config-driven where needed.
3. It keeps complexity low and avoids duplication.
4. It includes meaningful tests for critical paths.
5. It does not break existing FRAC behavior.
