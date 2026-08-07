import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetencyMappingTableComponent } from './competency-mapping-table.component';

describe('CompetencyMappingTableComponent', () => {
  let component: CompetencyMappingTableComponent;
  let fixture: ComponentFixture<CompetencyMappingTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompetencyMappingTableComponent]
    });
    fixture = TestBed.createComponent(CompetencyMappingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should copy, sync display levels, and sort', () => {
    component.competencies = [{ code: 'B1' } as any, { code: 'A1' } as any]
    component.ngOnInit()
    expect(component.filteredCompetencies.map(c => c.code)).toEqual(['A1', 'B1'])
    expect(component.displayLevels).toEqual(['L1', 'L2', 'L3', 'L4', 'L5'])
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

  describe('toggleSort / applySort', () => {
    it('should flip asc to desc and re-sort descending', () => {
      component.filteredCompetencies = [{ code: 'A1' } as any, { code: 'B1' } as any]
      component.sortDirection = 'asc'
      component.toggleSort()
      expect(component.sortDirection).toBe('desc')
      expect(component.filteredCompetencies.map(c => c.code)).toEqual(['B1', 'A1'])
    })

    it('should flip desc back to asc', () => {
      component.sortDirection = 'desc'
      component.toggleSort()
      expect(component.sortDirection).toBe('asc')
    })

    it('applySort should no-op when sortDirection is empty', () => {
      component.filteredCompetencies = [{ code: 'B1' } as any, { code: 'A1' } as any]
      component.sortDirection = ''
      component.applySort()
      expect(component.filteredCompetencies.map(c => c.code)).toEqual(['B1', 'A1'])
    })
  })

  describe('syncDisplayLevels (via ngOnChanges)', () => {
    it('should append extra normalized levels beyond the default 5', () => {
      component.levels = ['l1', ' L6 ', 'bad-level', 'L2']
      component.ngOnChanges({})
      expect(component.displayLevels).toEqual(['L1', 'L2', 'L3', 'L4', 'L5', 'L6'])
    })

    it('should keep the default levels when levels input is empty', () => {
      component.levels = []
      component.ngOnChanges({})
      expect(component.displayLevels).toEqual(['L1', 'L2', 'L3', 'L4', 'L5'])
    })
  })

  describe('onSearchChange', () => {
    it('should not emit when no activity is selected', () => {
      component.selectedActivity = null
      const emitSpy = jest.spyOn(component.searchChange, 'emit')
      component.onSearchChange()
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('should emit the search term when an activity is selected', () => {
      component.selectedActivity = { code: 'A1' } as any
      component.searchTerm = 'abc'
      const emitSpy = jest.spyOn(component.searchChange, 'emit')
      component.onSearchChange()
      expect(emitSpy).toHaveBeenCalledWith('abc')
    })
  })

  describe('isChecked', () => {
    it('should reflect the selection map', () => {
      component.selectedMap = { C1: ['C1_L1'] }
      expect(component.isChecked('C1', 'C1_L1')).toBe(true)
      expect(component.isChecked('C1', 'C1_L2')).toBe(false)
    })

    it('should return falsy for a code with no entry', () => {
      component.selectedMap = {}
      expect(component.isChecked('C1', 'C1_L1')).toBeFalsy()
    })
  })

  it('checkChange should emit code/level/checked', () => {
    const emitSpy = jest.spyOn(component.checked, 'emit')
    component.checkChange('C1', 'C1_L1', true)
    expect(emitSpy).toHaveBeenCalledWith({ code: 'C1', level: 'C1_L1', checked: true })
  })

  describe('buildSelectedCompetencies', () => {
    it('should build a summary with joined level suffixes and matched label', () => {
      component.competencies = [{ code: 'C1', label: 'Comp1' } as any]
      component.selectedMap = { C1: ['C1_L1', 'C1_L2'] }
      expect(component.buildSelectedCompetencies()).toEqual([
        { code: 'C1', label: 'Comp1', levels: 'L1,L2' },
      ])
    })

    it('should default label to empty string when the competency is not found', () => {
      component.competencies = []
      component.selectedMap = { C1: ['C1_L1'] }
      expect(component.buildSelectedCompetencies()).toEqual([
        { code: 'C1', label: '', levels: 'L1' },
      ])
    })
  })

  it('onAddCompetency should emit a fresh array from buildSelectedCompetencies', () => {
    component.competencies = [{ code: 'C1', label: 'Comp1' } as any]
    component.selectedMap = { C1: ['C1_L1'] }
    const emitSpy = jest.spyOn(component.addCompetency, 'emit')
    component.onAddCompetency()
    expect(emitSpy).toHaveBeenCalledWith([{ code: 'C1', label: 'Comp1', levels: 'L1' }])
  })

  describe('isAddDisabled', () => {
    it('should disable when no activity is selected', () => {
      component.selectedActivity = null
      expect(component.isAddDisabled()).toBe(true)
    })

    it('should disable while saving', () => {
      component.selectedActivity = { code: 'A1' } as any
      component.isSaving = true
      expect(component.isAddDisabled()).toBe(true)
    })

    it('should disable when nothing is selected and there were no previous competencies', () => {
      component.selectedActivity = { code: 'A1', competencyDetails: [] } as any
      component.isSaving = false
      component.selectedMap = {}
      expect(component.isAddDisabled()).toBe(true)
    })

    it('should enable when at least one level is selected', () => {
      component.selectedActivity = { code: 'A1', competencyDetails: [] } as any
      component.isSaving = false
      component.selectedMap = { C1: ['C1_L1'] }
      expect(component.isAddDisabled()).toBe(false)
    })

    it('should enable when the activity already had previous competencies', () => {
      component.selectedActivity = { code: 'A1', competencyDetails: [{ code: 'C1' }] } as any
      component.isSaving = false
      component.selectedMap = {}
      expect(component.isAddDisabled()).toBe(false)
    })
  })

  describe('empty-state getters', () => {
    it('should prompt activity selection when none is chosen', () => {
      component.selectedActivity = null
      expect(component.emptyStateTitle).toBe('Activity not selected')
      expect(component.emptyStateMessage).toBe('Please select an activity to search competency.')
    })

    it('should show a no-results message while searching', () => {
      component.selectedActivity = { code: 'A1' } as any
      component.searchTerm = 'xyz'
      expect(component.emptyStateTitle).toBe('No competency found')
      expect(component.emptyStateMessage).toBe('No competency matches your search. Try another keyword.')
    })

    it('should show a search prompt when not searching', () => {
      component.selectedActivity = { code: 'A1' } as any
      component.searchTerm = ''
      expect(component.emptyStateTitle).toBe('No competency mapped yet')
      expect(component.emptyStateMessage).toBe('Use the search bar to find the competency to map.')
    })
  })
});
