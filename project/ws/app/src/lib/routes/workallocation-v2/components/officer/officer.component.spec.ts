import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { TextFieldModule } from '@angular/cdk/text-field'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { WatStoreService } from '../../services/wat.store.service'

import { OfficerComponent } from './officer.component'

describe('OfficerComponent', () => {
  let component: OfficerComponent
  let fixture: ComponentFixture<OfficerComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [OfficerComponent],
      imports: [HttpClientTestingModule, MatLegacyAutocompleteModule, TextFieldModule],
      providers: [WatStoreService],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(OfficerComponent)
    component = fixture.componentInstance
    component.editData = {}
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
