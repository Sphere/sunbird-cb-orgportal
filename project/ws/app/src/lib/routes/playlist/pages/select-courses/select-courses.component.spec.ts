import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { SelectCoursesComponent } from './select-courses.component'
import { CourseApiService } from '../../services/course-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PLAYLIST_ROUTES } from '../../constants/playlist.constants'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('SelectCoursesComponent', () => {
  let component: SelectCoursesComponent
  let fixture: ComponentFixture<SelectCoursesComponent>
  let mockCourseApi: jest.Mocked<CourseApiService>
  let mockState: jest.Mocked<PlaylistStateService>
  let mockRouter: jest.Mocked<Router>
  let routeData: any

  const rawCourse = (overrides: any = {}) => ({
    identifier: 'c1',
    name: 'Alpha',
    sourceName: 'Src',
    primaryCategory: 'Course',
    status: 'Live',
    lang: 'en',
    createdOn: '2020-01-01',
    ...overrides,
  })

  const configureTestingModule = async () => {
    await TestBed.configureTestingModule({
      imports: [SelectCoursesComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: CourseApiService, useValue: mockCourseApi },
        { provide: PlaylistStateService, useValue: mockState },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: routeData } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(SelectCoursesComponent)
    component = fixture.componentInstance
  }

  beforeEach(() => {
    routeData = {}
    mockCourseApi = createSpyObj('CourseApiService', ['loadAllCourses', 'filterCourses'])
    mockState = createSpyObj('PlaylistStateService', [
      'getExistingCourseIds',
      'getExistingPlaylist',
      'getFilters',
      'getCachedCourses',
      'setCachedCourses',
      'getSelectedCourses',
      'setSelectedCourses',
    ])
    mockRouter = createSpyObj('Router', ['navigate'])

    mockState.getExistingCourseIds.mockReturnValue([])
    mockState.getExistingPlaylist.mockReturnValue(null)
    mockState.getFilters.mockReturnValue({ orgId: 'org1', role: [], language: 'en' } as any)
    mockState.getCachedCourses.mockReturnValue(null)
    mockState.getSelectedCourses.mockReturnValue([])
    mockCourseApi.loadAllCourses.mockResolvedValue([rawCourse()])
    mockCourseApi.filterCourses.mockImplementation((courses: any) => courses)
  })

  it('should create and load courses on init', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(component).toBeTruthy()
    expect(mockCourseApi.loadAllCourses).toHaveBeenCalledWith('')
    expect(component.allCourses().length).toBe(1)
    expect(component.loading()).toBe(false)
  })

  it('should navigate to filters page when no filters are set', async () => {
    mockState.getFilters.mockReturnValue(null)
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(mockRouter.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
    expect(mockCourseApi.loadAllCourses).not.toHaveBeenCalled()
  })

  it('should use cached courses when available and skip API call', async () => {
    mockState.getCachedCourses.mockReturnValue([rawCourse({ identifier: 'c2', name: 'Beta' })])
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(mockCourseApi.loadAllCourses).not.toHaveBeenCalled()
    expect(component.allCourses()[0].identifier).toBe('c2')
  })

  it('should handle API error while loading courses', async () => {
    mockCourseApi.loadAllCourses.mockRejectedValue(new Error('boom'))
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(component.loading()).toBe(false)
    expect(component.allCourses().length).toBe(0)
  })

  it('should mark existing courses as preselected and select them', async () => {
    mockState.getExistingCourseIds.mockReturnValue(['c1'])
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    const course = component.allCourses()[0]
    expect(course.isPreselected).toBe(true)
    expect(component.selection.isSelected(course)).toBe(true)
  })

  it('should respect preselected order from existing playlist payload', async () => {
    mockCourseApi.loadAllCourses.mockResolvedValue([
      rawCourse({ identifier: 'c1', name: 'Alpha' }),
      rawCourse({ identifier: 'c2', name: 'Beta' }),
    ])
    mockState.getExistingCourseIds.mockReturnValue(['c1', 'c2'])
    mockState.getExistingPlaylist.mockReturnValue({
      dataSource: { payload: ['c2', 'c1'] },
    } as any)
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    const courses = component.allCourses()
    expect(courses[0].identifier).toBe('c2')
    expect(courses[1].identifier).toBe('c1')
  })

  it('should ignore non-array playlist payload', async () => {
    mockState.getExistingPlaylist.mockReturnValue({ dataSource: { payload: 'not-an-array' } } as any)
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(component.allCourses().length).toBe(1)
  })

  it('should restore saved selections by identifier', async () => {
    mockCourseApi.loadAllCourses.mockResolvedValue([
      rawCourse({ identifier: 'c1', name: 'Alpha' }),
      rawCourse({ identifier: 'c2', name: 'Beta' }),
    ])
    mockState.getSelectedCourses.mockReturnValue([{ identifier: 'c2' } as any])
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    const c2 = component.allCourses().find(c => c.identifier === 'c2')
    expect(c2 && component.selection.isSelected(c2)).toBe(true)
  })

  it('should filter courses via search term', async () => {
    mockCourseApi.filterCourses.mockReturnValue([rawCourse({ identifier: 'c1' })] as any)
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    component.searchTerm.set('Alpha')
    component.onSearch()

    expect(mockCourseApi.filterCourses).toHaveBeenCalled()
    expect(component.filteredCourses().length).toBe(1)
  })

  it('should show all courses when search term is blank', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    component.searchTerm.set('   ')
    component.onSearch()

    expect(component.searchResultCourses().length).toBe(component.allCourses().length)
  })

  it('should select a row on onSelectionChange when checked', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    const course = component.allCourses()[0]
    const event = { target: { checked: true } } as unknown as Event
    component.onSelectionChange(course, event)

    expect(component.selection.isSelected(course)).toBe(true)
  })

  it('should deselect a row on onSelectionChange when unchecked', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    const course = component.allCourses()[0]
    component.selection.select(course)
    const event = { target: { checked: false } } as unknown as Event
    component.onSelectionChange(course, event)

    expect(component.selection.isSelected(course)).toBe(false)
  })

  it('should navigate back to summary on onBack', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    component.onBack()
    expect(mockRouter.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_SUMMARY])
  })

  it('should save selected courses and navigate to order route on onNext', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    const course = component.allCourses()[0]
    component.selection.select(course)
    component.onNext()

    expect(mockState.setSelectedCourses).toHaveBeenCalledWith([course], component.context.key)
    expect(mockRouter.navigate).toHaveBeenCalledWith([component.context.orderRoute])
  })

  it('should report isNextEnabled based on selection', async () => {
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(component.isNextEnabled()).toBe(false)
    component.selection.select(component.allCourses()[0])
    expect(component.isNextEnabled()).toBe(true)
  })

  it('should resolve askme context from route data', async () => {
    routeData = { courseContext: 'askme' }
    await configureTestingModule()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(component.context.key).toBe('askme')
  })
})
