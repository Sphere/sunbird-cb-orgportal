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
   * Normalizes API payload into a readable object.
   */
  static parseApiResponse(response: unknown): ParsedFracPayload {
    if (response === null || response === undefined) {
      return null
    }

    if (typeof response === 'string') {
      try {
        return JSON.parse(response) as Record<string, unknown>
      } catch {
        return { params: { errmsg: response } }
      }
    }

    if (Array.isArray(response)) {
      return { result: response }
    }

    if (typeof response !== 'object') {
      return { params: { errmsg: String(response) } }
    }

    const normalized = response as Record<string, unknown>
    if (this.looksLikeUploadPayload(normalized)) {
      return normalized
    }

    const nestedCandidates = [
      normalized.error,
      normalized.body,
      normalized.data,
      normalized.response,
      normalized.rejection,
      normalized.payload,
      normalized.text,
    ]

    for (const candidate of nestedCandidates) {
      if (!candidate) {
        continue
      }

      const normalizedCandidate = this.parseApiResponse(candidate)
      if (normalizedCandidate && this.looksLikeUploadPayload(normalizedCandidate)) {
        return normalizedCandidate
      }
    }

    return normalized
  }

  /**
   * Extracts a safe upload error payload from HttpClient error objects.
   */
  static async readErrorPayload(err: unknown): Promise<ParsedFracPayload> {
    const normalizedDirect = this.parseApiResponse(err)
    if (normalizedDirect && this.looksLikeUploadPayload(normalizedDirect)) {
      return normalizedDirect
    }

    const rawError = (err as { error?: unknown } | undefined)?.error
    if (rawError instanceof Blob) {
      try {
        const text = await rawError.text()
        const normalizedFromBlob = this.parseApiResponse(text)
        if (normalizedFromBlob && this.looksLikeUploadPayload(normalizedFromBlob)) {
          return normalizedFromBlob
        }
      } catch {
        // Keep the fallback below.
      }
    }

    if (typeof rawError === 'string') {
      const normalizedFromString = this.parseApiResponse(rawError)
      if (normalizedFromString && this.looksLikeUploadPayload(normalizedFromString)) {
        return normalizedFromString
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
      normalized === 'request failed'
    )
  }

  /**
   * Validates upload success based on status and generated success codes.
   */
  static isUploadSuccessful(response: unknown, expectedEntityType?: string): boolean {
    const normalizedResponse = this.parseApiResponse(response)
    const responseCode = (normalizedResponse?.responseCode || '').toString().toLowerCase()
    const paramsStatus = ((normalizedResponse?.params as Record<string, unknown> | undefined)?.status || '').toString().toLowerCase()

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

    return hasSuccessStatus && this.getSuccessCodes(normalizedResponse, expectedEntityType).length > 0
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
    const entries = Array.isArray(resultValue) ? resultValue : []
    return entries
      .map((item) => ((item as Record<string, unknown>)?.code ?? '').toString().trim())
      .filter(Boolean)
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

  private static looksLikeUploadPayload(payload: Record<string, unknown>): boolean {
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
