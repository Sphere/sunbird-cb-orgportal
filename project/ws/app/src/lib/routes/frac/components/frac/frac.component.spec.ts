import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { FracComponent } from './frac.component'
import { SanitizerService } from 'src/app/services/sanitizer.service'
import { FracService } from '../../services/frac.service'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('FracComponent', () => {
  let component: FracComponent
  let fixture: ComponentFixture<FracComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FracComponent],
      imports: [HttpClientTestingModule],
      providers: [
        SanitizerService,
        FracService,
        { provide: ConfigurationsService, useValue: { baseUrl: '', instanceConfig: {} } },
        { provide: CustomSnackbarService, useValue: createSpyObj('CustomSnackbarService', ['register']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FracComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
