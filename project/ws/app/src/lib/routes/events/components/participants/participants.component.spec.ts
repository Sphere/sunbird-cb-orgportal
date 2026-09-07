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

  describe('isAllSelected / masterToggle', () => {
    beforeEach(() => {
      component.dataSource = { data: [{ firstname: 'a', lastname: 'b', email: 1 }, { firstname: 'c', lastname: 'd', email: 2 }] }
    })

    it('isAllSelected should return false when not all rows selected', () => {
      component.selection.clear()
      expect(component.isAllSelected()).toBe(false)
    })

    it('isAllSelected should return true when all rows selected', () => {
      component.selection.clear()
      component.dataSource.data.forEach((row: any) => component.selection.select(row))
      expect(component.isAllSelected()).toBe(true)
    })

    it('masterToggle should clear selection when all selected', () => {
      component.dataSource.data.forEach((row: any) => component.selection.select(row))
      component.masterToggle()
      expect(component.selection.selected.length).toBe(0)
    })

    it('masterToggle should select all rows when not all selected', () => {
      component.selection.clear()
      component.masterToggle()
      expect(component.selection.selected.length).toBe(2)
    })
  })

  describe('ngOnInit search', () => {
    it('should populate participants for users that have email defined', (done) => {
      const eventSrc: any = TestBed.inject(EventsService)
      eventSrc.searchUser.mockReturnValue(of({
        result: {
          response: {
            content: [
              { firstName: 'John', lastName: 'Doe', email: 'john@x.com', userId: '1' },
              { firstName: 'NoEmail', lastName: 'User', userId: '2' },
            ],
          },
        },
      }))
      component.searchUserCtrl.setValue('john')
      setTimeout(() => {
        expect(component.participants.length).toBe(1)
        expect(component.participants[0].firstname).toBe('John')
        done()
      }, 250)
    })
  })

  describe('confirm', () => {
    it('should close dialog with selected data', () => {
      const dialogRef: any = TestBed.inject(MatDialogRef)
      component.selection.select({ firstname: 'a', lastname: 'b', email: 1 } as any)
      component.confirm()
      expect(dialogRef.close).toHaveBeenCalledWith({ data: component.selection.selected })
    })
  })

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const spyNext = jest.spyOn((component as any).destroy$, 'next')
      const spyComplete = jest.spyOn((component as any).destroy$, 'complete')
      component.ngOnDestroy()
      expect(spyNext).toHaveBeenCalled()
      expect(spyComplete).toHaveBeenCalled()
    })
  })
})
