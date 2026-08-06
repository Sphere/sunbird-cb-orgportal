import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'

import { TncRendererComponent } from './tnc-renderer.component'

describe('TncRendererComponent', () => {
  let component: TncRendererComponent
  let fixture: ComponentFixture<TncRendererComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TncRendererComponent],
      imports: [MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TncRendererComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set termsOfUser false when restrictedFeatures has termsOfUser', () => {
    const configSvc: any = {
      restrictedFeatures: {
        has: (key: string) => key === 'termsOfUser',
      },
    }
    const comp = new TncRendererComponent(configSvc)
    expect(comp.termsOfUser).toBe(false)
  })

  it('should keep termsOfUser true when restrictedFeatures does not have termsOfUser', () => {
    const configSvc: any = {
      restrictedFeatures: {
        has: () => false,
      },
    }
    const comp = new TncRendererComponent(configSvc)
    expect(comp.termsOfUser).toBe(true)
  })

  it('should keep termsOfUser true when restrictedFeatures is null', () => {
    const configSvc: any = { restrictedFeatures: null }
    const comp = new TncRendererComponent(configSvc)
    expect(comp.termsOfUser).toBe(true)
  })

  it('ngOnInit should do nothing when tncData is null', () => {
    component.tncData = null
    component.ngOnInit()
    expect(component.currentPanel).toBe('tnc')
  })

  it('ngOnInit should set currentPanel to dp when dpTnc not accepted', () => {
    component.tncData = {
      isAccepted: false,
      termsAndConditions: [
        { name: 'Data Privacy', isAccepted: false },
        { name: 'Generic T&C', isAccepted: true },
      ],
    } as any
    component.ngOnInit()
    expect(component.currentPanel).toBe('dp')
  })

  it('ngOnInit should set currentPanel to tnc when generalTnc not accepted', () => {
    component.tncData = {
      isAccepted: false,
      termsAndConditions: [
        { name: 'Data Privacy', isAccepted: true },
        { name: 'Generic T&C', isAccepted: false },
      ],
    } as any
    component.ngOnInit()
    expect(component.currentPanel).toBe('tnc')
  })

  it('ngOnInit should not switch panel when tncData isAccepted is true', () => {
    component.tncData = {
      isAccepted: true,
      termsAndConditions: [
        { name: 'Data Privacy', isAccepted: false },
        { name: 'Generic T&C', isAccepted: false },
      ],
    } as any
    component.currentPanel = 'tnc'
    component.ngOnInit()
    expect(component.currentPanel).toBe('tnc')
  })

  it('ngOnChanges should do nothing when tncData is null', () => {
    component.tncData = null
    component.generalTnc = null
    component.dpTnc = null
    component.ngOnChanges()
    expect(component.generalTnc).toBeNull()
    expect(component.dpTnc).toBeNull()
  })

  it('ngOnChanges should assign generalTnc and dpTnc when tncData present', () => {
    component.tncData = {
      isAccepted: false,
      termsAndConditions: [
        { name: 'Generic T&C', isAccepted: true },
        { name: 'Data Privacy', isAccepted: false },
      ],
    } as any
    component.ngOnChanges()
    expect(component.generalTnc).toEqual({ name: 'Generic T&C', isAccepted: true })
    expect(component.dpTnc).toEqual({ name: 'Data Privacy', isAccepted: false })
  })

  it('reCenterPanel should scroll into view when element exists', () => {
    const el = document.createElement('div')
    el.id = 'tnc'
    document.body.appendChild(el)
    const scrollSpy = jest.fn()
    ;(window as any).Element.prototype.scrollIntoView = scrollSpy
    component.reCenterPanel()
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    document.body.removeChild(el)
  })

  it('reCenterPanel should do nothing when element does not exist', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null)
    expect(() => component.reCenterPanel()).not.toThrow()
    ;(document.getElementById as jest.Mock).mockRestore()
  })

  it('changeTncLang should emit tncChange event', () => {
    const spy = jest.spyOn(component.tncChange, 'emit')
    component.changeTncLang('en')
    expect(spy).toHaveBeenCalledWith('en')
  })

  it('changeDpLang should emit dpChange event', () => {
    const spy = jest.spyOn(component.dpChange, 'emit')
    component.changeDpLang('hi')
    expect(spy).toHaveBeenCalledWith('hi')
  })
})
