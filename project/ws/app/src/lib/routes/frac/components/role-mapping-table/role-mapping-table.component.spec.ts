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

  it('should populate filteredPositions and sort on init', () => {
    component.positions = [{ code: 'B' } as any, { code: 'A' } as any]
    component.ngOnInit()
    expect(component.filteredPositions[0].code).toBe('A')
  })

  it('ngOnChanges: updates filteredPositions when positions change', () => {
    component.positions = [{ code: 'Z' } as any]
    component.ngOnChanges({ positions: { firstChange: false } as any })
    expect(component.filteredPositions[0].code).toBe('Z')
  })

  it('ngOnChanges: does nothing when positions not in changes', () => {
    component.filteredPositions = [{ code: 'X' } as any]
    component.ngOnChanges({})
    expect(component.filteredPositions[0].code).toBe('X')
  })

  it('ngOnChanges: resets searchTerm when searchResetKey changes and not firstChange', () => {
    component.searchTerm = 'abc'
    component.ngOnChanges({ searchResetKey: { firstChange: false } as any })
    expect(component.searchTerm).toBe('')
  })

  it('ngOnChanges: keeps searchTerm when searchResetKey is firstChange', () => {
    component.searchTerm = 'abc'
    component.ngOnChanges({ searchResetKey: { firstChange: true } as any })
    expect(component.searchTerm).toBe('abc')
  })

  it('toggleSort: flips from asc to desc and re-sorts', () => {
    component.filteredPositions = [{ code: 'A' } as any, { code: 'B' } as any]
    component.sortDirection = 'asc'
    component.toggleSort()
    expect(component.sortDirection).toBe('desc')
    expect(component.filteredPositions[0].code).toBe('B')
  })

  it('toggleSort: flips from desc to asc', () => {
    component.sortDirection = 'desc'
    component.toggleSort()
    expect(component.sortDirection).toBe('asc')
  })

  it('applySort: does nothing when sortDirection is empty', () => {
    component.filteredPositions = [{ code: 'B' } as any, { code: 'A' } as any]
    component.sortDirection = ''
    component.applySort()
    expect(component.filteredPositions[0].code).toBe('B')
  })

  it('applySort: handles missing code values', () => {
    component.filteredPositions = [{ code: undefined } as any, { code: 'A' } as any]
    component.sortDirection = 'asc'
    expect(() => component.applySort()).not.toThrow()
  })

  it('onSearchChange: does nothing when no selectedRole', () => {
    component.selectedRole = null
    const spy = jest.spyOn(component.searchChange, 'emit')
    component.onSearchChange()
    expect(spy).not.toHaveBeenCalled()
  })

  it('onSearchChange: emits trimmed search term when selectedRole present', () => {
    component.selectedRole = { code: 'P1' } as any
    component.searchTerm = '  hello  '
    const spy = jest.spyOn(component.searchChange, 'emit')
    component.onSearchChange()
    expect(spy).toHaveBeenCalledWith('hello')
  })

  it('isChecked: returns true when selectedPositionMap has code', () => {
    component.selectedPositionMap = { P1: true }
    expect(component.isChecked('P1')).toBe(true)
  })

  it('isChecked: returns false when selectedPositionMap missing code', () => {
    component.selectedPositionMap = {}
    expect(component.isChecked('P2')).toBe(false)
  })

  it('isChecked: returns false when selectedPositionMap is null', () => {
    component.selectedPositionMap = null as any
    expect(component.isChecked('P2')).toBe(false)
  })

  it('onCheckboxChange: emits code and checked', () => {
    const spy = jest.spyOn(component.positionCheckChange, 'emit')
    component.onCheckboxChange('P1', true)
    expect(spy).toHaveBeenCalledWith({ code: 'P1', checked: true })
  })

  it('onAddPosition: emits addPosition', () => {
    const spy = jest.spyOn(component.addPosition, 'emit')
    component.onAddPosition()
    expect(spy).toHaveBeenCalled()
  })

  describe('isAddDisabled', () => {
    it('returns true when no selectedRole', () => {
      component.selectedRole = null
      expect(component.isAddDisabled()).toBe(true)
    })

    it('returns true when isSaving', () => {
      component.selectedRole = { code: 'P1' } as any
      component.isSaving = true
      expect(component.isAddDisabled()).toBe(true)
    })

    it('returns true when nothing selected and no previous roleDetails', () => {
      component.selectedRole = { code: 'P1', roleDetails: [] } as any
      component.isSaving = false
      component.selectedPositionMap = {}
      expect(component.isAddDisabled()).toBe(true)
    })

    it('returns false when there is a selected item', () => {
      component.selectedRole = { code: 'P1', roleDetails: [] } as any
      component.isSaving = false
      component.selectedPositionMap = { R1: true }
      expect(component.isAddDisabled()).toBe(false)
    })

    it('returns false when there is previous roleDetails even with nothing newly selected', () => {
      component.selectedRole = { code: 'P1', roleDetails: [{ code: 'R1' }] } as any
      component.isSaving = false
      component.selectedPositionMap = {}
      expect(component.isAddDisabled()).toBe(false)
    })
  })

  describe('emptyStateMessage', () => {
    it('returns select-position message when no selectedRole', () => {
      component.selectedRole = null
      expect(component.emptyStateMessage).toBe('Select a position to view and map roles.')
    })

    it('returns no-roles-found message when searching', () => {
      component.selectedRole = { code: 'P1' } as any
      component.searchTerm = 'abc'
      expect(component.emptyStateMessage).toBe('No roles found for your search.')
    })

    it('returns default message when not searching', () => {
      component.selectedRole = { code: 'P1' } as any
      component.searchTerm = ''
      expect(component.emptyStateMessage).toBe('No existing roles mapped to this position. Search and add roles.')
    })
  })

  describe('emptyStateTitle', () => {
    it('returns position-not-selected title when no selectedRole', () => {
      component.selectedRole = null
      expect(component.emptyStateTitle).toBe('Position not selected')
    })

    it('returns no-role-found title when searching', () => {
      component.selectedRole = { code: 'P1' } as any
      component.searchTerm = 'x'
      expect(component.emptyStateTitle).toBe('No role found')
    })

    it('returns no-role-mapped title when not searching', () => {
      component.selectedRole = { code: 'P1' } as any
      component.searchTerm = ''
      expect(component.emptyStateTitle).toBe('No role mapped yet')
    })
  })

  describe('emptyStateIcon', () => {
    it('returns touch_app icon when no selectedRole', () => {
      component.selectedRole = null
      expect(component.emptyStateIcon).toBe('touch_app')
    })

    it('returns manage_search icon when searching', () => {
      component.selectedRole = { code: 'P1' } as any
      component.searchTerm = 'x'
      expect(component.emptyStateIcon).toBe('manage_search')
    })

    it('returns playlist_add_check icon when not searching', () => {
      component.selectedRole = { code: 'P1' } as any
      component.searchTerm = ''
      expect(component.emptyStateIcon).toBe('playlist_add_check')
    })
  })
})
