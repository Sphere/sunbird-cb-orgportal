import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ActivatedRoute } from '@angular/router'

import { IframeLoaderComponent } from './iframe-loader.component'
import { EventService } from '../../services/event.service'

describe('IframeLoaderComponent', () => {
  let component: IframeLoaderComponent
  let fixture: ComponentFixture<IframeLoaderComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [IframeLoaderComponent],
      providers: [
        EventService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => null } },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(IframeLoaderComponent)
    component = fixture.componentInstance
    component.iframeUrl = 'https://example.com/embed'
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
