import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { ReactiveFormsModule } from '@angular/forms'
import { of } from 'rxjs'

import { ViewUsersComponent } from './view-users.component'

describe('ViewUsersComponent', () => {
  let component: ViewUsersComponent
  let fixture: ComponentFixture<ViewUsersComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ViewUsersComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jest.fn(),
            afterClosed: () => of(undefined),
          },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            userArray: [],
            noOfUser: '0',
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewUsersComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
