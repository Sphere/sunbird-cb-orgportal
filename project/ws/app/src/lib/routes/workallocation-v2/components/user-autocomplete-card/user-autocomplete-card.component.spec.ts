import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'

import { UserAutocompleteCardComponent } from './user-autocomplete-card.component'

describe('UserAutocompleteCardComponent', () => {
  let component: UserAutocompleteCardComponent
  let fixture: ComponentFixture<UserAutocompleteCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        UserAutocompleteCardComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAutocompleteCardComponent)
    component = fixture.componentInstance
    component.user = { firstName: 'Test', lastName: 'User' }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
