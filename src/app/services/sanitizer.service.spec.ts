import { TestBed } from '@angular/core/testing'
import { DomSanitizer } from '@angular/platform-browser'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { SanitizerService } from './sanitizer.service'

describe('SanitizerService', () => {
  let service: SanitizerService
  let mockDomSanitizer: jest.Mocked<DomSanitizer>

  beforeEach(() => {
    mockDomSanitizer = createSpyObj('DomSanitizer', [
      'bypassSecurityTrustResourceUrl',
      'bypassSecurityTrustUrl',
      'bypassSecurityTrustStyle',
      'bypassSecurityTrustHtml',
      'bypassSecurityTrustScript',
      'sanitize',
    ])
    mockDomSanitizer.bypassSecurityTrustResourceUrl.mockImplementation(v => `safeResourceUrl(${v})` as any)
    mockDomSanitizer.bypassSecurityTrustUrl.mockImplementation(v => `safeUrl(${v})` as any)
    mockDomSanitizer.bypassSecurityTrustStyle.mockImplementation(v => `safeStyle(${v})` as any)
    mockDomSanitizer.bypassSecurityTrustScript.mockImplementation(v => `safeScript(${v})` as any)

    TestBed.configureTestingModule({
      providers: [
        SanitizerService,
        { provide: DomSanitizer, useValue: mockDomSanitizer },
      ],
    })
    service = TestBed.inject(SanitizerService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('isHttpUrl', () => {
    it.each([
      'https://example.com/logo.png',
      'http://example.com/logo.png',
      '//cdn.example.com/logo.png',
      '/frac',
      'mdo-assets/icons/pin.svg',
      '  https://example.com  ',
    ])('accepts safe value: %s', value => {
      expect(service.isHttpUrl(value)).toBe(true)
    })

    it.each([
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      '  javascript:alert(1)  ',
    ])('rejects dangerous scheme: %s', value => {
      expect(service.isHttpUrl(value)).toBe(false)
    })

    it('rejects non-string values', () => {
      expect(service.isHttpUrl(undefined as any)).toBe(false)
      expect(service.isHttpUrl(null as any)).toBe(false)
      expect(service.isHttpUrl(123 as any)).toBe(false)
    })
  })

  describe('trustResourceUrl', () => {
    it('bypasses sanitization for a safe URL', () => {
      const result = service.trustResourceUrl('https://example.com/frame')
      expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('https://example.com/frame')
      expect(result).toBe('safeResourceUrl(https://example.com/frame)')
    })

    it('falls back to an empty string for a javascript: URI', () => {
      const result = service.trustResourceUrl('javascript:alert(document.cookie)')
      expect(mockDomSanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('')
      expect(result).toBe('safeResourceUrl()')
    })
  })

  describe('trustUrl', () => {
    it('bypasses sanitization for a safe URL', () => {
      service.trustUrl('/frac')
      expect(mockDomSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('/frac')
    })

    it('falls back to an empty string for a data: URI', () => {
      service.trustUrl('data:text/html,<script>alert(1)</script>')
      expect(mockDomSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('')
    })
  })

  describe('trustStyleUrl', () => {
    it('builds a url() CSS value for a safe URL', () => {
      service.trustStyleUrl('https://example.com/logo.png')
      expect(mockDomSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith(
        "url('https://example.com/logo.png')",
      )
    })

    it('escapes single quotes so the URL cannot break out of the url() context', () => {
      service.trustStyleUrl("https://example.com/logo.png?x=') } * { color:red")
      expect(mockDomSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith(
        "url('https://example.com/logo.png?x=%27) } * { color:red')",
      )
    })

    it('falls back to an empty string for a javascript: URI', () => {
      service.trustStyleUrl('javascript:alert(1)')
      expect(mockDomSanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith('')
    })
  })

  describe('trustScript', () => {
    it('delegates to DomSanitizer.bypassSecurityTrustScript', () => {
      service.trustScript('doSomething()')
      expect(mockDomSanitizer.bypassSecurityTrustScript).toHaveBeenCalledWith('doSomething()')
    })
  })
})
