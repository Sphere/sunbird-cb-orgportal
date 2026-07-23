import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { ReactiveFormsModule } from '@angular/forms'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { of } from 'rxjs'

import { ParticipantsComponent } from './participants.component'
import { EventsService } from '../../services/events.service'

describe('ParticipantsComponent', () => {
  let component: ParticipantsComponent
  let fixture: ComponentFixture<ParticipantsComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ParticipantsComponent],
      imports: [ReactiveFormsModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jest.fn(), afterClosed: () => of(undefined) } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: EventsService, useValue: { searchUser: jest.fn().mockReturnValue(of([])) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
