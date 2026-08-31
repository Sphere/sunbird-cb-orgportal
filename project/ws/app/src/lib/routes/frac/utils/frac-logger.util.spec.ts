import { fracLogger } from './frac-logger.util'

describe('fracLogger', () => {
  let debugSpy: jest.SpyInstance
  let warnSpy: jest.SpyInstance
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation()
    warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    errorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(window as any).__FRAC_DEBUG__ = undefined
    try {
      window.localStorage.removeItem('FRAC_DEBUG')
    } catch {
      // ignore
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    ;(window as any).__FRAC_DEBUG__ = undefined
  })

  describe('when debug mode is disabled', () => {
    it('debug should not log', () => {
      fracLogger.debug('msg')
      expect(debugSpy).not.toHaveBeenCalled()
    })

    it('warn should not log', () => {
      fracLogger.warn('msg')
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('error should not log', () => {
      fracLogger.error('msg')
      expect(errorSpy).not.toHaveBeenCalled()
    })
  })

  describe('when window.__FRAC_DEBUG__ is true', () => {
    beforeEach(() => {
      ;(window as any).__FRAC_DEBUG__ = true
    })

    it('debug should log message only when no payload provided', () => {
      fracLogger.debug('hello')
      expect(debugSpy).toHaveBeenCalledWith('[FRAC] hello')
    })

    it('debug should log message with payload when provided', () => {
      fracLogger.debug('hello', { a: 1 })
      expect(debugSpy).toHaveBeenCalledWith('[FRAC] hello', { a: 1 })
    })

    it('warn should log message only when no payload provided', () => {
      fracLogger.warn('warn-msg')
      expect(warnSpy).toHaveBeenCalledWith('[FRAC] warn-msg')
    })

    it('warn should log message with payload when provided', () => {
      fracLogger.warn('warn-msg', { b: 2 })
      expect(warnSpy).toHaveBeenCalledWith('[FRAC] warn-msg', { b: 2 })
    })

    it('error should log message only when no payload provided', () => {
      fracLogger.error('err-msg')
      expect(errorSpy).toHaveBeenCalledWith('[FRAC] err-msg')
    })

    it('error should log message with payload when provided', () => {
      fracLogger.error('err-msg', { c: 3 })
      expect(errorSpy).toHaveBeenCalledWith('[FRAC] err-msg', { c: 3 })
    })
  })

  describe('when localStorage FRAC_DEBUG is "true"', () => {
    beforeEach(() => {
      window.localStorage.setItem('FRAC_DEBUG', 'true')
    })

    afterEach(() => {
      window.localStorage.removeItem('FRAC_DEBUG')
    })

    it('should enable logging via localStorage flag', () => {
      fracLogger.debug('via-storage')
      expect(debugSpy).toHaveBeenCalledWith('[FRAC] via-storage')
    })
  })

  describe('when accessing localStorage throws', () => {
    it('should treat debug mode as disabled and not throw', () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('denied')
        },
      })
      expect(() => fracLogger.debug('boom')).not.toThrow()
      expect(debugSpy).not.toHaveBeenCalled()
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    })
  })
})
