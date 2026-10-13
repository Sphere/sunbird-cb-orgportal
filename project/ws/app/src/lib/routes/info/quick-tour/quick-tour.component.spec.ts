import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { QuickTourComponent } from './quick-tour.component'

describe('QuickTourComponent', () => {
  let component: QuickTourComponent
  let fixture: ComponentFixture<QuickTourComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [QuickTourComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            instanceConfig: {
              tourVideo: { en: 'https://example.com/video.mp4' },
              details: { appName: '' },
            },
            activeLocale: null,
          },
        },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickTourComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
