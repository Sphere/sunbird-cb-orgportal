import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { Subject, of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { SignupAutoService } from './signup-auto.service'

import { SignupAutoComponent } from './signup-auto.component'

describe('SignupAutoComponent', () => {
  let component: SignupAutoComponent
  let fixture: ComponentFixture<SignupAutoComponent>
  let snackBar: ReturnType<typeof createSpyObj>
  let signupAutoService: ReturnType<typeof createSpyObj>
  let paramMap$: Subject<any>

  const build = () => {
    paramMap$ = new Subject<any>()
    snackBar = createSpyObj('MatSnackBar', ['open'])
    signupAutoService = createSpyObj('SignupAutoService', ['signup'])
    signupAutoService.signup.mockReturnValue(of({ msg: '1005', email: 'a@b.com' }))

    TestBed.configureTestingModule({
      declarations: [SignupAutoComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: SignupAutoService, useValue: signupAutoService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(SignupAutoComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create', () => {
    build()
    expect(component).toBeTruthy()
  })

  it('should read the id from paramMap and sign up', () => {
    build()
    paramMap$.next({ get: () => 'u1' })
    expect(component.uniqueId).toBe('u1')
    expect(signupAutoService.signup).toHaveBeenCalledWith('u1')
  })

  describe('signup response codes', () => {
    const cases: [string, string][] = [
      ['1001', 'Something went wrong, please contact administrator'],
      ['1002', 'Registered email address is not valid, so please contact administrator'],
      ['9999', 'Something went wrong, please contact administrator'],
    ]

    it.each(cases)('should set the message for code %s', (code, expectedMsg) => {
      build()
      signupAutoService.signup.mockReturnValue(of({ msg: `${code}:extra`, email: 'a@b.com' }))
      component.signup('u1')
      expect(component.msg).toBe(expectedMsg)
      expect(component.fetching).toBe(false)
      expect(component.showResonse).toBe(true)
      expect(snackBar.open).toHaveBeenCalledWith(expectedMsg, 'X', expect.any(Object))
    })

    it('should include the email for code 1003', () => {
      build()
      signupAutoService.signup.mockReturnValue(of({ msg: '1003:extra', email: 'a@b.com' }))
      component.signup('u1')
      expect(component.msg).toContain('a@b.com')
    })

    it('should not include an email for code 1004', () => {
      build()
      signupAutoService.signup.mockReturnValue(of({ msg: '1004:extra', email: 'a@b.com' }))
      component.signup('u1')
      expect(component.msg).toContain('already registered successfully')
    })

    it('should include the email for code 1005', () => {
      build()
      signupAutoService.signup.mockReturnValue(of({ msg: '1005:extra', email: 'a@b.com' }))
      component.signup('u1')
      expect(component.msg).toContain('a@b.com')
    })
  })

  it('should show a generic error message on failure', () => {
    build()
    signupAutoService.signup.mockReturnValue(throwError({ error: { msg: 'server-error' } }))
    component.signup('u1')
    expect(component.fetching).toBe(false)
    expect(component.showResonse).toBe(true)
    expect(component.msg).toBe('Something went wrong please try again later!!')
    expect(snackBar.open).toHaveBeenCalledWith('server-error', 'X', expect.any(Object))
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
