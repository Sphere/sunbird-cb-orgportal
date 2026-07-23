import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of, BehaviorSubject } from 'rxjs'

import { IframeLoaderComponent } from './iframe-loader.component'
import { EventService } from '../../services/event.service'

describe('IframeLoaderComponent', () => {
  let component: IframeLoaderComponent
  let fixture: ComponentFixture<IframeLoaderComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [IframeLoaderComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            snapshot: {
              params: {},
              queryParams: {},
              data: {},
              paramMap: { get: jest.fn().mockReturnValue(null) },
            },
            params: of({}),
            queryParams: of({}),
          },
        },
        {
          provide: EventService,
          useValue: {
            bannerisEnabled: new BehaviorSubject<boolean>(true),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideTemplate(IframeLoaderComponent, '<div></div>')
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(IframeLoaderComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
