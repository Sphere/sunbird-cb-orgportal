import { TestBed } from '@angular/core/testing'
import { DynamicAssetsLoaderService } from './dynamic-assets-loader.service'

describe('DynamicAssetsLoaderService', () => {
  let service: DynamicAssetsLoaderService

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DynamicAssetsLoaderService] })
    service = TestBed.inject(DynamicAssetsLoaderService)
    document.body.innerHTML = ''
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('loadScript', () => {
    it('resolves true immediately when url already marked loaded', async () => {
      service.urlLoadStatus.set('a.js', true)
      const result = await service.loadScript('a.js')
      expect(result).toBe(true)
    })

    it('appends a script element and resolves true on load event', async () => {
      const promise = service.loadScript('b.js')
      const elem = document.querySelector('script[src="b.js"]') as HTMLScriptElement
      expect(elem).toBeTruthy()
      elem.dispatchEvent(new Event('load'))
      const result = await promise
      expect(result).toBe(true)
      expect(service.urlLoadStatus.get('b.js')).toBe(true)
      expect(service.urlElemMapping.has('b.js')).toBe(false)
    })

    it('reuses existing element mapping for the same url on second call', async () => {
      const first = service.loadScript('c.js')
      const elem = document.querySelector('script[src="c.js"]') as HTMLScriptElement
      const second = service.loadScript('c.js')
      elem.dispatchEvent(new Event('load'))
      await first
      const secondResult = await second
      expect(secondResult).toBe(true)
      expect(document.querySelectorAll('script[src="c.js"]')).toHaveLength(1)
    })

    it('returns false when appendChild throws', async () => {
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => {
        throw new Error('fail')
      })
      const result = await service.loadScript('d.js')
      expect(result).toBe(false)
      jest.restoreAllMocks()
    })
  })

  describe('loadStyle', () => {
    it('resolves true immediately when url already marked loaded', async () => {
      service.urlLoadStatus.set('a.css', true)
      const result = await service.loadStyle('a.css')
      expect(result).toBe(true)
    })

    it('appends a link element and marks loaded', async () => {
      const result = await service.loadStyle('b.css')
      expect(result).toBe(true)
      const elem = document.querySelector('link[href="b.css"]') as HTMLLinkElement
      expect(elem).toBeTruthy()
      expect(elem.rel).toBe('stylesheet')
      expect(service.urlLoadStatus.get('b.css')).toBe(true)
    })

    it('returns false when appendChild throws', async () => {
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => {
        throw new Error('fail')
      })
      const result = await service.loadStyle('c.css')
      expect(result).toBe(false)
      jest.restoreAllMocks()
    })
  })
})
