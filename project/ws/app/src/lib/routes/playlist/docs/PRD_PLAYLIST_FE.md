# Product Requirements Document (PRD)
## Playlist Feature (Frontend)

## 1. Overview
The Playlist feature allows admin users to configure what learners see on the home screen.

It supports two playlist types:
- Course Playlist: ordered list of courses.
- Competency Playlist: ordered list of competencies, with one course mapped for each competency level.

This feature is available in the Admin Portal and is built in the module:
`/src/lib/routes/playlist`

## 2. Problem Statement
Admins need an easy way to manage learner content by:
- Organization
- Role (position)
- Language

Without this feature, content assignment is manual, inconsistent, and hard to maintain.

## 3. Goals
- Allow admins to create or update playlists in a guided flow.
- Keep content separated by language.
- Make reordering simple with drag-and-drop.
- Prevent accidental role-impact changes with clear confirmation.
- Show success/failure clearly after save.

## 4. Users
- Primary user: Admin user in e-Kshamata Admin Portal.

## 5. Scope
### In Scope
- Filter selection (organization, role, language).
- Playlist summary screen for course and competency counts.
- Course flow: select courses -> reorder -> save.
- Competency flow: select competencies -> assign level-wise courses -> reorder -> save.
- Role-change confirmation dialog.
- Success and error dialogs.

### Out of Scope
- Learner-side rendering logic.
- Competency authoring/creation.
- District/block master data integration (currently not implemented in logic).
- Cross-language auto-sync of playlists.

## 6. Information Architecture and Routes
### Home routes (with sidebar)
- `/app/home/playlist/filters`
- `/app/home/playlist/summary`

### Standalone routes (no sidebar)
- `/app/playlist/select-courses`
- `/app/playlist/manage-order`
- `/app/playlist/select-competencies`
- `/app/playlist/manage-competency-order`

## 7. User Flow
1. Admin opens Filters page.
2. Admin selects organization, one or more roles, and language.
3. System searches existing Course and Competency playlists for the same scope.
4. Admin lands on Summary page and chooses what to manage.
5. Admin follows either Course flow or Competency flow.
6. Admin saves changes.
7. System confirms success and returns user to start/summary flow.

## 8. Functional Requirements
### 8.1 Filters Page
- Show dropdown for organization with search.
- Show multi-select for role.
- Show dropdown for language.
- Continue button stays disabled until required fields are valid.
- On Continue:
  - Save filters in frontend state.
  - Search Course playlist (`Playlist_Course`).
  - Search Competency playlist (`COMPETENCY_PLAYLIST_V2`).
  - Save existing playlist IDs/data into state.
  - Navigate to Summary.
- If API fails, show inline error message.

### 8.2 Summary Page
- Show selected filters: org, org name, role(s), language.
- Show two cards:
  - Manage Course: total courses + last updated.
  - Manage Competency: total competencies + last updated.
- Button text:
  - `Create` when no existing playlist data.
  - `Manage` when playlist exists.
- `Change` action returns to filters page.

### 8.3 Select Courses Page
- Load all courses by selected language.
- Use cached data when available for same language.
- Preselect courses already present in existing playlist.
- Show selected/preselected items at top.
- Support search by course name and source.
- Support pagination (20/50/100).
- `Next` is enabled only when at least one course is selected.

### 8.4 Manage Course Order Page
- Show selected courses list.
- Allow drag-and-drop to set order.
- Allow search without changing true order.
- Save behavior:
  - Compare selected roles with existing playlist roles.
  - If roles changed, show role confirmation dialog.
  - Merge roles before save (existing + selected).
  - Create playlist if none exists, otherwise update.
  - Refresh latest playlist data after save.
  - Show success dialog on success.
  - Show retry-capable error dialog on failure.

### 8.5 Select Competencies Page
- Load competencies (currently from mock source).
- Preselect competencies already in playlist.
- Search by competency name or code.
- Pagination support.
- `Assign courses` button enabled only when at least one competency selected.

### 8.6 Manage Competency Order Page
- Show selected competencies in draggable list.
- Auto-open first competency in right panel.
- For selected competency, show level rows (config-driven, currently 5 levels).
- For each level, show only courses mapped to that competency and level.
- `Assign courses` button marks one competency as complete only if all levels have selected course.
- Save button enabled only when all selected competencies are marked complete.
- Save behavior:
  - Confirm role-impact changes when roles differ.
  - Build payload with competency order index and level-wise `courseId`.
  - Create/update playlist using competency datasource.
  - Show success/error dialogs.
- Auto-save order runs on drag-drop only when all competencies are complete.

### 8.7 Dialog Requirements
- Role Confirmation Dialog:
  - Triggered when roles differ from existing playlist.
  - Must show newly added roles and existing-only roles.
  - User can cancel or continue.
- Success Dialog:
  - Shows success title/message.
  - Continue button closes dialog and redirects.
- Error Dialog:
  - Shows title + message.
  - Optional details block.
  - Supports `Try Again` action.

## 9. Data and State Requirements
State service stores:
- Current filters.
- Existing course playlist and IDs.
- Existing competency playlist and IDs.
- Selected courses and ordered courses.
- Selected competencies.
- Course cache by language.
- Competency cache by language.

State must be cleared when workflow exits/reset is needed.

## 10. API Requirements
### Playlist APIs
- Search: `POST /apis/protected/v8/playlist/search`
- Create: `POST /apis/protected/v8/playlist/create`
- Update: `PUT /apis/protected/v8/playlist/update`

### Course API
- Search: `POST /api/proxies/v8/sunbirdigot/search`

### Organization API
- Search: `POST /apis/proxies/v8/org/v1/search`

### Datasource rules
- Course playlist uses:
  - `dataSource.type = "static"`
  - `payload = [courseId, ...]`
- Competency playlist uses:
  - `dataSource.type = "competency"`
  - `payload = [{ index, id, code, name, levels: [{ level, courseId, ... }] }, ...]`

## 11. Validation Rules
- Required on filters: `orgId`, `role`, `language`.
- Course save requires at least one selected course.
- Competency completion requires course selected for all configured levels.
- Final competency save requires all selected competencies complete.

## 12. Error Handling
- API/network failures must show clear user-facing message.
- Save failures should allow immediate retry.
- Missing state (for deep links/page refresh) should redirect user to correct previous step.

## 13. Non-Functional Requirements
- Responsive layout for standard desktop admin usage.
- Reasonable load performance using frontend cache by language.
- Stable drag-drop behavior without data loss.
- Consistent feedback for loading, saving, success, and error states.

## 14. Tracking and Analytics (Recommended)
Track these frontend events:
- Filters submitted.
- Course flow started.
- Competency flow started.
- Course save success/failure.
- Competency save success/failure.
- Role-confirm dialog shown/confirmed/cancelled.

## 15. Acceptance Criteria
1. Admin can filter by organization, role, and language and reach summary page.
2. Existing course and competency data are visible on summary.
3. Admin can create/update ordered course playlist and save successfully.
4. Admin can create/update competency playlist with level-wise course mapping and save successfully.
5. Role impact confirmation is shown when role set changes.
6. Success and error dialogs work as expected.
7. Navigating back and forth retains expected state in current session.

## 16. Current Gaps and Optimization Opportunities
- District and block are present in UI but not integrated end-to-end in current logic.
- Competency source is mock-based today; production API integration is pending.
- Some labels can be standardized (for example, breadcrumb text on course order page).
- Replace deprecated `toPromise()` usage with `firstValueFrom/lastValueFrom` for future Angular compatibility.

## 17. Future Enhancements
- Bulk assign courses for multiple competencies.
- Unsaved changes guard before route exits.
- Audit/history view of playlist changes.
- Multi-language side-by-side comparison for admins.
