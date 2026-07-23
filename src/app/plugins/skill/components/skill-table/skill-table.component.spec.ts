import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule, FormsModule, UntypedFormBuilder } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'

import { SkillTableComponent } from './skill-table.component'
import { UserAutoCompleteService } from '../../services/user-auto-complete.service'

describe('MappingUserTableComponent', () => {
  let component: SkillTableComponent
  let fixture: ComponentFixture<SkillTableComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SkillTableComponent],
      imports: [ReactiveFormsModule, FormsModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule, BrowserAnimationsModule],
      providers: [
        UntypedFormBuilder,
        {
          provide: MatDialog,
          useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) },
        },
        {
          provide: UserAutoCompleteService,
          useValue: {
            fetchUserList: jest.fn().mockReturnValue(of([])),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
