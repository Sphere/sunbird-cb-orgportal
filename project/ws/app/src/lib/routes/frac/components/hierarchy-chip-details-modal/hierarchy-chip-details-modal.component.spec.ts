import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

import { HierarchyChipDetailsModalComponent, HierarchyChipDetailsModalData } from './hierarchy-chip-details-modal.component'

describe('HierarchyChipDetailsModalComponent', () => {
  let component: HierarchyChipDetailsModalComponent
  let fixture: ComponentFixture<HierarchyChipDetailsModalComponent>

  const mockDialogRef = {
    close: jest.fn(),
  }

  let dialogData: HierarchyChipDetailsModalData = {
    chipType: 'role',
    items: [],
  }

  const configure = (data: HierarchyChipDetailsModalData) => {
    dialogData = data
    TestBed.configureTestingModule({
      declarations: [HierarchyChipDetailsModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }

  beforeEach(waitForAsync(() => {
    configure({ chipType: 'role', items: [] })
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchyChipDetailsModalComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('title getter', () => {
    it('should return "Roles" for role chipType', () => {
      component.data = { chipType: 'role', items: [] }
      expect(component.title).toBe('Roles')
    })

    it('should return "Activities" for activity chipType', () => {
      component.data = { chipType: 'activity', items: [] }
      expect(component.title).toBe('Activities')
    })

    it('should return "Competencies" for competency chipType', () => {
      component.data = { chipType: 'competency', items: [] }
      expect(component.title).toBe('Competencies')
    })
  })

  describe('emptyLabel getter', () => {
    it('should return role empty label', () => {
      component.data = { chipType: 'role', items: [] }
      expect(component.emptyLabel).toBe('No mapped role found.')
    })

    it('should return activity empty label', () => {
      component.data = { chipType: 'activity', items: [] }
      expect(component.emptyLabel).toBe('No mapped activity found.')
    })

    it('should return competency empty label', () => {
      component.data = { chipType: 'competency', items: [] }
      expect(component.emptyLabel).toBe('No mapped competency found.')
    })
  })

  describe('formatItem', () => {
    it('should format non-competency item with code and name', () => {
      component.data = { chipType: 'role', items: [] }
      const result = component.formatItem({ entityCode: 'C1', entityName: 'Name1' })
      expect(result).toBe('C1 - Name1')
    })

    it('should trim whitespace from code and name', () => {
      component.data = { chipType: 'activity', items: [] }
      const result = component.formatItem({ entityCode: '  C2  ', entityName: '  Name2  ' })
      expect(result).toBe('C2 - Name2')
    })

    it('should use "-" as name when entityName is empty', () => {
      component.data = { chipType: 'role', items: [] }
      const result = component.formatItem({ entityCode: 'C3', entityName: '' })
      expect(result).toBe('C3 - -')
    })

    it('should use empty code when entityCode is missing', () => {
      component.data = { chipType: 'role', items: [] }
      const result = component.formatItem({ entityCode: '', entityName: 'Name4' } as any)
      expect(result).toBe(' - Name4')
    })

    it('should append levels for competency chipType with valid levels', () => {
      component.data = { chipType: 'competency', items: [] }
      const result = component.formatItem({ entityCode: 'C5', entityName: 'Name5', levels: ['L1', 'L2'] })
      expect(result).toBe('C5 - Name5 : L1, L2')
    })

    it('should filter falsy values from levels for competency chipType', () => {
      component.data = { chipType: 'competency', items: [] }
      const result = component.formatItem({ entityCode: 'C6', entityName: 'Name6', levels: ['L1', '', undefined as any, 'L2'] })
      expect(result).toBe('C6 - Name6 : L1, L2')
    })

    it('should append " : -" for competency chipType when levels is undefined', () => {
      component.data = { chipType: 'competency', items: [] }
      const result = component.formatItem({ entityCode: 'C7', entityName: 'Name7' })
      expect(result).toBe('C7 - Name7 : -')
    })

    it('should append " : -" for competency chipType when levels is not an array', () => {
      component.data = { chipType: 'competency', items: [] }
      const result = component.formatItem({ entityCode: 'C8', entityName: 'Name8', levels: 'notArray' as any })
      expect(result).toBe('C8 - Name8 : -')
    })

    it('should append " : -" for competency chipType when levels is an empty array', () => {
      component.data = { chipType: 'competency', items: [] }
      const result = component.formatItem({ entityCode: 'C9', entityName: 'Name9', levels: [] })
      expect(result).toBe('C9 - Name9 : -')
    })
  })

  describe('onClose', () => {
    it('should call dialogRef.close', () => {
      mockDialogRef.close.mockClear()
      component.onClose()
      expect(mockDialogRef.close).toHaveBeenCalled()
    })
  })
})
