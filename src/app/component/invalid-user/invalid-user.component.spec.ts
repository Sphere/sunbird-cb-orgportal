import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { PipeSafeSanitizerPipe } from '@sunbird-cb/utils'

import { InvalidUserComponent } from './invalid-user.component'

describe('InvalidUserComponent', () => {
  let component: InvalidUserComponent
  let fixture: ComponentFixture<InvalidUserComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InvalidUserComponent, PipeSafeSanitizerPipe],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            data: of({ pageData: { data: { value: 'invalid' } } }),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(InvalidUserComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set invalidData from route data', () => {
    expect(component.invalidData).toBe('invalid')
  })

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jest.spyOn((component as any).subscriptionData, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubscribeSpy).toHaveBeenCalled()
  })
})
