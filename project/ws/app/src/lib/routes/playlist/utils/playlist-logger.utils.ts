/**
 * Lightweight logging wrapper for the playlist module.
 * Centralises all console access so it can be swapped out (e.g. for a real
 * logging service) without touching individual components or services.
 *
 * Only emits in non-production environments.
 * Usage:
 *   import { log } from '../../utils/playlist-logger.utils'
 *   log.error('Something went wrong', err)
 */

const isProd = typeof window !== 'undefined' && (window as Window & { isProduction?: boolean }).isProduction === true

/* eslint-disable no-console */
export const log = {
    error: (message: string, ...args: unknown[]): void => {
        if (!isProd) { console.error(`[Playlist] ${message}`, ...args) }
    },
    warn: (message: string, ...args: unknown[]): void => {
        if (!isProd) { console.warn(`[Playlist] ${message}`, ...args) }
    },
    info: (message: string, ...args: unknown[]): void => {
        if (!isProd) { console.info(`[Playlist] ${message}`, ...args) }
    },
}
/* eslint-enable no-console */
