import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RoleMappingTableComponent } from './role-mapping-table.component'

describe('RoleMappingTableComponent', () => {
  let component: RoleMappingTableComponent
  let fixture: ComponentFixture<RoleMappingTableComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoleMappingTableComponent]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(RoleMappingTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
