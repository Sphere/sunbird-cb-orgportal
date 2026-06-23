import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { MyDashboardHomeComponent } from './my-dashboard-home.component'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('MyDashboardHomeComponent', () => {
  let component: MyDashboardHomeComponent
  let fixture: ComponentFixture<MyDashboardHomeComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MyDashboardHomeComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: null,
            userProfile: null,
          },
        },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(MyDashboardHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
