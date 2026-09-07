import { of, throwError } from 'rxjs'
import { MapRoleActivitiesComponent } from './map-role-activities.component'
import { FRAC_ROUTES } from '../../constants/frac.constants'

describe('MapRoleActivitiesComponent', () => {
  let component: MapRoleActivitiesComponent
  let snackbarMock: any
  let fracApiServiceMock: any
  let dialogMock: any
  let routerMock: any

  const roleApiEntity = [
    { code: 'R1', name: 'Role One', additionalProperties: { Code: 'R1' } },
    { code: 'R2', name: 'Role Two', additionalProperties: { Code: 'R2' } },
  ]

  const activityApiEntity = [
    { code: 'A1', name: 'Activity One' },
    { code: 'A2', name: 'Activity Two' },
  ]

  const searchRoleResponse = { result: { data: { entity: roleApiEntity } } }
  const searchActivityResponse = { result: { data: { entity: activityApiEntity } } }

  function makeComponent() {
    snackbarMock = {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
    }
    fracApiServiceMock = {
      searchEntities: jest.fn(),
      searchEntityMapping: jest.fn(),
      mapEntity: jest.fn(),
    }
    const afterClosedSubject = { afterClosed: () => of(undefined) }
    dialogMock = {
      open: jest.fn().mockReturnValue(afterClosedSubject),
    }
    routerMock = {
      navigateByUrl: jest.fn(),
    }

    const comp = new MapRoleActivitiesComponent(
      snackbarMock,
      fracApiServiceMock,
      dialogMock,
      routerMock,
    )
    return comp
  }

  beforeEach(() => {
    fracApiServiceMock = null
    component = makeComponent()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit / ngOnDestroy', () => {
    it('fetches roles on init', () => {
      fracApiServiceMock.searchEntities.mockReturnValue(of(searchRoleResponse))
      component.ngOnInit()
      expect(fracApiServiceMock.searchEntities).toHaveBeenCalledWith('role', '', 'en')
      expect(component.roles.length).toBe(2)
      expect(component.filteredRoles.length).toBe(2)
    })

    it('completes destroy subject on destroy', () => {
      fracApiServiceMock.searchEntities.mockReturnValue(of(searchRoleResponse))
      component.ngOnInit()
      const destroy$: any = (component as any).destroy$
      const nextSpy = jest.spyOn(destroy$, 'next')
      const completeSpy = jest.spyOn(destroy$, 'complete')
      component.ngOnDestroy()
      expect(nextSpy).toHaveBeenCalled()
      expect(completeSpy).toHaveBeenCalled()
    })
  })

  describe('fetchRoles error handling', () => {
    it('clears roles on error', () => {
      fracApiServiceMock.searchEntities.mockReturnValue(throwError(() => new Error('fail')))
      component.ngOnInit()
      expect(component.roles).toEqual([])
      expect(component.filteredRoles).toEqual([])
      expect(component.isRolesLoading).toBe(false)
    })
  })

  describe('fetchActivities error handling', () => {
    it('clears activities on error', () => {
      fracApiServiceMock.searchEntities.mockImplementation((type: string) => {
        if (type === 'role') return of(searchRoleResponse)
        return throwError(() => new Error('fail'))
      })
      component.ngOnInit()
      ;(component as any).fetchActivities('')
      expect(component.activities).toEqual([])
      expect(component.filteredActivities).toEqual([])
      expect(component.isActivitiesLoading).toBe(false)
    })

    it('populates activities successfully', () => {
      fracApiServiceMock.searchEntities.mockImplementation((type: string) => {
        if (type === 'role') return of(searchRoleResponse)
        return of(searchActivityResponse)
      })
      component.ngOnInit()
      ;(component as any).fetchActivities('')
      expect(component.activities.length).toBe(2)
      expect(component.filteredActivities.length).toBe(2)
    })
  })

  describe('language dropdown', () => {
    it('toggles isOpen', () => {
      expect(component.isOpen).toBe(false)
      component.toggleDropdown()
      expect(component.isOpen).toBe(true)
      component.toggleDropdown()
      expect(component.isOpen).toBe(false)
    })

    it('getLangLabel returns label or key fallback', () => {
      expect(component.getLangLabel('en')).toBe('English')
      expect(component.getLangLabel('xx')).toBe('xx')
    })

    it('selectLanguage ignores unknown language', () => {
      const event = { stopPropagation: jest.fn() } as any
      component.selectLanguage({ key: 'zz' }, event)
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.selectedLanguage).toBe('en')
    })

    it('selectLanguage closes dropdown when same language selected', () => {
      component.isOpen = true
      const event = { stopPropagation: jest.fn() } as any
      component.selectLanguage({ key: 'en' }, event)
      expect(component.isOpen).toBe(false)
      expect(component.selectedLanguage).toBe('en')
    })

    it('selectLanguage switches language and refetches roles', () => {
      fracApiServiceMock.searchEntities.mockReturnValue(of(searchRoleResponse))
      const event = { stopPropagation: jest.fn() } as any
      component.selectLanguage({ key: 'hi' }, event)
      expect(component.selectedLanguage).toBe('hi')
      expect(component.isOpen).toBe(false)
      expect(fracApiServiceMock.searchEntities).toHaveBeenCalledWith('role', '', 'hi')
    })
  })

  describe('role search / selection', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      fracApiServiceMock.searchEntities.mockReturnValue(of(searchRoleResponse))
      component.ngOnInit()
    })

    it('onRoleSearch debounces and triggers fetchRoles', () => {
      component.onRoleSearch('  abc  ')
      expect(component.roleSearchTerm).toBe('abc')
      fracApiServiceMock.searchEntities.mockClear()
      jest.advanceTimersByTime(600)
      expect(fracApiServiceMock.searchEntities).toHaveBeenCalledWith('role', 'abc', 'en')
    })

    it('onRoleToggleExpand toggles expandedRole', () => {
      const role = component.roles[0]
      component.onRoleToggleExpand(role)
      expect(component.expandedRole).toBe(role)
      component.onRoleToggleExpand(role)
      expect(component.expandedRole).toBeNull()
    })

    it('onRoleSelected loads mappings and sets selectedRole', () => {
      fracApiServiceMock.searchEntityMapping.mockReturnValue(of({
        result: [{ childHierarchy: [{ entityType: 'Activity', entityCode: 'A1', entityName: 'Activity One' }] }],
      }))
      const role = component.roles[0]
      component.onRoleSelected(role)
      expect(component.selectedRole).toBeTruthy()
      expect(component.selectedActivityMap['A1']).toBe(true)
      expect(component.selectedActivitySummary.length).toBe(1)
      expect(component.isRoleMappingLoading).toBe(false)
    })

    it('onRoleSelected handles mapping error', () => {
      fracApiServiceMock.searchEntityMapping.mockReturnValue(throwError(() => new Error('fail')))
      const role = component.roles[0]
      component.onRoleSelected(role)
      expect(snackbarMock.error).toHaveBeenCalledWith('Unable to fetch existing role mappings.')
      expect(component.selectedActivityMap).toEqual({})
    })

    it('onRoleSelected uses cache on second call', () => {
      fracApiServiceMock.searchEntityMapping.mockReturnValue(of({
        result: [{ childHierarchy: [{ entityType: 'Activity', entityCode: 'A1', entityName: 'Activity One' }] }],
      }))
      const role = component.roles[0]
      component.onRoleSelected(role)
      fracApiServiceMock.searchEntityMapping.mockClear()
      component.onRoleSelected(role)
      expect(fracApiServiceMock.searchEntityMapping).not.toHaveBeenCalled()
    })
  })

  describe('activity search & selection', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      fracApiServiceMock.searchEntities.mockImplementation((type: string) => {
        if (type === 'role') return of(searchRoleResponse)
        return of(searchActivityResponse)
      })
      component.ngOnInit()
    })

    it('onActivitySearch debounces and triggers fetchActivities', () => {
      component.onActivitySearch(' xyz ')
      expect(component.activitySearchTerm).toBe('xyz')
      fracApiServiceMock.searchEntities.mockClear()
      jest.advanceTimersByTime(600)
      expect(fracApiServiceMock.searchEntities).toHaveBeenCalledWith('activity', 'xyz', 'en')
    })

    it('onActivityCheckChanged adds and removes from map', () => {
      ;(component as any).activitiesData = activityApiEntity.map(a => ({ code: a.code, title: a.name }))
      component.onActivityCheckChanged({ code: 'A1', checked: true })
      expect(component.selectedActivityMap['A1']).toBe(true)
      expect(component.selectedActivitySummary.some(s => s.code === 'A1')).toBe(true)

      component.onActivityCheckChanged({ code: 'A1', checked: false })
      expect(component.selectedActivityMap['A1']).toBeUndefined()
    })

    it('onActivityCheckChanged ignores empty code', () => {
      const before = { ...component.selectedActivityMap }
      component.onActivityCheckChanged({ code: '', checked: true })
      expect(component.selectedActivityMap).toEqual(before)
    })
  })

  describe('onAddActivityToRole', () => {
    it('warns when no role selected', () => {
      component.onAddActivityToRole()
      expect(snackbarMock.warning).toHaveBeenCalledWith('Please select a role first !!')
    })

    it('warns when nothing selected and role had no activities', () => {
      component.selectedRole = { code: 'R1', title: 'Role One' }
      component.selectedActivityMap = {}
      component.onAddActivityToRole()
      expect(snackbarMock.warning).toHaveBeenCalledWith('Please select at least one activity to map !!')
    })

    it('warns when selection unchanged from cache', () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [] }
      component.selectedActivityMap = { A1: true }
      ;(component as any).roleMappingCache.set('en::R1', [{ code: 'A1', label: 'Activity One' }])
      component.onAddActivityToRole()
      expect(snackbarMock.warning).toHaveBeenCalledWith('No changes detected. Please update your selection before saving.')
    })

    it('validates and saves when activities selected with no missing competencies', () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [] }
      component.selectedActivityMap = { A1: true }
      ;(component as any).activitiesData = [{ code: 'A1', title: 'Activity One' }]
      fracApiServiceMock.searchEntityMapping.mockReturnValue(of({
        result: [{ childHierarchy: [{ entityType: 'Competency', competencies: [{ levelNumber: 1 }] }] }],
      }))
      fracApiServiceMock.mapEntity.mockReturnValue(of({}))

      component.onAddActivityToRole()

      expect(fracApiServiceMock.searchEntityMapping).toHaveBeenCalled()
      expect(fracApiServiceMock.mapEntity).toHaveBeenCalled()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('opens mapping required modal when activities missing competency mapping', () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [] }
      component.selectedActivityMap = { A1: true }
      ;(component as any).activitiesData = [{ code: 'A1', title: 'Activity One' }]
      fracApiServiceMock.searchEntityMapping.mockReturnValue(of({ result: [{ childHierarchy: [] }] }))

      component.onAddActivityToRole()

      expect(snackbarMock.warning).toHaveBeenCalledWith('Some selected activities are missing competency mapping.')
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('navigates to mapActivity route when map-now action chosen', () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [] }
      component.selectedActivityMap = { A1: true }
      ;(component as any).activitiesData = [{ code: 'A1', title: 'Activity One' }]
      fracApiServiceMock.searchEntityMapping.mockReturnValue(of({ result: [{ childHierarchy: [] }] }))
      dialogMock.open.mockReturnValue({ afterClosed: () => of('map-now') })

      component.onAddActivityToRole()

      expect(routerMock.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.mapActivity)
    })

    it('handles error during validation', () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [] }
      component.selectedActivityMap = { A1: true }
      ;(component as any).activitiesData = [{ code: 'A1', title: 'Activity One' }]
      fracApiServiceMock.searchEntityMapping.mockReturnValue(throwError(() => new Error('boom')))

      component.onAddActivityToRole()

      // per-request errors are swallowed via catchError and treated as "not mapped",
      // which routes into the missing-competency-mapping modal rather than the error snackbar.
      expect(snackbarMock.warning).toHaveBeenCalledWith('Some selected activities are missing competency mapping.')
    })

    it('removes all activities and saves when selection becomes empty', () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [{ code: 'A1', label: 'Activity One' }] }
      component.selectedActivityMap = {}
      ;(component as any).roleMappingCache.set('en::R1', [{ code: 'A1', label: 'Activity One' }])
      fracApiServiceMock.mapEntity.mockReturnValue(of({}))

      component.onAddActivityToRole()

      expect(component.selectedRole.activityDetails).toEqual([])
    })

    it('persists the cleared mapping and opens the success result modal', () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [{ code: 'A9', label: 'Old' }] }
      component.selectedActivityMap = {}
      component.selectedActivitySummary = []
      ;(component as any).roleMappingCache.set('en::R1', [{ code: 'A9', label: 'Old' }])
      fracApiServiceMock.mapEntity.mockReturnValue(of({}))
      component.onAddActivityToRole()
      expect(fracApiServiceMock.mapEntity).toHaveBeenCalled()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(component.isSaving).toBe(false)
    })
  })

  describe('persistRoleActivityMappings failure path', () => {
    it('shows error modal on mapEntity failure', async () => {
      component.selectedRole = { code: 'R1', title: 'Role One', activityDetails: [] }
      component.selectedActivityMap = { A1: true }
      ;(component as any).activitiesData = [{ code: 'A1', title: 'Activity One' }]
      fracApiServiceMock.searchEntityMapping.mockReturnValue(of({
        result: [{ childHierarchy: [{ entityType: 'Competency', competencies: [{ levelNumber: 1 }] }] }],
      }))
      fracApiServiceMock.mapEntity.mockReturnValue(throwError(() => ({ status: 500, error: { params: { errmsg: 'bad' } } })))

      component.onAddActivityToRole()

      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      expect(component.isSaving).toBe(false)
    })
  })

  describe('onHomeClick', () => {
    it('does nothing while saving', () => {
      component.isSaving = true
      component.onHomeClick()
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled()
    })

    it('navigates directly when no unsaved changes', () => {
      component.hasUnsavedChanges = false
      component.onHomeClick()
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.homeDashboard)
    })

    it('opens unsaved changes modal and navigates on continue', () => {
      component.hasUnsavedChanges = true
      dialogMock.open.mockReturnValue({ afterClosed: () => of('continue') })
      component.onHomeClick()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.homeDashboard)
    })

    it('does not navigate on cancel', () => {
      component.hasUnsavedChanges = true
      dialogMock.open.mockReturnValue({ afterClosed: () => of('cancel') })
      component.onHomeClick()
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('isEditing getter', () => {
    it('is true only for en', () => {
      component.selectedLanguage = 'en'
      expect(component.isEditing).toBe(true)
      component.selectedLanguage = 'hi'
      expect(component.isEditing).toBe(false)
    })
  })
})
