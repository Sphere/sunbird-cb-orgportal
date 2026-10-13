import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router, NavigationEnd } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { Subject } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { HomeComponent } from './home.component'
import { SanitizerService } from 'src/app/services/sanitizer.service'

describe('HomeComponent', () => {
  let component: HomeComponent
  let fixture: ComponentFixture<HomeComponent>
  let routerEvents$: Subject<any>
  let configSvc: any
  let sanitizerService: jest.Mocked<SanitizerService>

  const build = (instanceConfig: any = undefined) => {
    routerEvents$ = new Subject<any>()
    configSvc = { instanceConfig }
    sanitizerService = createSpyObj<SanitizerService>('SanitizerService', ['trustResourceUrl'])
    sanitizerService.trustResourceUrl.mockImplementation((u: string) => u)

    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        { provide: Router, useValue: { events: routerEvents$.asObservable() } },
        { provide: ConfigurationsService, useValue: configSvc },
        { provide: SanitizerService, useValue: sanitizerService },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(HomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create with defaults when instanceConfig is missing', () => {
    build()
    expect(component).toBeTruthy()
    expect(component.appName).toBe('')
  })

  it('ngOnInit should set appName/appIcon from instanceConfig', () => {
    build({ details: { appName: 'Sphere' }, logos: { appTransparent: 'icon.svg' } })
    expect(component.appName).toBe('Sphere')
    expect(component.appIcon).toBe('icon.svg')
  })

  describe.each([
    ['lang', 1],
    ['tnc', 2],
    ['about-video', 3],
    ['interest', 4],
  ])('NavigationEnd on a %s route', (segment, expectedStep) => {
    it(`should set stepCount to ${expectedStep} and show the step count`, () => {
      build()
      routerEvents$.next(new NavigationEnd(1, `/app/setup/${segment}`, `/app/setup/${segment}`))
      expect(component.stepCount).toBe(expectedStep)
      expect(component.showStepCount).toBe(true)
    })
  })

  it('should hide the step count for an unrecognized route', () => {
    build()
    routerEvents$.next(new NavigationEnd(1, '/app/setup/done', '/app/setup/done'))
    expect(component.showStepCount).toBe(false)
  })

  it('should ignore non-NavigationEnd router events', () => {
    build()
    expect(() => routerEvents$.next({})).not.toThrow()
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
