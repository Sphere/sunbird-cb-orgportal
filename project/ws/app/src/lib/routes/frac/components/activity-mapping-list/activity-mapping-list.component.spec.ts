import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityMappingListComponent } from './activity-mapping-list.component';

describe('ActivityMappingListComponent', () => {
  let component: ActivityMappingListComponent;
  let fixture: ComponentFixture<ActivityMappingListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivityMappingListComponent]
    });
    fixture = TestBed.createComponent(ActivityMappingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should copy and sort activities', () => {
    component.activities = [{ code: 'B1', title: 'Bee' } as any, { code: 'A1', title: 'Aye' } as any]
    component.ngOnInit()
    expect(component.filteredActivities.map(a => a.code)).toEqual(['A1', 'B1'])
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

  describe('expand', () => {
    it('should expand a collapsed item', () => {
      const item = { code: 'A1' } as any
      component.expand(item)
      expect(component.expanded).toBe(item)
    })

    it('should collapse an already-expanded item', () => {
      const item = { code: 'A1' } as any
      component.expanded = item
      component.expand(item)
      expect(component.expanded).toBeNull()
    })
  })

  describe('onHeaderClick', () => {
    it('should select the activity and stop propagation for a different code', () => {
      component.selectedActivityCode = 'A1'
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      const selectSpy = jest.spyOn(component.activitySelected, 'emit')
      component.onHeaderClick({ code: 'A2' } as any, event)
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(selectSpy).toHaveBeenCalledWith({ code: 'A2' })
    })

    it('should expand instead of re-selecting when the same code is clicked', () => {
      component.selectedActivityCode = 'A1'
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      const item = { code: 'A1' }
      component.onHeaderClick(item as any, event)
      expect(component.expanded).toBe(item)
    })
  })

  it('activitySelectedHandler should emit the given activity', () => {
    const emitSpy = jest.spyOn(component.activitySelected, 'emit')
    component.activitySelectedHandler({ code: 'A1' } as any)
    expect(emitSpy).toHaveBeenCalledWith({ code: 'A1' })
  })

  describe('trackByCode', () => {
    it('should return the code when present', () => {
      expect(component.trackByCode(2, { code: 'A1' } as any)).toBe('A1')
    })

    it('should fall back to the index when code is missing', () => {
      expect(component.trackByCode(2, {} as any)).toBe('2')
    })
  })

  describe('getSortedCompetencies', () => {
    it('should sort competencyDetails by code then label', () => {
      const activity = {
        competencyDetails: [
          { code: 'B1', label: 'Bee' },
          { code: 'A1', label: 'Aye' },
        ],
      } as any
      expect(component.getSortedCompetencies(activity).map(c => c.code)).toEqual(['A1', 'B1'])
    })

    it('should return an empty array when competencyDetails is missing', () => {
      expect(component.getSortedCompetencies({} as any)).toEqual([])
    })
  })

  describe('hasValidLevels', () => {
    it('should return false when there are no competency details', () => {
      expect(component.hasValidLevels({} as any)).toBe(false)
    })

    it('should return false when all levels are blank', () => {
      const activity = { competencyDetails: [{ levels: '' }, { levels: '   ' }] } as any
      expect(component.hasValidLevels(activity)).toBe(false)
    })

    it('should return true when at least one level is non-blank', () => {
      const activity = { competencyDetails: [{ levels: '' }, { levels: 'L1' }] } as any
      expect(component.hasValidLevels(activity)).toBe(true)
    })
  })
});
