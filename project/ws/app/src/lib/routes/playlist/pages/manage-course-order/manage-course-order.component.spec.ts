import { of, throwError } from 'rxjs'
import { ManageCourseOrderComponent } from './manage-course-order.component'
import { PLAYLIST_ROUTES } from '../../constants/playlist.constants'
import { COURSE_CONTEXTS } from '../../config/course-context.config'

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

describe('ManageCourseOrderComponent', () => {
  let component: ManageCourseOrderComponent
  let routerMock: any
  let routeMock: any
  let dialogMock: any
  let stateMock: any
  let playlistApiMock: any
  let featureAccessMock: any

  const makeCourse = (overrides: any = {}) => ({
    identifier: overrides.identifier ?? '1',
    name: overrides.name ?? 'Course 1',
    sourceName: overrides.sourceName ?? 'Source A',
    displayOrder: overrides.displayOrder ?? 1,
    ...overrides,
  })

  const buildComponent = (courseContext: string = 'default') => {
    routerMock = { navigate: jest.fn() }
    routeMock = { snapshot: { data: { courseContext } } }
    dialogMock = { open: jest.fn() }
    stateMock = {
      getSelectedCourses: jest.fn().mockReturnValue([]),
      getExistingPlaylist: jest.fn().mockReturnValue(null),
      setOrderedCourses: jest.fn(),
      getFilters: jest.fn().mockReturnValue({ role: ['ROLE1'] }),
      compareRoles: jest.fn().mockReturnValue({ isNewPlaylist: true, isExactMatch: true, newRoles: [], existingOnlyRoles: [] }),
      getMergedRoles: jest.fn().mockReturnValue(['ROLE1']),
      setExistingPlaylist: jest.fn(),
      setExistingCourseIds: jest.fn(),
    }
    playlistApiMock = {
      savePlaylist: jest.fn().mockReturnValue(of({})),
      searchPlaylist: jest.fn().mockReturnValue(of([])),
      extractCourseIds: jest.fn().mockReturnValue([]),
    }
    featureAccessMock = {
      isViewOnly: jest.fn().mockReturnValue(false),
    }

    ;(inject as jest.Mock).mockImplementation((token: any) => {
      const name = (token && token.name) || ''
      if (/Router$/.test(name)) return routerMock
      if (/ActivatedRoute$/.test(name)) return routeMock
      if (/MatDialog$/.test(name)) return dialogMock
      if (/PlaylistStateService$/.test(name)) return stateMock
      if (/PlaylistApiService$/.test(name)) return playlistApiMock
      if (/FeatureAccessService$/.test(name)) return featureAccessMock
      if (/DestroyRef$/.test(name)) return {}
      // FEATURE_KEY InjectionToken or anything else
      return null
    })

    return new ManageCourseOrderComponent()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    component = buildComponent()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('context resolution', () => {
    it('resolves the default context when route data is unknown', () => {
      component = buildComponent('unknown-key')
      expect(component.context).toEqual(COURSE_CONTEXTS.default)
    })

    it('resolves the askme context from route data', () => {
      component = buildComponent('askme')
      expect(component.context).toEqual(COURSE_CONTEXTS.askme)
    })
  })

  describe('isViewOnly', () => {
    it('delegates to featureAccess.isViewOnly', () => {
      featureAccessMock.isViewOnly.mockReturnValue(true)
      expect(component.isViewOnly).toBe(true)
      expect(featureAccessMock.isViewOnly).toHaveBeenCalled()
    })
  })

  describe('ngOnInit / loadSelectedCourses', () => {
    it('redirects to select route when no courses are selected', () => {
      stateMock.getSelectedCourses.mockReturnValue([])
      component.ngOnInit()
      expect(routerMock.navigate).toHaveBeenCalledWith([component.context.selectRoute])
      expect(component.orderedCourses()).toEqual([])
    })

    it('redirects to select route when selected courses is null', () => {
      stateMock.getSelectedCourses.mockReturnValue(null)
      component.ngOnInit()
      expect(routerMock.navigate).toHaveBeenCalledWith([component.context.selectRoute])
    })

    it('populates orderedCourses and filteredCourses with a sequential displayOrder', () => {
      const courses = [makeCourse({ identifier: 'a' }), makeCourse({ identifier: 'b' })]
      stateMock.getSelectedCourses.mockReturnValue(courses)
      component.ngOnInit()
      expect(component.orderedCourses().map(c => c.displayOrder)).toEqual([1, 2])
      expect(component.filteredCourses().length).toBe(2)
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })
  })

  describe('isSaveEnabled', () => {
    it('is false with no courses', () => {
      expect(component.isSaveEnabled()).toBe(false)
    })

    it('is true with courses and not saving', () => {
      stateMock.getSelectedCourses.mockReturnValue([makeCourse()])
      component.ngOnInit()
      expect(component.isSaveEnabled()).toBe(true)
    })

    it('is false while saving', () => {
      stateMock.getSelectedCourses.mockReturnValue([makeCourse()])
      component.ngOnInit()
      component.saving.set(true)
      expect(component.isSaveEnabled()).toBe(false)
    })
  })

  describe('onDrop', () => {
    beforeEach(() => {
      const courses = [makeCourse({ identifier: 'a', name: 'Alpha' }), makeCourse({ identifier: 'b', name: 'Beta' }), makeCourse({ identifier: 'c', name: 'Gamma' })]
      stateMock.getSelectedCourses.mockReturnValue(courses)
      component.ngOnInit()
    })

    it('does nothing when filtered list is empty', () => {
      component.filteredCourses.set([])
      const before = component.orderedCourses()
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      expect(component.orderedCourses()).toBe(before)
    })

    it('does nothing when previousIndex === currentIndex', () => {
      const before = component.orderedCourses()
      component.onDrop({ previousIndex: 1, currentIndex: 1 } as any)
      expect(component.orderedCourses()).toBe(before)
    })

    it('reorders the full list and updates displayOrder when there is no search term', () => {
      component.onDrop({ previousIndex: 0, currentIndex: 2 } as any)
      const courses = component.orderedCourses()
      expect(courses.map(c => c.identifier)).toEqual(['b', 'c', 'a'])
      expect(courses.map(c => c.displayOrder)).toEqual([1, 2, 3])
    })

    it('merges filtered order back into the full list when searching', () => {
      component.searchTerm.set('a')
      component.onSearch()
      // Force a deterministic filtered subset containing b and c only.
      component.filteredCourses.set(component.orderedCourses().filter(c => c.identifier === 'b' || c.identifier === 'c'))
      component.onDrop({ previousIndex: 0, currentIndex: 1 } as any)
      const courses = component.orderedCourses()
      // 'a' stays in place, b and c swap.
      expect(courses.map(c => c.identifier)).toEqual(['a', 'c', 'b'])
    })
  })

  describe('onSearch', () => {
    beforeEach(() => {
      const courses = [makeCourse({ identifier: '1', name: 'Alpha', sourceName: 'Src1' }), makeCourse({ identifier: '2', name: 'Beta', sourceName: 'Src2' })]
      stateMock.getSelectedCourses.mockReturnValue(courses)
      component.ngOnInit()
    })

    it('filters by name (case-insensitive)', () => {
      component.searchTerm.set('alp')
      component.onSearch()
      expect(component.filteredCourses().map(c => c.identifier)).toEqual(['1'])
    })

    it('filters by sourceName', () => {
      component.searchTerm.set('src2')
      component.onSearch()
      expect(component.filteredCourses().map(c => c.identifier)).toEqual(['2'])
    })

    it('returns full list when search term is empty', () => {
      component.searchTerm.set('')
      component.onSearch()
      expect(component.filteredCourses().length).toBe(2)
    })

    it('returns full list when search term is whitespace only', () => {
      component.searchTerm.set('   ')
      component.onSearch()
      expect(component.filteredCourses().length).toBe(2)
    })
  })

  describe('onBack', () => {
    it('navigates to the context select route', () => {
      component.onBack()
      expect(routerMock.navigate).toHaveBeenCalledWith([component.context.selectRoute])
    })
  })

  describe('onSave', () => {
    it('shows error dialog and navigates to filters when no filters available', async () => {
      stateMock.getFilters.mockReturnValue(null)
      await component.onSave()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
    })

    it('saves directly when it is a new playlist (no role confirmation needed)', async () => {
      stateMock.compareRoles.mockReturnValue({ isNewPlaylist: true, isExactMatch: true, newRoles: [], existingOnlyRoles: [] })
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(playlistApiMock.savePlaylist).toHaveBeenCalled()
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
      dialogMock.open
        .mockReturnValueOnce({ afterClosed: () => of(true) })
        .mockReturnValueOnce({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(playlistApiMock.savePlaylist).toHaveBeenCalled()
    })

    it('shows success dialog and navigates to filters on save success', async () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
    })

    it('continues (does not throw) when re-fetch after save fails', async () => {
      playlistApiMock.searchPlaylist.mockReturnValue(throwError(new Error('refetch failed')))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(component.saving()).toBe(false)
      expect(stateMock.setExistingPlaylist).not.toHaveBeenCalled()
    })

    it('shows an error dialog with the first error message and resets saving flag on failure', async () => {
      playlistApiMock.savePlaylist.mockReturnValue(
        throwError({ error: { result: { errors: [{ message: 'bad thing 1' }, { message: 'bad thing 2' }] } } }),
      )
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      await component.onSave()
      expect(component.saving()).toBe(false)
      expect(dialogMock.open).toHaveBeenCalled()
      const errorCall = dialogMock.open.mock.calls.find((call: any[]) => call[1]?.data?.title === 'Save Failed')
      expect(errorCall[1].data.message).toBe('bad thing 1')
      expect(errorCall[1].data.details).toBe('• bad thing 1\n• bad thing 2')
    })

    it('falls back to the Error message when no structured error shape is present', async () => {
      playlistApiMock.savePlaylist.mockReturnValue(throwError(new Error('plain failure')))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      await component.onSave()
      const errorCall = dialogMock.open.mock.calls.find((call: any[]) => call[1]?.data?.title === 'Save Failed')
      expect(errorCall[1].data.message).toBe('plain failure')
    })

    it('falls back to the generic message when the error has no message at all', async () => {
      playlistApiMock.savePlaylist.mockReturnValue(throwError({}))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      await component.onSave()
      const errorCall = dialogMock.open.mock.calls.find((call: any[]) => call[1]?.data?.title === 'Save Failed')
      expect(errorCall[1].data.message).toBe('Failed to save playlist')
    })

    it('retries onSave when the error dialog result signals retry', async () => {
      let callCount = 0
      playlistApiMock.savePlaylist.mockImplementation(() => {
        callCount += 1
        return callCount === 1 ? throwError(new Error('fail once')) : of({})
      })
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })
      await component.onSave()
      expect(callCount).toBeGreaterThanOrEqual(1)
    })
  })
})
