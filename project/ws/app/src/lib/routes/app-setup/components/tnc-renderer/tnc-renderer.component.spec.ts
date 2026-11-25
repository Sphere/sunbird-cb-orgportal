import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core'

import { TncRendererComponent } from './tnc-renderer.component'

@Pipe({ name: 'pipeSafeSanitizer', standalone: false })
class MockPipeSafeSanitizer implements PipeTransform {
  transform(value: any): any { return value }
}

describe('TncRendererComponent', () => {
  let component: TncRendererComponent
  let fixture: ComponentFixture<TncRendererComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TncRendererComponent, MockPipeSafeSanitizer],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TncRendererComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  function makeUnit(name: 'Generic T&C' | 'Data Privacy', isAccepted: boolean, availableLanguages: string[] = ['en']): any {
    return {
      acceptedDate: new Date(),
      acceptedLanguage: 'en',
      acceptedVersion: '1',
      availableLanguages,
      content: '',
      isAccepted,
      language: 'en',
      name,
      version: '1',
    }
  }

  describe('ngOnInit', () => {
    it('does nothing when tncData is null', () => {
      component.tncData = null
      expect(() => component.ngOnInit()).not.toThrow()
      expect(component.generalTnc).toBeNull()
    })

    it('sets currentPanel to dp when tncData not accepted and dpTnc not accepted', () => {
      component.tncData = {
        isAccepted: false,
        termsAndConditions: [
          makeUnit('Generic T&C', true),
          makeUnit('Data Privacy', false),
        ],
      }
      component.ngOnInit()
      expect(component.currentPanel).toBe('dp')
    })

    it('sets currentPanel to tnc when tncData not accepted and generalTnc not accepted', () => {
      component.tncData = {
        isAccepted: false,
        termsAndConditions: [
          makeUnit('Generic T&C', false),
          makeUnit('Data Privacy', true),
        ],
      }
      component.ngOnInit()
      expect(component.currentPanel).toBe('tnc')
    })

    it('keeps default currentPanel when tncData isAccepted is true', () => {
      component.tncData = {
        isAccepted: true,
        termsAndConditions: [
          makeUnit('Generic T&C', true),
          makeUnit('Data Privacy', true),
        ],
      }
      component.currentPanel = 'tnc'
      component.ngOnInit()
      expect(component.currentPanel).toBe('tnc')
    })

    it('does not switch panel when dpTnc is accepted even if tncData not accepted', () => {
      component.tncData = {
        isAccepted: false,
        termsAndConditions: [
          makeUnit('Generic T&C', false),
          makeUnit('Data Privacy', true),
        ],
      }
      component.currentPanel = 'tnc'
      component.ngOnInit()
      // generalTnc not accepted branch should apply, ending on tnc
      expect(component.currentPanel).toBe('tnc')
    })
  })

  describe('isLocaleAvailable', () => {
    it('returns false when generalTnc is null', () => {
      component.generalTnc = null
      expect(component.isLocaleAvailable('en')).toBe(false)
    })

    it('returns false when availableLanguages is missing', () => {
      component.generalTnc = { ...makeUnit('Generic T&C', true), availableLanguages: undefined as any }
      expect(component.isLocaleAvailable('en')).toBe(false)
    })

    it('returns true when code is in availableLanguages', () => {
      component.generalTnc = makeUnit('Generic T&C', true, ['en', 'fr'])
      expect(component.isLocaleAvailable('fr')).toBe(true)
    })

    it('returns false when code is not in availableLanguages', () => {
      component.generalTnc = makeUnit('Generic T&C', true, ['en'])
      expect(component.isLocaleAvailable('fr')).toBe(false)
    })
  })

  describe('ngOnChanges', () => {
    it('does nothing when tncData is null', () => {
      component.tncData = null
      expect(() => component.ngOnChanges()).not.toThrow()
    })

    it('assigns generalTnc and dpTnc when tncData present', () => {
      component.tncData = {
        isAccepted: true,
        termsAndConditions: [
          makeUnit('Generic T&C', true),
          makeUnit('Data Privacy', true),
        ],
      }
      component.ngOnChanges()
      expect(component.generalTnc && component.generalTnc.name).toBe('Generic T&C')
      expect(component.dpTnc && component.dpTnc.name).toBe('Data Privacy')
    })
  })

  describe('reCenterPanel', () => {
    it('scrolls into view when element exists', () => {
      const scrollSpy = jest.fn()
      jest.spyOn(document, 'getElementById').mockReturnValue({ scrollIntoView: scrollSpy } as any)
      component.reCenterPanel()
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    })

    it('does nothing when element does not exist', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      expect(() => component.reCenterPanel()).not.toThrow()
    })
  })

  describe('changeTncLang', () => {
    it('emits tncChange with the selected locale value', () => {
      const emitSpy = jest.spyOn(component.tncChange, 'emit')
      component.changeTncLang({ value: 'fr' } as any)
      expect(emitSpy).toHaveBeenCalledWith('fr')
    })
  })
})
