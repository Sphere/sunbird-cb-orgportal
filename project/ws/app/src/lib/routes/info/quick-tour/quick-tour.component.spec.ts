import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { QuickTourComponent } from './quick-tour.component'

describe('QuickTourComponent', () => {
  let component: QuickTourComponent
  let fixture: ComponentFixture<QuickTourComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [QuickTourComponent],
      providers: [
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            instanceConfig: { tourVideo: { en: '' }, details: { appName: '' } },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
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
