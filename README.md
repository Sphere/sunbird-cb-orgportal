# MDO-Fusion

//Comment by Amit Sengar
Initialization Code:

If Authenticated:

Get Roles, Get Groups, Get Features, Get WidgetConfigs
Process Features by roles & Groups
Process Widgets by features, roles and groups
Initialize Widgets by widgetConfig => Reset the available Flow of static injection
Process featuesList.json by using roles & groups

Features =>
check if its available

- No -> check if is denied or not available
- Yes -> check for current page rendering
  -> Yes => render
  -> No => stop rendering

**FRAC and Playlist Overview**
This is an Angular org portal with two main areas visible here:

`Playlist` module: creates and manages learner playlists for an org, role/position, language, and optional district.

`FRAC` module: manages framework entities and mappings:

- Competency
- Activity
- Role
- Position
- Position → Role
- Role → Activity
- Activity → Competency

**Playlist API Calls**
From [playlist-api.service.ts]

`POST /apis/proxies/v8/org/v1/search`

- Loads root organizations for dropdown.

`POST /apis/proxies/v8/entity/v1/search`

- Loads positions for role/position dropdown.
- Also used by competency service to load competencies.

`POST /apis/protected/v8/playlist/search`

- Searches existing playlist by:
  - `orgId`
  - `role`
  - `language`
  - `playlistId`
- Called twice from filters:
  - Course playlist: `Playlist_Course`
  - Competency playlist: `COMPETENCY_PLAYLIST_V2`

`POST /apis/protected/v8/playlist/create`

- Creates a new playlist when no existing playlist is found.

`PUT /apis/protected/v8/playlist/update`

- Updates existing playlist when one already exists.

From [course-api.service.ts]

`POST /apis/proxies/v8/sunbirdigot/search`

- Searches all courses.
- Searches courses by course IDs.
- Searches courses mapped to competency levels using `competencySearch`.

**Playlist Conditional Flow**

1. User opens playlist filters.
2. App loads:
   - organizations
   - positions
3. User selects org, role/position, language, district.
4. On Continue:
   - if form invalid, stop and show validation.
   - if valid, save filters in state.
   - clear stale course/competency selections.
   - search course playlist.
   - search competency playlist.
5. If playlist exists:
   - store existing playlist and payload IDs in state.
6. If no playlist exists:
   - state keeps playlist as `null`.
7. User goes to summary.
8. User chooses:
   - manage course playlist
   - manage competency playlist
9. On Save:
   - if no existing playlist, call create.
   - if existing playlist, call update.
   - if selected roles differ from existing roles, show confirmation before saving.
   - roles are merged before saving.

**Course Playlist Flow**

1. Load all courses by language.
2. If cached courses exist, use cache.
3. Preselect courses already in existing playlist.
4. User selects/unselects courses.
5. User orders selected courses.
6. Save payload is ordered course identifiers.
7. API decides:
   - create playlist if new
   - update playlist if existing

**Competency Playlist Flow**

1. Load competencies by language from entity search.
2. Preselect competencies from existing competency playlist using competency code.
3. User selects competencies.
4. User orders competencies.
5. For each competency, app loads mapped courses by competency levels.
6. User assigns courses to levels.
7. Save payload contains competency details, level data, course assignments, and order.
8. If all competencies are complete, reorder can auto-save.
9. Final save uses create/update playlist API.

**FRAC API Calls**
From [frac-api.service.ts]

Configured endpoints come from `resolveFracClientConfig`.

Defaults include:

`PUT /apis/proxies/v8/entity/v1/update`

- Updates competency/activity/role/position records.

`DELETE /apis/proxies/v8/entity/v1/delete`

- Deletes entity records.

`POST /apis/proxies/v8/entity/v1/upload`

- Uploads Excel/entity sheet.

`POST /apis/proxies/v8/entity/v1/search`

- Searches entities by type:
  - `Competency`
  - `Activity`
  - `Role`
  - `Position`

`POST /apis/proxies/v8/entity/v1/mapping`

- Saves parent-child mappings.

`POST /apis/proxies/v8/entity/v1/mapping/search`

- Searches saved mappings.

`POST /apis/proxies/v8/entity/v1/hierarchy`

- Fetches full hierarchy for an entity.

**Map Role Position Flow**
From [map-role-position.component.ts]

1. Page loads.
2. Search positions:
   - `searchEntities('position')`
3. User selects a position.
4. App loads existing mapped roles:
   - `searchEntityMapping('position', position.code)`
5. User searches roles:
   - `searchEntities('role')`
6. User checks roles.
7. Before saving, app validates each selected role has activity mapping:
   - `searchEntityMapping('role', role.code)`
8. If any selected role has no activity mapping:
   - show warning modal.
   - user can go map roles to activities.
9. If all roles are valid:
   - build Position → Role payload.
   - save using `mapEntity(payload)`.
10. If role selection is unchanged from cached mapping:

- skip API save and show “No changes detected.”

**Upload/Edit/Delete FRAC Flow**
For competency/activity/role/position upload pages:

1. Search existing entity list:
   - `searchEntities(type, keyword, language)`
2. Upload sheet:
   - `uploadFile(file, language)`
3. Parse API response.
4. Show success/error modal.
5. Edit rows:
   - `updateEntity(payloads)`
6. Delete rows:
   - `deleteEntity(payload)`.

In short:
playlist is a curated learning-content workflow,
while FRAC is the entity and mapping backbone that supplies competencies, roles, activities, and positions.
