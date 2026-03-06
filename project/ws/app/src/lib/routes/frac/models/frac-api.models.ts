export type FracEntityType = 'competency' | 'activity' | 'role' | 'position'

export interface FracApiParams {
  status?: string
  errmsg?: string
  [key: string]: unknown
}

export interface FracEntityChild {
  level?: string
  levelId?: number
  levelNumber?: number
  levelName?: string
  levelDescription?: string
  name?: string
  description?: string
  entityName?: string
  entityDescription?: string
  language?: string
  competencies?: Array<FracEntityChild | number | string | Record<string, unknown>>
  entityType?: string
  entityCode?: string
  childHierarchy?: FracEntityChild[]
  [key: string]: unknown
}

export interface FracApiEntity {
  id?: string | number
  entityId?: string
  code?: string
  name?: string
  description?: string
  type?: string
  status?: string
  area?: string
  languageCode?: string
  entityType?: string
  level?: string | null
  levelId?: number | null
  source?: string | null
  additionalProperties?: Record<string, unknown> | null
  children?: FracEntityChild[]
  levels?: FracEntityChild[]
  competencyLevels?: FracEntityChild[]
  createdAt?: string | null
  updatedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  [key: string]: unknown
}

export interface FracSearchRequest {
  entityType: string
  language: string
  query: string
  strict: string
  field: string[]
}

export interface FracSearchResponse {
  responseCode?: string
  params?: FracApiParams
  result?: {
    count?: number
    entity?: FracApiEntity[]
    data?: {
      entity?: FracApiEntity[]
    }
    [key: string]: unknown
  }
  data?: {
    entity?: FracApiEntity[]
    [key: string]: unknown
  }
  entity?: FracApiEntity[]
  [key: string]: unknown
}

export type FracUpdateEntityPayload = Record<string, unknown>
export type FracUpdateEntityRequest = FracUpdateEntityPayload[]

export interface FracUpdateEntityResponse {
  responseCode?: string
  params?: FracApiParams
  result?: unknown
  [key: string]: unknown
}

export interface FracDeleteEntityRequestItem {
  entityCode: string
  entityType: string
  language: string
  purgeAllLanguage?: boolean | null
}

export type FracDeleteEntityRequest = FracDeleteEntityRequestItem[]

export interface FracDeleteEntityResponse {
  responseCode?: string
  params?: FracApiParams
  result?: unknown
  [key: string]: unknown
}

export interface FracMapEntityRequestItem {
  parentEntityType: string
  parentEntityCode: string
  childEntityType?: string
  childEntityCode?: string
  competencies?: Array<number | string | Record<string, unknown>>
}

export type FracMapEntityRequest = FracMapEntityRequestItem[]

export interface FracMapEntityResponse {
  responseCode?: string
  params?: FracApiParams
  result?: FracMapEntityRequestItem[]
  [key: string]: unknown
}

export interface FracMappingSearchRequest {
  entityType: string
  entityCode: string
  entityLanguage: string
}

export interface FracMappingSearchResponse {
  responseCode?: string
  params?: FracApiParams
  result?: FracEntityChild[]
  [key: string]: unknown
}

export interface FracHierarchyNode {
  entityType?: string
  entityCode?: string
  entityName?: string
  entityDescription?: string
  language?: string
  competencies?: Array<FracEntityChild | number | string | Record<string, unknown>> | null
  children?: FracHierarchyNode[] | null
  childHierarchy?: FracHierarchyNode[] | null
  [key: string]: unknown
}

export interface FracHierarchyResponse {
  responseCode?: string
  params?: FracApiParams
  result?: FracHierarchyNode | FracHierarchyNode[]
  [key: string]: unknown
}

export interface FracUploadEntityBlock {
  entityType?: string
  entityCode?: string[]
  [key: string]: unknown
}

export interface FracUploadResponse {
  responseCode?: string
  params?: FracApiParams
  result?: {
    entityType?: string
    entityCode?: string[]
    count?: number
    entity?: FracUploadEntityBlock[]
    [key: string]: unknown
  } | Array<Record<string, unknown>>
  message?: string
  error_description?: string
  status?: string | number
  statusText?: string
  code?: string | number
  [key: string]: unknown
}

export type FracUploadApiResponse = FracUploadResponse | string | Record<string, unknown>
