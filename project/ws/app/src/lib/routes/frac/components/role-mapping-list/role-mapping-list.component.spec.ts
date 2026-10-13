import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'

import { RoleMappingListComponent } from './role-mapping-list.component'

describe('RoleMappingListComponent', () => {
  let component: RoleMappingListComponent
  let fixture: ComponentFixture<RoleMappingListComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoleMappingListComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    fixture = TestBed.createComponent(RoleMappingListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should copy and sort roles by code then title', () => {
    component.roles = [{ code: 'B1', title: 'Bee' } as any, { code: 'A1', title: 'Aye' } as any]
    component.ngOnInit()
    expect(component.filteredRoles.map(r => r.code)).toEqual(['A1', 'B1'])
  })

  describe('ngOnChanges', () => {
    it('should reset searchTerm on a non-first searchResetKey change', () => {
      component.searchTerm = 'x'
      component.ngOnChanges({ searchResetKey: { firstChange: false } as any })
      expect(component.searchTerm).toBe('')
    })

    it('should not reset searchTerm on the first change', () => {
      component.searchTerm = 'x'
      component.ngOnChanges({ searchResetKey: { firstChange: true } as any })
      expect(component.searchTerm).toBe('x')
    })

    it('should not reset searchTerm without a searchResetKey change', () => {
      component.searchTerm = 'x'
      component.ngOnChanges({})
      expect(component.searchTerm).toBe('x')
    })
  })

  it('onSearchChange should emit the current search term', () => {
    component.searchTerm = 'abc'
    const emitSpy = jest.spyOn(component.searchChange, 'emit')
    component.onSearchChange()
    expect(emitSpy).toHaveBeenCalledWith('abc')
  })

  describe('onHeaderClick', () => {
    it('should select the role and stop propagation when a different role is clicked', () => {
      component.selectedRoleCode = 'R1'
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      const selectSpy = jest.spyOn(component.roleSelected, 'emit')
      component.onHeaderClick({ code: 'R2' } as any, event)
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(selectSpy).toHaveBeenCalledWith({ code: 'R2' })
    })

    it('should expand instead of re-selecting when the already-selected role is clicked', () => {
      component.selectedRoleCode = 'R1'
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      const toggleSpy = jest.spyOn(component.toggle, 'emit')
      component.onHeaderClick({ code: 'R1' } as any, event)
      expect(component.expandedRoleCode).toBe('R1')
      expect(toggleSpy).toHaveBeenCalled()
    })

    it('should expand when the clicked item has no code', () => {
      component.selectedRoleCode = 'R1'
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      component.onHeaderClick({} as any, event)
      expect(component.expandedRoleCode).toBeNull()
    })
  })

  describe('expand', () => {
    it('should set expandedRoleCode and emit toggle', () => {
      const toggleSpy = jest.spyOn(component.toggle, 'emit')
      component.expand({ code: 'R1' } as any)
      expect(component.expandedRoleCode).toBe('R1')
      expect(toggleSpy).toHaveBeenCalledWith({ code: 'R1' })
    })

    it('should collapse when the same role is expanded again', () => {
      component.expandedRoleCode = 'R1'
      component.expand({ code: 'R1' } as any)
      expect(component.expandedRoleCode).toBeNull()
    })

    it('should treat a missing code as null', () => {
      component.expand({} as any)
      expect(component.expandedRoleCode).toBeNull()
    })
  })

  it('roleSelectedHandler should emit the given role', () => {
    const emitSpy = jest.spyOn(component.roleSelected, 'emit')
    component.roleSelectedHandler({ code: 'R1' } as any)
    expect(emitSpy).toHaveBeenCalledWith({ code: 'R1' })
  })

  describe('trackByCode', () => {
    it('should return the code when present', () => {
      expect(component.trackByCode(2, { code: 'R1' } as any)).toBe('R1')
    })

    it('should fall back to the index when code is missing', () => {
      expect(component.trackByCode(2, {} as any)).toBe('2')
    })
  })

  describe('getSortedActivities', () => {
    it('should sort activityDetails by code then label', () => {
      const role = {
        activityDetails: [
          { code: 'B1', label: 'Bee' },
          { code: 'A1', label: 'Aye' },
        ],
      } as any
      expect(component.getSortedActivities(role).map((a: any) => a.code)).toEqual(['A1', 'B1'])
    })

    it('should return an empty array when activityDetails is missing', () => {
      expect(component.getSortedActivities({} as any)).toEqual([])
    })

    it('should break ties on label when codes match', () => {
      const role = {
        activityDetails: [
          { code: 'A1', label: 'Zed' },
          { code: 'A1', label: 'Aye' },
        ],
      } as any
      expect(component.getSortedActivities(role).map((a: any) => a.label)).toEqual(['Aye', 'Zed'])
    })
  })
});
