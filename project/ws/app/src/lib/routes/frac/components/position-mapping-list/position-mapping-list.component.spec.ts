import { ComponentFixture, TestBed } from '@angular/core/testing'

import { PositionMappingListComponent } from './position-mapping-list.component'

describe('PositionMappingListComponent', () => {
  let component: PositionMappingListComponent
  let fixture: ComponentFixture<PositionMappingListComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PositionMappingListComponent],
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionMappingListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should copy roles into filteredRoles and sort them by code then title', () => {
      component.roles = [
        { code: 'b', title: 'Beta' } as any,
        { code: 'a', title: 'Alpha' } as any,
      ]
      component.ngOnInit()
      expect(component.filteredRoles.map(r => r.code)).toEqual(['a', 'b'])
    })

    it('should sort by title when codes are equal', () => {
      component.roles = [
        { code: 'a', title: 'Zeta' } as any,
        { code: 'a', title: 'Alpha' } as any,
      ]
      component.ngOnInit()
      expect(component.filteredRoles.map(r => r.title)).toEqual(['Alpha', 'Zeta'])
    })
  })

  describe('ngOnChanges', () => {
    it('should update filteredRoles and re-sort when roles change', () => {
      component.roles = [{ code: 'z', title: 'Z' } as any, { code: 'a', title: 'A' } as any]
      component.ngOnChanges({
        roles: { firstChange: true, currentValue: component.roles, previousValue: [], isFirstChange: () => true },
      } as any)
      expect(component.filteredRoles.map(r => r.code)).toEqual(['a', 'z'])
    })

    it('should not touch filteredRoles when roles input did not change', () => {
      component.filteredRoles = [{ code: 'x', title: 'X' } as any]
      component.ngOnChanges({} as any)
      expect(component.filteredRoles).toEqual([{ code: 'x', title: 'X' }])
    })

    it('should reset searchTerm when searchResetKey changes and it is not the first change', () => {
      component.searchTerm = 'something'
      component.ngOnChanges({
        searchResetKey: { firstChange: false, currentValue: 1, previousValue: 0, isFirstChange: () => false },
      } as any)
      expect(component.searchTerm).toBe('')
    })

    it('should not reset searchTerm when searchResetKey change is the first change', () => {
      component.searchTerm = 'something'
      component.ngOnChanges({
        searchResetKey: { firstChange: true, currentValue: 0, previousValue: 0, isFirstChange: () => true },
      } as any)
      expect(component.searchTerm).toBe('something')
    })

    it('should not reset searchTerm when searchResetKey did not change', () => {
      component.searchTerm = 'something'
      component.ngOnChanges({ roles: { firstChange: true, currentValue: [], previousValue: [], isFirstChange: () => true } } as any)
      expect(component.searchTerm).toBe('something')
    })
  })

  describe('onSearchChange / onSearchSubmit', () => {
    it('should emit searchChange with current searchTerm', () => {
      const spy = jest.spyOn(component.searchChange, 'emit')
      component.searchTerm = 'abc'
      component.onSearchChange()
      expect(spy).toHaveBeenCalledWith('abc')
    })

    it('should emit searchSubmit with current searchTerm', () => {
      const spy = jest.spyOn(component.searchSubmit, 'emit')
      component.searchTerm = 'xyz'
      component.onSearchSubmit()
      expect(spy).toHaveBeenCalledWith('xyz')
    })
  })

  describe('onHeaderClick', () => {
    it('should emit roleSelected when item code differs from selectedPositionCode', () => {
      const event = { stopPropagation: jest.fn() } as any
      const roleSpy = jest.spyOn(component.roleSelected, 'emit')
      component.selectedPositionCode = 'other'
      component.onHeaderClick({ code: 'p1' } as any, event)
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(roleSpy).toHaveBeenCalledWith({ code: 'p1' })
    })

    it('should expand instead of emitting roleSelected when item code equals selectedPositionCode', () => {
      const event = { stopPropagation: jest.fn() } as any
      const expandSpy = jest.spyOn(component, 'expand')
      component.selectedPositionCode = 'p1'
      component.onHeaderClick({ code: 'p1' } as any, event)
      expect(expandSpy).toHaveBeenCalledWith({ code: 'p1' })
    })

    it('should expand when item has no code (itemCode falsy)', () => {
      const event = { stopPropagation: jest.fn() } as any
      const expandSpy = jest.spyOn(component, 'expand')
      component.onHeaderClick({} as any, event)
      expect(expandSpy).toHaveBeenCalled()
    })
  })

  describe('expand', () => {
    it('should set expandedPositionCode to the item code when previously null', () => {
      const toggleSpy = jest.spyOn(component.toggle, 'emit')
      component.expandedPositionCode = null
      component.expand({ code: 'p1' } as any)
      expect(component.expandedPositionCode).toBe('p1')
      expect(toggleSpy).toHaveBeenCalledWith({ code: 'p1' })
    })

    it('should collapse (set to null) when the same code is expanded again', () => {
      component.expandedPositionCode = 'p1'
      component.expand({ code: 'p1' } as any)
      expect(component.expandedPositionCode).toBeNull()
    })

    it('should treat item with no code as null code', () => {
      component.expandedPositionCode = null
      component.expand({} as any)
      expect(component.expandedPositionCode).toBeNull()
    })
  })

  describe('roleSelectedHandler', () => {
    it('should emit roleSelected with the given role', () => {
      const spy = jest.spyOn(component.roleSelected, 'emit')
      component.roleSelectedHandler({ code: 'r1' } as any)
      expect(spy).toHaveBeenCalledWith({ code: 'r1' })
    })
  })

  describe('trackByCode', () => {
    it('should return the item code when present', () => {
      expect(component.trackByCode(0, { code: 'abc' } as any)).toBe('abc')
    })

    it('should return the index as a string when code is missing', () => {
      expect(component.trackByCode(3, {} as any)).toBe('3')
    })

    it('should return the index as a string when item is null', () => {
      expect(component.trackByCode(5, null as any)).toBe('5')
    })
  })

  describe('getSortedRoles', () => {
    it('should sort roleDetails by code then label', () => {
      const position = {
        roleDetails: [
          { code: 'b', label: 'Bravo' },
          { code: 'a', label: 'Alpha' },
        ],
      } as any
      const result = component.getSortedRoles(position)
      expect(result!.map((r: any) => r.code)).toEqual(['a', 'b'])
    })

    it('should sort by label when codes are equal', () => {
      const position = {
        roleDetails: [
          { code: 'a', label: 'Zulu' },
          { code: 'a', label: 'Alpha' },
        ],
      } as any
      const result = component.getSortedRoles(position)
      expect(result!.map((r: any) => r.label)).toEqual(['Alpha', 'Zulu'])
    })

    it('should return an empty array when roleDetails is missing', () => {
      expect(component.getSortedRoles({} as any)).toEqual([])
    })

    it('should return an empty array when position is null', () => {
      expect(component.getSortedRoles(null as any)).toEqual([])
    })
  })

  describe('compareEntities (via getSortedRoles) with missing code/label', () => {
    it('should treat missing code/label as empty strings without throwing', () => {
      const position = {
        roleDetails: [
          { code: undefined, label: undefined },
          { code: 'a', label: 'A' },
        ],
      } as any
      expect(() => component.getSortedRoles(position)).not.toThrow()
    })

    it('should directly exercise all falsy/truthy combinations of code and label args', () => {
      const compareEntities = (component as any).compareEntities.bind(component)
      expect(compareEntities(undefined, 'x', undefined, 'y')).toBeLessThan(0)
      expect(compareEntities('a', undefined, 'a', undefined)).toBe(0)
      expect(compareEntities('a', 'x', undefined, 'y')).toBeGreaterThan(0)
      expect(compareEntities(undefined, undefined, undefined, undefined)).toBe(0)
    })
  })
})
