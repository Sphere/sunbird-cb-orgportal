import { of, throwError, Subject } from 'rxjs'
import { fakeAsync, tick } from '@angular/core/testing'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { MapActivityCompetenciesComponent } from './map-activity-competencies.component'
import { CustomSnackbarService } from '../../../services/custom-snackbar.service'
import { FracApiService } from '../../../services/frac-api.service'

describe('MapActivityCompetenciesComponent', () => {
  let component: MapActivityCompetenciesComponent
  let snackbar: ReturnType<typeof createSpyObj>
  let fracApiService: ReturnType<typeof createSpyObj>
  let dialog: ReturnType<typeof createSpyObj>
  let router: ReturnType<typeof createSpyObj>

  const activityEntity = (code: string, name: string) => ({ code, name })

  const buildComponent = () => {
    snackbar = createSpyObj('CustomSnackbarService', ['warning', 'success'])
    fracApiService = createSpyObj<FracApiService>('FracApiService', ['searchEntities', 'searchEntityMapping', 'mapEntity'])
    dialog = createSpyObj('MatDialog', ['open'])
    router = createSpyObj('Router', ['navigateByUrl'])

    fracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }))
    fracApiService.searchEntityMapping.mockReturnValue(of({ result: [] }))
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })

    return new MapActivityCompetenciesComponent(
      snackbar as unknown as CustomSnackbarService,
      fracApiService as unknown as FracApiService,
      dialog as any,
      router as any,
    )
  }

  beforeEach(() => {
    component = buildComponent()
  })

  afterEach(() => {
    component.ngOnDestroy()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('fetches activities and resets view on init', () => {
      component.ngOnInit()
      expect(fracApiService.searchEntities).toHaveBeenCalledWith('activity', '', 'en')
      expect(component.activitiesData).toEqual([])
    })

    it('populates activities from the API response', () => {
      fracApiService.searchEntities.mockReturnValue(of({ result: { entity: [activityEntity('A1', 'Activity One')] } }))
      component.ngOnInit()
      expect(component.activities.length).toBe(1)
      expect(component.activities[0].code).toBe('A1')
      expect(component.filteredActivities.length).toBe(1)
    })

    it('handles activities fetch error gracefully', () => {
      fracApiService.searchEntities.mockReturnValue(throwError(() => new Error('boom')))
      component.ngOnInit()
      expect(component.isActivitiesLoading).toBe(false)
      expect(component.activities).toEqual([])
    })
  })

  describe('ngOnDestroy', () => {
    it('completes the destroy subject', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>
      const nextSpy = jest.spyOn(destroy$, 'next')
      const completeSpy = jest.spyOn(destroy$, 'complete')
      component.ngOnDestroy()
      expect(nextSpy).toHaveBeenCalled()
      expect(completeSpy).toHaveBeenCalled()
    })
  })

  describe('toggleDropdown / getLangLabel / selectLanguage', () => {
    it('toggles isOpen', () => {
      expect(component.isOpen).toBe(false)
      component.toggleDropdown()
      expect(component.isOpen).toBe(true)
      component.toggleDropdown()
      expect(component.isOpen).toBe(false)
    })

    it('returns language label for known key and falls back to key for unknown', () => {
      expect(component.getLangLabel('en')).toBe('English')
      expect(component.getLangLabel('xx')).toBe('xx')
    })

    it('does nothing for an unknown language', () => {
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      component.selectLanguage({ key: 'zz' }, event)
      expect(component.selectedLanguage).toBe('en')
      expect(event.stopPropagation).toHaveBeenCalled()
    })

    it('closes dropdown without refetch when selecting the same language', () => {
      component.isOpen = true
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      fracApiService.searchEntities.mockClear()
      component.selectLanguage({ key: 'en' }, event)
      expect(component.isOpen).toBe(false)
      expect(fracApiService.searchEntities).not.toHaveBeenCalled()
    })

    it('switches language, resets view, and refetches activities', () => {
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      component.selectLanguage({ key: 'hi' }, event)
      expect(component.selectedLanguage).toBe('hi')
      expect(component.isOpen).toBe(false)
      expect(fracApiService.searchEntities).toHaveBeenCalledWith('activity', '', 'hi')
    })
  })

  describe('expand', () => {
    it('expands and collapses an activity card', () => {
      const activity = { code: 'A1', title: 'A1' } as any
      component.expand(activity)
      expect(component.expandedActivity).toBe(activity)
      component.expand(activity)
      expect(component.expandedActivity).toBeNull()
    })
  })

  describe('onActivitySelected', () => {
    it('does nothing when activity has no code', () => {
      component.onActivitySelected({ code: '' } as any)
      expect(component.selectedActivity).toBeNull()
    })

    it('selects an activity and triggers mapping load', () => {
      fracApiService.searchEntityMapping.mockReturnValue(of({ result: [] }))
      const activity = { code: 'A1', title: 'Activity One' } as any
      component.onActivitySelected(activity)
      expect(component.selectedActivity?.code).toBe('A1')
      expect(fracApiService.searchEntityMapping).toHaveBeenCalledWith('activity', 'A1', 'en')
    })
  })

  describe('onActivitySearch', () => {
    it('trims the keyword and eventually triggers a fetch', done => {
      fracApiService.searchEntities.mockClear()
      component.ngOnInit()
      fracApiService.searchEntities.mockClear()
      component.onActivitySearch('  hello  ')
      expect(component.activitySearchTerm).toBe('hello')
      setTimeout(() => {
        expect(fracApiService.searchEntities).toHaveBeenCalledWith('activity', 'hello', 'en')
        done()
      }, 600)
    })
  })

  describe('onCompetencySearch', () => {
    it('warns and clears when no activity selected and keyword present', () => {
      component.onCompetencySearch('term')
      expect(snackbar.warning).toHaveBeenCalled()
      expect(component.competencies).toEqual([])
    })

    it('does not warn when keyword is empty and no activity selected', () => {
      component.onCompetencySearch('')
      expect(snackbar.warning).not.toHaveBeenCalled()
    })

    it('fetches competencies when an activity is selected', done => {
      component.ngOnInit()
      component.onActivitySelected({ code: 'A1', title: 'A1' } as any)
      fracApiService.searchEntities.mockClear()
      component.onCompetencySearch('java')
      setTimeout(() => {
        expect(fracApiService.searchEntities).toHaveBeenCalledWith('competency', 'java', 'en')
        done()
      }, 600)
    })
  })

  describe('onCheck', () => {
    it('adds a level when checked', () => {
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)
      expect(component.selectedMap.C1).toEqual(['C1_L1'])
      expect(component.selectedCompetencies.some(s => s.code === 'C1')).toBe(true)
    })

    it('does not duplicate an already-checked level', () => {
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)
      expect(component.selectedMap.C1).toEqual(['C1_L1'])
    })

    it('removes a level when unchecked and clears entry when empty', () => {
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: false } as any)
      expect(component.selectedMap.C1).toBeUndefined()
    })

    it('builds a range summary for a full L1-L5 selection', () => {
      ;['L1', 'L2', 'L3', 'L4', 'L5'].forEach(l => {
        component.onCheck({ code: 'C1', level: `C1_${l}`, checked: true } as any)
      })
      const summary = component.selectedCompetencies.find(s => s.code === 'C1')
      expect(summary?.levels).toBe('L1-L5')
    })
  })

  describe('onAddCompetencyToActivity', () => {
    it('warns when no activity selected', () => {
      component.onAddCompetencyToActivity()
      expect(snackbar.warning).toHaveBeenCalledWith('Please select an activity first !!')
    })

    it('warns when nothing selected and activity had no previous competencies', () => {
      component.onActivitySelected({ code: 'A1', title: 'A1' } as any)
      component.onAddCompetencyToActivity()
      expect(snackbar.warning).toHaveBeenCalledWith('Please select at least one competency level to map !!')
    })

    it('saves mapping successfully and shows a result modal', () => {
      fracApiService.mapEntity.mockReturnValue(of({}))
      component.onActivitySelected({ code: 'A1', title: 'A1' } as any)
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)
      component.onAddCompetencyToActivity()
      expect(fracApiService.mapEntity).toHaveBeenCalled()
      expect(dialog.open).toHaveBeenCalled()
      expect(component.isSaving).toBe(false)
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('shows an error result modal on save failure', async () => {
      fracApiService.mapEntity.mockReturnValue(throwError(() => ({ status: 500 })))
      component.onActivitySelected({ code: 'A1', title: 'A1' } as any)
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)
      component.onAddCompetencyToActivity()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(dialog.open).toHaveBeenCalled()
      expect(component.isSaving).toBe(false)
    })

    it('warns "no changes" when re-saving identical selection', () => {
      fracApiService.mapEntity.mockReturnValue(of({}))
      component.onActivitySelected({ code: 'A1', title: 'A1' } as any)
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)
      component.onAddCompetencyToActivity()

      component.onAddCompetencyToActivity()
      expect(snackbar.warning).toHaveBeenCalledWith('No changes detected. Please update your selection before saving.')
    })
  })

  describe('onHomeClick', () => {
    it('does nothing while saving', () => {
      component.isSaving = true
      component.onHomeClick()
      expect(router.navigateByUrl).not.toHaveBeenCalled()
    })

    it('navigates home directly when there are no unsaved changes', () => {
      component.hasUnsavedChanges = false
      component.onHomeClick()
      expect(router.navigateByUrl).toHaveBeenCalled()
    })

    it('opens unsaved-changes dialog and navigates on continue', () => {
      component.hasUnsavedChanges = true
      dialog.open.mockReturnValue({ afterClosed: () => of('continue') })
      component.onHomeClick()
      expect(dialog.open).toHaveBeenCalled()
      expect(router.navigateByUrl).toHaveBeenCalled()
    })

    it('does not navigate when dialog is cancelled', () => {
      component.hasUnsavedChanges = true
      dialog.open.mockReturnValue({ afterClosed: () => of('cancel') })
      router.navigateByUrl.mockClear()
      component.onHomeClick()
      expect(router.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('activity mapping caching behavior', () => {
    it('extracts mapped competency details from search response and re-uses cache on reselect', () => {
      fracApiService.searchEntityMapping.mockReturnValue(of({
        result: [{
          childHierarchy: [
            { entityType: 'Competency', entityCode: 'C1', entityName: 'Comp One', competencies: [1, 2, 3, 4, 5] },
            { entityType: 'Other', entityCode: 'X1' },
          ],
        }],
      }))

      const activity = { code: 'A1', title: 'A1' } as any
      component.onActivitySelected(activity)

      expect(component.selectedActivity?.competencyDetails).toEqual([{ code: 'C1', label: 'Comp One', levels: 'L1-L5' }])
      expect(component.competencies.length).toBe(1)

      fracApiService.searchEntityMapping.mockClear()
      component.expand(activity)
      component.onActivitySelected(activity)
      expect(fracApiService.searchEntityMapping).not.toHaveBeenCalled()
    })

    it('handles mapping fetch errors', () => {
      fracApiService.searchEntityMapping.mockReturnValue(throwError(() => new Error('fail')))
      component.onActivitySelected({ code: 'A2', title: 'A2' } as any)
      expect(component.isActivityMappingLoading).toBe(false)
    })
  })

  it('should trigger fetchActivities through the debounced activitySearch$ stream', fakeAsync(() => {
    // debounceTime schedules via zone.js-patched timers, which jest's fake timers
    // don't reliably intercept alongside Angular's zone — Angular's own fakeAsync/tick
    // is the supported way to advance RxJS-scheduled ticks inside a zone-aware spec.
    ;(component as any).setupSearchStreams()
    const spy = jest.spyOn(component as any, 'fetchActivities')
    component.onActivitySearch('debounced-term')
    tick(600)
    expect(spy).toHaveBeenCalledWith('debounced-term')
  }))

  it('should clear competencies via the debounced competencySearch$ stream when no activity is selected', fakeAsync(() => {
    ;(component as any).setupSearchStreams()
    component.selectedActivity = null
    component.competencyData = [{ code: 'C1', label: 'Comp', levels: [] } as any]
    ;(component as any).competencySearch$.next('term')
    tick(600)
    expect(component.competencyData).toEqual([])
  }))

  it('should call fetchCompetencies through the debounced competencySearch$ stream when an activity is selected', fakeAsync(() => {
    ;(component as any).setupSearchStreams()
    component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
    const spy = jest.spyOn(component as any, 'fetchCompetencies')
    ;(component as any).competencySearch$.next('java')
    tick(600)
    expect(spy).toHaveBeenCalledWith('java')
  }))

  it('should populate competencyData and levels on a successful fetchCompetencies call', () => {
    ;(fracApiService.searchEntities as jest.Mock).mockReturnValue(
      of({ result: { entity: [{ code: 'C1', name: 'Comp 1', levels: [{ levelNumber: 1 }] }] } }),
    )
    ;(component as any).fetchCompetencies('term')
    expect(component.competencyData.length).toBe(1)
    expect(component.isCompetenciesLoading).toBe(false)
  })

  it('should clear the selected activity in fetchActivities when it disappears from results with no search keyword', () => {
    component.selectedActivity = { code: 'GONE', title: 'Gone Activity' } as any
    ;(fracApiService.searchEntities as jest.Mock).mockReturnValue(
      of({ result: { entity: [{ code: 'OTHER', name: 'Other Activity' }] } }),
    )
    ;(component as any).fetchActivities('')
    expect(component.selectedActivity).toBeNull()
    expect(component.selectedMap).toEqual({})
    expect(component.selectedCompetencies).toEqual([])
  })

  it('should keep the missing selected activity untouched in fetchActivities when a search keyword is present', () => {
    component.selectedActivity = { code: 'GONE', title: 'Gone Activity' } as any
    ;(fracApiService.searchEntities as jest.Mock).mockReturnValue(
      of({ result: { entity: [{ code: 'OTHER', name: 'Other Activity' }] } }),
    )
    ;(component as any).fetchActivities('some-keyword')
    expect(component.selectedActivity?.code).toBe('GONE')
  })

  it('should re-apply mapped details to the selected activity when it is still present in fetchActivities results', () => {
    component.selectedActivity = { code: 'A1', title: 'Activity 1', competencyDetails: [{ code: 'C1', label: 'Comp', levels: 'L1' }] } as any
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityMappingCache.set(key, [{ code: 'C1', label: 'Comp', levels: 'L1' }])
    ;(fracApiService.searchEntities as jest.Mock).mockReturnValue(
      of({ result: { entity: [{ code: 'A1', name: 'Activity 1' }] } }),
    )
    ;(component as any).fetchActivities('')
    expect(component.selectedActivity?.code).toBe('A1')
    expect(component.selectedMap['C1']).toContain('C1_L1')
  })

  it('should skip loading mappings when reselecting the same activity that already has mappings', () => {
    const activity = { code: 'A1', title: 'Activity 1' } as any
    component.onActivitySelected(activity)
    ;(component as any).activityMappingCache.set((component as any).buildMappingCacheKey('A1'), [])
    const searchSpy = fracApiService.searchEntityMapping as jest.Mock
    searchSpy.mockClear()
    component.onActivitySelected(activity)
    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('should restore a level range from cached competencyDetails', () => {
    const activity = { code: 'A1', title: 'Activity 1', competencyDetails: [{ code: 'C1', label: 'Comp', levels: 'L1-L3' }] } as any
    ;(component as any).restoreSelectedMapFromActivity(activity)
    expect(component.selectedMap['C1']).toEqual(['C1_L1', 'C1_L2', 'C1_L3'])
  })

  it('should compute matching signatures in isSelectionUnchangedFromCache when nothing changed', () => {
    component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityMappingCache.set(key, [{ code: 'C1', label: 'Comp', levels: 'L1,L2' }])
    component.selectedMap = { C1: ['C1_L1', 'C1_L2'] }
    expect((component as any).isSelectionUnchangedFromCache()).toBe(true)
  })

  it('should return false from isSelectionUnchangedFromCache when there is no selected activity', () => {
    component.selectedActivity = null
    expect((component as any).isSelectionUnchangedFromCache()).toBe(false)
  })

  it('should sort multi-entry signatures when comparing cache with current selection', () => {
    component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityMappingCache.set(key, [
      { code: 'C2', label: 'Comp2', levels: 'L2,L1' },
      { code: 'C1', label: 'Comp1', levels: 'L3,L1' },
    ])
    component.selectedMap = {
      C2: ['C2_L2', 'C2_L1'],
      C1: ['C1_L3', 'C1_L1'],
    }
    expect((component as any).isSelectionUnchangedFromCache()).toBe(true)
  })

  it('should detect a changed multi-entry selection against the cache', () => {
    component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityMappingCache.set(key, [
      { code: 'C2', label: 'Comp2', levels: 'L2,L1' },
      { code: 'C1', label: 'Comp1', levels: 'L3,L1' },
    ])
    component.selectedMap = {
      C2: ['C2_L2'],
      C1: ['C1_L3', 'C1_L1'],
    }
    expect((component as any).isSelectionUnchangedFromCache()).toBe(false)
  })

  it('should parse blank, comma, range and invalid-range levels strings', () => {
    expect((component as any).parseLevelsString('   ')).toEqual([])
    expect((component as any).parseLevelsString('L1,L2')).toEqual(['L1', 'L2'])
    expect((component as any).parseLevelsString('L1-L3')).toEqual(['L1', 'L2', 'L3'])
    expect((component as any).parseLevelsString('LX-LY')).toEqual([])
  })

  it('should numerically sort comma-separated levels in extractCompetencyLevels regardless of input order', () => {
    expect((component as any).extractCompetencyLevels('L3,L1,L2')).toEqual([1, 2, 3])
    expect((component as any).extractCompetencyLevels('L1,L3,L2')).toEqual([1, 2, 3])
  })

  it('should load mappings from the activityDraftStore when present', () => {
    const activity = { code: 'A1', title: 'Activity 1' } as any
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityDraftStore.set(key, [{ code: 'C1', label: 'Comp', levels: 'L1' }])
    ;(component as any).activityMappedCompetenciesCache.set(key, [{ code: 'C1', label: 'Comp', levels: [] }])
    ;(component as any).loadSelectedActivityMappings(activity)
    expect(component.isActivityMappingLoading).toBe(false)
    expect(component.competencyData.length).toBe(1)
  })

  it('should load mappings from the activityMappingCache when there is no draft', () => {
    const activity = { code: 'A1', title: 'Activity 1' } as any
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityMappingCache.set(key, [{ code: 'C1', label: 'Comp', levels: 'L1' }])
    ;(component as any).activityMappedCompetenciesCache.set(key, [{ code: 'C1', label: 'Comp', levels: [] }])
    ;(component as any).loadSelectedActivityMappings(activity)
    expect(component.isActivityMappingLoading).toBe(false)
    expect(component.competencyData.length).toBe(1)
  })

  it('should not re-issue a request for a mapping already in flight for the same key', () => {
    const activity = { code: 'A1', title: 'Activity 1' } as any
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activeMappingRequestKey = key
    const searchSpy = fracApiService.searchEntityMapping as jest.Mock
    searchSpy.mockClear()
    ;(component as any).loadSelectedActivityMappings(activity)
    expect(component.isActivityMappingLoading).toBe(false)
    expect(searchSpy).not.toHaveBeenCalled()
  })

  it('should ignore a stale searchEntityMapping success response for a different selected activity', () => {
    ;(fracApiService.searchEntityMapping as jest.Mock).mockReturnValue(of({}))
    const activity = { code: 'A1', title: 'Activity 1' } as any
    component.selectedActivity = { code: 'DIFFERENT', title: 'Different' } as any
    ;(component as any).loadSelectedActivityMappings(activity)
    expect(component.selectedActivity?.code).toBe('DIFFERENT')
  })

  it('should ignore a stale searchEntityMapping error response for a different selected activity', () => {
    ;(fracApiService.searchEntityMapping as jest.Mock).mockReturnValue(
      new (require('rxjs').Observable)((subscriber: any) => subscriber.error(new Error('boom'))),
    )
    const activity = { code: 'A1', title: 'Activity 1' } as any
    component.selectedActivity = { code: 'DIFFERENT', title: 'Different' } as any
    ;(component as any).loadSelectedActivityMappings(activity)
    expect(component.selectedActivity?.code).toBe('DIFFERENT')
  })

  it('should log and clear mappings when searchEntityMapping errors for the currently selected activity', () => {
    ;(fracApiService.searchEntityMapping as jest.Mock).mockReturnValue(
      new (require('rxjs').Observable)((subscriber: any) => subscriber.error(new Error('boom'))),
    )
    const activity = { code: 'A1', title: 'Activity 1' } as any
    component.selectedActivity = activity
    ;(component as any).loadSelectedActivityMappings(activity)
    expect(component.isActivityMappingLoading).toBe(false)
  })

  it('should extract level numbers from object-shaped competency entries', () => {
    const result = (component as any).extractLevelNumbers([{ levelNumber: 2 }, { level: 3 }, { levelId: 4 }])
    expect(result).toEqual([2, 3, 4])
  })

  it('should format five sequential levels as a compact range', () => {
    const result = (component as any).formatMappedLevels([1, 2, 3, 4, 5])
    expect(result).toBe('L1-L5')
  })

  it('should initialize competencyDetails to an empty array when adding to an activity that has none', () => {
    component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
    component.selectedMap = { C1: ['C1_L1'] }
    component.competencyData = [{ code: 'C1', label: 'Comp 1', levels: [] } as any]
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })
    ;(fracApiService.mapEntity as jest.Mock).mockReturnValue(of({}))
    component.onAddCompetencyToActivity()
    expect(component.selectedActivity?.competencyDetails).toBeDefined()
  })

  it('should warn with no-changes-detected when the current selection matches the cache', () => {
    const activity = { code: 'A1', title: 'Activity 1', competencyDetails: [{ code: 'C1', label: 'Comp', levels: 'L1' }] } as any
    component.selectedActivity = activity
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityMappingCache.set(key, [{ code: 'C1', label: 'Comp', levels: 'L1' }])
    component.selectedMap = { C1: ['C1_L1'] }
    component.onAddCompetencyToActivity()
    expect(snackbar.warning).toHaveBeenCalledWith('No changes detected. Please update your selection before saving.')
  })

  it('should show a success snackbar without calling mapEntity when the payload is empty', () => {
    ;(fracApiService.mapEntity as jest.Mock).mockClear()
    // empty activity code means getCodeFromKey() yields a falsy code, so buildPayload() stays empty
    component.selectedActivity = { code: '', title: 'Activity 1', competencyDetails: [{ code: 'C1', label: 'Comp', levels: 'L1' }] } as any
    component.selectedMap = { C1: ['C1_L1'] }
    component.competencyData = [{ code: 'C1', label: 'Comp', levels: [] } as any]
    ;(component as any).clearedActivityDraftKeys.clear()
    ;(component as any).activityDraftStore.clear()
    component.onAddCompetencyToActivity()
    expect(fracApiService.mapEntity).not.toHaveBeenCalled()
    expect(snackbar.success).toHaveBeenCalledWith('Activity–Competency selection updated.')
  })

  it('should remove deselected competency details that are no longer in selectedCompetencies', () => {
    component.selectedActivity = {
      code: 'A1',
      title: 'Activity 1',
      competencyDetails: [{ code: 'C1', label: 'Comp', levels: 'L1' }, { code: 'C2', label: 'Comp 2', levels: 'L2' }],
    } as any
    component.selectedCompetencies = [{ code: 'C1', label: 'Comp', levels: 'L1' }]
    ;(component as any).removeDeselected()
    expect(component.selectedActivity?.competencyDetails?.map((d: any) => d.code)).toEqual(['C1'])
  })

  it('should update an existing competency detail level via updateOrInsertSelected', () => {
    component.selectedActivity = {
      code: 'A1',
      title: 'Activity 1',
      competencyDetails: [{ code: 'C1', label: 'Comp', levels: 'L1' }],
    } as any
    component.selectedCompetencies = [{ code: 'C1', label: 'Comp', levels: 'L1,L2' }]
    ;(component as any).updateOrInsertSelected()
    expect(component.selectedActivity?.competencyDetails?.[0].levels).toBe('L1,L2')
  })

  it('should refresh activitiesData, activities and filteredActivities after a save', () => {
    const activity = { code: 'A1', title: 'Activity 1', competencyDetails: [{ code: 'C1', label: 'Comp', levels: 'L1' }] } as any
    component.activitiesData = [activity]
    component.activities = [activity]
    component.filteredActivities = [activity]
    component.selectedActivity = activity
    ;(component as any).refreshActivitiesState()
    expect(component.activitiesData[0].competencyDetails?.[0].code).toBe('C1')
    expect(component.activities[0].competencyDetails?.[0].code).toBe('C1')
    expect(component.filteredActivities[0].competencyDetails?.[0].code).toBe('C1')
  })

  it('should skip adding a cleared-key entry to the payload when the activity already has mappings', () => {
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).activityDraftStore.set(key, [{ code: 'C1', label: 'Comp', levels: 'L1' }])
    ;(component as any).clearedActivityDraftKeys.add(key)
    const payload = (component as any).buildPayload()
    expect(payload.length).toBe(1)
    expect(payload[0].childEntityCode).toBe('C1')
  })

  it('should add a cleared entry to the payload for an activity with no remaining mappings', () => {
    const key = (component as any).buildMappingCacheKey('A1')
    ;(component as any).clearedActivityDraftKeys.add(key)
    const payload = (component as any).buildPayload()
    expect(payload.length).toBe(1)
    expect(payload[0].parentEntityCode).toBe('A1')
    expect(payload[0].childEntityType).toBeUndefined()
  })

  it('should return an empty array from extractCompetencyLevels for an invalid range', () => {
    const result = (component as any).extractCompetencyLevels('L5-L1')
    expect(result).toEqual([])
  })

  it('should compute a level range from extractCompetencyLevels for a valid range', () => {
    const result = (component as any).extractCompetencyLevels('L1-L3')
    expect(result).toEqual([1, 2, 3])
  })

  it('should report true from hasActivityMappings for each backing store', () => {
    const draftKey = (component as any).buildMappingCacheKey('DRAFT')
    const cacheKey = (component as any).buildMappingCacheKey('CACHE')
    const clearedKey = (component as any).buildMappingCacheKey('CLEARED')
    ;(component as any).activityDraftStore.set(draftKey, [{ code: 'C1', label: '', levels: 'L1' }])
    ;(component as any).activityMappingCache.set(cacheKey, [])
    ;(component as any).clearedActivityDraftKeys.add(clearedKey)
    expect((component as any).hasActivityMappings(draftKey)).toBe(true)
    expect((component as any).hasActivityMappings(cacheKey)).toBe(true)
    expect((component as any).hasActivityMappings(clearedKey)).toBe(true)
    expect((component as any).hasActivityMappings('unknown-key')).toBe(false)
  })

  it('should hydrate competency details from the draft store first, then the mapping cache', () => {
    const draftCode = 'DRAFT_A'
    const draftKey = (component as any).buildMappingCacheKey(draftCode)
    ;(component as any).activityDraftStore.set(draftKey, [{ code: 'C1', label: '', levels: 'L1' }])
    expect((component as any).getHydratedActivityCompetencyDetails(draftCode)?.[0].code).toBe('C1')

    const cachedCode = 'CACHED_A'
    const cachedKey = (component as any).buildMappingCacheKey(cachedCode)
    ;(component as any).activityMappingCache.set(cachedKey, [{ code: 'C2', label: '', levels: 'L2' }])
    expect((component as any).getHydratedActivityCompetencyDetails(cachedCode)?.[0].code).toBe('C2')

    expect((component as any).getHydratedActivityCompetencyDetails('NOTHING_HERE')).toBeNull()
  })

  it('should delete the draft and mark it cleared when setActivityDraft receives no details', () => {
    const code = 'A1'
    const key = (component as any).buildMappingCacheKey(code)
    ;(component as any).activityDraftStore.set(key, [{ code: 'C1', label: '', levels: 'L1' }])
    ;(component as any).setActivityDraft(code, [])
    expect((component as any).activityDraftStore.has(key)).toBe(false)
    expect((component as any).clearedActivityDraftKeys.has(key)).toBe(true)
  })

  it('should resolve activity title metadata from the activities or filteredActivities lists', () => {
    const code = 'A1'
    const key = (component as any).buildMappingCacheKey(code)
    component.activitiesData = []
    component.activities = [{ code, title: 'From Activities List' } as any]
    component.filteredActivities = []
    ;(component as any).activityDraftStore.set(key, [{ code: 'C1', label: '', levels: 'L1' }])
    ;(component as any).syncUpdatedActivitiesFromDraftStore()
    expect(component.updatedActivities.find((a: any) => a.code === code)?.title).toBe('From Activities List')
  })

  it('should fall back to filteredActivities metadata as a last resort in syncUpdatedActivitiesFromDraftStore', () => {
    const code = 'A2'
    const key = (component as any).buildMappingCacheKey(code)
    component.activitiesData = []
    component.activities = []
    component.filteredActivities = [{ code, title: 'From Filtered List' } as any]
    ;(component as any).activityDraftStore.set(key, [{ code: 'C1', label: '', levels: 'L1' }])
    ;(component as any).syncUpdatedActivitiesFromDraftStore()
    expect(component.updatedActivities.find((a: any) => a.code === code)?.title).toBe('From Filtered List')
  })

  it('should fall back to the code itself when no metadata is found anywhere', () => {
    const code = 'A3'
    const key = (component as any).buildMappingCacheKey(code)
    component.activitiesData = []
    component.activities = []
    component.filteredActivities = []
    ;(component as any).activityDraftStore.set(key, [{ code: 'C1', label: '', levels: 'L1' }])
    ;(component as any).syncUpdatedActivitiesFromDraftStore()
    expect(component.updatedActivities.find((a: any) => a.code === code)?.title).toBe(code)
  })

  it('should navigate home when the result modal closes after a successful save with redirectOnClose', () => {
    ;(router.navigateByUrl as jest.Mock).mockClear()
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })
    ;(component as any).showResultModal({ type: 'success', title: 't', message: 'm' }, true)
    expect(router.navigateByUrl).toHaveBeenCalled()
  })

  describe('additional branch coverage', () => {
    it('falls back to an empty competencyDetails array when the re-matched activity in fetchActivities has none cached', () => {
      component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
      ;(fracApiService.searchEntities as jest.Mock).mockReturnValue(
        of({ result: { entity: [{ code: 'A1', name: 'Activity 1' }] } }),
      )
      ;(component as any).fetchActivities('')
      expect(component.selectedActivity?.code).toBe('A1')
      expect(component.selectedActivity?.competencyDetails).toEqual([])
    })

    it('skips entries with missing code or levels when restoring the selected map', () => {
      const activity = {
        code: 'A1',
        title: 'Activity 1',
        competencyDetails: [
          { code: '', label: 'NoCode', levels: 'L1' },
          { code: 'C2', label: 'NoLevels', levels: '' },
          { code: 'C3', label: 'Valid', levels: 'L1' },
        ],
      } as any
      ;(component as any).restoreSelectedMapFromActivity(activity)
      expect(component.selectedMap['C3']).toEqual(['C3_L1'])
      expect(component.selectedMap['C2']).toBeUndefined()
    })

    it('handles a cached entry with blank levels when computing the cache signature', () => {
      component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
      const key = (component as any).buildMappingCacheKey('A1')
      ;(component as any).activityMappingCache.set(key, [{ code: 'C1', label: 'Comp', levels: '' }])
      component.selectedMap = {}
      expect((component as any).isSelectionUnchangedFromCache()).toBe(false)
    })

    it('treats a level key without an underscore as-is when computing the current signature', () => {
      component.selectedActivity = { code: 'A1', title: 'Activity 1' } as any
      const key = (component as any).buildMappingCacheKey('A1')
      ;(component as any).activityMappingCache.set(key, [])
      component.selectedMap = { C1: ['NoUnderscoreLevel'] }
      expect((component as any).isSelectionUnchangedFromCache()).toBe(false)
    })

    it('falls back to an empty array for draft/cached-competencies get() misses even when has() is true', () => {
      const activity = { code: 'A1', title: 'Activity 1' } as any
      const key = (component as any).buildMappingCacheKey('A1')
      const draftStore = (component as any).activityDraftStore
      jest.spyOn(draftStore, 'has').mockReturnValue(true)
      jest.spyOn(draftStore, 'get').mockReturnValue(undefined)
      const cachedCompMap = (component as any).activityMappedCompetenciesCache
      jest.spyOn(cachedCompMap, 'get').mockReturnValue(undefined)
      ;(component as any).loadSelectedActivityMappings(activity)
      expect(component.competencyData).toEqual([])
      expect(key).toBeTruthy()
    })

    it('falls back to an empty array for activityMappingCache get() misses even when has() is true', () => {
      const activity = { code: 'A1', title: 'Activity 1' } as any
      const mappingCache = (component as any).activityMappingCache
      jest.spyOn(mappingCache, 'has').mockReturnValue(true)
      jest.spyOn(mappingCache, 'get').mockReturnValue(undefined)
      const cachedCompMap = (component as any).activityMappedCompetenciesCache
      jest.spyOn(cachedCompMap, 'get').mockReturnValue(undefined)
      ;(component as any).loadSelectedActivityMappings(activity)
      expect(component.competencyData).toEqual([])
    })

    it('applies mapped details only to the matching activity and leaves others untouched across all three lists', () => {
      component.activitiesData = [{ code: 'A1', title: 'One' }, { code: 'A2', title: 'Two' }] as any
      component.activities = [{ code: 'A1', title: 'One' }, { code: 'A2', title: 'Two' }] as any
      component.filteredActivities = [{ code: 'A1', title: 'One' }, { code: 'A2', title: 'Two' }] as any
      component.selectedActivity = { code: 'A1', title: 'One' } as any
      ;(component as any).applyMappedDetailsToActivity(
        { code: 'A1', title: 'One' } as any,
        [{ code: 'C1', label: 'Comp', levels: 'L1' }],
      )
      expect(component.activitiesData.find((a: any) => a.code === 'A2')).toEqual({ code: 'A2', title: 'Two' })
      expect(component.activities.find((a: any) => a.code === 'A2')).toEqual({ code: 'A2', title: 'Two' })
      expect(component.filteredActivities.find((a: any) => a.code === 'A2')).toEqual({ code: 'A2', title: 'Two' })
    })

    it('defaults entityType/entityCode/entityName and non-array competencies when extracting mapped competency details', () => {
      const res = {
        result: [{
          childHierarchy: [
            { entityType: 'competency', competencies: 'not-an-array' },
          ],
        }],
      }
      const result = (component as any).extractMappedCompetencyDetails(res)
      expect(result).toEqual([])
    })

    it('defaults entityType/entityCode/entityName and non-array competencies when extracting mapped competency rows', () => {
      const res = {
        result: [{
          childHierarchy: [
            { entityType: 'competency' },
          ],
        }],
      }
      const result = (component as any).extractMappedCompetencyRows(res)
      expect(result).toEqual([])
    })

    it('returns an empty array from extractLevelNumbers when input is not an array', () => {
      expect((component as any).extractLevelNumbers(undefined)).toEqual([])
    })

    it('returns an empty string from formatMappedLevels when there are no normalized levels', () => {
      expect((component as any).formatMappedLevels([])).toBe('')
    })

    it('skips an empty raw selection when transforming selected competencies', () => {
      component.selectedMap = { C1: [] }
      ;(component as any).transformSelectedCompetencies()
      expect(component.selectedCompetencies).toEqual([])
    })

    it('does nothing in refreshActivitiesState when there is no selected activity', () => {
      component.selectedActivity = null
      expect(() => (component as any).refreshActivitiesState()).not.toThrow()
    })

    it('falls back to an empty competencyDetails array in refreshActivitiesState when the activity has none', () => {
      component.selectedActivity = { code: 'A1', title: 'One' } as any
      component.activitiesData = [{ code: 'A1', title: 'One' }, { code: 'A2', title: 'Two' }] as any
      component.activities = [{ code: 'A1', title: 'One' }, { code: 'A2', title: 'Two' }] as any
      component.filteredActivities = [{ code: 'A1', title: 'One' }, { code: 'A2', title: 'Two' }] as any
      ;(component as any).refreshActivitiesState()
      expect(component.selectedActivity?.competencyDetails).toEqual([])
      expect(component.activitiesData.find((a: any) => a.code === 'A2')).toEqual({ code: 'A2', title: 'Two' })
    })

    it('skips draft entries with a blank competency code and continues when building the payload', () => {
      const key = (component as any).buildMappingCacheKey('A1')
      ;(component as any).activityDraftStore.set(key, [
        { code: '', label: 'blank', levels: 'L1' },
        { code: 'C1', label: 'valid', levels: 'L1' },
      ])
      const payload = (component as any).buildPayload()
      expect(payload.length).toBe(1)
      expect(payload[0].childEntityCode).toBe('C1')
    })

    it('returns an empty array from extractCompetencyLevels when levels is blank', () => {
      expect((component as any).extractCompetencyLevels('')).toEqual([])
    })

    it('returns an empty array from cloneActivityDetails when details is undefined', () => {
      expect((component as any).cloneActivityDetails(undefined as any)).toEqual([])
    })

    it('defaults label/levels to blank strings in cloneActivityDetails when missing', () => {
      const result = (component as any).cloneActivityDetails([{ code: 'C1' }])
      expect(result).toEqual([{ code: 'C1', label: '', levels: '' }])
    })

    it('uses an HTTP status-less error and non-blank raw message when building the failure modal data', async () => {
      const result = await (component as any).buildMappingFailureModalData({ message: 'Server error' }, 'fallback msg')
      expect(result.message).toBe('Server error')
      expect(result.type).toBe('error')
    })

    it('renders the detail line without brackets when a mapped competency has blank levels on save success', () => {
      ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })
      ;(fracApiService.mapEntity as jest.Mock).mockReturnValue(of({}))

      // C1 is checked with a level code that has no underscore, so sortLevels filters it out and
      // buildLevelString yields a blank levels string, exercising the falsy branch of the ternary.
      component.selectedActivity = { code: 'A1', title: 'Activity 1', competencyDetails: [{ code: 'C1', label: 'Comp 1', levels: '' }] } as any
      component.competencyData = [{ code: 'C1', label: 'Comp 1', levels: [] } as any, { code: 'C2', label: 'Comp 2', levels: [] } as any]
      component.onCheck({ code: 'C1', level: 'C1', checked: true } as any)
      component.onCheck({ code: 'C2', level: 'C2_L1', checked: true } as any)

      component.onAddCompetencyToActivity()

      expect(dialog.open).toHaveBeenCalled()
      const args = (dialog.open as jest.Mock).mock.calls[0][1]
      expect(args.data.errorDetails).toContain('A1 <=> C1\n')
      expect(args.data.errorDetails).toContain('A1 <=> C2 [L1]')
    })

    it('defaults activityCode to empty string in the save-success detail lines when selectedActivity is falsy', () => {
      ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })

      component.selectedActivity = { code: 'A1', title: 'Activity 1', competencyDetails: [] } as any
      component.competencyData = [{ code: 'C1', label: 'Comp 1', levels: [] } as any]
      component.onCheck({ code: 'C1', level: 'C1_L1', checked: true } as any)

      // clear selectedActivity right as the mapEntity observable emits, simulating a race with a concurrent reset
      ;(fracApiService.mapEntity as jest.Mock).mockImplementation(() => {
        component.selectedActivity = null
        return of({})
      })

      component.onAddCompetencyToActivity()

      expect(dialog.open).toHaveBeenCalled()
      const args = (dialog.open as jest.Mock).mock.calls[0][1]
      expect(args.data.errorDetails).toBeUndefined()
    })

    it('treats an entityType-less hierarchy child as not a competency when extracting mapped competency details', () => {
      const response = {
        result: [
          { childHierarchy: [{ entityType: undefined, entityCode: 'C1', entityName: 'Comp 1', competencies: [] }] },
        ],
      }
      const result = (component as any).extractMappedCompetencyDetails(response)
      expect(result).toEqual([])
    })

    it('treats an entityType-less hierarchy child as not a competency when extracting mapped competency rows', () => {
      const response = {
        result: [
          { childHierarchy: [{ entityType: undefined, entityCode: 'C1', entityName: 'Comp 1', competencies: [] }] },
        ],
      }
      const result = (component as any).extractMappedCompetencyRows(response)
      expect(result).toEqual([])
    })
  })
})
