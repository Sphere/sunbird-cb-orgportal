/** One org as returned by the org-search API (`result.response.content[]`). */
export interface IOrganization {
  id: string
  orgName?: string
  channel?: string
  isTenant?: boolean
  organisationType?: string
  organisationSubType?: string
  status?: number
  createdDate?: string
}

export interface IOrgSearchResponse {
  result: { response: { content: IOrganization[], count?: number } }
}

/** Body of the create call — confirmed against the real create curl. */
export interface IOrgCreateRequest {
  orgName: string
  channel: string
  isTenant: boolean
  organisationType: string
  organisationSubType: string
}

/** Body of the update call (standard Sunbird `org/v1/update`, not yet confirmed against a real curl). */
export interface IOrgUpdateRequest {
  organisationId: string
  orgName: string
  organisationType: string
  organisationSubType: string
}

export interface IOrgApiResponse {
  responseCode?: string
  result?: Record<string, unknown>
  params?: { status?: string, errmsg?: string }
}
