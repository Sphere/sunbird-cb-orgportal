/**
 * Competency Level Configuration
 * 
 * This configuration makes the level system flexible and future-proof.
 * Currently set to 5 levels (L1-L5), but can be easily changed to 4, 7, or any number.
 * 
 * @module CompetencyConfig
 */

/**
 * Competency configuration constants
 */
export const COMPETENCY_CONFIG = {
    /**
     * Default number of levels for each competency
     * 
     * Current: 5 (L1, L2, L3, L4, L5)
     * Can be changed to: 4, 7, 10, etc. as needed in future
     */
    DEFAULT_LEVEL_COUNT: 5,

    /**
     * Minimum level number (always starts from 1)
     */
    MIN_LEVEL: 1,

    /**
     * Maximum allowed levels (for validation)
     */
    MAX_LEVEL: 10,
} as const

/**
 * Get the configured number of levels
 * @returns The number of levels defined in configuration
 */
export function getLevelCount(): number {
    return COMPETENCY_CONFIG.DEFAULT_LEVEL_COUNT
}

/**
 * Generate array of level numbers based on configuration
 * 
 * @returns Array of level numbers [1, 2, 3, 4, 5] for 5 levels
 * 
 * @example
 * ```typescript
 * // For DEFAULT_LEVEL_COUNT = 5
 * getLevelNumbers() // Returns [1, 2, 3, 4, 5]
 * 
 * // For DEFAULT_LEVEL_COUNT = 7 (future)
 * getLevelNumbers() // Returns [1, 2, 3, 4, 5, 6, 7]
 * ```
 */
export function getLevelNumbers(): number[] {
    return Array.from(
        { length: COMPETENCY_CONFIG.DEFAULT_LEVEL_COUNT },
        (_, i) => COMPETENCY_CONFIG.MIN_LEVEL + i
    )
}

/**
 * Validate if a level number is within valid range
 * @param level The level number to validate
 * @returns True if level is valid, false otherwise
 */
export function isValidLevel(level: number): boolean {
    return level >= COMPETENCY_CONFIG.MIN_LEVEL &&
        level <= COMPETENCY_CONFIG.DEFAULT_LEVEL_COUNT
}
