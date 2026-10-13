import { of, throwError, Subject } from 'rxjs'
import { ManageCompetencyOrderComponent } from './manage-competency-order.component'
import { PLAYLIST_ROUTES } from '../../constants/playlist.constants'
import { PlaylistType } from '../../services/playlist-api.service'

// The component uses Angular's `inject()` calls in field initializers, so we can't
// `new` it directly like a plain class — we stub `inject` to return our mocks
// based on which token is requested, mirroring how DI would resolve them.
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core')
  return {
    ...actual,
    inject: jest.fn(),
  }
})

jest.mock('@angular/core/rxjs-interop', () => ({
  takeUntilDestroyed: () => (source: any) => source,
}))

import { inject } from '@angular/core'

describe('ManageCompetencyOrderComponent', () => {
  let component: ManageCompetencyOrderComponent
  let routerMock: any
  let dialogMock: any
  let stateMock: any
  let playlistApiMock: any
  let courseApiMock: any
  let featureAccessMock: any

  const makeCompetency = (overrides: any = {}) => ({
    id: overrides.id ?? '1',
    code: overrides.code ?? 'C1',
    name: overrides.name ?? 'Competency 1',
    selected: true,
    displayOrder: overrides.displayOrder ?? 1,
    coursesAssigned: overrides.coursesAssigned ?? false,
    levels: overrides.levels ?? [
      { level: 1 }, { level: 2 }, { level: 3 }, { level: 4 }, { level: 5 },
    ],
    ...overrides,
  })

  const buildComponent = () => {
    routerMock = { navigate: jest.fn() }
    dialogMock = { open: jest.fn() }
    stateMock = {
      getSelectedCompetencies: jest.fn().mockReturnValue([]),
      getExistingCompetencyPlaylist: jest.fn().mockReturnValue(null),
      setSelectedCompetencies: jest.fn(),
      getFilters: jest.fn().mockReturnValue({ role: ['ROLE1'] }),
      compareRoles: jest.fn().mockReturnValue({ isNewPlaylist: true, isExactMatch: true, newRoles: [], existingOnlyRoles: [] }),
      getMergedRoles: jest.fn().mockReturnValue(['ROLE1']),
    }
    playlistApiMock = {
      savePlaylist: jest.fn().mockReturnValue(of({})),
    }
    courseApiMock = {
      searchCoursesByCompetency: jest.fn().mockReturnValue(of({ courses: [] })),
      filterCoursesByLevel: jest.fn().mockReturnValue([]),
    }
    featureAccessMock = {
      isViewOnly: jest.fn().mockReturnValue(false),
    }

    ;(inject as jest.Mock).mockImplementation((token: any) => {
      const name = (token && token.name) || ''
      if (/Router$/.test(name)) return routerMock
      if (/MatDialog$/.test(name)) return dialogMock
      if (/PlaylistStateService$/.test(name)) return stateMock
      if (/PlaylistApiService$/.test(name)) return playlistApiMock
      if (/CourseApiService$/.test(name)) return courseApiMock
      if (/FeatureAccessService$/.test(name)) return featureAccessMock
      if (/DestroyRef$/.test(name)) return {}
      // FEATURE_KEY InjectionToken or anything else
      return null
    })

    return new ManageCompetencyOrderComponent()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    component = buildComponent()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('isViewOnly', () => {
    it('delegates to featureAccess.isViewOnly', () => {
      featureAccessMock.isViewOnly.mockReturnValue(true)
      expect(component.isViewOnly).toBe(true)
      expect(featureAccessMock.isViewOnly).toHaveBeenCalled()
    })
  })

  describe('ngOnInit', () => {
    it('redirects to select-competencies when nothing is selected', () => {
      stateMock.getSelectedCompetencies.mockReturnValue([])
      component.ngOnInit()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.SELECT_COMPETENCIES])
      expect(component.competencies()).toEqual([])
    })

    it('loads competencies when some are selected', () => {
      const comps = [makeCompetency({ id: '1' }), makeCompetency({ id: '2' })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      expect(routerMock.navigate).not.toHaveBeenCalled()
      expect(component.competencies().length).toBe(2)
      expect(component.selectedCompetency()).toEqual(component.competencies()[0])
    })
  })

  describe('loadCompetencies (via ngOnInit)', () => {
    it('assigns default levels and display order when none exist', () => {
      const raw = [{ id: '1', code: 'C1', name: 'Comp 1', selected: true }]
      stateMock.getSelectedCompetencies.mockReturnValue(raw)
      component.ngOnInit()
      const comps = component.competencies()
      expect(comps[0].levels?.length).toBe(5)
      expect(comps[0].displayOrder).toBe(1)
    })

    it('restores order and assignment from existing playlist payload', () => {
      const raw = [makeCompetency({ id: '1', code: 'C1' }), makeCompetency({ id: '2', code: 'C2' })]
      stateMock.getSelectedCompetencies.mockReturnValue(raw)
      stateMock.getExistingCompetencyPlaylist.mockReturnValue({
        dataSource: {
          payload: [
            { code: 'C2', index: 0 },
            { code: 'C1', index: 1 },
          ],
        },
      })
      component.ngOnInit()
      const comps = component.competencies()
      // C2 should now be first since its saved index is 0
      expect(comps[0].code).toBe('C2')
      expect(comps[1].code).toBe('C1')
    })

    it('marks a competency complete when all 5 levels have courseIds', () => {
      const levels = [1, 2, 3, 4, 5].map(level => ({ level, courseId: `course-${level}` }))
      const raw = [makeCompetency({ id: '1', code: 'C1', levels, coursesAssigned: false })]
      stateMock.getSelectedCompetencies.mockReturnValue(raw)
      component.ngOnInit()
      expect(component.competencies()[0].coursesAssigned).toBe(true)
    })

    it('does nothing when loadCompetencies finds no selected competencies at call time', () => {
      // First call (ngOnInit guard) has data, but loadCompetencies re-reads and sees none.
      stateMock.getSelectedCompetencies
        .mockReturnValueOnce([makeCompetency()])
        .mockReturnValueOnce([])
      component.ngOnInit()
      expect(component.competencies()).toEqual([])
    })
  })

  describe('loadCompetencyLevelCourses (via onSelectCompetency)', () => {
    it('does nothing when competency has no id', () => {
      component.onSelectCompetency({ id: '' } as any)
      expect(courseApiMock.searchCoursesByCompetency).not.toHaveBeenCalled()
    })

    it('fetches and caches courses, updates level-filtered courses', () => {
      const comp = makeCompetency({ id: 'abc' })
      courseApiMock.searchCoursesByCompetency.mockReturnValue(of({ courses: [{ identifier: 'x', name: 'Course X' }] }))
      component.onSelectCompetency(comp)
      expect(component.courses()).toEqual([{ identifier: 'x', name: 'Course X' }])
      expect(courseApiMock.filterCoursesByLevel).toHaveBeenCalled()
      expect(component.loadingCourses()).toBe(false)
    })

    it('uses cache on second call for same competency (no second API call)', () => {
      const comp = makeCompetency({ id: 'abc' })
      courseApiMock.searchCoursesByCompetency.mockReturnValue(of({ courses: [{ identifier: 'x', name: 'X' }] }))
      component.onSelectCompetency(comp)
      courseApiMock.searchCoursesByCompetency.mockClear()
      component.onSelectCompetency(comp)
      expect(courseApiMock.searchCoursesByCompetency).not.toHaveBeenCalled()
      expect(component.courses()).toEqual([{ identifier: 'x', name: 'X' }])
    })

    it('handles missing courses field in response gracefully', () => {
      const comp = makeCompetency({ id: 'no-courses' })
      courseApiMock.searchCoursesByCompetency.mockReturnValue(of({}))
      component.onSelectCompetency(comp)
      expect(component.courses()).toEqual([])
    })

    it('handles API errors by clearing level-filtered courses and stopping loading', () => {
      const comp = makeCompetency({ id: 'err' })
      courseApiMock.searchCoursesByCompetency.mockReturnValue(throwError(() => new Error('boom')))
      component.onSelectCompetency(comp)
      expect(component.loadingCourses()).toBe(false)
      expect(component.getCoursesForLevel(1)).toEqual(component.courses())
    })

    it('clears the loading guard timeout via finalize', () => {
      const comp = makeCompetency({ id: 'slow' })
      const subject = new Subject<any>()
      courseApiMock.searchCoursesByCompetency.mockReturnValue(subject.asObservable())
      component.onSelectCompetency(comp)
      expect(component.loadingCourses()).toBe(true)
      subject.next({ courses: [] })
      subject.complete()
      expect(component.loadingCourses()).toBe(false)
    })
  })

  describe('onDrop', () => {
    beforeEach(() => {
      const comps = [makeCompetency({ id: '1', code: 'A', displayOrder: 1 }), makeCompetency({ id: '2', code: 'B', displayOrder: 2 }), makeCompetency({ id: '3', code: 'C', displayOrder: 3 })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
    })

    it('does nothing while auto-saving', () => {
      component.autoSaving.set(true)
      const before = component.competencies()
      component.onDrop({ previousIndex: 0, currentIndex: 2 } as any)
      expect(component.competencies()).toBe(before)
    })

    it('does nothing when previousIndex === currentIndex', () => {
      const before = component.competencies()
      component.onDrop({ previousIndex: 1, currentIndex: 1 } as any)
      expect(component.competencies()).toBe(before)
    })

    it('reorders the full list and updates displayOrder when there is no search term', () => {
      component.onDrop({ previousIndex: 0, currentIndex: 2 } as any)
      const comps = component.competencies()
      expect(comps.map(c => c.code)).toEqual(['B', 'C', 'A'])
      expect(comps.map(c => c.displayOrder)).toEqual([1, 2, 3])
      expect(stateMock.setSelectedCompetencies).toHaveBeenCalledWith(comps)
    })

    it('merges filtered order back into full list when searching', () => {
      component.searchTerm.set('a')
      component.filterCompetencies()
      // Filtered should just contain "A" (matches code 'a') - force filtered list explicitly for a
      // deterministic scenario with two matches instead:
      component.searchTerm.set('')
      component.filterCompetencies()
      // Simulate a search matching B and C only
      component.searchTerm.set('b')
      // manually build filtered list with B and C to test merge logic path
      component.filteredCompetencies.set(component.competencies().filter(c => c.code === 'B' || c.code === 'C'))
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      const comps = component.competencies()
      // A stays in place, B and C swap
      expect(comps.map(c => c.code)).toEqual(['A', 'C', 'B'])
    })

    it('returns early when filtered list is empty', () => {
      component.filteredCompetencies.set([])
      const before = component.competencies()
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      expect(component.competencies()).toBe(before)
    })

    it('triggers auto-save when all competencies become complete after reorder', () => {
      const comps = component.competencies().map(c => ({ ...c, coursesAssigned: true }))
      component.competencies.set(comps)
      component.filteredCompetencies.set([...comps])
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      expect(playlistApiMock.savePlaylist).toHaveBeenCalled()
    })
  })

  describe('onSearch / filterCompetencies', () => {
    beforeEach(() => {
      const comps = [makeCompetency({ id: '1', code: 'ALPHA', name: 'Alpha' }), makeCompetency({ id: '2', code: 'BETA', name: 'Beta' })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
    })

    it('filters by name (case-insensitive)', () => {
      component.searchTerm.set('alp')
      component.onSearch()
      expect(component.filteredCompetencies().map(c => c.code)).toEqual(['ALPHA'])
    })

    it('filters by code', () => {
      component.searchTerm.set('BETA')
      component.onSearch()
      expect(component.filteredCompetencies().map(c => c.code)).toEqual(['BETA'])
    })

    it('returns full list when search term is empty', () => {
      component.searchTerm.set('')
      component.onSearch()
      expect(component.filteredCompetencies().length).toBe(2)
    })

    it('returns empty filtered list when there are no competencies at all', () => {
      component.competencies.set([])
      component.filterCompetencies()
      expect(component.filteredCompetencies()).toEqual([])
    })
  })

  describe('onSelectCompetency', () => {
    it('sets the selected competency and loads its courses', () => {
      const comp = makeCompetency({ id: '5' })
      component.onSelectCompetency(comp)
      expect(component.selectedCompetency()).toBe(comp)
      expect(courseApiMock.searchCoursesByCompetency).toHaveBeenCalledWith('5', '')
    })
  })

  describe('getCoursesForLevel', () => {
    it('returns level-filtered courses when present', () => {
      const comp = makeCompetency({ id: 'lvl' })
      courseApiMock.filterCoursesByLevel.mockReturnValue([{ identifier: 'f1' }])
      courseApiMock.searchCoursesByCompetency.mockReturnValue(of({ courses: [{ identifier: 'f1' }] }))
      component.onSelectCompetency(comp)
      expect(component.getCoursesForLevel(1)).toEqual([{ identifier: 'f1' }])
    })

    it('falls back to full courses list when level not present in map', () => {
      component.courses.set([{ identifier: 'fallback' } as any])
      expect(component.getCoursesForLevel(999)).toEqual([{ identifier: 'fallback' }])
    })
  })

  describe('onCourseSelect', () => {
    it('does nothing when level or courseId missing', () => {
      component.onCourseSelect(null as any, 'x')
      component.onCourseSelect({ level: 1 } as any, '')
      expect(stateMock.setSelectedCompetencies).not.toHaveBeenCalled()
    })

    it('sets courseId/courseName on the level and persists to state', () => {
      const comps = [makeCompetency({ id: '1' })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      component.courses.set([{ identifier: 'c1', name: 'Course One' } as any])
      const level = component.competencies()[0].levels[0]
      component.onCourseSelect(level, 'c1')
      expect(level.courseId).toBe('c1')
      expect(level.courseName).toBe('Course One')
      expect(stateMock.setSelectedCompetencies).toHaveBeenCalled()
    })

    it('falls back to empty courseName when course not found', () => {
      const comps = [makeCompetency({ id: '1' })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      component.courses.set([])
      const level = component.competencies()[0].levels[0]
      component.onCourseSelect(level, 'unknown')
      expect(level.courseName).toBe('')
    })
  })

  describe('isCurrentCompetencyComplete', () => {
    it('returns false when no competency selected', () => {
      expect(component.isCurrentCompetencyComplete()).toBe(false)
    })

    it('returns false when a level lacks a courseId', () => {
      component.selectedCompetency.set(makeCompetency({ levels: [{ level: 1 }] }))
      expect(component.isCurrentCompetencyComplete()).toBe(false)
    })

    it('returns true when all levels have courseIds', () => {
      component.selectedCompetency.set(makeCompetency({ levels: [{ level: 1, courseId: 'a' }] }))
      expect(component.isCurrentCompetencyComplete()).toBe(true)
    })
  })

  describe('onAssignCourses', () => {
    it('does nothing when nothing selected', () => {
      component.onAssignCourses()
      expect(component.selectedCompetency()).toBeNull()
    })

    it('does nothing when the current competency is incomplete', () => {
      const comp = makeCompetency({ levels: [{ level: 1 }] })
      component.selectedCompetency.set(comp)
      component.onAssignCourses()
      expect(comp.coursesAssigned).toBe(false)
    })

    it('marks complete and advances to next incomplete competency', () => {
      const comp1 = makeCompetency({ id: '1', code: 'A', levels: [{ level: 1, courseId: 'x' }], coursesAssigned: false })
      const comp2 = makeCompetency({ id: '2', code: 'B', coursesAssigned: false })
      stateMock.getSelectedCompetencies.mockReturnValue([comp1, comp2])
      component.ngOnInit()
      component.selectedCompetency.set(component.competencies()[0])
      component.onAssignCourses()
      expect(component.competencies()[0].coursesAssigned).toBe(true)
      expect(component.selectedCompetency()?.code).toBe('B')
    })

    it('leaves selection unchanged when no incomplete competency remains', () => {
      const comp1 = makeCompetency({ id: '1', code: 'A', levels: [{ level: 1, courseId: 'x' }], coursesAssigned: true })
      stateMock.getSelectedCompetencies.mockReturnValue([comp1])
      component.ngOnInit()
      component.selectedCompetency.set(component.competencies()[0])
      const selectSpy = jest.spyOn(component.selectedCompetency, 'set')
      component.onAssignCourses()
      expect(selectSpy).not.toHaveBeenCalled()
    })
  })

  describe('isCompetencyComplete', () => {
    it('returns false for falsy competency', () => {
      expect(component.isCompetencyComplete(null as any)).toBe(false)
    })

    it('returns coursesAssigned flag', () => {
      expect(component.isCompetencyComplete(makeCompetency({ coursesAssigned: true }))).toBe(true)
      expect(component.isCompetencyComplete(makeCompetency({ coursesAssigned: false }))).toBe(false)
    })
  })

  describe('onBack', () => {
    it('navigates to select-competencies route', () => {
      component.onBack()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.SELECT_COMPETENCIES])
    })
  })

  describe('onSave', () => {
    it('shows error and stops when no filters available', async () => {
      stateMock.getFilters.mockReturnValue(null)
      await component.onSave()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
    })

    it('saves directly when it is a new playlist (no role confirmation needed)', async () => {
      stateMock.compareRoles.mockReturnValue({ isNewPlaylist: true, isExactMatch: true, newRoles: [], existingOnlyRoles: [] })
      await component.onSave()
      expect(playlistApiMock.savePlaylist).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        undefined,
        PlaylistType.COMPETENCY,
      )
      expect(component.saving()).toBe(false)
    })

    it('opens role confirmation dialog and cancels save when user declines', async () => {
      stateMock.compareRoles.mockReturnValue({ isNewPlaylist: false, isExactMatch: false, newRoles: ['R1'], existingOnlyRoles: ['R2'] })
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      await component.onSave()
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
    })

    it('proceeds with save after user confirms role change dialog', async () => {
      stateMock.compareRoles.mockReturnValue({ isNewPlaylist: false, isExactMatch: false, newRoles: ['R1'], existingOnlyRoles: ['R2'] })
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })
      await component.onSave()
      expect(playlistApiMock.savePlaylist).toHaveBeenCalled()
    })

    it('shows success dialog and navigates on save success', async () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_SUMMARY])
    })

    it('shows an error dialog and resets saving flag on save failure', async () => {
      playlistApiMock.savePlaylist.mockReturnValue(throwError(() => new Error('fail')))
      await component.onSave()
      expect(component.saving()).toBe(false)
      expect(dialogMock.open).toHaveBeenCalled()
    })
  })

  describe('autoSaveOrder (via onDrop)', () => {
    it('does not save when competencies are incomplete', () => {
      const comps = [makeCompetency({ id: '1', coursesAssigned: false }), makeCompetency({ id: '2', coursesAssigned: false })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
    })

    it('logs and bails out when filters are missing', () => {
      const comps = [makeCompetency({ id: '1', coursesAssigned: true }), makeCompetency({ id: '2', coursesAssigned: true })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      stateMock.getFilters.mockReturnValue(null)
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
      expect(component.autoSaving()).toBe(false)
    })

    it('saves successfully and resets autoSaving flag', () => {
      const comps = [makeCompetency({ id: '1', coursesAssigned: true }), makeCompetency({ id: '2', coursesAssigned: true })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      expect(playlistApiMock.savePlaylist).toHaveBeenCalled()
      expect(component.autoSaving()).toBe(false)
    })

    it('shows an error dialog and resets autoSaving flag on failure', () => {
      const comps = [makeCompetency({ id: '1', coursesAssigned: true }), makeCompetency({ id: '2', coursesAssigned: true })]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      playlistApiMock.savePlaylist.mockReturnValue(throwError(() => new Error('auto-save-fail')))
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      expect(component.autoSaving()).toBe(false)
      expect(dialogMock.open).toHaveBeenCalled()
    })
  })

  describe('allCompetenciesComplete computed', () => {
    it('is false when there are no competencies', () => {
      expect(component.allCompetenciesComplete()).toBe(false)
    })

    it('is true only when every competency is complete', () => {
      const comps = [
        makeCompetency({ id: '1', levels: [{ level: 1, courseId: 'a' }], coursesAssigned: false }),
        makeCompetency({ id: '2', coursesAssigned: false }),
      ]
      stateMock.getSelectedCompetencies.mockReturnValue(comps)
      component.ngOnInit()
      expect(component.allCompetenciesComplete()).toBe(false)

      // onAssignCourses marks the current competency complete and bumps the
      // completion tick, which is what allCompetenciesComplete depends on.
      component.selectedCompetency.set(component.competencies()[0])
      component.onAssignCourses()
      expect(component.allCompetenciesComplete()).toBe(false)

      const second = component.competencies()[1]
      second.levels = [{ level: 1, courseId: 'b' }]
      component.selectedCompetency.set(second)
      component.onAssignCourses()
      expect(component.allCompetenciesComplete()).toBe(true)
    })
  })
})
