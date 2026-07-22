// ===========================================================================
// COURSE CONTEXT CONFIG
// The course selection + ordering screens are shared by more than one playlist.
// Each context here is one such playlist: its backend playlist type, the routes
// its screens live on, and the copy those screens render.
// Add a context here to get a new course flow — no component changes needed.
// ===========================================================================

import { PLAYLIST_ROUTES } from '../constants/playlist.constants'
import { PlaylistType } from '../services/playlist-api.service'

/** Identifies which course playlist the shared course screens are editing */
export type CourseContextKey = 'default' | 'askme'

export interface CourseContextConfig {
    key: CourseContextKey
    /** Backend playlist type — decides the playlistId used on search / create / update */
    playlistType: PlaylistType
    /** Route of the course selection screen for this context */
    selectRoute: string
    /** Route of the course ordering screen for this context */
    orderRoute: string
    selectTitle: string
    selectSubtitle: string
    orderTitle: string
    orderSubtitle: string
    /** Heading shown by the read-only playlist view dialog */
    viewDialogTitle: string
}

export const DEFAULT_COURSE_CONTEXT_KEY: CourseContextKey = 'default'
export const ASKME_COURSE_CONTEXT_KEY: CourseContextKey = 'askme'

export const COURSE_CONTEXTS: Record<CourseContextKey, CourseContextConfig> = {
    default: {
        key: 'default',
        playlistType: PlaylistType.COURSE,
        selectRoute: PLAYLIST_ROUTES.SELECT_COURSES,
        orderRoute: PLAYLIST_ROUTES.MANAGE_COURSE_ORDER,
        selectTitle: 'Select Courses',
        selectSubtitle: 'Choose which courses learners will see on their home screen.',
        orderTitle: 'Manage Courses Order',
        orderSubtitle: "Arrange the order in which courses appear on the learner's home page.",
        viewDialogTitle: 'Course Playlist View',
    },
    askme: {
        key: 'askme',
        playlistType: PlaylistType.ASKME_COURSE,
        selectRoute: PLAYLIST_ROUTES.ASKME_SELECT_COURSES,
        orderRoute: PLAYLIST_ROUTES.ASKME_MANAGE_COURSE_ORDER,
        selectTitle: 'Select Askme Courses',
        selectSubtitle: 'Choose the courses to be displayed in the Askme chat window.',
        orderTitle: 'Manage Askme Courses Order',
        orderSubtitle: 'Arrange the order in which courses appear in the Askme chat window.',
        viewDialogTitle: 'Askme Course Playlist View',
    },
}

/** Resolves a context from route data, falling back to the standard course flow */
export function getCourseContext(key: unknown): CourseContextConfig {
    const resolved = COURSE_CONTEXTS[key as CourseContextKey]
    return resolved || COURSE_CONTEXTS[DEFAULT_COURSE_CONTEXT_KEY]
}
