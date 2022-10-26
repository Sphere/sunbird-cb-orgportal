import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { SearchSelectedFilterComponent } from './search-selected-filter.component'

describe('SearchSelectedFilterComponent', () => {
  let component: SearchSelectedFilterComponent
  let fixture: ComponentFixture<SearchSelectedFilterComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchSelectedFilterComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchSelectedFilterComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
