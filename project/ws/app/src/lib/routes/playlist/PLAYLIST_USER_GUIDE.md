# Playlist — User Journey Guide

The **Playlist** feature lets an admin decide what learners see on their app home screen — which **Courses**, which **Competencies**, and how the **Search** behaves — for a chosen organisation, role and language.

This guide walks through every screen end-to-end: **what** the screen is, **why** it exists, and **how** to use it.

---

## The Big Picture

You always do three things, in order:

1. **Pick your audience** — choose Org, Position/Role and Language (the "scope").
2. **Open the dashboard** — three cards: Manage Course, Manage Competency, Manage Search.
3. **Configure & save** — pick items, arrange their order, and save. Learners instantly see the change.

```
Filters  ──►  Dashboard  ──►  ┌─ Manage Course      (Select → Order → Save)
                              ├─ Manage Competency  (Select → Assign courses to levels → Save)
                              └─ Manage Search      (Edit query → Save)
```

---

## Screen 1 — Select Position & Language (Filters)

**Route:** `/app/home/playlist/filters`

- **What:** A form with Organisation, Position, District, Block and Language dropdowns.
- **Why:** Everything you set up later applies only to this audience. This is the "for whom" step.
- **How:** Pick Organisation + Position + Language (required). District/Block are optional. Click **Continue**.

> On Continue, the system quietly loads any existing Course / Competency / Search playlists for this scope, so the next screen can show counts and pre-tick already-saved items.

---

## Screen 2 — Admin Portal Dashboard (Summary)

**Route:** `/app/home/playlist/summary`

- **What:** The home dashboard. A scope bar at the top (Org, Position, Language + **Change** button) and three cards.
- **Why:** Single place to see what's already configured and jump into editing.
- **How:** Each card shows a count + "last updated", and has two buttons:
  - **Manage / Create** → edit that playlist.
  - **View** → open a read-only popup of what's currently saved.

| Card | Manage button takes you to | View button shows |
|------|---------------------------|-------------------|
| **Manage Course** | Select Courses (Screen 3) | Course Playlist View popup |
| **Manage Competency** | Select Competencies (Screen 5) | Competency Playlist View popup |
| **Manage Search** | Manage Search editor (Screen 7) | Search query popup |

> Use **Change** in the scope bar to go back to Screen 1 and switch audience.

---

## Course Flow

### Screen 3 — Select Courses

**Route:** `/app/playlist/select-courses`

- **What:** A searchable table of all available courses with checkboxes.
- **Why:** Choose which courses appear on the learner's home screen.
- **How:** Search by identifier / name / source, tick the courses you want, click **Next**. (Already-saved courses come pre-ticked and float to the top.)

### Screen 4 — Manage Courses Order

**Route:** `/app/playlist/manage-course-order`

- **What:** Your chosen courses in a drag-handle list, numbered 1, 2, 3…
- **Why:** The order here is the exact order learners see. Top = shown first.
- **How:** Drag rows to reorder, then click **Save**. A success popup confirms, and you return to the dashboard.

> If your selected roles differ from what was saved before, a **Role Confirmation** popup appears first — confirm to apply the change to those roles too.

---

## Competency Flow

### Screen 5 — Select Competencies

**Route:** `/app/playlist/select-competencies`

- **What:** A table of competencies, each with a code (ME3, ME4…) and name, with checkboxes.
- **Why:** Choose which competencies learners see and practice on.
- **How:** Search by name/code, tick the competencies you want, click **Assign courses**.

### Screen 6 — Manage Competency Order & Assign Courses

**Route:** `/app/playlist/manage-competency-order`

- **What:** Two panels — left: your competencies (draggable, numbered); right: the selected competency's **Levels 1–5**, each with a course dropdown.
- **Why:** Each competency level needs a course mapped to it, and the competency order controls display order.
- **How:**
  1. Click a competency on the left.
  2. For each Level 1–5, pick a course from the dropdown.
  3. A green tick appears once all levels are filled; move to the next competency.
  4. Drag to reorder competencies, then click **Save**.

> A competency is "complete" only when all 5 levels have a course. The same Role Confirmation popup may appear on save.

---

## Search Flow

### Screen 7 — Manage Search

**Route:** `/app/playlist/manage-search`

- **What:** A JSON editor holding the search query that decides which courses surface dynamically.
- **Why:** Advanced control — instead of hand-picking, define rules (language, source, category, limits).
- **How:** Edit the JSON, use **Format JSON** to tidy it, then **Save**. Invalid JSON blocks saving.

---

## View Popups (Read-Only)

Opened by the **View** buttons on the dashboard — these never change anything, they just show what's live.

- **Course Playlist View:** Org ID, Org Name, Playlist ID, Language, Role, and the ordered list of courses (ID, name, source).
- **Competency Playlist View:** Same header, plus each competency expandable to show its Levels 1–5 and the course mapped to each.

---

## Quick End-to-End: Create a Course Playlist

1. **Filters** → pick Org, Position, Language → **Continue**.
2. **Dashboard** → on Manage Course card, click **Create**.
3. **Select Courses** → tick courses → **Next**.
4. **Manage Courses Order** → drag to arrange → **Save**.
5. Success popup → back on dashboard, the count updates. Done — learners see it immediately.

> Competency and Search follow the same pattern: pick → arrange/assign → Save.

---

## Good to Know

- **Nothing is lost going Back** — selections are held in memory until you save or change scope.
- **Editing vs creating** is automatic — if a playlist already exists for the scope, your saved items come pre-selected.
- **Saving merges roles** — it won't silently drop courses already assigned to other roles.
- **After every save**, fresh data is reloaded so the dashboard counts stay accurate.
