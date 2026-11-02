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
  const body = (err as { error?: unknown } | null)?.error
  if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
    return (body as { error: string }).error
  }
  return fallback
}
