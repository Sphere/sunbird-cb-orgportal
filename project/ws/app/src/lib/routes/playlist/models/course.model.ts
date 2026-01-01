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
            status: string[]
            lang: string[]
            channel: string
        }
        limit: number
        offset: number
        sort_by: {
            createdOn: string
        }
    }
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
