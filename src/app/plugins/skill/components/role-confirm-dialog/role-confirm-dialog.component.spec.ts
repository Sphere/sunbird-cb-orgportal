import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { RoleConfirmDialogComponent } from './role-confirm-dialog.component'

describe('ConfirmDialogComponent', () => {
  let component: RoleConfirmDialogComponent
  let fixture: ComponentFixture<RoleConfirmDialogComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RoleConfirmDialogComponent],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(RoleConfirmDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
