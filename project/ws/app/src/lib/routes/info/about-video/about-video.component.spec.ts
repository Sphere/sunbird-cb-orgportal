import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { AboutVideoComponent } from './about-video.component'

describe('AboutVideoComponent', () => {
  let component: AboutVideoComponent
  let fixture: ComponentFixture<AboutVideoComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AboutVideoComponent],
      providers: [
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            instanceConfig: { introVideo: { en: '' }, details: { appName: '' } },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutVideoComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
