# Form Module — Overview

> **Developer use only.** This tool edits the live configuration that controls how the Ekshamata and
> Sphere apps look and behave for every organization. A wrong save changes what real users see. Use it
> only if you are a developer who understands the form config you are changing.

For implementation details (API contract, files, design decisions) see
[FORM_FEATURE_GUIDE.md](FORM_FEATURE_GUIDE.md).

---

## What it is

The Ekshamata and Sphere web and mobile apps don't hard-code their layouts. Each organization's header
menu, home-page sections, footer, logos, theme and similar settings are stored as **forms** in the Sunbird
form-service: JSON documents keyed by layout type, app, framework and organization.

Before this module, changing one of these meant finding the right combination of keys, calling the
form-service API by hand, and editing a JSON document of around 1,000 values nested up to 11 levels deep.
It was slow, error-prone and easy to get wrong.

The **Form module** is a page in the Org Portal (left menu → **Form**) that lets a developer find, view,
edit and create these forms through an ordinary UI, with a preview of every change before it's saved.

## What we built

| Capability | What it gives you |
|---|---|
| **Browse existing forms** | A table of real forms: Public, one Organization, or All forms. No more guessing which keys exist. |
| **Searchable org picker** | Find an organization by name or id instead of pasting ids. |
| **Open the exact form** | Edit opens precisely the form in that row, including when an org has two versions (`*` and `v2`). |
| **Edit every value as a form field** | Every text, number, on/off flag, list and group in the JSON gets its own input, at any depth. No raw JSON editing. |
| **Collapsible tree + Expand all / Collapse all** | Large forms open compact; open only what you need. |
| **Bulk add for lists** | Paste `id1, id2, id3` into a list (e.g. `competencyIds`) and get three entries in one step. |
| **Preview before save** | A side-by-side diff of exactly what changed in each section, confirmed before anything is sent. |
| **Clear save feedback** | A success message on save, or the real error with your edits kept. The form stays open. |
| **Unsaved-changes warning** | Leaving a form with unsaved edits asks first. **Discard changes** resets to what was loaded. |
| **Download JSON backup** | Save a copy of the form as it was before you overwrite it. |
| **Upload JSON / Download sample** | Start a new form from a JSON file instead of empty: download a sample for the layout type, edit it, upload it. Uploading a **Download JSON** file from another org **copies that org's form** to a new one. |
| **Safe "New Form"** | Before creating, it checks whether that form already exists and offers to open it instead, so an existing form is never overwritten by an empty one. |

## Why it's useful

- **Faster:** a config change that took several manual API calls and careful JSON editing is now a few
  clicks.
- **Safer:**
  - You see the exact change before saving.
  - You can't accidentally create a duplicate over a real form.
  - You get warned before losing edits.
  - You can download a backup first.
- **Accurate:** you pick from forms that actually exist, so you never edit the wrong version, or one that
  doesn't exist.
- **No hand-made API calls:** login, org and auth headers are handled by the portal.

## How it works

```
 Left menu → Form
        │
        ▼
 ┌──────────────── Browse ────────────────┐
 │  [Public] [Organization] [All forms]   │──── New Form ───┐
 │  filter: type / org / component        │                 │
 │  table of forms ─────── Edit ──┐       │                 ▼
 └────────────────────────────────┼───────┘   pick Type / App / Access /
                                  │           Framework / Org → Create
                                  │                 │
                                  │      already exists? ── yes → Open existing
                                  │                 │ no
                                  ▼                 ▼
 ┌──────────────── Edit ──────────────────────────────────┐
 │  Editing: web_layout · ekshamata · v2 · <Org name>     │
 │  Layout details                                        │
 │  Sections: orgData | LAYOUT_HEADER | BODY | FOOTER     │
 │  every value as a form field (expand/collapse, bulk)   │
 │  [Download JSON] [Discard changes] [Update Form]       │
 └───────────────────────────┬────────────────────────────┘
                             ▼
             Preview: what changed, per section
                             │ Confirm & Save
                             ▼
             Saved ✓ (stays open, list refreshes)
             or error shown, edits kept
```

**Step by step:**
1. Open **Form** from the left menu. Public forms are listed by default.
2. Switch to **Organization** and pick an org (type part of its name to filter), or choose **All forms**.
3. Narrow the table with the filter box or the Type dropdown, then click **Edit** on the form you want.
4. Pick a section (e.g. `LAYOUT_HEADER`) and change values. Use **Expand all** to see everything, and the
   **Add** buttons, or paste into **Add Values** for lists.
5. Optional: click **Download JSON** to keep a backup.
6. Click **Update Form**, check the diff, then **Confirm & Save**.
7. To create a form that doesn't exist yet, use **New Form**. If it already exists, you'll be offered
   **Open existing** instead.
8. In New Form, after picking the Type, choose **Start from**: **Empty form**, or **Upload JSON**. Use
   **Download sample JSON** for a starting file. To copy a form from another org, use **Download JSON** on
   that form, then upload the file here. The uploaded content opens in the editor; nothing is saved until
   you click **Create Form** and confirm.

## Safety rails and limits

- **Who can use it:** intended for developers only. Today this is a team convention. The menu item is
  visible to every portal user, and the page itself isn't locked by role. Locking it to a developer role is
  the next step, once that role name is agreed.
- **Saves are live:** there's no draft or approval step. A confirmed save goes straight to the
  form-service for that org.
- **"All forms" is heavy:** it downloads every form (about 2 MB), so it's only loaded when you choose it.
- **One editor at a time:** if two developers edit the same form at once, the last save wins.

## What's next

- Restrict the page to a developer role (needs the role name, a menu and route update, and a DevOps
  config change).
- Search inside a form: find a key or value and jump straight to it.
- Confirm with the backend whether new forms should be created with subtype `*` (as all existing forms
  are) instead of `v1`.
