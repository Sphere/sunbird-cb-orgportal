/**
 * Reads the filename from a Content-Disposition header, preferring the RFC 5987
 * `filename*=UTF-8''…` form the service sends. Returns the fallback when absent.
 */
export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) {
    return fallback
  }
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim())
    } catch {
      return fallback
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain ? plain[1].trim() : fallback
}

/** Hands a downloaded blob to the browser as a file. The only side effect in this file. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Message to show for a failed call: the service's `{ error }` text when it sent one. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  return apiError(err)?.message ?? fallback
}

/**
 * The service's coded error, from `{ error: { code, message } }` (frac-studio-service ApiError).
 * The older `{ error: "message" }` shape is still read so an older service build keeps working.
 */
export function apiError(err: unknown): { code: string, message: string } | null {
  const body = (err as { error?: unknown } | null)?.error
  const inner = body && typeof body === 'object' ? (body as { error?: unknown }).error : undefined
  if (inner && typeof inner === 'object') {
    const { code, message } = inner as { code?: unknown, message?: unknown }
    if (typeof message === 'string') {
      return { code: typeof code === 'string' ? code : '', message }
    }
  }
  if (typeof inner === 'string') {
    return { code: '', message: inner }
  }
  return null
}
