import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { EventBannerComponent } from './event-banner.component'

describe('EventBannerComponent', () => {
  let component: EventBannerComponent
  let fixture: ComponentFixture<EventBannerComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventBannerComponent],
    imports: [HttpClientTestingModule],
    providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EventBannerComponent)
    component = fixture.componentInstance
    component.data = { SessionCards: { Sessions: {} }, Home: { EventImageURL: ['', ''] } }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should calculateTime and push sessionTime entries when sessions exist', () => {
    component.data = {
      SessionCards: {
        Sessions: {
          s1: { SessionStartTime: new Date(Date.now() + 100000).toISOString() },
          s2: { SessionStartTime: new Date(Date.now() + 200000).toISOString() },
        },
      },
    }
    component.sessionTime = []
    component.calculateTime()
    expect(component.allStartTimeData.length).toBe(2)
    expect(component.sessionTime.length).toBe(2)
  })

  it('should run timer subscription callback and update allRemainingTime', (done) => {
    component.data = {
      Home: { EventImageURL: ['', 'https://example.com/image.jpg'] },
      SessionCards: { Sessions: {} },
    }
    component.sessionTime = [100000]
    component.ngOnInit()
    setTimeout(() => {
      expect(component.allRemainingTime.length).toBe(1)
      component.ngOnDestroy()
      done()
    }, 50)
  })

  it('convertMinutes should compute days/hours/mins correctly', () => {
    const result = component.convertMinutes(1000 * 60 * 60 * 25) // 25 hours
    expect(result.hours).toBe(25)
    expect(result.mins).toBe(0)
  })

  describe('slideTo', () => {
    it('should update currentIndex when index within bounds', () => {
      component.slideTo(1)
      expect(component.currentIndex).toBe(1)
    })

    it('should not update currentIndex when index is negative', () => {
      component.currentIndex = 0
      component.slideTo(-1)
      expect(component.currentIndex).toBe(0)
    })

    it('should not update currentIndex when index is out of upper bound', () => {
      component.currentIndex = 0
      component.slideTo(component.bannerTemplates.length)
      expect(component.currentIndex).toBe(0)
    })
  })

  describe('onClickRegister', () => {
    it('should navigate to sessions and toggle isRegisteredUser from false to true', () => {
      const router: any = TestBed.inject(Router)
      component.isRegisteredUser = false
      component.onClickRegister()
      expect(router.navigate).toHaveBeenCalledWith(['sessions'], { relativeTo: expect.anything() })
      expect(component.isRegisteredUser).toBe(true)
    })

    it('should toggle isRegisteredUser from true to false', () => {
      component.isRegisteredUser = true
      component.onClickRegister()
      expect(component.isRegisteredUser).toBe(false)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe currentSubscription when present', () => {
      component.ngOnInit()
      const spy = jest.spyOn((component as any).currentSubscription, 'unsubscribe')
      component.ngOnDestroy()
      expect(spy).toHaveBeenCalled()
    })

    it('should not throw when currentSubscription is null', () => {
      ;(component as any).currentSubscription = null
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  it('ngOnChanges should not throw', () => {
    expect(() => component.ngOnChanges()).not.toThrow()
  })
})
