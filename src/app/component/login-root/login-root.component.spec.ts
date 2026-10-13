import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { LoginRootService } from './login-root.service'

import { LoginRootComponent } from './login-root.component'
import { LoginRootDirective } from './login-root.directive'
import { LoginComponent } from '../login/login.component'

describe('LoginRootComponent', () => {
  let component: LoginRootComponent
  let fixture: ComponentFixture<LoginRootComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoginRootComponent, LoginRootDirective, LoginComponent],
      providers: [
        {
          provide: LoginRootService,
          useValue: {
            getComponent: jest.fn().mockReturnValue(class {}),
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
    jest.spyOn(component, 'loadComponent').mockImplementation(() => {})
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call loadComponent on ngOnInit', () => {
    expect(component.loadComponent).toHaveBeenCalled()
  })
})
