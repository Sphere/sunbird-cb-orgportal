import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { CertificateGeneratorComponent } from './certificate-generator.component'
import { EventService } from '../../services/event.service'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('CertificateGeneratorComponent', () => {
  let component: CertificateGeneratorComponent
  let fixture: ComponentFixture<CertificateGeneratorComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificateGeneratorComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            queryParams: of({}),
            params: of({}),
          },
        },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        {
          provide: EventService,
          useValue: {
            currentEvent: of(null),
            generateCertificates: jest.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: { instanceConfig: null, pageNavBar: {} },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateGeneratorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
