import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { SelectCompetenciesComponent } from './select-competencies.component'
import { CompetencyApiService } from '../../services/competency-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PLAYLIST_ROUTES } from '../../constants/playlist.constants'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('SelectCompetenciesComponent', () => {
  let component: SelectCompetenciesComponent
  let fixture: ComponentFixture<SelectCompetenciesComponent>
  let mockCompetencyApi: jest.Mocked<CompetencyApiService>
  let mockState: jest.Mocked<PlaylistStateService>
  let mockRouter: jest.Mocked<Router>

  const rawCompetency = (overrides: any = {}) => ({
    id: 1,
    code: 'C1',
    name: 'Alpha',
    description: '',
    children: [],
    ...overrides,
  })

  const configureTestingModule = async () => {
    await TestBed.configureTestingModule({
      imports: [SelectCompetenciesComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: CompetencyApiService, useValue: mockCompetencyApi },
        { provide: PlaylistStateService, useValue: mockState },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(SelectCompetenciesComponent)
    component = fixture.componentInstance
  }

  beforeEach(() => {
    mockCompetencyApi = createSpyObj('CompetencyApiService', ['getCompetencyListByLanguage'])
    mockState = createSpyObj('PlaylistStateService', [
      'getExistingCompetencyCodes',
      'getExistingCompetencyPlaylist',
      'getFilters',
      'getCachedCompetencies',
      'setCachedCompetencies',
      'getSelectedCompetencies',
      'setSelectedCompetencies',
    ])
    mockRouter = createSpyObj('Router', ['navigate'])

    mockState.getExistingCompetencyCodes.mockReturnValue([])
    mockState.getExistingCompetencyPlaylist.mockReturnValue(null)
    mockState.getFilters.mockReturnValue({ orgId: 'org1', role: [], language: 'en' } as any)
    mockState.getCachedCompetencies.mockReturnValue(null)
    mockState.getSelectedCompetencies.mockReturnValue([])
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([rawCompetency()]) as any)
  })

  it('should create and load competencies on init', async () => {
    await configureTestingModule()
    fixture.detectChanges()

    expect(component).toBeTruthy()
    expect(mockCompetencyApi.getCompetencyListByLanguage).toHaveBeenCalledWith('en')
    expect(component.allCompetencies().length).toBe(1)
    expect(component.loading()).toBe(false)
  })

  it('should navigate to filters page when no filters are set', async () => {
    mockState.getFilters.mockReturnValue(null)
    await configureTestingModule()
    fixture.detectChanges()

    expect(mockRouter.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
    expect(mockCompetencyApi.getCompetencyListByLanguage).not.toHaveBeenCalled()
  })

  it('should use cached competencies when available and skip API call', async () => {
    mockState.getCachedCompetencies.mockReturnValue([rawCompetency({ id: 2, code: 'C2', name: 'Beta' })])
    await configureTestingModule()
    fixture.detectChanges()

    expect(mockCompetencyApi.getCompetencyListByLanguage).not.toHaveBeenCalled()
    expect(component.allCompetencies()[0].code).toBe('C2')
  })

  it('should default to english when filter language is missing', async () => {
    mockState.getFilters.mockReturnValue({ orgId: 'org1', role: [] } as any)
    await configureTestingModule()
    fixture.detectChanges()

    expect(mockCompetencyApi.getCompetencyListByLanguage).toHaveBeenCalledWith('en')
  })

  it('should handle API error while loading competencies', async () => {
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(throwError({ message: 'boom' }))
    await configureTestingModule()
    fixture.detectChanges()

    expect(component.loading()).toBe(false)
    expect(component.allCompetencies().length).toBe(0)
  })

  it('should map competencies with children into levels', async () => {
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
      rawCompetency({
        id: 3,
        code: 'C3',
        name: 'Gamma',
        children: [{ levelId: 1, level: 'L1', name: 'Level One', description: 'd1' }],
      }),
    ]) as any)
    await configureTestingModule()
    fixture.detectChanges()

    const comp = component.allCompetencies().find(c => c.code === 'C3')
    expect(comp?.levels?.length).toBe(1)
    expect(comp?.levels?.[0].level).toBe(1)
  })

  it('should fall back to default level numbers when no children present', async () => {
    await configureTestingModule()
    fixture.detectChanges()

    const comp = component.allCompetencies()[0]
    expect(comp.levels && comp.levels.length).toBeGreaterThan(0)
  })

  it('should mark existing competencies as preselected', async () => {
    mockState.getExistingCompetencyCodes.mockReturnValue(['c1'])
    await configureTestingModule()
    fixture.detectChanges()

    const comp = component.allCompetencies()[0]
    expect(comp.isPreselected).toBe(true)
    expect(component.selection.isSelected(comp)).toBe(true)
  })

  it('should restore saved selections by code', async () => {
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
      rawCompetency({ id: 1, code: 'C1', name: 'Alpha' }),
      rawCompetency({ id: 2, code: 'C2', name: 'Beta' }),
    ]) as any)
    mockState.getSelectedCompetencies.mockReturnValue([{ code: 'C2', id: '2' } as any])
    await configureTestingModule()
    fixture.detectChanges()

    const selected = component.allCompetencies().filter(c => component.selection.isSelected(c))
    expect(selected.length).toBe(1)
    expect(selected[0].code).toBe('C2')
  })

  it('should restore saved selections by id when code missing', async () => {
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
      rawCompetency({ id: 5, code: '', name: 'NoCode' }),
    ]) as any)
    mockState.getSelectedCompetencies.mockReturnValue([{ code: '', id: '5' } as any])
    await configureTestingModule()
    fixture.detectChanges()

    expect(component.selection.selected.length).toBe(1)
  })

  it('should fall back to backend preselected ids when no saved selection matches', async () => {
    mockState.getExistingCompetencyCodes.mockReturnValue(['C1'])
    mockState.getSelectedCompetencies.mockReturnValue([{ code: 'ZZZ', id: '999' } as any])
    await configureTestingModule()
    fixture.detectChanges()

    const comp = component.allCompetencies()[0]
    expect(component.selection.isSelected(comp)).toBe(true)
  })

  it('should build preselected order map from existing playlist payload', async () => {
    mockState.getExistingCompetencyPlaylist.mockReturnValue({
      dataSource: { payload: [{ code: 'C1', index: 5 }] },
    } as any)
    await configureTestingModule()
    fixture.detectChanges()

    expect((component as any).preselectedCompetencyOrderMap.get('C1')).toBe(5)
  })

  it('should handle wrapped payload entries without a top-level code', async () => {
    mockState.getExistingCompetencyPlaylist.mockReturnValue({
      dataSource: { payload: [{ wrapper: { code: 'C1', index: 2 } }] },
    } as any)
    await configureTestingModule()
    fixture.detectChanges()

    expect((component as any).preselectedCompetencyOrderMap.get('C1')).toBe(2)
  })

  it('should ignore non-array payload and null/invalid items', async () => {
    mockState.getExistingCompetencyPlaylist.mockReturnValue({ dataSource: { payload: 'not-an-array' } } as any)
    await configureTestingModule()
    expect(() => fixture.detectChanges()).not.toThrow()

    mockState.getExistingCompetencyPlaylist.mockReturnValue({
      dataSource: { payload: [null, 42, { code: '' }] },
    } as any)
    const fixture2 = TestBed.createComponent(SelectCompetenciesComponent)
    expect(() => fixture2.detectChanges()).not.toThrow()
  })

  describe('onSearch', () => {
    beforeEach(async () => {
      mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
        rawCompetency({ id: 1, code: 'C1', name: 'Alpha' }),
        rawCompetency({ id: 2, code: 'C2', name: 'Beta' }),
      ]) as any)
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('should reset to full list when search term is blank', () => {
      component.searchTerm.set('  ')
      component.onSearch()
      expect(component.searchResultCompetencies().length).toBe(2)
    })

    it('should filter by name', () => {
      component.searchTerm.set('alpha')
      component.onSearch()
      expect(component.searchResultCompetencies().length).toBe(1)
      expect(component.searchResultCompetencies()[0].code).toBe('C1')
    })

    it('should filter by code', () => {
      component.searchTerm.set('c2')
      component.onSearch()
      expect(component.searchResultCompetencies().length).toBe(1)
      expect(component.searchResultCompetencies()[0].code).toBe('C2')
    })
  })

  describe('onSelectionChange', () => {
    beforeEach(async () => {
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('should select row when checkbox checked', () => {
      const row = component.allCompetencies()[0]
      const event = { target: { checked: true } } as unknown as Event
      component.onSelectionChange(row, event)
      expect(component.selection.isSelected(row)).toBe(true)
    })

    it('should deselect row when checkbox unchecked', () => {
      const row = component.allCompetencies()[0]
      component.selection.select(row)
      const event = { target: { checked: false } } as unknown as Event
      component.onSelectionChange(row, event)
      expect(component.selection.isSelected(row)).toBe(false)
    })
  })

  it('onBack should navigate to summary route', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    component.onBack()
    expect(mockRouter.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_SUMMARY])
  })

  it('should sort preselected competencies by playlist payload order when both preselected', async () => {
    mockState.getExistingCompetencyCodes.mockReturnValue(['C1', 'C2'])
    mockState.getExistingCompetencyPlaylist.mockReturnValue({
      dataSource: { payload: [{ code: 'C2', index: 0 }, { code: 'C1', index: 1 }] },
    } as any)
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
      rawCompetency({ id: 1, code: 'C1', name: 'Alpha' }),
      rawCompetency({ id: 2, code: 'C2', name: 'Beta' }),
    ]) as any)
    await configureTestingModule()
    fixture.detectChanges()

    const codes = component.allCompetencies().map(c => c.code)
    expect(codes[0]).toBe('C2')
    expect(codes[1]).toBe('C1')
  })

  it('should fall back to name comparison when codes are equal', async () => {
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
      rawCompetency({ id: 1, code: 'SAME', name: 'Zeta' }),
      rawCompetency({ id: 2, code: 'SAME', name: 'Alpha' }),
    ]) as any)
    await configureTestingModule()
    fixture.detectChanges()

    const names = component.allCompetencies().map(c => c.name)
    expect(names[0]).toBe('Alpha')
    expect(names[1]).toBe('Zeta')
  })

  it('should use arrayIndex fallback when payload item has no numeric index', async () => {
    mockState.getExistingCompetencyPlaylist.mockReturnValue({
      dataSource: { payload: [{ code: 'C1' }] },
    } as any)
    await configureTestingModule()
    fixture.detectChanges()

    expect((component as any).preselectedCompetencyOrderMap.get('C1')).toBe(0)
  })

  it('should fall back to default levels when children is undefined', async () => {
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
      rawCompetency({ id: 9, code: 'C9', name: 'Nine', children: undefined }),
    ]) as any)
    await configureTestingModule()
    fixture.detectChanges()

    const comp = component.allCompetencies().find(c => c.code === 'C9')
    expect(comp?.levels && comp.levels.length).toBeGreaterThan(0)
  })

  it('should handle saved selections with missing code/id gracefully', async () => {
    mockState.getSelectedCompetencies.mockReturnValue([{ code: '', id: '' } as any])
    await configureTestingModule()
    expect(() => fixture.detectChanges()).not.toThrow()
  })

  it('should treat items with missing code/name as empty strings when sorting', async () => {
    mockCompetencyApi.getCompetencyListByLanguage.mockReturnValue(of([
      rawCompetency({ id: 1, code: '', name: '' }),
      rawCompetency({ id: 2, code: '', name: '' }),
    ]) as any)
    await configureTestingModule()
    expect(() => fixture.detectChanges()).not.toThrow()
    expect(component.allCompetencies().length).toBe(2)
  })

  it('onAssignCourses should save selected competencies and navigate', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    const row = component.allCompetencies()[0]
    component.selection.select(row)

    component.onAssignCourses()

    expect(mockState.setSelectedCompetencies).toHaveBeenCalledWith([row])
    expect(mockRouter.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.MANAGE_COMPETENCY_ORDER])
  })
})
