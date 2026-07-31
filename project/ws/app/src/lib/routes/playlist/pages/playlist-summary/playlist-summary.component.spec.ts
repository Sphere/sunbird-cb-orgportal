import { of, throwError } from 'rxjs'
import { PlaylistSummaryComponent } from './playlist-summary.component'
import { PLAYLIST_ROUTES } from '../../constants/playlist.constants'
import { ASKME_COURSE_CONTEXT_KEY } from '../../config/course-context.config'

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

import { inject } from '@angular/core'

describe('PlaylistSummaryComponent', () => {
  let component: PlaylistSummaryComponent
  let routerMock: any
  let dialogMock: any
  let stateMock: any
  let courseApiMock: any

  const baseFilters = { orgId: 'org1', orgName: 'Org One', role: ['ROLE1'], language: 'en' }

  const buildComponent = () => {
    routerMock = { navigate: jest.fn() }
    dialogMock = { open: jest.fn() }
    stateMock = {
      getFilters: jest.fn().mockReturnValue(baseFilters),
      getExistingCourseIds: jest.fn().mockReturnValue([]),
      getExistingPlaylist: jest.fn().mockReturnValue(null),
      getExistingCompetencyIds: jest.fn().mockReturnValue([]),
      getExistingCompetencyPlaylist: jest.fn().mockReturnValue(null),
      getExistingSearchPlaylist: jest.fn().mockReturnValue(null),
      clearCourseCache: jest.fn(),
      clearSelectedCourses: jest.fn(),
    }
    courseApiMock = {
      searchCoursesByIds: jest.fn().mockReturnValue(of({ courses: [] })),
    }

    ;(inject as jest.Mock).mockImplementation((token: any) => {
      const name = (token && token.name) || ''
      if (/Router$/.test(name)) return routerMock
      if (/MatDialog$/.test(name)) return dialogMock
      if (/PlaylistStateService$/.test(name)) return stateMock
      if (/CourseApiService$/.test(name)) return courseApiMock
      return null
    })

    return new PlaylistSummaryComponent()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    component = buildComponent()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('navigates to filters route when no filters exist', () => {
      stateMock.getFilters.mockReturnValue(null)
      component.ngOnInit()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
      expect(component.filters()).toBeNull()
    })

    it('does not navigate when filters exist and populates filters signal', () => {
      component.ngOnInit()
      expect(routerMock.navigate).not.toHaveBeenCalled()
      expect(component.filters()).toEqual(baseFilters)
    })

    it('loads course summary with N/A when no existing course ids', () => {
      component.ngOnInit()
      expect(component.courseSummary()).toEqual({ total: 0, lastUpdated: 'N/A' })
      expect(component.hasExistingCoursePlaylist()).toBe(false)
    })

    it('loads course summary with timeAgo when ids and updated_at exist', () => {
      stateMock.getExistingCourseIds.mockReturnValue(['c1', 'c2'])
      stateMock.getExistingPlaylist.mockReturnValue({ updated_at: new Date().toISOString() })
      component.ngOnInit()
      expect(component.courseSummary().total).toBe(2)
      expect(component.courseSummary().lastUpdated).toBe('Just now')
      expect(component.hasExistingCoursePlaylist()).toBe(true)
    })

    it('loads askme course summary using askme context key', () => {
      stateMock.getExistingCourseIds.mockImplementation((key?: string) =>
        key === ASKME_COURSE_CONTEXT_KEY ? ['a1'] : [],
      )
      stateMock.getExistingPlaylist.mockImplementation((key?: string) =>
        key === ASKME_COURSE_CONTEXT_KEY ? { updated_at: new Date().toISOString() } : null,
      )
      component.ngOnInit()
      expect(component.askmeCourseSummary().total).toBe(1)
      expect(component.hasExistingAskmeCoursePlaylist()).toBe(true)
      expect(component.courseSummary().total).toBe(0)
    })

    it('loads competency summary', () => {
      stateMock.getExistingCompetencyIds.mockReturnValue(['comp1'])
      stateMock.getExistingCompetencyPlaylist.mockReturnValue({ updated_at: new Date().toISOString() })
      component.ngOnInit()
      expect(component.competencySummary().total).toBe(1)
      expect(component.hasExistingCompetencyPlaylist()).toBe(true)
    })

    it('loads search summary as N/A when no payload', () => {
      stateMock.getExistingSearchPlaylist.mockReturnValue({ dataSource: {} })
      component.ngOnInit()
      expect(component.searchSummary()).toEqual({ total: 0, lastUpdated: 'N/A' })
      expect(component.hasExistingSearchPlaylist()).toBe(false)
    })

    it('loads search summary with timeAgo when payload exists', () => {
      stateMock.getExistingSearchPlaylist.mockReturnValue({
        dataSource: { payload: { q: 'x' } },
        updated_at: new Date().toISOString(),
      })
      component.ngOnInit()
      expect(component.searchSummary().total).toBe(1)
      expect(component.searchSummary().lastUpdated).toBe('Just now')
      expect(component.hasExistingSearchPlaylist()).toBe(true)
    })
  })

  describe('timeAgo (via loadExistingPlaylist)', () => {
    const setUpdatedAt = (msAgo: number) => {
      stateMock.getExistingCourseIds.mockReturnValue(['c1'])
      stateMock.getExistingPlaylist.mockReturnValue({
        updated_at: new Date(Date.now() - msAgo).toISOString(),
      })
    }

    it('returns "Just now" for under a minute', () => {
      setUpdatedAt(5 * 1000)
      component.ngOnInit()
      expect(component.courseSummary().lastUpdated).toBe('Just now')
    })

    it('returns minutes ago (plural)', () => {
      setUpdatedAt(5 * 60 * 1000)
      component.ngOnInit()
      expect(component.courseSummary().lastUpdated).toBe('5 mins ago')
    })

    it('returns singular minute', () => {
      setUpdatedAt(1 * 60 * 1000)
      component.ngOnInit()
      expect(component.courseSummary().lastUpdated).toBe('1 min ago')
    })

    it('returns hours ago', () => {
      setUpdatedAt(3 * 60 * 60 * 1000)
      component.ngOnInit()
      expect(component.courseSummary().lastUpdated).toBe('3 hrs ago')
    })

    it('returns days ago', () => {
      setUpdatedAt(2 * 24 * 60 * 60 * 1000)
      component.ngOnInit()
      expect(component.courseSummary().lastUpdated).toBe('2 days ago')
    })

    it('returns months ago', () => {
      setUpdatedAt(90 * 24 * 60 * 60 * 1000)
      component.ngOnInit()
      expect(component.courseSummary().lastUpdated).toBe('3 months ago')
    })

    it('returns years ago', () => {
      setUpdatedAt(400 * 24 * 60 * 60 * 1000)
      component.ngOnInit()
      expect(component.courseSummary().lastUpdated).toBe('1 year ago')
    })
  })

  describe('onChangeFilters', () => {
    it('navigates to home filters route', () => {
      component.onChangeFilters()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
    })
  })

  describe('onManageCourse', () => {
    it('clears course cache and selected courses, then navigates', () => {
      component.onManageCourse()
      expect(stateMock.clearCourseCache).toHaveBeenCalled()
      expect(stateMock.clearSelectedCourses).toHaveBeenCalledWith()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.SELECT_COURSES])
    })
  })

  describe('onManageAskmeCourse', () => {
    it('clears caches and navigates to the askme select route', () => {
      component.onManageAskmeCourse()
      expect(stateMock.clearCourseCache).toHaveBeenCalled()
      expect(stateMock.clearSelectedCourses).toHaveBeenCalledWith(ASKME_COURSE_CONTEXT_KEY)
      expect(routerMock.navigate).toHaveBeenCalled()
    })
  })

  describe('onCompetencyClick', () => {
    it('navigates to select competencies route', () => {
      component.onCompetencyClick()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.SELECT_COMPETENCIES])
    })
  })

  describe('onSearchClick', () => {
    it('navigates to manage search route', () => {
      component.onSearchClick()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.MANAGE_SEARCH])
    })
  })

  describe('onViewSearch', () => {
    it('returns early when there are no filters', () => {
      component.ngOnInit()
      component.filters.set(null)
      component.onViewSearch()
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('returns early when there is no existing search playlist', () => {
      component.ngOnInit()
      stateMock.getExistingSearchPlaylist.mockReturnValue(null)
      component.onViewSearch()
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('opens the dialog with search payload data', () => {
      component.ngOnInit()
      stateMock.getExistingSearchPlaylist.mockReturnValue({
        dataSource: { payload: { q: 'abc' } },
        playlistId: 'pl-1',
      })
      component.onViewSearch()
      expect(dialogMock.open).toHaveBeenCalled()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.mode).toBe('search')
      expect(options.data.playlistId).toBe('pl-1')
      expect(options.data.searchPayloadJson).toContain('abc')
    })
  })

  describe('onViewCourse / onViewAskmeCourse (openCourseView)', () => {
    it('returns early when there are no filters', async () => {
      component.ngOnInit()
      component.filters.set(null)
      await component.onViewCourse()
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('returns early when there is no existing playlist for the context', async () => {
      component.ngOnInit()
      stateMock.getExistingPlaylist.mockReturnValue(null)
      await component.onViewCourse()
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('builds course rows and opens dialog for default context', async () => {
      component.ngOnInit()
      stateMock.getExistingPlaylist.mockReturnValue({
        dataSource: { payload: ['course-1', 'course-2'] },
        playlistId: 'pl-2',
      })
      courseApiMock.searchCoursesByIds.mockReturnValue(
        of({ courses: [{ identifier: 'course-1', name: 'Course 1', sourceName: 'src' }] }),
      )
      await component.onViewCourse()
      expect(courseApiMock.searchCoursesByIds).toHaveBeenCalledWith(['course-1', 'course-2'])
      expect(dialogMock.open).toHaveBeenCalled()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.mode).toBe('course')
      expect(options.data.courseRows).toEqual([
        { index: 0, identifier: 'course-1', name: 'Course 1', sourceName: 'src' },
        { index: 1, identifier: 'course-2', name: 'course-2', sourceName: 'N/A' },
      ])
    })

    it('builds course rows for the askme context', async () => {
      component.ngOnInit()
      stateMock.getExistingPlaylist.mockReturnValue({
        dataSource: { payload: [] },
        playlistId: 'pl-3',
      })
      await component.onViewAskmeCourse()
      expect(dialogMock.open).toHaveBeenCalled()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.title).toBe('Askme Course Playlist View')
    })

    it('handles a non-array payload by producing no course rows and skipping the API call', async () => {
      component.ngOnInit()
      stateMock.getExistingPlaylist.mockReturnValue({
        dataSource: { payload: null },
        playlistId: 'pl-4',
      })
      await component.onViewCourse()
      expect(courseApiMock.searchCoursesByIds).not.toHaveBeenCalled()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.courseRows).toEqual([])
    })

    it('handles a missing courses field in the api response', async () => {
      component.ngOnInit()
      stateMock.getExistingPlaylist.mockReturnValue({
        dataSource: { payload: ['course-1'] },
        playlistId: 'pl-5',
      })
      courseApiMock.searchCoursesByIds.mockReturnValue(of({}))
      await component.onViewCourse()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.courseRows).toEqual([
        { index: 0, identifier: 'course-1', name: 'course-1', sourceName: 'N/A' },
      ])
    })
  })

  describe('onViewCompetency', () => {
    it('returns early when there are no filters', () => {
      component.ngOnInit()
      component.filters.set(null)
      component.onViewCompetency()
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('returns early when there is no existing competency playlist', () => {
      component.ngOnInit()
      stateMock.getExistingCompetencyPlaylist.mockReturnValue(null)
      component.onViewCompetency()
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('builds competency rows sorted by index with sorted levels, and opens dialog', () => {
      component.ngOnInit()
      stateMock.getExistingCompetencyPlaylist.mockReturnValue({
        dataSource: {
          payload: [
            {
              code: 'C2',
              name: 'Competency 2',
              index: 1,
              levels: [
                { level: 3, courseId: 'x' },
                { level: 1, courseId: 'y' },
              ],
            },
            { id: 'id1', code: 'C1', name: 'Competency 1', index: 0, levels: [] },
          ],
        },
        playlistId: 'pl-6',
      })
      component.onViewCompetency()
      expect(dialogMock.open).toHaveBeenCalled()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.mode).toBe('competency')
      const rows = options.data.competencyRows
      expect(rows.map((r: any) => r.code)).toEqual(['C1', 'C2'])
      expect(rows[1].levels.map((l: any) => l.level)).toEqual([1, 3])
    })

    it('handles wrapped competency payload objects and falls back to code when name missing', () => {
      component.ngOnInit()
      stateMock.getExistingCompetencyPlaylist.mockReturnValue({
        dataSource: {
          payload: [
            { wrapper: { code: 'C3', id: 'id3' } },
            'not-an-object',
            {},
          ],
        },
        playlistId: 'pl-7',
      })
      component.onViewCompetency()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.competencyRows.length).toBe(1)
      expect(options.data.competencyRows[0].name).toBe('C3')
    })

    it('handles a non-array payload gracefully producing no rows', () => {
      component.ngOnInit()
      stateMock.getExistingCompetencyPlaylist.mockReturnValue({
        dataSource: { payload: undefined },
        playlistId: 'pl-8',
      })
      component.onViewCompetency()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.competencyRows).toEqual([])
    })

    it('sorts levels with non-numeric labels using localeCompare fallback', () => {
      component.ngOnInit()
      stateMock.getExistingCompetencyPlaylist.mockReturnValue({
        dataSource: {
          payload: [
            {
              code: 'C4',
              index: 0,
              levels: [
                { level: 'Beginner', courseId: 'a' },
                { level: 'Advanced', courseId: 'b' },
              ],
            },
          ],
        },
        playlistId: 'pl-9',
      })
      component.onViewCompetency()
      const [, options] = dialogMock.open.mock.calls[0]
      expect(options.data.competencyRows[0].levels.map((l: any) => l.level)).toEqual(['Beginner', 'Advanced'])
    })
  })

  describe('getRoleDisplay', () => {
    it('returns empty string when no filters', () => {
      component.filters.set(null)
      expect(component.getRoleDisplay()).toBe('')
    })

    it('returns empty string when filters have no role', () => {
      component.filters.set({ ...baseFilters, role: undefined } as any)
      expect(component.getRoleDisplay()).toBe('')
    })

    it('joins array roles with a comma', () => {
      component.filters.set({ ...baseFilters, role: ['A', 'B'] } as any)
      expect(component.getRoleDisplay()).toBe('A, B')
    })

    it('returns the role string as-is when not an array', () => {
      component.filters.set({ ...baseFilters, role: 'SOLO' } as any)
      expect(component.getRoleDisplay()).toBe('SOLO')
    })
  })
})
