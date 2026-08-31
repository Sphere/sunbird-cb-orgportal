import { WindowRef, BrowserWindowRef, windowFactory } from './window.service'

describe('WindowRef', () => {
  it('should throw "Not implemented." when nativeWindow is accessed on the abstract base', () => {
    class NoopWindowRef extends WindowRef {}
    const ref = new NoopWindowRef()
    expect(() => ref.nativeWindow).toThrow('Not implemented.')
  })
})

describe('BrowserWindowRef', () => {
  it('should return the global window object', () => {
    const ref = new BrowserWindowRef()
    expect(ref.nativeWindow).toBe(window)
  })
})

describe('windowFactory', () => {
  it('should return the native window when running in a browser platform', () => {
    const browserWindowRef = new BrowserWindowRef()
    const result = windowFactory(browserWindowRef, 'browser')
    expect(result).toBe(window)
  })

  it('should return an empty object when not running in a browser platform', () => {
    const browserWindowRef = new BrowserWindowRef()
    const result = windowFactory(browserWindowRef, 'server')
    expect(result).toEqual({})
    expect(result).not.toBe(window)
  })
})
