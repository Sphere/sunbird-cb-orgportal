import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'

import { FracComponent } from './frac.component'
import { FracService } from '../../services/frac.service'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'

describe('FracComponent', () => {
  let component: FracComponent
  let fixture: ComponentFixture<FracComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FracComponent],
      providers: [
        { provide: FracService, useValue: { fetchFrac: jest.fn().mockResolvedValue(null) } },
        { provide: CustomSnackbarService, useValue: { register: jest.fn(), success: jest.fn(), error: jest.fn(), warning: jest.fn() } },
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
