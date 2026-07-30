import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { AppSetupHomeComponent } from './app-setup-home.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('AppSetupHomeComponent', () => {
  let component: AppSetupHomeComponent
  let fixture: ComponentFixture<AppSetupHomeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppSetupHomeComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        {
          provide: ConfigurationsService,
          useValue: {
            activeLocale: null,
            instanceConfig: { introVideo: { en: '' } },
            userUrl: '',
          },
        },
      ],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSetupHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
