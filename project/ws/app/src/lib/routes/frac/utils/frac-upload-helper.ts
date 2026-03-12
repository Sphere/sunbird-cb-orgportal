import { FracResponseParserUtil } from './frac-response-parser.util'
import { UploadResultData } from '../components/upload-result-modal/upload-result-modal.component'

/**
 * Pure helper utility for processing FRAC file upload errors.
 * Extracts the duplicated logic from upload UI components.
 */
export class FracUploadHelper {

  /**
   * Reads an error object from HttpClient and resolves it into a normalized
   * modal data configuration to be displayed to the user.
   *
   * @param err Any error object, typically HttpErrorResponse.
   * @returns Configuration for the UploadResultModal.
   */
  static async resolveErrorToModalData(err: unknown): Promise<UploadResultData> {
    const resolvedPayload = await FracResponseParserUtil.readErrorPayload(err)
    const errObj = (err && typeof err === 'object' ? err : {}) as Record<string, unknown>

    if (
      (resolvedPayload?.params as Record<string, unknown> | undefined)?.errmsg ||
      resolvedPayload?.responseCode ||
      resolvedPayload?.result ||
      resolvedPayload?.message
    ) {
      return this.createFailureModalData(resolvedPayload)
    }

    const httpStatusText = errObj.statusText as string | undefined
    const message = errObj.message as string | undefined
    const httpStatus = errObj.status as number | undefined

    return {
      type: 'error',
      title: 'Upload Failed',
      message: httpStatusText || message || 'An unexpected error occurred while uploading your file.',
      errorDetails: httpStatus ? `HTTP Status: ${httpStatus}` : undefined,
    }
  }

  /**
   * Internal method to build the detailed modal data from a resolved API payload.
   */
  static createFailureModalData(response: unknown): UploadResultData {
    const normalizedResponse = FracResponseParserUtil.parseApiResponse(response)
    const apiMessage = FracResponseParserUtil.getRawMessage(normalizedResponse)
    const responseCode =
      normalizedResponse?.responseCode ||
      normalizedResponse?.code ||
      normalizedResponse?.status
    const paramsStatus =
      (normalizedResponse?.params as Record<string, unknown> | undefined)?.status ||
      normalizedResponse?.statusText
    const affectedCodes = FracResponseParserUtil.getAffectedCodes(normalizedResponse)
    const affectedCodesDetails = affectedCodes.length
      ? `Affected Codes: ${affectedCodes.join(', ')}`
      : undefined

    let message: string
    if (apiMessage && apiMessage.trim()) {
      message = apiMessage.trim()
    } else if (affectedCodes.length) {
      message = 'Multiple occurrences or duplicates found.'
    } else {
      message = 'Upload failed. Please verify your file and try again.'
    }

    return {
      type: 'error',
      title: 'Upload Failed',
      message,
      errorDetails: FracResponseParserUtil.formatErrorDetails(responseCode, paramsStatus, affectedCodesDetails),
      resultDetails: FracResponseParserUtil.getStructuredErrorDetails(response)
    }
  }
}
