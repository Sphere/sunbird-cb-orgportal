import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { UserPopupComponent } from './user-popup'

describe('UserPopupComponent', () => {
  let component: UserPopupComponent
  let fixture: ComponentFixture<UserPopupComponent>
  let mockDialogRef: { close: jest.Mock }

  beforeEach(async () => {
    mockDialogRef = { close: jest.fn() }

    await TestBed.configureTestingModule({
      declarations: [UserPopupComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { animal: 'cat', name: 'n', data: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(UserPopupComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    fixture.detectChanges()
    expect(component).toBeTruthy()
  })

  it('ngOnInit should not throw', () => {
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('onNoClick should close the dialog', () => {
    component.onNoClick()
    expect(mockDialogRef.close).toHaveBeenCalled()
  })

  describe('markAsComplete', () => {
    it('should close dialog with selectedUser data when currentSelection is false', () => {
      component.selectedUser = [{ id: 1 }]
      component.currentSelection = false
      component.markAsComplete()
      expect(mockDialogRef.close).toHaveBeenCalledWith({ event: 'close', data: [{ id: 1 }] })
      expect(component.currentSelection).toBe(true)
      expect(component.dialogRef as any).toEqual([{ id: 1 }])
    })

    it('should do nothing when currentSelection is already true', () => {
      component.currentSelection = true
      mockDialogRef.close.mockClear()
      component.markAsComplete()
      expect(mockDialogRef.close).not.toHaveBeenCalled()
    })
  })

  describe('selectedUserFrom', () => {
    it('should push the row when selectedUser.lenght is not defined (undefined === 0 is false, else branch taken)', () => {
      component.selectedUser = []
      component.selectedUserFrom({ row: { id: 1 } })
      expect(component.selectedUser).toEqual([{ id: 1 }])
    })

    it('should replace existing selection when called again', () => {
      component.selectedUser = [{ id: 1 }]
      component.selectedUserFrom({ row: { id: 2 } })
      expect(component.selectedUser).toEqual([{ id: 2 }])
    })
  })
})
