/**
 * Language utility functions for handling case-insensitive language filtering.
 * Supports both language codes (en, hi) and full names (English, Hindi).
 */

const LANGUAGE_MAPPING: { [key: string]: string[] } = {
    en: ['en', 'english'],
    hi: ['hi', 'hindi'],
}

/**
 * Normalizes language input to standard code format (e.g., "en", "hi").
 * Handles both language codes and full names in a case-insensitive manner.
 *
 * @param language Language code or name (e.g., "en", "English", "hi", "Hindi")
 * @returns Normalized language code (e.g., "en", "hi"), or original input if no match
 *
 * @example
 * normalizeLanguage("English") // returns "en"
 * normalizeLanguage("EN") // returns "en"
 * normalizeLanguage("hindi") // returns "hi"
 * normalizeLanguage("hi") // returns "hi"
 */
export function normalizeLanguage(language: string): string {
    const normalizedInput = language.toLowerCase().trim()

    for (const [code, aliases] of Object.entries(LANGUAGE_MAPPING)) {
        if (aliases.includes(normalizedInput)) {
            return code
        }
    }

    return normalizedInput
}

/**
 * Normalizes an array of language values for API filtering.
 * Ensures unique values and handles case-insensitive matching.
 *
 * @param languages Array of language codes/names
 * @returns Array of normalized language codes with duplicates removed
 *
 * @example
 * normalizeLanguages(["en", "English", "hi", "HINDI"])
 * // returns ["en", "hi"]
 */
export function normalizeLanguages(languages: string[]): string[] {
    const normalized = languages.map(lang => normalizeLanguage(lang))
    return [...new Set(normalized)]
}

/**
 * Expands language filter to include both code and full name variants.
 * Useful for backward compatibility when API accepts both formats.
 *
 * @param language Language code or name
 * @returns Array with both code and name variants (e.g., ["en", "english"])
 *
 * @example
 * expandLanguageFilter("en") // returns ["en", "english"]
 * expandLanguageFilter("hi") // returns ["hi", "hindi"]
 */
export function expandLanguageFilter(language: string): string[] {
    const normalized = normalizeLanguage(language)
    return LANGUAGE_MAPPING[normalized] || [normalized]
}

/**
 * Expands multiple languages for filtering that needs both code and name variants.
 *
 * @param languages Array of language codes/names
 * @returns Array with all variants (e.g., ["en", "english", "hi", "hindi"])
 *
 * @example
 * expandLanguageFilters(["en", "hindi"])
 * // returns ["en", "english", "hi", "hindi"]
 */
export function expandLanguageFilters(languages: string[]): string[] {
    const normalized = normalizeLanguages(languages)
    const expanded: string[] = []
    normalized.forEach(lang => {
        const variants = LANGUAGE_MAPPING[lang] || [lang]
        expanded.push(...variants)
    })
    return [...new Set(expanded)]
}
