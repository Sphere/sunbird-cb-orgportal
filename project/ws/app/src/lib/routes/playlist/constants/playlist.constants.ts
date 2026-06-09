// ===========================================================================
// PLAYLIST MODULE CONSTANTS
// All hardcoded values for the playlist module live here.
// Never inline routes, limits, timeouts, sizes, or UI defaults in components or services.
// ===========================================================================

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

export const PLAYLIST_ROUTES = {
    /** Home routes — rendered inside the sidebar layout */
    HOME_FILTERS: '/app/home/playlist/filters',
    HOME_SUMMARY: '/app/home/playlist/summary',

    /** Standalone routes — full-screen, no sidebar */
    SELECT_COURSES: '/app/playlist/select-courses',
    MANAGE_COURSE_ORDER: '/app/playlist/manage-course-order',
    SELECT_COMPETENCIES: '/app/playlist/select-competencies',
    MANAGE_COMPETENCY_ORDER: '/app/playlist/manage-competency-order',
    MANAGE_SEARCH: '/app/playlist/manage-search',
} as const

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const PLAYLIST_API = {
    /** Max records returned when fetching organisations */
    ORG_SEARCH_LIMIT: 9999,

    /** Auth token used when no user token is available */
    DEFAULT_AUTH_TOKEN: 'system',
} as const

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

export const PLAYLIST_UI = {
    /** Number of shimmer rows to show while a table is loading */
    SHIMMER_ROWS: 8,

    /** Width of standard action dialogs (role confirm, error) */
    DIALOG_WIDTH: '450px',

    /** Width of the success dialog */
    SUCCESS_DIALOG_WIDTH: '323px',

    /** Width of the error dialog */
    ERROR_DIALOG_WIDTH: '400px',

    /** Milliseconds before the loading spinner guard auto-clears */
    LOADING_GUARD_MS: 20000,

    /** Milliseconds for the per-competency course fetch timeout */
    COURSE_LOAD_TIMEOUT_MS: 15000,

    /** Delay in ms before focusing a search input after opening a dropdown */
    FOCUS_DELAY_MS: 50,
} as const

// ---------------------------------------------------------------------------
// COMPETENCY DEFAULTS
// Hardcoded metadata values required by the playlist API V2 format.
// ---------------------------------------------------------------------------

export const PLAYLIST_COMPETENCY_DEFAULTS = {
    AREA: 'Management',
    STATUS: 'UNVERIFIED',
    LEVEL: 'INITIATE',
    LEVEL_ID: 0,
    TYPE: 'Domain',
} as const

// ---------------------------------------------------------------------------
// TIME UNITS
// Thresholds (in seconds) used by the relative-time formatter in playlist-summary.
// ---------------------------------------------------------------------------

export const TIME_UNITS = {
    /** Seconds in one minute */
    MINUTE: 60,
    /** Minutes in one hour */
    HOUR: 60,
    /** Hours in one day */
    DAY: 24,
    /** Days threshold before switching to absolute date display */
    MONTH_THRESHOLD: 30,
} as const

// ---------------------------------------------------------------------------
// LANGUAGES
// Supported language options shown in the filters form.
// ---------------------------------------------------------------------------

export const PLAYLIST_LANGUAGES: { value: string; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'kn', label: 'Kannada' },
    { value: 'tn', label: 'Tamil' },
]
