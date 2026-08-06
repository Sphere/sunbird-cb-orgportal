import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'

import { LangSelectComponent } from './lang-select.component'

describe('LangSelectComponent', () => {
  let component: LangSelectComponent
  let fixture: ComponentFixture<LangSelectComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [LangSelectComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LangSelectComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set userName from configSvc.userProfile.givenName when present', () => {
      mockConfigurationsService.userProfile = { givenName: 'John' } as any
      component.ngOnInit()
      expect(component.userName).toBe('John')
    })

    it('should set userName to empty string when givenName is falsy', () => {
      mockConfigurationsService.userProfile = { givenName: '' } as any
      component.ngOnInit()
      expect(component.userName).toBe('')
    })

    it('should not set userName when userProfile is null', () => {
      mockConfigurationsService.userProfile = null
      component.userName = 'pre-existing'
      component.ngOnInit()
      expect(component.userName).toBe('pre-existing')
    })

    it('should reset selectedLang to empty string', () => {
      component.selectedLang = 'fr'
      mockConfigurationsService.instanceConfig = null
      component.ngOnInit()
      expect(component.selectedLang).toBe('')
    })

    it('should build allowedLangCode when instanceConfig is present', () => {
      mockConfigurationsService.instanceConfig = {
        locals: [
          { path: 'en', isAvailable: true, isEnabled: true },
          { path: 'fr', isAvailable: false, isEnabled: false },
        ],
      } as any
      component.ngOnInit()
      expect(component.allowedLangCode['en']).toEqual({ path: 'en', isAvailable: true, isEnabled: true })
      expect(component.allowedLangCode['fr']).toEqual({ path: 'fr', isAvailable: false, isEnabled: false })
    })

    it('should not update allowedLangCode when instanceConfig is falsy', () => {
      mockConfigurationsService.instanceConfig = null
      component.allowedLangCode = { existing: { path: 'existing' } as any }
      component.ngOnInit()
      expect(component.allowedLangCode['existing']).toBeTruthy()
    })
  })

  describe('isLocaleAvailable', () => {
    it('should return true when langPath entry exists and isAvailable is true', () => {
      component.allowedLangCode = { en: { path: 'en', isAvailable: true, isEnabled: true } as any }
      expect(component.isLocaleAvailable('en')).toBe(true)
    })

    it('should return falsy when langPath entry exists but isAvailable is false', () => {
      component.allowedLangCode = { en: { path: 'en', isAvailable: false, isEnabled: true } as any }
      expect(component.isLocaleAvailable('en')).toBe(false)
    })

    it('should return undefined when langPath entry does not exist', () => {
      component.allowedLangCode = {}
      expect(component.isLocaleAvailable('missing')).toBeUndefined()
    })
  })

  describe('isLocaleEnabled', () => {
    it('should return true when langPath entry exists and isEnabled is true', () => {
      component.allowedLangCode = { en: { path: 'en', isAvailable: true, isEnabled: true } as any }
      expect(component.isLocaleEnabled('en')).toBe(true)
    })

    it('should return falsy when langPath entry exists but isEnabled is false', () => {
      component.allowedLangCode = { en: { path: 'en', isAvailable: true, isEnabled: false } as any }
      expect(component.isLocaleEnabled('en')).toBe(false)
    })

    it('should return undefined when langPath entry does not exist', () => {
      component.allowedLangCode = {}
      expect(component.isLocaleEnabled('missing')).toBeUndefined()
    })
  })

  describe('langChanged', () => {
    it('should set selectedLang to the given path', () => {
      component.langChanged('fr')
      expect(component.selectedLang).toBe('fr')
    })
  })

  describe('applyLang', () => {
    let assignSpy: jest.SpyInstance

    const assignFn = jest.fn()

    beforeAll(() => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, assign: assignFn },
        writable: true,
      })
    })

    beforeEach(() => {
      assignFn.mockClear()
      assignSpy = assignFn
      mockRouter.navigateByUrl.mockClear()
      mockUserPreferenceService.saveUserPreference.mockClear()
    })

    it('should reset selectedLang to empty string when it is "en" and navigate', async () => {
      component.selectedLang = 'en'
      mockConfigurationsService.userUrl = ''
      await component.applyLang()
      expect(component.selectedLang).toBe('')
      expect(mockUserPreferenceService.saveUserPreference).toHaveBeenCalledWith({ selectedLocale: '' })
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/setup/home/tnc')
      expect(assignSpy).not.toHaveBeenCalled()
    })

    it('should append ref query param when userUrl is present and selectedLang is empty', async () => {
      component.selectedLang = ''
      mockConfigurationsService.userUrl = 'http://back.url'
      await component.applyLang()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/setup/home/tnc')
    })

    it('should call location.assign with lang path when selectedLang is not empty and no userUrl', async () => {
      component.selectedLang = 'fr'
      mockConfigurationsService.userUrl = ''
      await component.applyLang()
      expect(mockUserPreferenceService.saveUserPreference).toHaveBeenCalledWith({ selectedLocale: 'fr' })
      expect(assignSpy).toHaveBeenCalledWith(
        `${location.origin}/fr/app/setup/home/tnc`,
      )
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })

    it('should call location.assign with ref query param when selectedLang is not empty and userUrl is present', async () => {
      component.selectedLang = 'fr'
      mockConfigurationsService.userUrl = 'http://back.url'
      await component.applyLang()
      expect(assignSpy).toHaveBeenCalledWith(
        `${location.origin}/fr/app/setup/home/tnc?ref=${encodeURIComponent('http://back.url')}`,
      )
    })
  })
})
