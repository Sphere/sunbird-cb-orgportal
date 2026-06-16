# FRAC & Manage Positions — User Journey Guide

**FRAC** stands for **F**ramework of **R**oles, **A**ctivities, and **C**ompetencies. It's where an admin builds the org's skill structure: upload the building blocks, then link them together so every position knows what its people must be able to do.

**Manage Positions** is where you see those links assembled — each position with its full Role → Activity → Competency tree.

This guide covers every screen end-to-end: **what** it is, **why** it exists, **how** to use it.

---

## The Big Picture

FRAC has four building blocks that stack into a chain:

```
Competency  ─ the skill (with 5 levels)
Activity    ─ a task that needs competencies
Role        ─ a responsibility made of activities
Position    ─ a job that holds roles

Chain:  Position → Role → Activity → Competency (L1–L5)
```

You work in two passes:

1. **Upload** each block (Competency, Activity, Role) from a CSV/Excel file.
2. **Map** them together, bottom-up: Activity→Competency, then Role→Activity, then Role→Position.

Once mapped, **Manage Positions** shows the finished hierarchy, and **Playlist** uses it to decide what learners see.

---

## Screen 1 — FRAC Hub ("Welcome to the FRAC")

**Route:** `/app/home/frac/dashboard`

- **What:** The FRAC home page with 6 cards — 3 for uploading blocks, 3 for mapping them.
- **Why:** One launchpad for the whole framework. Top row builds blocks, bottom row connects them.
- **How:** Each card has buttons:

| Card | Buttons | Goes to |
|------|---------|---------|
| **Upload Competency** | Upload / Manage | Upload or edit competencies |
| **Upload Activities** | Upload / Manage | Upload or edit activities |
| **Upload Roles** | Upload / Manage | Upload or edit roles |
| **Map Activities to Competencies** | Map now | Link activities ↔ competency levels |
| **Map Roles to Activities** | Map now | Link roles ↔ activities |
| **Map Roles to Positions** | Map now | Link positions ↔ roles |

> First-time setup order: upload all three blocks first, then map bottom-up (Activity→Competency, Role→Activity, Role→Position).

---

## Uploading Blocks

The **Upload** and **Manage** screens look the same for Competency, Activity, and Role — only the columns differ.

### Upload screen (Upload Competency / Activity / Role / Positions)

**Route:** `/app/home/frac/competency?mode=upload` (and `activity`, `role`, `position`)

- **What:** A page with a **Download sample** button, an **Upload File** button, and a drag-and-drop modal.
- **Why:** Bulk-add many items at once from a spreadsheet instead of typing them in.
- **How:**
  1. Pick the **Language** (English or Hindi).
  2. Click **Download sample** to get the correctly-formatted template.
  3. Fill it in, then **Upload File** → drag-drop or browse → **Confirm & Upload**.
  4. A result popup confirms how many records loaded; you land on the **Manage** view.

> Competency/Activity/Role accept CSV or XLSX. Positions accept CSV or JSON. Always start from the downloaded sample so the columns match.

### Manage screen (Manage Competency / Activity / Role)

**Route:** `/app/home/frac/competency?mode=manage` (and `activity`, `role`)

- **What:** A table of everything uploaded — Code + Name (Competency also shows Description, Type, Area, and Level 1–5 labels).
- **Why:** Review, fix typos, or delete items after upload.
- **How:** Search by name/code, switch Language to view translations, then:
  - **Edit** → tick a row, edit cells inline, click **Save**.
  - **Remove** → tick rows and delete (with confirmation).

> The Language dropdown here **views** translations. To add or change mappings later, you edit in **English** (see the language note below).

---

## Mapping Blocks Together

All three map screens share one layout: **pick an item on the left, tick what it links to on the right, click Add.**

> **Language rule (all map screens):** mapping is only editable in **English**. In Hindi you'll see a banner — *"You are currently viewing mappings for Hindi. To make changes, please switch to English."* — and the screen is read-only.

### Screen — Map Activities to Competencies

**Route:** `/app/home/frac/map-activity`

- **What:** Left: list of Activities. Right: Competencies with **Level 1–5** checkboxes.
- **Why:** Defines which competency levels each task builds. This is the foundation the other maps depend on.
- **How:** Click an activity → tick the competency levels it needs → **Add Competency**. Repeat per activity. ("Activity not selected" shows until you pick one.)

### Screen — Map Roles to Activities

**Route:** `/app/home/frac/map-role`

- **What:** Left: list of Roles (expandable to show mapped activities). Right: Available Activities checkboxes.
- **Why:** Defines what each role is responsible for doing.
- **How:** Click a role → tick its activities → **Add activity**.

> If you try to add an activity that has **no competency mapping yet**, a popup blocks you and offers **Map Now** to fix it first. Map Activity→Competency before Role→Activity.

### Screen — Map Roles to Positions

**Route:** `/app/home/frac/map-role-position`

- **What:** Left: list of Positions. Right: Available Roles checkboxes.
- **Why:** Attaches roles to real job positions — the top of the chain. This is what makes a position "complete".
- **How:** Click a position → tick its roles → **Add Role**. ("Position not selected" shows until you pick one.)

---

## Manage Positions

A separate **Manage Positions** item in the left nav — the read-and-edit home for positions and their assembled hierarchy.

### Screen — Manage Position (card grid)

**Route:** `/app/home/frac/position`

- **What:** A grid of position cards, each showing its **Roles / Activities / Competencies** counts. Top bar has Language, **Upload Position**, and **Manage Position**.
- **Why:** At-a-glance view of how built-out each position is (0 counts = nothing mapped yet).
- **How:** On any card:
  - **View** → opens the full **Role → Activity → Competency** tree (with L1–L5 badges).
  - **Edit** → change the position's details.
  - Top buttons: **Upload Position** (bulk add) or **Manage Position** (edit the list).

### Screen — Manage Position (table)

**Route:** `/app/home/frac/position?mode=manage`

- **What:** A table of positions (P1, P2…) with Code + Name, Search, Language, Remove + Edit.
- **Why:** Rename or delete positions in bulk.
- **How:** Search/filter, tick rows, **Edit** inline or **Remove**, then **Save**.

### Screen — Upload Positions

**Route:** `/app/home/frac/position?mode=upload`

- **What:** Same upload pattern — Download sample, Upload File, drag-drop modal (CSV or JSON).
- **Why:** Add many positions at once.
- **How:** Download sample → fill → Upload File → Confirm & Upload → land on the card grid.

---

## The View Modal (read-only)

Opened by **View** on a position card.

- **What:** A popup titled with the position name, summarising its **Roles / Activities / Competencies** counts, then an expandable tree.
- **Why:** Verify the full chain is wired correctly before learners rely on it.
- **How:** Expand **Role → Activity → Competency**; each competency shows its mapped levels (e.g. **L1–L5**). Read-only — close when done.

---

## Quick End-to-End: Build a Position from Scratch

1. **FRAC Hub** → upload **Competencies**, **Activities**, **Roles** (Download sample → fill → Upload).
2. **Map Activities to Competencies** → tick L1–L5 per activity → Add Competency.
3. **Map Roles to Activities** → tick activities per role → Add activity.
4. **Map Roles to Positions** → tick roles per position → Add Role.
5. **Manage Positions** → open the card → **View** to confirm the full tree.
6. Position is ready — **Playlist** can now use it to serve learners.

---

## Good to Know

- **Order matters bottom-up** — Competency → Activity → Role → Position. The system blocks Role→Activity if an activity has no competency yet.
- **Edit in English** — all mapping is done in English; other languages are view-only translations.
- **Always start from the sample file** — column names must match or the upload fails.
- **Counts tell the story** — a position card showing `0 Roles / 0 Activities / 0 Competencies` simply hasn't been mapped yet.
- **Leaving with unsaved edits** prompts a confirmation so you don't lose work.
