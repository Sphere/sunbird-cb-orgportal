import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of, Subject } from 'rxjs'
import { ValueService } from '@sunbird-cb/utils'

import { AppGalleryComponent } from './app-gallery.component'

describe('AppGalleryComponent', () => {
  let component: AppGalleryComponent
  let fixture: ComponentFixture<AppGalleryComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppGalleryComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ eventdata: { data: { Home: {}, Gallery: [] } } }) },
        },
        {
          provide: ValueService,
          useValue: { isLtMedium$: new Subject<boolean>() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppGalleryComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set noOfCol to 1 when isLtMedium$ emits true', () => {
    const valSvc: any = TestBed.inject(ValueService)
    valSvc.isLtMedium$.next(true)
    expect(component.noOfCol).toBe(1)
  })

  it('should set noOfCol to 2 when isLtMedium$ emits false', () => {
    const valSvc: any = TestBed.inject(ValueService)
    valSvc.isLtMedium$.next(true)
    valSvc.isLtMedium$.next(false)
    expect(component.noOfCol).toBe(2)
  })

  it('should unsubscribe screenSubscription on destroy', () => {
    const unsubSpy = jest.spyOn(component.screenSubscription as any, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
  })

  it('should not throw on destroy when screenSubscription is null', () => {
    component.screenSubscription = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  describe('slideTo', () => {
    beforeEach(() => {
      component.imageGallery = ['a', 'b', 'c']
    })

    it('should set currentIndex when index is within bounds', () => {
      component.slideTo(1)
      expect(component.currentIndex).toBe(1)
    })

    it('should wrap to 0 when index equals imageGallery length', () => {
      component.slideTo(3)
      expect(component.currentIndex).toBe(0)
    })

    it('should wrap to end when index is negative', () => {
      component.slideTo(-1)
      expect(component.currentIndex).toBe(2)
    })
  })

  describe('openGallery', () => {
    it('should set isOpened and imageGallery when imageArray has items', () => {
      component.openGallery(true, ['img1', 'img2'])
      expect(component.isOpened).toBe(true)
      expect(component.imageGallery).toEqual(['img1', 'img2'])
    })

    it('should set isOpened but not update imageGallery when imageArray is empty', () => {
      component.imageGallery = ['existing']
      component.openGallery(true, [])
      expect(component.isOpened).toBe(true)
      expect(component.imageGallery).toEqual(['existing'])
    })

    it('should set isOpened but not update imageGallery when imageArray is undefined', () => {
      component.imageGallery = ['existing']
      component.openGallery(false)
      expect(component.isOpened).toBe(false)
      expect(component.imageGallery).toEqual(['existing'])
    })
  })

  describe('ngOnInit data branches', () => {
    it('should set error true when eventdata is missing', () => {
      const route: any = TestBed.inject(ActivatedRoute)
      route.data = of({})
      const c = new AppGalleryComponent(route, TestBed.inject(ValueService))
      c.ngOnInit()
      expect(c.error).toBe(true)
    })

    it('should set error true when eventdata has error', () => {
      const route: any = TestBed.inject(ActivatedRoute)
      route.data = of({ eventdata: { error: true } })
      const c = new AppGalleryComponent(route, TestBed.inject(ValueService))
      c.ngOnInit()
      expect(c.error).toBe(true)
    })

    it('should set data and imageData when eventdata.data present', () => {
      const route: any = TestBed.inject(ActivatedRoute)
      route.data = of({ eventdata: { data: { Home: { EventName: 'X' }, Gallery: [['a']] } } })
      const c = new AppGalleryComponent(route, TestBed.inject(ValueService))
      c.ngOnInit()
      expect(c.data).toEqual({ EventName: 'X' })
      expect(c.imageData).toEqual([['a']])
      expect(c.error).toBe(false)
    })
  })
})
