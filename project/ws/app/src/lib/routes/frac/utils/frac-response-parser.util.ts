import { FracUploadEntityBlock } from '../models/frac-api.models'

type ParsedFracPayload = {
  params?: {
    errmsg?: string
    status?: string
    [key: string]: unknown
  }
  responseCode?: unknown
  result?: unknown
  message?: string
  errmsg?: string
  error_description?: string
  status?: unknown
  statusText?: unknown
  code?: unknown
  [key: string]: unknown
} | null

/**
 * Helper class for reading FRAC upload API responses.
 * All methods are pure functions and do not mutate component state.
 */
export class FracResponseParserUtil {
  /**
   * Resolves upload API payload from string/blob/object into a normalized shape.
   * Useful when proxies return JSON bodies as Blob/text even on non-success business responses.
   */
  static async resolveApiPayload(response: unknown): Promise<ParsedFracPayload> {
    if (response instanceof Blob) {
      try {
        const text = await response.text()
        return this.parseApiResponse(text)
      } catch {
        return this.parseApiResponse(response)
      }
    }

    return this.parseApiResponse(response)
  }

  /**
   * Normalizes API payload into a readable object.
   */
  static parseApiResponse(response: unknown): ParsedFracPayload {
    if (response === null || response === undefined) {
      return null
    }

    if (typeof response === 'string') {
      const trimmed = response.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed) as Record<string, unknown>
        } catch {
          // Fallback below
        }
      }
      return { params: { errmsg: response } }
    }

    if (Array.isArray(response)) {
      return { result: response }
    }

    if (typeof response !== 'object') {
      return { params: { errmsg: String(response) } }
    }

    const normalized = response as Record<string, unknown>

    // 🎯 If it already looks like a valid FRAC payload, return it directly.
    if (this.looksLikeUploadPayload(normalized)) {
      return normalized
    }

    // 🔍 Otherwise, look deeper into common wrapper keys.
    const nestedCandidates = [
      normalized.error,
      normalized.result,
      normalized.body,
      normalized.data,
      normalized.response,
      normalized.rejection,
      normalized.payload,
      normalized.text,
    ]

    for (const candidate of nestedCandidates) {
      if (candidate === null || candidate === undefined) {
        continue
      }

      const normalizedCandidate = this.parseApiResponse(candidate)
      // If we found something that looks like an upload payload OR just has a message, take it.
      if (normalizedCandidate && (this.looksLikeUploadPayload(normalizedCandidate) || this.getRawMessage(normalizedCandidate))) {
        return normalizedCandidate
      }
    }

    return normalized
  }

  /**
   * Extracts a safe upload error payload from HttpClient error objects.
   */
  static async readErrorPayload(err: unknown): Promise<ParsedFracPayload> {
    // 1️⃣ Try parsing the error object directly (handles objects containing .error/.body)
    const normalizedDirect = this.parseApiResponse(err)
    if (normalizedDirect && this.looksLikeUploadPayload(normalizedDirect)) {
      return normalizedDirect
    }

    // 2️⃣ Try reading from the .error property explicitly if it's a string/blob/object
    const rawError = (err as { error?: unknown } | undefined)?.error
    if (rawError instanceof Blob) {
      try {
        const text = await rawError.text()
        const normalizedFromBlob = this.parseApiResponse(text)
        if (normalizedFromBlob) {
          return normalizedFromBlob
        }
      } catch {
        // Fallback
      }
    }

    if (typeof rawError === 'string') {
      const normalizedFromString = this.parseApiResponse(rawError)
      if (normalizedFromString) {
        return normalizedFromString
      }
    }

    if (rawError && typeof rawError === 'object') {
      const normalizedFromObj = this.parseApiResponse(rawError)
      if (normalizedFromObj) {
        return normalizedFromObj
      }
    }

    return normalizedDirect
  }

  /**
   * Returns true when message text is useful for end users.
   */
  static isUsefulMessage(message: string | undefined): boolean {
    const normalized = (message || '').trim().toLowerCase()
    if (!normalized) {
      return false
    }
    return !this.isVagueErrorText(normalized)
  }

  /**
   * Returns true for generic non-actionable error words.
   */
  static isVagueErrorText(text: string): boolean {
    const normalized = (text || '').trim().toLowerCase()
    return (
      normalized === 'error' ||
      normalized === 'failed' ||
      normalized === 'bad request' ||
      normalized === 'request failed' ||
      normalized === 'internal server error' ||
      normalized === 'service unavailable'
    )
  }

  /**
   * Extracts the rawest form of an error message from a normalized payload.
   */
  static getRawMessage(payload: ParsedFracPayload): string | undefined {
    if (!payload) {
      console.warn('[FracResponseParser] getRawMessage: payload is null/undefined')
      return undefined
    }

    console.log('[FracResponseParser] getRawMessage input:', payload)

    // Extract from params.errmsg first (most specific)
    const paramsErrmsg = payload.params?.errmsg
    if (paramsErrmsg && typeof paramsErrmsg === 'string' && paramsErrmsg.trim()) {
      console.log('[FracResponseParser] Found params.errmsg:', paramsErrmsg)
      return paramsErrmsg.trim()
    }

    // Fallback to other fields
    if (payload.errmsg && typeof payload.errmsg === 'string' && payload.errmsg.trim()) {
      console.log('[FracResponseParser] Found errmsg:', payload.errmsg)
      return payload.errmsg.trim()
    }

    if (payload.message && typeof payload.message === 'string' && payload.message.trim()) {
      console.log('[FracResponseParser] Found message:', payload.message)
      return payload.message.trim()
    }

    if (payload.error_description && typeof payload.error_description === 'string' && payload.error_description.trim()) {
      console.log('[FracResponseParser] Found error_description:', payload.error_description)
      return payload.error_description.trim()
    }

    // Last resort: params.status
    const paramsStatus = payload.params?.status
    if (paramsStatus && typeof paramsStatus === 'string' && paramsStatus.trim()) {
      console.log('[FracResponseParser] Found params.status:', paramsStatus)
      return paramsStatus.trim()
    }

    console.warn('[FracResponseParser] No message found in payload')
    return undefined
  }

  /**
   * Validates upload success based on status and generated success codes.
   */
  static isUploadSuccessful(response: unknown, expectedEntityType?: string): boolean {
    const normalizedResponse = this.parseApiResponse(response)
    if (!normalizedResponse) {
      return false
    }

    const responseCode = (normalizedResponse.responseCode || '').toString().toLowerCase()
    const paramsStatus = ((normalizedResponse.params as Record<string, unknown> | undefined)?.status || '').toString().toLowerCase()

    const hasSuccessStatus =
      responseCode === 'ok' ||
      responseCode === '200 ok' ||
      responseCode === 'created' ||
      responseCode === '201 created' ||
      paramsStatus === 'success' ||
      paramsStatus === 'ok' ||
      paramsStatus === '200 ok' ||
      paramsStatus === 'created' ||
      paramsStatus === '201 created'

    if (hasSuccessStatus) {
      return true
    }

    // Also check if we have success codes even without explicit success status
    return this.getSuccessCodes(normalizedResponse, expectedEntityType).length > 0
  }

  /**
   * Reads uploaded entity codes from both legacy and new response contracts.
   */
  static getSuccessCodes(response: unknown, expectedEntityType?: string): string[] {
    const normalizedResponse = this.parseApiResponse(response)
    const entityBlocks = this.getEntityBlocks(normalizedResponse)
    const expectedType = (expectedEntityType || '').toLowerCase()
    const collectedCodes: string[] = []

    entityBlocks.forEach((item) => {
      const entityType = (item?.entityType || '').toString().toLowerCase()
      if (expectedType && entityType !== expectedType) {
        return
      }

      const entityCodes = Array.isArray(item?.entityCode) ? item.entityCode : []
      entityCodes.forEach((code) => {
        const normalizedCode = (code ?? '').toString().trim()
        if (normalizedCode) {
          collectedCodes.push(normalizedCode)
        }
      })
    })

    return collectedCodes
  }

  /**
   * Reads all affected codes, including partial failures.
   */
  static getAffectedCodes(response: unknown): string[] {
    const normalizedResponse = this.parseApiResponse(response)
    const uploadedCodes = this.getSuccessCodes(normalizedResponse)
    if (uploadedCodes.length) {
      return uploadedCodes
    }

    const resultValue = normalizedResponse?.result
    if (Array.isArray(resultValue)) {
      return resultValue
        .map((item) => ((item as Record<string, unknown>)?.code ?? '').toString().trim())
        .filter(Boolean)
    }

    return []
  }

  /**
   * Returns entity blocks from legacy and latest payload variants.
   */
  static getEntityBlocks(response: ParsedFracPayload): FracUploadEntityBlock[] {
    if (!response) {
      return []
    }

    const resultObject = (response.result || {}) as Record<string, unknown>
    const legacyEntityType = resultObject.entityType
    const legacyEntityCodes = Array.isArray(resultObject.entityCode) ? resultObject.entityCode : []
    const entityList = Array.isArray(resultObject.entity) ? resultObject.entity : []
    const blocks: FracUploadEntityBlock[] = [...(entityList as FracUploadEntityBlock[])]

    if (legacyEntityType || legacyEntityCodes.length) {
      blocks.push({
        entityType: legacyEntityType?.toString(),
        entityCode: legacyEntityCodes.map(code => (code ?? '').toString()).filter(Boolean),
      })
    }

    return blocks
  }

  /**
   * Builds readable error details by removing duplicates and vague text.
   */
  static formatErrorDetails(responseCode: unknown, paramsStatus: unknown, affectedCodesDetails?: string): string | undefined {
    const uniqueDetails: string[] = []
    const seen = new Set<string>()

    const appendIfUnique = (value: unknown): void => {
      const detail = (value ?? '').toString().trim()
      if (!detail) {
        return
      }

      const normalized = detail.toLowerCase()
      if (this.isVagueErrorText(normalized)) {
        return
      }

      if (seen.has(normalized)) {
        return
      }

      seen.add(normalized)
      uniqueDetails.push(detail)
    }

    appendIfUnique(responseCode)
    appendIfUnique(paramsStatus)
    appendIfUnique(affectedCodesDetails)

    return uniqueDetails.length ? uniqueDetails.join('\n') : undefined
  }

  /**
   * Extracts structured information from the `result` block of the API response, e.g., missing properties or row indices.
   */
  static getStructuredErrorDetails(response: unknown): { key: string; values: any[] }[] {
    const normalizedResponse = this.parseApiResponse(response)
    const resultObj = normalizedResponse?.result
    if (!resultObj || typeof resultObj !== 'object' || Array.isArray(resultObj)) {
      return []
    }

    const details: { key: string; values: any[] }[] = []
    Object.keys(resultObj).forEach((key) => {
      const vals = (resultObj as Record<string, any>)[key]
      if (Array.isArray(vals) && vals.length > 0) {
        details.push({ key, values: vals })
      }
    })
    return details
  }

  static looksLikeUploadPayload(payload: Record<string, unknown>): boolean {
    if (!payload || typeof payload !== 'object') {
      return false
    }
    const resultObject = (payload.result || {}) as Record<string, unknown>
    return (
      Boolean((payload.params as Record<string, unknown> | undefined)?.errmsg) ||
      Boolean(payload.responseCode) ||
      Boolean(resultObject.entityCode) ||
      Array.isArray(resultObject.entity) ||
      Array.isArray(payload.result)
    )
  }
}
