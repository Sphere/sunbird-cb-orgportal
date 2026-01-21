/**
 * Competency Playlist Module
 * Entry point for all competency-related services, models, and transformers.
 */

// --- Services ---
export { CompetencyApiService } from './services/competency-api.service'
export { PlaylistApiService, PlaylistType, PLAYLIST_IDS } from './services/playlist-api.service'

// --- Transformer & Utils ---
export {
    CompetencyTransformer,
    RawCompetencyEntity,
    RawCompetencyLevel,
    PlaylistCompetency,
    PlaylistCompetencyLevel,
    CourseLanguageMapping
} from './utils/competency-transformer'

// --- Mock Data (Temporary) ---
// TODO: Remove this once the real backend API is fully integrated
export { MOCK_COMPETENCY_LIST_RESPONSE } from './services/competency-mock-data'

/*
 * -----------------------------------------------------------------------
 * Developer Notes & Cheatsheet
 * -----------------------------------------------------------------------
 * 
 * 1. File Structure:
 *    - services/       -> APIs and Data Fetching
 *    - utils/          -> Logic (transformers)
 *    - pages/          -> UI Components
 *    - docs/           -> Guides and Documentation
 * 
 * 2. Language Support:
 *    - English (en) is the "base" language.
 *    - Other languages (hi, ka) use `additionalProperties` for their names/descriptions.
 *    - Always pass the 'existingPayload' when updating so you don't lose other language data.
 * 
 * 3. Course Assignments:
 *    - Courses are stored in an array: [{ lang: 'en', id: '...' }, { lang: 'hi', id: '...' }]
 *    - Updating one language preserves the others.
 * 
 * 4. Need more help? 
 *    Check the 'docs/' folder for detailed guides and examples.
 */

