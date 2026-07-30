import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { LoginRootComponent } from './login-root.component'
import { LoginRootDirective } from './login-root.directive'
import { LoginComponent } from '../login/login.component'

describe('LoginRootComponent', () => {
  let component: LoginRootComponent
  let fixture: ComponentFixture<LoginRootComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LoginRootComponent, LoginRootDirective, LoginComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              pageData: {
                data: {
                  isClient: false,
                  footer: { descriptiveFooter: '', contactUs: '' },
                  topbar: { title: '', subTitle: '' },
                },
              },
            }),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginRootComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
