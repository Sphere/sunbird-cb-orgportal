import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import {
  ConfigurationsService, SubapplicationRespondService, ValueService, LogoutComponent,
} from '@sunbird-cb/utils'
import { CustomTourService } from '@sunbird-cb/collection'
import { Subject, of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { FeaturesComponent } from './features.component'

describe('FeaturesComponent', () => {
  let component: FeaturesComponent
  let fixture: ComponentFixture<FeaturesComponent>
  let dialog: any
  let router: any
  let configSvc: any
  let tour: any
  let respondSvc: any
  let queryParamMap: { get: jest.Mock }

  const feature = (overrides: any = {}) => ({
    name: 'Search feature',
    keywords: ['search'],
    description: 'find things',
    ...overrides,
  })

  const build = (appsConfig: any, q: string | null = null) => {
    queryParamMap = { get: jest.fn().mockReturnValue(q) }
    configSvc = {
      appsConfig,
      pageNavBar: {},
      restrictedFeatures: new Set<string>(),
      tourGuideNotifier: new Subject<boolean>(),
    }
    dialog = createSpyObj('MatDialog', ['open'])
    router = createSpyObj('Router', ['navigate'])
    tour = createSpyObj('CustomTourService', ['startTour'])
    respondSvc = createSpyObj('SubapplicationRespondService', ['unsubscribeResponse'])

    TestBed.configureTestingModule({
      declarations: [FeaturesComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: router },
        { provide: ConfigurationsService, useValue: configSvc },
        { provide: CustomTourService, useValue: tour },
        { provide: SubapplicationRespondService, useValue: respondSvc },
        { provide: ValueService, useValue: { isXSmall$: of(false) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(FeaturesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create with a minimal appsConfig', () => {
    build({ groups: [], features: {} })
    expect(component).toBeTruthy()
  })

  it('should build featureGroups with widgets from appsConfig when present', () => {
    build({
      tourGuide: true,
      groups: [{ featureIds: ['f1'], hasRole: [] }],
      features: { f1: feature() },
    })
    expect((component as any).featuresConfig[0].featureWidgets.length).toBe(1)
    expect(tour.data).toBe(true)
  })

  it('should leave featuresConfig empty when appsConfig is missing entirely', () => {
    build(undefined)
    expect((component as any).featuresConfig).toEqual([])
  })

  it('should not notify the tour guide when appsConfig.tourGuide is falsy', () => {
    const nextSpy = jest.fn()
    build({ groups: [], features: {} })
    ;(component as any).configurationSvc.tourGuideNotifier.next = nextSpy
    expect(tour.data).toBeUndefined()
  })

  describe('ngOnInit / filteredFeatures', () => {
    it('should seed the query control from the route snapshot and set featureGroups', fakeAsync(() => {
      build({ groups: [{ featureIds: ['f1'], hasRole: [] }], features: { f1: feature() } }, null)
      tick(500)
      expect(component.featureGroups?.length).toBe(1)
      expect(router.navigate).toHaveBeenCalledWith([], { queryParams: { q: null } })
    }))

    it('should filter feature groups by query and drop empty groups', fakeAsync(() => {
      build({
        groups: [{ featureIds: ['f1', 'f2'], hasRole: [] }],
        features: { f1: feature({ name: 'alpha' }), f2: feature({ name: 'beta' }) },
      })
      tick(500)
      component.queryControl.setValue('alpha')
      tick(500)
      expect(component.featureGroups?.[0].featureWidgets.length).toBe(1)
    }))

    it('should match on keywords or description when the name does not match', () => {
      build({
        groups: [{ featureIds: ['f1'], hasRole: [] }],
        features: { f1: feature({ name: 'Zeta', keywords: ['findme'], description: 'nothing' }) },
      })
      expect((component as any).queryMatchForFeature(feature({ name: 'Zeta', keywords: ['findme'] }), 'findme')).toBe(true)
      expect((component as any).queryMatchForFeature(feature({ name: 'Zeta', keywords: [], description: 'special' }), 'special')).toBe(true)
      expect((component as any).queryMatchForFeature(feature({ name: 'Zeta', keywords: [] }), 'nomatch')).toBe(false)
      expect((component as any).queryMatchForFeature(undefined, 'x')).toBe(false)
    })

    it('should return the empty array when featuresConfig is null and a query is given', () => {
      build(undefined)
      expect((component as any).filteredFeatures('term')).toEqual([])
    })

    it('should show the tour guide when not restricted', () => {
      build({ groups: [], features: {} })
      component['configurationSvc'].tourGuideNotifier.next(true)
      expect(component.isTourGuideAvailable).toBe(true)
    })

    it('should not show the tour guide when restricted', () => {
      build({ groups: [], features: {} })
      component['configurationSvc'].restrictedFeatures = new Set(['tourGuide'])
      component['configurationSvc'].tourGuideNotifier.next(true)
      expect(component.isTourGuideAvailable).toBe(false)
    })
  })

  it('ngOnDestroy should unsubscribe and notify tourGuideNotifier(false)', () => {
    build({ groups: [], features: {} })
    const nextSpy = jest.spyOn(component['configurationSvc'].tourGuideNotifier, 'next')
    component.ngOnDestroy()
    expect(nextSpy).toHaveBeenCalledWith(false)
  })

  it('clear should reset the query control', () => {
    build({ groups: [], features: {} })
    component.queryControl.setValue('abc')
    component.clear()
    expect(component.queryControl.value).toBe('')
  })

  it('logout should open the LogoutComponent dialog', () => {
    build({ groups: [], features: {} })
    component.logout()
    expect(dialog.open).toHaveBeenCalledWith(LogoutComponent)
  })

  describe('startTour', () => {
    it('should start the tour and skip unsubscribe when there is no responseSubscription', () => {
      build({ groups: [], features: {} })
      component.startTour()
      expect(tour.startTour).toHaveBeenCalled()
      expect(respondSvc.unsubscribeResponse).not.toHaveBeenCalled()
    })
  })
})
