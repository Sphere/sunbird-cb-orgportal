/**
 * Course Data Models
 * Defines TypeScript interfaces for course-related data structures
 */

/**
 * Course search request payload
 */
export interface CourseSearchRequest {
    request: {
        filters: {
            primaryCategory: string[]
            status?: string[]
            lang: string[]
            channel?: string
            identifier?: string[],  // Optional: filter by specific course IDs
            competency?: boolean
        }
        limit: number
        offset: number
        sort_by: {
            createdOn: string
        }
        fields: string[]
    }
}

/**
 * Competency-based course search request payload
 * Used to search for courses mapped to specific competency levels
 */
export interface CompetencyCourseSearchRequest {
    request: {
        filters: {
            competencySearch: string[]  // e.g., ["100-1", "100-2", "100-3", "100-4", "100-5"]
            lang: string[]
            primaryCategory: string[]
        }
        exists: string[]  // e.g., ["competencies_v1"]
        fields: string[]
    }
}

/**
 * Competency information from course metadata
 * Parsed from the competencies_v1 JSON string field
 */
export interface CompetencyInfo {
    competencyName: string
    competencyId: string | number
    level: string | number
}

/**
 * Course object from Sunbird API
 */
export interface Course {
    identifier: string          // do_id
    name: string               // Course name
    sourceName: string         // Content provider/source
    primaryCategory: string    // Should be 'Course'
    status: string            // Should be 'Live'
    lang: string              // Language code
    createdOn: string         // ISO date string
    updatedOn?: string
    description?: string
    thumbnail?: string
    competencies_v1?: string   // JSON string of CompetencyInfo[]
    competencySearch?: string[] // Array like ["100-1", "100-2"]
}

/**
 * Course search API response
 */
export interface CourseSearchResponse {
    result: {
        content: Course[]
        count: number
    }
}

/**
 * Course with selection state (UI model)
 */
export interface SelectableCourse extends Course {
    selected: boolean
    isPreselected: boolean  // Was in existing playlist
    displayOrder?: number   // For ordering UI
}

/**
 * Ordered course for final payload
 */
export interface OrderedCourse {
    identifier: string
    name: string
    order: number
}
