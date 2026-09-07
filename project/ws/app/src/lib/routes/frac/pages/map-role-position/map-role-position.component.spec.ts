import { of, throwError, Subject } from 'rxjs'

import { MapRolePositionComponent } from './map-role-position.component'

describe('MapRolePositionComponent', () => {
  let component: MapRolePositionComponent
  let snackbar: any
  let fracApiService: any
  let dialog: any
  let activatedRoute: any
  let router: any
  let queryParams$: Subject<any>

  const positionApiEntity = (code: string, name: string) => ({
    code,
    name,
    additionalProperties: { Code: code },
  })

  const roleApiEntity = (code: string, name: string) => ({
    code,
    name,
    additionalProperties: { Code: code },
  })

  beforeEach(() => {
    queryParams$ = new Subject<any>()

    snackbar = {
      warning: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
    }

    fracApiService = {
      searchEntities: jest.fn().mockReturnValue(of({ result: { entity: [] } })),
      searchEntityMapping: jest.fn().mockReturnValue(of({ result: [] })),
      mapEntity: jest.fn().mockReturnValue(of({})),
    }

    dialog = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
    }

    activatedRoute = {
      queryParams: queryParams$.asObservable(),
    }

    router = {
      navigateByUrl: jest.fn(),
    }

    component = new MapRolePositionComponent(
      snackbar,
      fracApiService,
      dialog,
      activatedRoute,
      router,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('ngOnInit / ngOnDestroy', () => {
    it('fetches positions and subscribes to query params on init', () => {
      component.ngOnInit()
      queryParams$.next({ positionCode: ' POS1 ' })
      expect(fracApiService.searchEntities).toHaveBeenCalledWith('position', '', 'en')
      expect((component as any).routePositionCode).toBe('POS1')
    })

    it('sets routePositionCode to null when no positionCode present', () => {
      component.ngOnInit()
      queryParams$.next({})
      expect((component as any).routePositionCode).toBeNull()
    })

    it('completes destroy$ subject on destroy and stops further query param handling', () => {
      component.ngOnInit()
      component.ngOnDestroy()
      queryParams$.next({ positionCode: 'POS2' })
      expect((component as any).routePositionCode).toBeNull()
    })
  })

  describe('fetchPositions (via ngOnInit / search)', () => {
    it('populates positions on success', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1')] } }),
      )
      component.ngOnInit()
      expect(component.positions.length).toBe(1)
      expect(component.positions[0].code).toBe('P1')
      expect(component.isPositionsLoading).toBe(false)
    })

    it('clears positions and logs error on failure', () => {
      fracApiService.searchEntities.mockReturnValue(throwError(() => new Error('boom')))
      component.ngOnInit()
      expect(component.positions).toEqual([])
      expect(component.isPositionsLoading).toBe(false)
    })

    it('keeps selectedPosition when it matches refreshed results and reapplies mapped roles', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1')] } }),
      )
      component.ngOnInit()
      component.selectedPosition = component.positions[0]
      ;(component as any).fetchPositions('')
      expect(component.selectedPosition!.code).toBe('P1')
    })

    it('clears selectedPosition when it no longer matches and there is no search keyword', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1')] } }),
      )
      component.ngOnInit()
      component.selectedPosition = { code: 'GONE', title: 'Gone' }
      ;(component as any).fetchPositions('')
      expect(component.selectedPosition).toBeNull()
      expect(component.selectedRoleMap).toEqual({})
    })

    it('keeps selectedPosition unchanged when it no longer matches but a search keyword is present', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1')] } }),
      )
      component.ngOnInit()
      const missing = { code: 'GONE', title: 'Gone' }
      component.selectedPosition = missing
      ;(component as any).fetchPositions('someKeyword')
      expect(component.selectedPosition).toBe(missing)
    })
  })

  describe('applyRoutePositionSelection via ngOnInit', () => {
    it('auto-selects the position matching the route positionCode', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1')] } }),
      )
      component.ngOnInit()
      queryParams$.next({ positionCode: 'P1' })
      ;(component as any).fetchPositions('')
      expect(component.selectedPosition?.code).toBe('P1')
    })

    it('triggers a search for the route position code when not found on initial load', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [] } }),
      )
      component.ngOnInit()
      queryParams$.next({ positionCode: 'MISSING' })
      ;(component as any).fetchPositions('')
      expect(fracApiService.searchEntities).toHaveBeenCalledWith('position', 'MISSING', 'en')
    })
  })

  describe('fetchRoles', () => {
    it('populates roles on success', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [roleApiEntity('R1', 'Role 1')] } }),
      )
      ;(component as any).fetchRoles('')
      expect(component.roles.length).toBe(1)
      expect(component.isRolesLoading).toBe(false)
    })

    it('clears roles and logs error on failure', () => {
      fracApiService.searchEntities.mockReturnValue(throwError(() => new Error('fail')))
      ;(component as any).fetchRoles('')
      expect(component.roles).toEqual([])
      expect(component.isRolesLoading).toBe(false)
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

    it('returns label for a known language key and falls back to key for unknown', () => {
      expect(component.getLangLabel('en')).toBe('English')
      expect(component.getLangLabel('xx')).toBe('xx')
    })

    it('ignores unknown languages in selectLanguage', () => {
      const event = { stopPropagation: jest.fn() } as any
      component.selectLanguage({ key: 'zz' }, event)
      expect(component.selectedLanguage).toBe('en')
    })

    it('closes dropdown without resetting when selecting the current language', () => {
      component.isOpen = true
      const event = { stopPropagation: jest.fn() } as any
      component.selectLanguage({ key: 'en' }, event)
      expect(component.isOpen).toBe(false)
      expect(component.selectedLanguage).toBe('en')
    })

    it('switches language, resets view, and refetches positions', () => {
      const event = { stopPropagation: jest.fn() } as any
      component.positionSearchTerm = 'abc'
      component.selectLanguage({ key: 'hi' }, event)
      expect(component.selectedLanguage).toBe('hi')
      expect(component.positionSearchTerm).toBe('')
      expect(fracApiService.searchEntities).toHaveBeenCalledWith('position', '', 'en')
    })
  })

  describe('isEditing getter', () => {
    it('is true only for english', () => {
      expect(component.isEditing).toBe(true)
      component.selectedLanguage = 'hi'
      expect(component.isEditing).toBe(false)
    })
  })

  describe('position search', () => {
    it('sets positionSearchTerm and pushes to positionSearch$', () => {
      const nextSpy = jest.spyOn((component as any).positionSearch$, 'next')
      component.onPositionSearch('  abc  ')
      expect(component.positionSearchTerm).toBe('abc')
      expect(nextSpy).toHaveBeenCalledWith('abc')
    })

    it('onPositionSearchSubmit trims and fetches immediately', () => {
      component.onPositionSearchSubmit('  xyz ')
      expect(component.positionSearchTerm).toBe('xyz')
      expect(fracApiService.searchEntities).toHaveBeenCalledWith('position', 'xyz', 'en')
    })

    it('debounced search stream eventually calls fetchPositions', done => {
      component.ngOnInit()
      fracApiService.searchEntities.mockClear()
      ;(component as any).positionSearch$.next('deb')
      setTimeout(() => {
        expect(fracApiService.searchEntities).toHaveBeenCalledWith('position', 'deb', 'en')
        done()
      }, 600)
    })
  })

  describe('onPositionSelected / onPositionToggleExpand', () => {
    it('selects a position and loads its role mappings', () => {
      const position = { code: 'P1', title: 'Position 1' }
      fracApiService.searchEntityMapping.mockReturnValue(of({ result: [] }))
      component.onPositionSelected(position)
      expect(component.selectedPosition).toEqual(position)
      expect(fracApiService.searchEntityMapping).toHaveBeenCalledWith('position', 'P1', 'en')
    })

    it('toggles expandedPosition open then closed', () => {
      const position = { code: 'P1', title: 'Position 1' }
      component.onPositionToggleExpand(position)
      expect(component.expandedPosition).toBe(position)
      component.onPositionToggleExpand(position)
      expect(component.expandedPosition).toBeNull()
    })
  })

  describe('loadPositionRoleMappings (private, via onPositionSelected)', () => {
    it('applies mapped roles returned from the API', () => {
      fracApiService.searchEntityMapping.mockReturnValue(
        of({
          result: [
            {
              childHierarchy: [
                { entityType: 'Role', entityCode: 'R1', entityName: 'Role One' },
                { entityType: 'Activity', entityCode: 'A1', entityName: 'Activity' },
              ],
            },
          ],
        }),
      )
      const position = { code: 'P1', title: 'Position 1' }
      component.onPositionSelected(position)
      expect(component.selectedRoleMap['R1']).toBe(true)
      expect(component.selectedRoleSummary).toEqual([{ code: 'R1', label: 'Role One' }])
    })

    it('handles API error while loading mappings', () => {
      fracApiService.searchEntityMapping.mockReturnValue(throwError(() => new Error('nope')))
      const position = { code: 'P1', title: 'Position 1' }
      component.onPositionSelected(position)
      expect(snackbar.error).toHaveBeenCalledWith('Unable to fetch existing position mappings.')
      expect(component.isPositionRoleMappingLoading).toBe(false)
    })

    it('uses draft store cache when present instead of calling the API', () => {
      const position = { code: 'P1', title: 'Position 1' }
      ;(component as any).setPositionDraft('P1', [{ code: 'R9', label: 'Cached Role' }])
      fracApiService.searchEntityMapping.mockClear()
      component.onPositionSelected(position)
      expect(fracApiService.searchEntityMapping).not.toHaveBeenCalled()
      expect(component.selectedRoleMap['R9']).toBe(true)
    })

    it('uses in-memory mapping cache when present and no draft exists', () => {
      const position = { code: 'P1', title: 'Position 1' }
      ;(component as any).positionRoleMappingCache.set(
        (component as any).buildPositionMappingKey('P1'),
        [{ code: 'R8', label: 'Cached2' }],
      )
      fracApiService.searchEntityMapping.mockClear()
      component.onPositionSelected(position)
      expect(fracApiService.searchEntityMapping).not.toHaveBeenCalled()
      expect(component.selectedRoleMap['R8']).toBe(true)
    })

    it('skips a duplicate in-flight request for the same key', () => {
      const position = { code: 'P1', title: 'Position 1' }
      ;(component as any).activePositionRoleMappingRequestKey = (component as any).buildPositionMappingKey('P1')
      fracApiService.searchEntityMapping.mockClear()
      component.onPositionSelected(position)
      expect(fracApiService.searchEntityMapping).not.toHaveBeenCalled()
    })

    it('ignores a stale response if selectedPosition changed before it arrived', () => {
      const subject = new Subject<any>()
      fracApiService.searchEntityMapping.mockReturnValue(subject.asObservable())
      const position = { code: 'P1', title: 'Position 1' }
      component.onPositionSelected(position)
      component.selectedPosition = { code: 'OTHER', title: 'Other' }
      subject.next({ result: [] })
      expect(component.isPositionRoleMappingLoading).toBe(true)
    })
  })

  describe('onRoleSearch / onRoleCheckChanged', () => {
    it('sets roleSearchTerm and pushes to roleSearch$', () => {
      const nextSpy = jest.spyOn((component as any).roleSearch$, 'next')
      component.onRoleSearch(' abc ')
      expect(component.roleSearchTerm).toBe('abc')
      expect(nextSpy).toHaveBeenCalledWith('abc')
    })

    it('ignores check-change events without a code', () => {
      component.onRoleCheckChanged({ code: '', checked: true })
      expect(component.selectedRoleMap).toEqual({})
    })

    it('adds a role to selectedRoleMap when checked', () => {
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      component.onRoleCheckChanged({ code: 'R1', checked: true })
      expect(component.selectedRoleMap['R1']).toBe(true)
      expect(component.selectedRoleSummary).toEqual([{ code: 'R1', label: 'Role One' }])
    })

    it('removes a role from selectedRoleMap when unchecked', () => {
      component.selectedRoleMap = { R1: true }
      component.onRoleCheckChanged({ code: 'R1', checked: false })
      expect(component.selectedRoleMap['R1']).toBeUndefined()
      expect(component.selectedRoleSummary).toEqual([])
    })

    it('falls back to existing selectedPosition role label when rolesData lacks metadata', () => {
      component.selectedPosition = { code: 'P1', title: 'P1', roleDetails: [{ code: 'R2', label: 'Existing Label' }] }
      component.rolesData = []
      component.onRoleCheckChanged({ code: 'R2', checked: true })
      expect(component.selectedRoleSummary).toEqual([{ code: 'R2', label: 'Existing Label' }])
    })
  })

  describe('onAddRoleToPosition', () => {
    it('warns when no position is selected', () => {
      component.selectedPosition = null
      component.onAddRoleToPosition()
      expect(snackbar.warning).toHaveBeenCalledWith('Please select a position first !!')
    })

    it('warns when nothing selected and position had no prior roles', () => {
      component.selectedPosition = { code: 'P1', title: 'P1' }
      component.selectedRoleMap = {}
      component.onAddRoleToPosition()
      expect(snackbar.warning).toHaveBeenCalledWith('Please select at least one role to map !!')
    })

    it('warns when the selection is unchanged from the cached mapping', () => {
      const position = { code: 'P1', title: 'P1' }
      component.selectedPosition = position
      ;(component as any).positionRoleMappingCache.set(
        (component as any).buildPositionMappingKey('P1'),
        [{ code: 'R1', label: 'Role One' }],
      )
      component.selectedRoleMap = { R1: true }
      component.onAddRoleToPosition()
      expect(snackbar.warning).toHaveBeenCalledWith('No changes detected. Please update your selection before saving.')
    })

    it('proceeds to validate and apply mappings when selection changed', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(of({ result: [] }))
      component.onAddRoleToPosition()
      expect(snackbar.warning).not.toHaveBeenCalledWith('No changes detected. Please update your selection before saving.')
      expect(fracApiService.searchEntityMapping).toHaveBeenCalledWith('role', 'R1', 'en')
    })

    it('allows saving an empty selection when the position previously had roles', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [{ code: 'R1', label: 'Role One' }] }
      component.selectedPosition = position
      component.selectedRoleMap = {}
      fracApiService.mapEntity.mockReturnValue(of({}))
      component.onAddRoleToPosition()
      expect(component.hasUnsavedChanges).toBe(false)
    })
  })

  describe('validateAndApplyPositionRoleMappings via onAddRoleToPosition', () => {
    it('opens the missing-mapping modal when some roles lack activity mapping', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(of({ result: [] }))
      component.onAddRoleToPosition()
      expect(snackbar.warning).toHaveBeenCalledWith('Some selected roles are missing activity mapping.')
      expect(dialog.open).toHaveBeenCalled()
    })

    it('navigates to map-role when the user chooses map-now in the missing mapping modal', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of('map-now') })
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(of({ result: [] }))
      component.onAddRoleToPosition()
      expect(router.navigateByUrl).toHaveBeenCalledWith('/app/frac/map-role')
    })

    it('persists mappings and shows success modal when all roles are mapped to activities', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(
        of({ result: [{ childHierarchy: [{ entityType: 'Activity', entityCode: 'A1' }] }] }),
      )
      fracApiService.mapEntity.mockReturnValue(of({}))
      component.onAddRoleToPosition()
      expect(fracApiService.mapEntity).toHaveBeenCalled()
      expect(dialog.open).toHaveBeenCalled()
    })

    it('handles validation error from findRolesMissingActivityMapping-level API failure gracefully via catchError', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(throwError(() => new Error('down')))
      component.onAddRoleToPosition()
      // catchError inside findRolesMissingActivityMapping treats it as unmapped -> missing modal opens
      expect(dialog.open).toHaveBeenCalled()
    })

    it('does nothing when isValidatingRoleMappings is already true', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      component.isValidatingRoleMappings = true
      fracApiService.searchEntityMapping.mockClear()
      ;(component as any).validateAndApplyPositionRoleMappings()
      expect(fracApiService.searchEntityMapping).not.toHaveBeenCalled()
    })

    it('does nothing when there is no selectedPosition', () => {
      component.selectedPosition = null
      expect(() => (component as any).validateAndApplyPositionRoleMappings()).not.toThrow()
    })

    it('handles error from the outer findRolesMissingActivityMapping subscription', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      jest.spyOn(component as any, 'findRolesMissingActivityMapping').mockReturnValue(
        throwError(() => new Error('outer failure'))
      )
      component.onAddRoleToPosition()
      expect(snackbar.error).toHaveBeenCalledWith('Unable to validate role activity mappings. Please try again.')
      expect((component as any).isValidatingRoleMappings).toBe(false)
    })
  })

  describe('persistPositionRoleMappings error handling', () => {
    it('shows a failure modal when mapEntity errors out', done => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(
        of({ result: [{ childHierarchy: [{ entityType: 'Activity', entityCode: 'A1' }] }] }),
      )
      fracApiService.mapEntity.mockReturnValue(throwError(() => ({ status: 500, message: 'Server error' })))
      component.onAddRoleToPosition()
      setTimeout(() => {
        expect(dialog.open).toHaveBeenCalled()
        expect(component.isSaving).toBe(false)
        done()
      }, 0)
    })
  })

  describe('onHomeClick', () => {
    it('does nothing while saving', () => {
      component.isSaving = true
      component.onHomeClick()
      expect(router.navigateByUrl).not.toHaveBeenCalled()
    })

    it('navigates home directly when there are no unsaved changes', () => {
      component.isSaving = false
      component.hasUnsavedChanges = false
      component.onHomeClick()
      expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/frac/dashboard')
    })

    it('opens unsaved-changes modal and navigates home on continue', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of('continue') })
      component.isSaving = false
      component.hasUnsavedChanges = true
      component.onHomeClick()
      expect(dialog.open).toHaveBeenCalled()
      expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/frac/dashboard')
    })

    it('opens unsaved-changes modal and stays on cancel', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of('cancel') })
      component.isSaving = false
      component.hasUnsavedChanges = true
      component.onHomeClick()
      expect(router.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('draft store helpers', () => {
    it('setPositionDraft stores non-empty details and syncs updatedPositions', () => {
      ;(component as any).setPositionDraft('P1', [{ code: 'R1', label: 'Role One' }])
      expect(component.updatedPositions.length).toBe(1)
      expect(component.updatedPositions[0].code).toBe('P1')
    })

    it('setPositionDraft clears drafts and marks the key cleared when details are empty', () => {
      ;(component as any).setPositionDraft('P1', [{ code: 'R1', label: 'Role One' }])
      ;(component as any).setPositionDraft('P1', [])
      expect(component.updatedPositions).toEqual([])
      expect((component as any).clearedPositionDraftKeys.has((component as any).buildPositionMappingKey('P1'))).toBe(true)
    })
  })

  describe('additional branch coverage', () => {
    it('debounced role search stream eventually calls fetchRoles', done => {
      component.ngOnInit()
      fracApiService.searchEntities.mockClear()
      ;(component as any).roleSearch$.next('deb')
      setTimeout(() => {
        expect(fracApiService.searchEntities).toHaveBeenCalledWith('role', 'deb', 'en')
        done()
      }, 600)
    })

    it('applyRoutePositionSelection returns early once already auto-selected', () => {
      ;(component as any).hasAutoSelectedRoutePosition = true
      ;(component as any).routePositionCode = 'P1'
      const spy = jest.spyOn(component, 'onPositionSelected')
      ;(component as any).applyRoutePositionSelection([{ code: 'P1', title: 'P1' }], '')
      expect(spy).not.toHaveBeenCalled()
    })

    it('applyRoutePositionSelection marks auto-selected without re-selecting when a position is already selected', () => {
      ;(component as any).routePositionCode = 'P1'
      component.selectedPosition = { code: 'OTHER', title: 'Other' }
      const spy = jest.spyOn(component, 'onPositionSelected')
      ;(component as any).applyRoutePositionSelection([{ code: 'P1', title: 'P1' }], '')
      expect(spy).not.toHaveBeenCalled()
      expect((component as any).hasAutoSelectedRoutePosition).toBe(true)
    })

    it('ignores a stale error response if selectedPosition changed before it arrived', () => {
      const subject = new Subject<any>()
      fracApiService.searchEntityMapping.mockReturnValue(subject.asObservable())
      const position = { code: 'P1', title: 'Position 1' }
      component.onPositionSelected(position)
      component.selectedPosition = { code: 'OTHER', title: 'Other' }
      subject.error(new Error('late error'))
      expect(snackbar.error).not.toHaveBeenCalled()
    })

    it('keeps the searched role list instead of showing all mapped roles when a role search term is active', () => {
      component.roleSearchTerm = 'abc'
      component.selectedPosition = { code: 'P1', title: 'Position 1' }
      const nextSpy = jest.spyOn((component as any).roleSearch$, 'next')
      ;(component as any).applyMappedRolesToPosition(
        { code: 'P1', title: 'Position 1' },
        [{ code: 'R1', label: 'Role One' }],
      )
      expect(nextSpy).toHaveBeenCalledWith('abc')
    })

    it('persists via API when an empty selection actually clears a previously cached mapping', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [{ code: 'R1', label: 'Role One' }] }
      component.selectedPosition = position
      ;(component as any).positionRoleMappingCache.set(
        (component as any).buildPositionMappingKey('P1'),
        [{ code: 'R1', label: 'Role One' }],
      )
      component.selectedRoleMap = {}
      fracApiService.mapEntity.mockReturnValue(of({}))
      component.onAddRoleToPosition()
      expect(fracApiService.mapEntity).toHaveBeenCalled()
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('shows success message directly when empty selection produces no payload', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = {}
      component.selectedRoleSummary = []
      jest.spyOn(component as any, 'buildPayload').mockReturnValue([])
      ;(component as any).validateAndApplyPositionRoleMappings()
      expect(snackbar.success).toHaveBeenCalledWith('Position–Role selection updated.')
    })

    it('shows success message directly when a validated selection produces no payload', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(
        of({ result: [{ childHierarchy: [{ entityType: 'Activity', entityCode: 'A1' }] }] }),
      )
      jest.spyOn(component as any, 'buildPayload').mockReturnValue([])
      component.onAddRoleToPosition()
      expect(snackbar.success).toHaveBeenCalledWith('Position–Role selection updated.')
    })

    it('treats a non-activity child as not mapped in hasMappedActivityLevels', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'Role One' }]
      fracApiService.searchEntityMapping.mockReturnValue(
        of({ result: [{ childHierarchy: [{ entityType: 'Role', entityCode: 'R9' }] }] }),
      )
      component.onAddRoleToPosition()
      expect(snackbar.warning).toHaveBeenCalledWith('Some selected roles are missing activity mapping.')
    })

    it('removes deselected roles and updates existing role labels on a partial change', () => {
      const position = { code: 'P1', title: 'P1', roleDetails: [{ code: 'R1', label: 'Old Label' }, { code: 'R2', label: 'Stale' }] }
      component.selectedPosition = position
      component.selectedRoleMap = { R1: true }
      component.rolesData = [{ code: 'R1', title: 'New Label' }]
      fracApiService.searchEntityMapping.mockReturnValue(
        of({ result: [{ childHierarchy: [{ entityType: 'Activity', entityCode: 'A1' }] }] }),
      )
      fracApiService.mapEntity.mockReturnValue(of({}))
      component.onAddRoleToPosition()
      expect(component.selectedPosition!.roleDetails).toEqual([{ code: 'R1', label: 'New Label' }])
    })

    it('dedupes duplicate role pairs in buildPayload', () => {
      const key = (component as any).buildPositionMappingKey('P1')
      ;(component as any).positionDraftStore.set(key, [{ code: 'R1', label: 'A' }, { code: 'R1', label: 'A' }])
      const payload = (component as any).buildPayload()
      expect(payload.filter((p: any) => p.parentEntityCode === 'P1').length).toBe(1)
    })

    it('skips cleared positions in buildPayload when they already have mappings', () => {
      ;(component as any).setPositionDraft('P1', [{ code: 'R1', label: 'A' }])
      const key = (component as any).buildPositionMappingKey('P1')
      ;(component as any).clearedPositionDraftKeys.add(key)
      const payload = (component as any).buildPayload()
      const clearedOnly = payload.filter((p: any) => p.parentEntityCode === 'P1' && !p.childEntityCode)
      expect(clearedOnly.length).toBe(0)
    })

    it('getHydratedPositionRoleDetails returns cloned draft details when present', () => {
      ;(component as any).setPositionDraft('P1', [{ code: 'R1', label: 'Draft Role' }])
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1')] } }),
      )
      ;(component as any).fetchPositions('')
      expect(component.positions[0].roleDetails).toEqual([{ code: 'R1', label: 'Draft Role' }])
    })

    it('getHydratedPositionRoleDetails returns cloned cached details when no draft exists', () => {
      const key = (component as any).buildPositionMappingKey('P1')
      ;(component as any).positionRoleMappingCache.set(key, [{ code: 'R2', label: 'Cached Role' }])
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1')] } }),
      )
      ;(component as any).fetchPositions('')
      expect(component.positions[0].roleDetails).toEqual([{ code: 'R2', label: 'Cached Role' }])
    })

    it('applyPositionDetailsToCollections only updates the matching position in a multi-position list', () => {
      fracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [positionApiEntity('P1', 'Position 1'), positionApiEntity('P2', 'Position 2')] } }),
      )
      ;(component as any).fetchPositions('')
      fracApiService.searchEntityMapping.mockReturnValue(
        of({ result: [{ childHierarchy: [{ entityType: 'Role', entityCode: 'R1', entityName: 'Role One' }] }] }),
      )
      component.onPositionSelected(component.positions[0])
      const other = component.positions.find(p => p.code === 'P2')
      expect(other!.roleDetails || []).toEqual([])
      const updated = component.positions.find(p => p.code === 'P1')
      expect(updated!.roleDetails).toEqual([{ code: 'R1', label: 'Role One' }])
    })

    it('syncUpdatedPositionsFromDraftStore falls back to positions/filteredPositions metadata', () => {
      component.positionsData = []
      component.positions = [{ code: 'P1', title: 'From Positions List' }]
      component.filteredPositions = []
      ;(component as any).setPositionDraft('P1', [{ code: 'R1', label: 'Role One' }])
      expect(component.updatedPositions[0].title).toBe('From Positions List')
    })

    it('syncUpdatedPositionsFromDraftStore falls back to filteredPositions metadata as last resort', () => {
      component.positionsData = []
      component.positions = []
      component.filteredPositions = [{ code: 'P1', title: 'From Filtered List' }]
      ;(component as any).setPositionDraft('P1', [{ code: 'R1', label: 'Role One' }])
      expect(component.updatedPositions[0].title).toBe('From Filtered List')
    })

    it('syncUpdatedPositionsFromDraftStore falls back to code when no metadata found anywhere', () => {
      component.positionsData = []
      component.positions = []
      component.filteredPositions = []
      ;(component as any).setPositionDraft('PX', [{ code: 'R1', label: 'Role One' }])
      expect(component.updatedPositions[0].title).toBe('PX')
    })

    it('showResultModal redirects home when redirectOnClose is true and result is success', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      ;(component as any).showResultModal({ type: 'success', title: 'T', message: 'M' }, true)
      expect(router.navigateByUrl).toHaveBeenCalledWith('/app/home/frac/dashboard')
    })

    it('showResultModal does not redirect when redirectOnClose is true but result is not success', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      router.navigateByUrl.mockClear()
      ;(component as any).showResultModal({ type: 'error', title: 'T', message: 'M' }, true)
      expect(router.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('buildPayload via full save flow', () => {
    it('includes cleared positions with no mappings and mapped positions with roles', () => {
      ;(component as any).setPositionDraft('P1', [{ code: 'R1', label: 'Role One' }])
      ;(component as any).setPositionDraft('P2', [{ code: 'R1', label: 'Role One' }])
      ;(component as any).setPositionDraft('P2', [])
      const payload = (component as any).buildPayload()
      expect(payload).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ parentEntityCode: 'P1', childEntityCode: 'R1' }),
        ]),
      )
      const clearedEntry = payload.find((p: any) => p.parentEntityCode === 'P2')
      expect(clearedEntry.childEntityCode).toBeUndefined()
    })
  })
})
