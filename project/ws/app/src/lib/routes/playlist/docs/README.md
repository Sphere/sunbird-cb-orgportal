# Competency & Course Playlist Module

Welcome to the **Playlist Module**! 👋

## 🚀 Overview
This module is the control center for creating **Learning Paths** for users. Think of it as a playlist builder for learning content.

It allows administrators to define exactly what a user should learn based on three criteria:
1.  **Who they are** (Role)
2.  **Where they are** (Organization/State/District)
3.  **What language they speak** (English, Hindi, etc.)

We support two types of playlists:
*   **Course Playlist**: A simple ordered list of courses.
*   **Competency Playlist**: A structured path where specific courses are assigned to different levels (Level 1 to Level 5) of a competency.

> **Important**: Playlists are managed separately for each language. A playlist created for *English* users is completely different from one created for *Hindi* users.

---

## 🗺️ User Journey

Every journey begins with defining the audience.

### Step 1: Define Context (`/filters`)
The user selects:
*   **Organization**
*   **Role** (e.g., Nurse, Medical Officer)
*   **Language** (e.g., English, Hindi)

This combination allows the system to load the unique playlist entry for that specific group.

### Step 2: Dashboard Overview (`/summary`)
The system displays the current state of assignments. The user chooses which type of content to manage.

---

### Path A: Course Playlist Journey 📚
Used for assigning a simple list of training videos or modules.

1.  **Select Courses**: The user browses the global course repository and selects the relevant content.
2.  **Reorder**: On the management page, the user drags and drops courses to define the exact viewing sequence.
3.  **Save**: The prioritized list is saved for the specific language and role.

### Path B: Competency Playlist Journey 🎯
Used for building a structured, level-based proficiency framework.

1.  **Select Competencies**: The user picks relevant domain competencies (e.g., "Maternal Care", "Communication").
2.  **Assign Levels**: The user enters the detailed view for each selected competency.
    *   The system requires assigning a specific course for each proficiency level (**Level 1** to **Level 5**).
    *   Visual indicators show when a competency is fully mapped (completed).
3.  **Reorder**: The user can rearrange the order in which competencies appear to the learner.
4.  **Save**: The entire structure (Competencies + Level Mappings) is saved.

---

## 👩‍💻 Developer Guide

### Key Files
*   **`pages/`**: Contains the UI screens (Filters, Summary, Selection, Ordering).
*   **`services/`**:
    *   `PlaylistApiService`: Handles all backend communication (Search, Create, Update).
    *   `PlaylistStateService`: Acts as the temporary memory. It holds the selected filters and data as the user moves between pages.
*   **`utils/competency-transformer.ts`**: A helper that converts the complex backend data (V2 format) into simple objects the UI can use.

### Technical Concept: Language Isolation
Since every language version of a playlist is a separate entry in the database:
*   We do **not** merge languages automatically.
*   Editing the English playlist has no effect on the Hindi playlist.
*   The system treats them as independent records sharing the same Role and Organization.

### Api Endpoints
*   **Playlists**: `/apis/protected/v8/playlist`
*   **Courses**: `/api/proxies/v8/sunbirdigot`
*   **Organizations**: `/apis/proxies/v8/org`
