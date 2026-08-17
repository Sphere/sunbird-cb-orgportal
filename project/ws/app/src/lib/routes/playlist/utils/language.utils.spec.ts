import {
  normalizeLanguage,
  normalizeLanguages,
  expandLanguageFilter,
  expandLanguageFilters,
} from './language.utils'

describe('language.utils', () => {
  describe('normalizeLanguage', () => {
    it('should normalize a full language name to its code, case-insensitively', () => {
      expect(normalizeLanguage('English')).toBe('en')
      expect(normalizeLanguage('EN')).toBe('en')
      expect(normalizeLanguage('hindi')).toBe('hi')
      expect(normalizeLanguage('HINDI')).toBe('hi')
    })

    it('should pass through an already-normalized code', () => {
      expect(normalizeLanguage('hi')).toBe('hi')
    })

    it('should trim whitespace before matching', () => {
      expect(normalizeLanguage('  English  ')).toBe('en')
    })

    it('should return the lowercased input unchanged when there is no match', () => {
      expect(normalizeLanguage('Kannada')).toBe('kannada')
    })
  })

  describe('normalizeLanguages', () => {
    it('should normalize and de-duplicate a list of languages', () => {
      expect(normalizeLanguages(['en', 'English', 'hi', 'HINDI'])).toEqual(['en', 'hi'])
    })

    it('should return an empty array for an empty input', () => {
      expect(normalizeLanguages([])).toEqual([])
    })
  })

  describe('expandLanguageFilter', () => {
    it('should expand a code into both code and full-name variants', () => {
      expect(expandLanguageFilter('en')).toEqual(['en', 'english'])
      expect(expandLanguageFilter('hi')).toEqual(['hi', 'hindi'])
    })

    it('should expand a full name into its code and name variants', () => {
      expect(expandLanguageFilter('English')).toEqual(['en', 'english'])
    })

    it('should return a single-element array for an unmapped language', () => {
      expect(expandLanguageFilter('kannada')).toEqual(['kannada'])
    })
  })

  describe('expandLanguageFilters', () => {
    it('should expand multiple languages and de-duplicate the combined variants', () => {
      expect(expandLanguageFilters(['en', 'hindi'])).toEqual(['en', 'english', 'hi', 'hindi'])
    })

    it('should return an empty array for an empty input', () => {
      expect(expandLanguageFilters([])).toEqual([])
    })
  })
})
