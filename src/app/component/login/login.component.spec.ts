import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { SanitizerService } from '../../services/sanitizer.service'

import { LoginComponent } from './login.component'

describe('LoginComponent', () => {
  let component: LoginComponent
  let fixture: ComponentFixture<LoginComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            data: of({
              pageData: {
                data: {
                  isClient: false,
                  footer: { descriptiveFooter: null, contactUs: false },
                  topbar: { title: '', subTitle: '' },
                },
              },
            }),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: null,
            restrictedFeatures: null,
          },
        },
        {
          provide: SanitizerService,
          useValue: {
            trustResourceUrl: jest.fn((u: string) => u),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should populate config from route data on ngOnInit', () => {
    expect(component.isClientLogin).toBe(false)
    expect(component.title).toBe('')
    expect(component.contactUs).toBe(false)
  })
})
