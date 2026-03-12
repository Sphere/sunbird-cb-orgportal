# FRAC Module (Framework for Roles, Activities, and Competencies)

Welcome to the FRAC module! This document serves as a high-level guide to understanding what FRAC is, why it was built, its core features, and how the codebase is structured.

---

## 📖 What is FRAC?

**FRAC** stands for **Framework for Roles, Activities, and Competencies**.
It is a structured ecosystem designed to define, map, and manage the capabilities expected of individuals within an organization.

In simple terms, FRAC answers three main questions for any job:
1. **Position**: What is the job title? *(e.g., Senior Developer)*
2. **Role & Activities**: What does a person in this job actually do? *(e.g., Write code, review PRs)*
3. **Competencies**: What skills are required to perform those activities efficiently? *(e.g., JavaScript L4, Git L3)*

---

## 🎯 Why do we need FRAC?

Before FRAC, managing organizational hierarchies, job descriptions, and skill requirements was often a scattered, manual process.

The FRAC module provides a **client-agnostic, configurable UI** to:
1. **Standardize Work**: Introduce a universal language for skills and roles across departments.
2. **Enable Capability Building**: Connect learning systems (like courses) directly to required competencies.
3. **Bulk Process Data**: Allow administrators to easily upload and manage hundreds of positions and competencies at once using Excel/CSV templates.

---

## ✨ Core Features

The FRAC module is split into four primary entity streams, alongside a mapping engine:

1. **Competency Management**: Upload, define, and manage standalone skills and their proficiency levels.
2. **Activity Management**: Define granular tasks and actions that employees perform.
3. **Role Management**: Bundle multiple activities into a logical "Role".
4. **Position Management**: Map organizational job titles to specific Roles.
5. **Mapping Engine**: A visual interface to link these entities together (e.g., Mapping specific Competencies to an Activity).
6. **Hierarchy Viewer**: A unified modal to visualize the complete tree: `Position ➔ Roles ➔ Activities ➔ Competencies`.

---

## 🔄 User Flow (How Administrators use it)

The standard flow for an admin interacting with this module looks like this:

1. **Upload Phase**: The Admin downloads an empty Excel/CSV template, fills it with bulk data (e.g., 50 new Competencies), and uploads it via the UI.
2. **Validation**: The UI presents the uploaded data in an editable table. The system automatically tags formatting errors or duplicate codes.
3. **Manage & Edit**: The Admin reviews the table, modifies any incorrect cells directly on the web, and deletes unwanted rows.
4. **Save**: The data gets pushed to the backend via a generated API payload.
5. **Mapping**: Once entities exist, the Admin navigates to the Mapping routes to connect them visually (e.g., attaching "Communication Skills" to a "Manager" role).

---

## 🏗️ Code Architecture & Folder Structure

To ensure scalability and maintainability, the FRAC module strictly limits file complexity (striving for <500 lines per file) and follows a modular pattern:

```text
frac/
├── components/       # Reusable UI parts (e.g., tables, dialogs, upload popups)
├── constants/        # Hardcoded routes, fallback configs, S3 URLs
├── models/           # TypeScript interfaces (Strict typing, no \"any\")
├── pages/            # Smart container components grouped by entity (Position/Role/etc.)
│   ├── position/     # Handles Position Upload, Manage, and Card views
│   ├── role/         # Handles Role logic
│   └── mapping/      # Screens dedicated to inter-linking entities
├── pipes/            # Angular pipes for pure template data transformations
├── services/         # Orchestrators and API HTTP calls
└── utils/            # Pure functions (Parsers, Payload Builders, Hierarchy Generators)
```

### Key Engineering Principles
- **Config-Driven**: UI text, standard radii, debounces, and pagination limits are driven by `frac.constants` or instance overrides.
- **Dumb & Smart Components**: `pages/` handle logic, states, and API calls. `components/` strictly emit events and receive `@Input()` bindings.
- **Purely Typed**: Heavy reliance on interfaces like `FracUploadRow`. API responses are safely parsed using utility classes before hitting the UI.

---

## 🛠️ Development Guidelines

When adding new features or modifying existing code in FRAC, follow these rules:

1. **No logic duplication**: Before writing a new component or service, check if an existing one covers the use case. Prefer extending over duplicating.
2. **Reuse shared tables**: Upload table display is handled by `app-upload-activity-list-table`. Do not create parallel table components.
3. **Keep components thin**: Complex data transformations, payload construction, and API error parsing belong in `/utils` or `/services`, not inside Angular components.
4. **Follow the 500-line rule**: No single TypeScript file should exceed 500 lines. If it does, extract logic into a dedicated utility or service.
5. **No hardcoded values**: All URLs, labels, debounce delays, and UI constants must live in `frac.constants.ts` or the instance config override path.
6. **No `any` types**: Use defined models. At external API boundaries, use `unknown` and narrow immediately.
7. **Update tests**: If you change payload builders, parsers, or guard logic, ensure the relevant `.spec.ts` file is updated alongside.

For architecture details and design decisions, refer to the sections above.
