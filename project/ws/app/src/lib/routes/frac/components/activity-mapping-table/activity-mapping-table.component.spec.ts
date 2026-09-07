import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'

import { ActivityMappingTableComponent } from './activity-mapping-table.component'

describe('ActivityMappingTableComponent', () => {
  let component: ActivityMappingTableComponent
  let fixture: ComponentFixture<ActivityMappingTableComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivityMappingTableComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    fixture = TestBed.createComponent(ActivityMappingTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should copy activities into filteredActivities, sorted', () => {
    component.activities = [{ code: 'B1' } as any, { code: 'A1' } as any]
    component.ngOnInit()
    expect(component.filteredActivities.map(a => a.code)).toEqual(['A1', 'B1'])
  })

  describe('ngOnChanges', () => {
    it('should reset searchTerm when searchResetKey changes (not first change)', () => {
      component.searchTerm = 'abc'
      component.ngOnChanges({ searchResetKey: { firstChange: false } as any })
      expect(component.searchTerm).toBe('')
    })

    it('should not reset searchTerm on the first change', () => {
      component.searchTerm = 'abc'
      component.ngOnChanges({ searchResetKey: { firstChange: true } as any })
      expect(component.searchTerm).toBe('abc')
    })

    it('should not reset searchTerm when searchResetKey did not change', () => {
      component.searchTerm = 'abc'
      component.ngOnChanges({})
      expect(component.searchTerm).toBe('abc')
    })
  })

  describe('toggleSort / applySort', () => {
    it('should flip asc to desc and re-sort descending', () => {
      component.filteredActivities = [{ code: 'A1' } as any, { code: 'B1' } as any]
      component.sortDirection = 'asc'
      component.toggleSort()
      expect(component.sortDirection).toBe('desc')
      expect(component.filteredActivities.map(a => a.code)).toEqual(['B1', 'A1'])
    })

    it('should flip desc back to asc', () => {
      component.sortDirection = 'desc'
      component.toggleSort()
      expect(component.sortDirection).toBe('asc')
    })

    it('applySort should no-op when sortDirection is empty', () => {
      component.filteredActivities = [{ code: 'B1' } as any, { code: 'A1' } as any]
      component.sortDirection = ''
      component.applySort()
      expect(component.filteredActivities.map(a => a.code)).toEqual(['B1', 'A1'])
    })

    it('should treat a missing code as an empty string when sorting', () => {
      component.filteredActivities = [{ code: 'A1' } as any, {} as any]
      component.sortDirection = 'asc'
      component.applySort()
      expect(component.filteredActivities[0]).toEqual({})
    })
  })

  describe('onSearchChange', () => {
    it('should not emit when no role is selected', () => {
      component.selectedRole = null
      const emitSpy = jest.spyOn(component.searchChange, 'emit')
      component.onSearchChange()
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('should emit the search term when a role is selected', () => {
      component.selectedRole = { code: 'R1' } as any
      component.searchTerm = 'abc'
      const emitSpy = jest.spyOn(component.searchChange, 'emit')
      component.onSearchChange()
      expect(emitSpy).toHaveBeenCalledWith('abc')
    })
  })

  describe('isChecked', () => {
    it('should reflect the selection map', () => {
      component.selectedActivityMap = { A1: true }
      expect(component.isChecked('A1')).toBe(true)
      expect(component.isChecked('B1')).toBe(false)
    })

    it('should handle an undefined map', () => {
      component.selectedActivityMap = undefined as any
      expect(component.isChecked('A1')).toBe(false)
    })
  })

  it('onCheckboxChange should emit the code and checked state', () => {
    const emitSpy = jest.spyOn(component.activityCheckChange, 'emit')
    component.onCheckboxChange('A1', true)
    expect(emitSpy).toHaveBeenCalledWith({ code: 'A1', checked: true })
  })

  it('onAddActivity should emit', () => {
    const emitSpy = jest.spyOn(component.addActivity, 'emit')
    component.onAddActivity()
    expect(emitSpy).toHaveBeenCalled()
  })

  describe('isAddDisabled', () => {
    it('should disable while loading/action-loading/saving', () => {
      component.isLoading = true
      expect(component.isAddDisabled()).toBe(true)
      component.isLoading = false
      component.isActionLoading = true
      expect(component.isAddDisabled()).toBe(true)
      component.isActionLoading = false
      component.isSaving = true
      expect(component.isAddDisabled()).toBe(true)
    })

    it('should disable when no role is selected', () => {
      component.isSaving = false
      component.selectedRole = null
      expect(component.isAddDisabled()).toBe(true)
    })

    it('should disable when nothing is selected and the role had no previous activities', () => {
      component.selectedRole = { code: 'R1', activityDetails: [] } as any
      component.selectedActivityMap = {}
      expect(component.isAddDisabled()).toBe(true)
    })

    it('should enable when at least one activity is selected', () => {
      component.selectedRole = { code: 'R1', activityDetails: [] } as any
      component.selectedActivityMap = { A1: true }
      expect(component.isAddDisabled()).toBe(false)
    })

    it('should enable when the role already had previous activities', () => {
      component.selectedRole = { code: 'R1', activityDetails: [{ code: 'A1' }] } as any
      component.selectedActivityMap = {}
      expect(component.isAddDisabled()).toBe(false)
    })
  })

  describe('empty-state getters', () => {
    it('should prompt role selection when no role is chosen', () => {
      component.selectedRole = null
      expect(component.emptyStateMessage).toBe('Select a role to view and map activities.')
      expect(component.emptyStateTitle).toBe('Role not selected')
      expect(component.emptyStateIcon).toBe('touch_app')
    })

    it('should show a no-results message while searching with a role selected', () => {
      component.selectedRole = { code: 'R1' } as any
      component.searchTerm = 'xyz'
      expect(component.emptyStateMessage).toBe('No activities found for your search.')
      expect(component.emptyStateTitle).toBe('No activity found')
      expect(component.emptyStateIcon).toBe('manage_search')
    })

    it('should show a no-mappings message when not searching with a role selected', () => {
      component.selectedRole = { code: 'R1' } as any
      component.searchTerm = ''
      expect(component.emptyStateMessage).toBe('No existing activities mapped to this role. Search and add activities.')
      expect(component.emptyStateTitle).toBe('No activity mapped yet')
      expect(component.emptyStateIcon).toBe('playlist_add_check')
    })
  })
});
