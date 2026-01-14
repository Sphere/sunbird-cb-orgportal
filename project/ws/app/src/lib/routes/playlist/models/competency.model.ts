/**
 * Competency Data Models
 */

export interface Competency {
    id: string
    code: string
    name: string
    description?: string
    type?: string
    status?: string
    selected?: boolean
    displayOrder?: number
    coursesAssigned?: boolean
    levels?: CompetencyLevel[]
}

export interface CompetencyLevel {
    level: number
    name?: string
    description?: string
    courseId?: string
    courseName?: string
}


export interface CompetencySearchRequest {
    request: {
        entity: {
            type: string
            query?: {
                code?: string
                name?: string
            }
            limit?: number
            offset?: number
        }
    }
}

export interface CompetencySearchResponse {
    result: {
        entity: Competency[]
        count?: number
    }
}

export interface SelectableCompetency extends Competency {
    selected: boolean
    isPreselected?: boolean
    displayOrder: number
    coursesAssigned: boolean
    levels: CompetencyLevel[]
}

