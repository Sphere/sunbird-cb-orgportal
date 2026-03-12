declare global {
  interface Window {
    __FRAC_DEBUG__?: boolean
  }
}

/**
 * Lightweight logger for FRAC module.
 * Logs only when debug mode is explicitly enabled.
 */
class FracLogger {
  private isEnabled(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    if (window.__FRAC_DEBUG__ === true) {
      return true
    }

    try {
      return window.localStorage?.getItem('FRAC_DEBUG') === 'true'
    } catch {
      return false
    }
  }

  /**
   * Writes debug details when FRAC debug mode is on.
   */
  debug(message: string, payload?: unknown): void {
    if (!this.isEnabled()) {
      return
    }

    if (payload === undefined) {
      // eslint-disable-next-line no-console
      console.debug(`[FRAC] ${message}`)
      return
    }

    // eslint-disable-next-line no-console
    console.debug(`[FRAC] ${message}`, payload)
  }

  /**
   * Writes warning details when FRAC debug mode is on.
   */
  warn(message: string, payload?: unknown): void {
    if (!this.isEnabled()) {
      return
    }

    if (payload === undefined) {
      // eslint-disable-next-line no-console
      console.warn(`[FRAC] ${message}`)
      return
    }

    // eslint-disable-next-line no-console
    console.warn(`[FRAC] ${message}`, payload)
  }

  /**
   * Writes error details when FRAC debug mode is on.
   */
  error(message: string, payload?: unknown): void {
    if (!this.isEnabled()) {
      return
    }

    if (payload === undefined) {
      // eslint-disable-next-line no-console
      console.error(`[FRAC] ${message}`)
      return
    }

    // eslint-disable-next-line no-console
    console.error(`[FRAC] ${message}`, payload)
  }
}

export const fracLogger = new FracLogger()
