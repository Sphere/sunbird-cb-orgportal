import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of, BehaviorSubject } from 'rxjs'

import { AppGalleryComponent } from './app-gallery.component'
import { ValueService } from '@sunbird-cb/utils'

describe('AppGalleryComponent', () => {
  let component: AppGalleryComponent
  let fixture: ComponentFixture<AppGalleryComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppGalleryComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              eventdata: {
                data: {
                  Home: { EventName: 'Test Event' },
                  Gallery: [],
                  SessionCards: { Sessions: {} },
                },
              },
            }),
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
        {
          provide: ValueService,
          useValue: {
            isLtMedium$: new BehaviorSubject<boolean>(false),
          },
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
})
