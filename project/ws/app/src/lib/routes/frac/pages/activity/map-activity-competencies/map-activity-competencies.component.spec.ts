import { of, throwError, Subject } from 'rxjs'
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
})
