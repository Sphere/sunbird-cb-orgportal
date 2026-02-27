import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'
import { Subject } from 'rxjs'
import {
  Activity,
  ActivityCompetencyDetail,
  Competency,
  SelectedMap,
  SelectedCompetencySummary,
  CompetencyCheckChangeEvent,
  SelectedLevelCode
} from '../../../models/activity-competency.models'
import { transformActivities, transformCompetencies, extractEntityList, makeMappingKey, getCodeFromKey } from '../../../utils/common.util'
import { fracLogger } from '../../../utils/frac-logger.util'
import { CustomSnackbarService } from '../../../services/custom-snackbar.service'
import { FracApiService } from '../../../services/frac-api.service'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { UploadResultData, UploadResultModalComponent } from '../../../components/upload-result-modal/upload-result-modal.component'
import { FRAC_UI_CONFIG } from '../../../models/ui.config.model'
import { FRAC_DEBOUNCE_MS, FRAC_DIALOG_SIZES, FRAC_LANGUAGES, FRAC_MAP_PAGE_SPINNER, FRAC_ROUTES } from '../../../constants/frac.constants'

interface ActivityCompetencyApiRequestItem {
  parentEntityType: 'Activity'
  parentEntityCode: string
  childEntityType: 'Competency'
  childEntityCode: string
  competencies: number[]
}

interface ActivityMappingHierarchyNode {
  entityType?: string
  entityCode?: string
  entityName?: string
  competencies?: Array<number | string | { levelNumber?: number; level?: number | string; levelId?: number }>
}

interface ActivityMappingSearchResultItem {
  childHierarchy?: ActivityMappingHierarchyNode[]
}

interface ActivityMappingSearchResponseShape {
  result?: ActivityMappingSearchResultItem[]
}

@Component({
  selector: 'ws-app-map-activitiy-competencies',
  templateUrl: './map-activity-competencies.component.html',
  styleUrls: ['./map-activity-competencies.component.scss'],
})
export class MapActivityCompetenciesComponent implements OnInit, OnDestroy {
  constructor(
    private snackbar: CustomSnackbarService,
    private fracApiService: FracApiService,
    private dialog: MatDialog,
    private router: Router,
  ) { }

  readonly uiConfig = FRAC_UI_CONFIG
  readonly routes = FRAC_ROUTES
  readonly mapPageSpinner = FRAC_MAP_PAGE_SPINNER

  readonly languages: string[] = [...FRAC_LANGUAGES]
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true
  isSaving = false
  isActivitiesLoading = false
  isCompetenciesLoading = false
  isActivityMappingLoading = false
  hasUnsavedChanges = false

  levels: string[] = []

  competencyData: Competency[] = []
  competencies: Competency[] = []
  filteredCompetencies: Competency[] = []

  activitiesData: Activity[] = []
  activities: Activity[] = []
  filteredActivities: Activity[] = []

  selectedMap: SelectedMap = {}
  selectedCompetencies: SelectedCompetencySummary[] = []

  expandedActivity: Activity | null = null
  selectedActivity: (Activity & { competencyDetails?: ActivityCompetencyDetail[] }) | null = null

  updatedActivities: (Activity & { competencyDetails?: ActivityCompetencyDetail[] })[] = []

  activitySearchTerm = ''
  competencySearchTerm = ''
  searchResetKey = 0

  private activitySearch$ = new Subject<string>()
  private competencySearch$ = new Subject<string>()
  private destroy$ = new Subject<void>()
  private readonly activityMappingCache = new Map<string, ActivityCompetencyDetail[]>()
  private readonly activityDraftStore = new Map<string, ActivityCompetencyDetail[]>()
  private readonly activityMappedCompetenciesCache = new Map<string, Competency[]>()
  private activeMappingRequestKey: string | null = null

  /**
   * Runs once when the page loads. Sets up search listeners and checks the URL to see if we are in upload or manage mode.
   */
  ngOnInit(): void {
    this.setupSearchStreams()
    this.resetInitialView()
    this.fetchActivities('')
  }

  /**
   * Cleans up memory and active background tasks when the user leaves this page.
   */
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  /**
   * Initializes the search bars to wait 500ms after the user stops typing before making a backend request.
   */
  private setupSearchStreams(): void {
    this.activitySearch$
      .pipe(
        debounceTime(FRAC_DEBOUNCE_MS.searchInput),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchActivities(keyword))

    this.competencySearch$
      .pipe(
        debounceTime(FRAC_DEBOUNCE_MS.searchInput),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => {
        if (!this.selectedActivity) {
          this.clearCompetencies()
          return
        }
        this.fetchCompetencies(keyword)
      })
  }

  /**
   * Resets all component variables back to their blank, starting state.
   */
  private resetInitialView(): void {
    this.searchResetKey += 1
    this.activitySearchTerm = ''
    this.competencySearchTerm = ''
    this.hasUnsavedChanges = false

    this.activitiesData = []
    this.activities = []
    this.filteredActivities = []

    this.clearCompetencies()
    this.selectedMap = {}
    this.selectedCompetencies = []
    this.selectedActivity = null
    this.expandedActivity = null
    this.updatedActivities = []
    this.isActivitiesLoading = false
    this.isCompetenciesLoading = false
    this.isActivityMappingLoading = false
    this.activeMappingRequestKey = null
    this.activityMappingCache.clear()
    this.activityDraftStore.clear()
    this.activityMappedCompetenciesCache.clear()
  }

  // ---------------------------------------------------------------------------
  // API Search Integration
  // ---------------------------------------------------------------------------

  /**
   * Fetches the list of activities from the backend using the search keyword.
   */
  private fetchActivities(keyword: string): void {
    this.isActivitiesLoading = true
    this.fracApiService.searchEntities('activity', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isActivitiesLoading = false
        const entityList = extractEntityList(res)
        const transformed = transformActivities(entityList)
        const hydrated = transformed.map((activity) => {
          const details = this.getHydratedActivityCompetencyDetails(activity.code)
          return details ? { ...activity, competencyDetails: details } : activity
        })

        this.activitiesData = hydrated
        this.activities = [...hydrated]
        this.filteredActivities = [...hydrated]

        if (this.selectedActivity) {
          const hasSearchKeyword = !!keyword.trim()
          const matchingActivity = hydrated.find(a => a.code === this.selectedActivity!.code)
          if (!matchingActivity) {
            if (hasSearchKeyword) {
              return
            }
            this.selectedActivity = null
            this.selectedMap = {}
            this.selectedCompetencies = []
            this.clearCompetencies()
          } else {
            const typed = matchingActivity as Activity & { competencyDetails?: ActivityCompetencyDetail[] }
            this.selectedActivity = typed
            this.applyMappedDetailsToActivity(typed, typed.competencyDetails || [])
          }
        }
      },
      error: (err) => {
        this.isActivitiesLoading = false
        fracLogger.error('Failed to fetch activities', err)
        this.activitiesData = []
        this.activities = []
        this.filteredActivities = []
      },
    })
  }

  /**
   * Fetches the list of competencies from the backend to display in the mapping table.
   */
  private fetchCompetencies(keyword: string): void {
    this.isCompetenciesLoading = true
    this.fracApiService.searchEntities('competency', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isCompetenciesLoading = false
        const entityList = extractEntityList(res)
        const transformed = transformCompetencies(entityList)

        this.competencyData = transformed
        this.competencies = [...transformed]
        this.filteredCompetencies = [...transformed]
        this.levels = this.extractLevels(transformed)
      },
      error: (err) => {
        this.isCompetenciesLoading = false
        fracLogger.error('Failed to fetch competencies', err)
        this.clearCompetencies()
      },
    })
  }


  /**
   * Clears the currently displayed list of competencies and resets related state.
   */
  private clearCompetencies(): void {
    this.competencyData = []
    this.competencies = []
    this.filteredCompetencies = []
    this.levels = []
  }

  /**
   * Takes the already mapped competencies from the server and populates the table with them.
   */
  private setMappedCompetencies(competencies: Competency[]): void {
    this.competencyData = competencies.map(item => ({ ...item, levels: [...(item.levels || [])] }))
    this.competencies = this.competencyData.map(item => ({ ...item, levels: [...(item.levels || [])] }))
    this.filteredCompetencies = this.competencyData.map(item => ({ ...item, levels: [...(item.levels || [])] }))
    this.levels = this.extractLevels(this.competencyData)
  }

  /**
   * Extracts the level headers (like Level 1, Level 2) dynamically from the API response.
   */
  private extractLevels(competencies: Competency[]): string[] {
    if (!competencies.length || !competencies[0].levels) return []
    return competencies[0].levels.map((level) => level.level)
  }

  // ---------------------------------------------------------------------------
  // Language Dropdown
  // ---------------------------------------------------------------------------

  /**
   * Opens or closes the language selection dropdown menu.
   */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen
  }

  /**
   * Changes the selected language and fetches new data for that language if in manage mode.
   */
  selectLanguage(lang: string, event: MouseEvent): void {
    event.stopPropagation()
    if (!this.languages.includes(lang)) return
    if (this.selectedLanguage === lang) {
      this.isOpen = false
      return
    }

    this.selectedLanguage = lang
    this.isOpen = false
    this.resetInitialView()
    this.fetchActivities('')
  }

  // ---------------------------------------------------------------------------
  // Activity Selection
  // ---------------------------------------------------------------------------

  /**
   * Programmatically forces an activity card to expand and load its children.
   */
  expand(activity: Activity): void {
    this.expandedActivity = this.expandedActivity === activity ? null : activity
  }

  /**
   * Sets an activity card as the active focus in the UI.
   */
  onActivitySelected(activity: Activity): void {
    if (!activity.code) return

    const nextKey = this.buildMappingCacheKey(activity.code)
    if (this.selectedActivity?.code === activity.code && this.hasActivityMappings(nextKey)) {
      return
    }

    const typed = activity as Activity & { competencyDetails?: ActivityCompetencyDetail[] }
    this.selectedActivity = typed
    this.selectedMap = {}
    this.selectedCompetencies = []
    this.competencySearchTerm = ''
    this.searchResetKey += 1
    this.clearCompetencies()
    this.loadSelectedActivityMappings(typed)
  }

  onActivitySearch(keyword: string): void {
    this.activitySearchTerm = keyword.trim()
    this.activitySearch$.next(this.activitySearchTerm)
  }

  /**
   * Loads previous mapping choices from memory when the user expands an activity card they already edited.
   */
  private restoreSelectedMapFromActivity(activity: Activity & { competencyDetails?: ActivityCompetencyDetail[] }): void {
    this.selectedMap = {}

    const details = activity.competencyDetails
    if (!details?.length) return

    for (const comp of details) {
      const { code, levels } = comp
      if (!code || !levels) continue

      this.selectedMap[code] = []

      if (levels.includes('-')) {
        const [start, end] = levels.split('-')
        const s = Number(start.replace('L', ''))
        const e = Number(end.replace('L', ''))
        for (let i = s; i <= e; i++) this.selectedMap[code].push(`${code}_L${i}`)
      } else {
        levels
          .split(',')
          .map(l => l.trim())
          .forEach(l => this.selectedMap[code].push(`${code}_${l}`))
      }
    }

    this.transformSelectedCompetencies()
  }

  /**
   * Creates a standardized text key to store and look up draft mappings in memory.
   */
  private buildMappingCacheKey(activityCode: string): string {
    return makeMappingKey(this.selectedLanguage, activityCode)
  }

  /**
   * Triggers a backend request to find mapped competencies when a user expands an activity card.
   */
  private loadSelectedActivityMappings(activity: Activity & { competencyDetails?: ActivityCompetencyDetail[] }): void {
    const requestKey = this.buildMappingCacheKey(activity.code)
    this.isActivityMappingLoading = true

    if (this.activityDraftStore.has(requestKey)) {
      const draftDetails = this.activityDraftStore.get(requestKey) || []
      const cachedCompetencies = this.activityMappedCompetenciesCache.get(requestKey) || []
      this.setMappedCompetencies(cachedCompetencies)
      this.applyMappedDetailsToActivity(activity, draftDetails)
      this.isActivityMappingLoading = false
      return
    }

    if (this.activityMappingCache.has(requestKey)) {
      const cachedDetails = this.activityMappingCache.get(requestKey) || []
      const cachedCompetencies = this.activityMappedCompetenciesCache.get(requestKey) || []
      this.setMappedCompetencies(cachedCompetencies)
      this.applyMappedDetailsToActivity(activity, cachedDetails)
      this.isActivityMappingLoading = false
      return
    }

    if (this.activeMappingRequestKey === requestKey) {
      this.isActivityMappingLoading = false
      return
    }

    this.activeMappingRequestKey = requestKey

    this.fracApiService.searchEntityMapping('activity', activity.code, this.selectedLanguage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isActivityMappingLoading = false
          if (this.activeMappingRequestKey === requestKey) {
            this.activeMappingRequestKey = null
          }

          if (this.selectedActivity?.code !== activity.code || this.buildMappingCacheKey(activity.code) !== requestKey) {
            return
          }

          const mappedDetails = this.extractMappedCompetencyDetails(res)
          const mappedCompetencies = this.extractMappedCompetencyRows(res)
          this.activityMappingCache.set(requestKey, mappedDetails)
          this.activityMappedCompetenciesCache.set(requestKey, mappedCompetencies)
          this.setMappedCompetencies(mappedCompetencies)
          this.applyMappedDetailsToActivity(activity, mappedDetails)
        },
        error: (err) => {
          this.isActivityMappingLoading = false
          if (this.activeMappingRequestKey === requestKey) {
            this.activeMappingRequestKey = null
          }
          if (this.selectedActivity?.code !== activity.code || this.buildMappingCacheKey(activity.code) !== requestKey) {
            return
          }

          fracLogger.error('Failed to fetch activity mappings', err)
          this.applyMappedDetailsToActivity(activity, [])
        },
      })
  }

  private applyMappedDetailsToActivity(
    activity: Activity & { competencyDetails?: ActivityCompetencyDetail[] },
    mappedDetails: ActivityCompetencyDetail[],
  ): void {
    const normalizedDetails = this.cloneActivityDetails(mappedDetails)
    activity.competencyDetails = normalizedDetails

    this.activitiesData = this.activitiesData.map((a) =>
      a.code === activity.code ? { ...a, competencyDetails: this.cloneActivityDetails(normalizedDetails) } : a,
    )

    this.activities = this.activities.map((a) =>
      a.code === activity.code ? { ...a, competencyDetails: this.cloneActivityDetails(normalizedDetails) } : a,
    )

    this.filteredActivities = this.filteredActivities.map((a) =>
      a.code === activity.code ? { ...a, competencyDetails: this.cloneActivityDetails(normalizedDetails) } : a,
    )

    if (this.selectedActivity?.code === activity.code) {
      this.selectedActivity = {
        ...this.selectedActivity,
        competencyDetails: this.cloneActivityDetails(normalizedDetails),
      }
      this.restoreSelectedMapFromActivity(this.selectedActivity)
    }
  }

  private extractMappedCompetencyDetails(response: unknown): ActivityCompetencyDetail[] {
    const result = Array.isArray((response as ActivityMappingSearchResponseShape)?.result)
      ? (response as ActivityMappingSearchResponseShape).result || []
      : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy
      .filter((child: ActivityMappingHierarchyNode) => (child?.entityType || '').toLowerCase() === 'competency')
      .map((child: ActivityMappingHierarchyNode) => {
        const code = (child?.entityCode || '').trim()
        const label = child?.entityName || ''
        const competencies = Array.isArray(child?.competencies) ? child.competencies : []
        const levels = this.formatMappedLevels(competencies)

        return { code, label, levels }
      })
      .filter((item: ActivityCompetencyDetail) => !!item.code)
  }

  private extractMappedCompetencyRows(response: unknown): Competency[] {
    const result = Array.isArray((response as ActivityMappingSearchResponseShape)?.result)
      ? (response as ActivityMappingSearchResponseShape).result || []
      : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy
      .filter((child: ActivityMappingHierarchyNode) => (child?.entityType || '').toLowerCase() === 'competency')
      .map((child: ActivityMappingHierarchyNode) => {
        const code = (child?.entityCode || '').trim()
        const label = child?.entityName || ''
        const levelNumbers = this.extractLevelNumbers(child?.competencies)

        return {
          code,
          label,
          levels: levelNumbers.map(level => ({ level: `L${level}`, code })),
        } as Competency
      })
      .filter((item: Competency) => !!item.code)
  }

  private extractLevelNumbers(levels: Array<number | string | { levelNumber?: number; level?: number | string; levelId?: number }> | undefined): number[] {
    if (!Array.isArray(levels)) return []

    return Array.from(
      new Set(
        levels
          .map((level) => {
            if (typeof level === 'number' || typeof level === 'string') {
              return Number(level)
            }
            return Number(level.levelNumber ?? level.level ?? level.levelId)
          })
          .filter((value: number) => Number.isFinite(value) && value > 0)
          .sort((a: number, b: number) => a - b),
      ),
    )
  }

  private formatMappedLevels(levels: Array<number | string | { levelNumber?: number; level?: number | string; levelId?: number }>): string {
    const normalized = this.extractLevelNumbers(levels)

    if (!normalized.length) return ''
    if (normalized.length === 5 && normalized.every((value, index) => value === index + 1)) {
      return 'L1-L5'
    }

    return normalized.map(level => `L${level}`).join(',')
  }

  // ---------------------------------------------------------------------------
  // Competency Table Events
  // ---------------------------------------------------------------------------

  /**
   * Fires an immediate search request when the user presses Enter in the competency search box.
   */
  onCompetencySearch(keyword: string): void {
    this.competencySearchTerm = keyword.trim()

    if (!this.selectedActivity) {
      this.isCompetenciesLoading = false
      if (this.competencySearchTerm) {
        this.snackbar.warning('Please select at least one activity before searching competency !!')
      }
      this.clearCompetencies()
      return
    }

    this.competencySearch$.next(this.competencySearchTerm)
  }

  onCheck(event: CompetencyCheckChangeEvent): void {
    const { code, level, checked } = event

    if (!this.selectedMap[code]) this.selectedMap[code] = []

    if (checked) {
      if (!this.selectedMap[code].includes(level)) this.selectedMap[code].push(level)
    } else {
      this.selectedMap[code] = this.selectedMap[code].filter(l => l !== level)
      if (!this.selectedMap[code].length) delete this.selectedMap[code]
    }

    this.transformSelectedCompetencies()
  }

  // ---------------------------------------------------------------------------
  // Selected Competency Summary
  // ---------------------------------------------------------------------------

  private transformSelectedCompetencies(): void {
    const result: SelectedCompetencySummary[] = []

    for (const code of Object.keys(this.selectedMap)) {
      const raw = this.selectedMap[code]
      if (!raw?.length) continue

      const meta = this.competencyData.find(c => c.code === code)
      const sorted = this.sortLevels(raw)

      const summary: SelectedCompetencySummary = {
        code,
        label: meta?.label ?? '',
        levels: this.buildLevelString(sorted),
      }

      result.push(summary)
    }

    this.selectedCompetencies = result
  }

  private sortLevels(raw: SelectedLevelCode[]): string[] {
    return raw
      .map(r => r.split('_')[1])
      .filter(Boolean)
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
  }

  private buildLevelString(levels: string[]): string {
    if (this.isFullRange(levels)) return `${levels[0]}-${levels[levels.length - 1]}`
    return levels.join(',')
  }

  private isFullRange(levels: string[]): boolean {
    const expected = ['L1', 'L2', 'L3', 'L4', 'L5']
    return levels.length === 5 && levels.every((l, i) => l === expected[i])
  }

  // ---------------------------------------------------------------------------
  // Add Competencies to Activity
  // ---------------------------------------------------------------------------

  onAddCompetencyToActivity(): void {
    if (!this.selectedActivity) {
      this.snackbar.warning('Please select an activity first !!')
      return
    }
    if (!this.selectedActivity.competencyDetails)
      this.selectedActivity.competencyDetails = []

    this.transformSelectedCompetencies()
    const hasSelectedLevels =
      Object.values(this.selectedMap).some((levels: SelectedLevelCode[]) => levels.length > 0)
    const activityAlreadyHadCompetencies =
      this.selectedActivity.competencyDetails.length > 0

    if (!hasSelectedLevels && !activityAlreadyHadCompetencies) {
      this.snackbar.warning('Please select at least one competency level to map !!')
      return
    }

    const previousSignature = this.getActivityCompetencyDetailsSignature(this.selectedActivity.competencyDetails || [])

    this.removeDeselected()
    this.updateOrInsertSelected()
    this.refreshActivitiesState()
    const currentSignature = this.getActivityCompetencyDetailsSignature(this.selectedActivity.competencyDetails || [])
    const hasChanges = previousSignature !== currentSignature
    this.hasUnsavedChanges = this.hasUnsavedChanges || hasChanges
    this.snackbar.success('Activity–Competency linked successfully. Please tap Save to apply changes.')
  }

  private removeDeselected(): void {
    if (!this.selectedActivity?.competencyDetails) return

    this.selectedActivity.competencyDetails =
      this.selectedActivity.competencyDetails.filter(detail =>
        this.selectedCompetencies.some(s => s.code === detail.code),
      )
  }

  private updateOrInsertSelected(): void {
    if (!this.selectedActivity) return

    for (const summary of this.selectedCompetencies) {
      const existing = this.selectedActivity.competencyDetails!.find(
        c => c.code === summary.code,
      )

      if (existing) existing.levels = summary.levels
      else
        this.selectedActivity.competencyDetails!.push({
          code: summary.code,
          label: summary.label,
          levels: summary.levels,
        })
    }
  }

  private refreshActivitiesState(): void {
    if (!this.selectedActivity) return

    const normalizedDetails = this.cloneActivityDetails(this.selectedActivity.competencyDetails || [])
    const updatedSelectedActivity: Activity & { competencyDetails?: ActivityCompetencyDetail[] } = {
      ...this.selectedActivity,
      code: this.selectedActivity.code,
      title: this.selectedActivity.title,
      competencyDetails: normalizedDetails,
    }

    this.activitiesData = this.activitiesData.map(a =>
      a.code === updatedSelectedActivity.code ? updatedSelectedActivity : a,
    )

    this.activities = this.activities.map(a =>
      a.code === updatedSelectedActivity.code ? updatedSelectedActivity : a,
    )

    this.filteredActivities = this.filteredActivities.map(a =>
      a.code === updatedSelectedActivity.code ? updatedSelectedActivity : a,
    )

    this.selectedActivity = updatedSelectedActivity
    this.setActivityDraft(updatedSelectedActivity.code, normalizedDetails)

    this.activityMappingCache.set(
      this.buildMappingCacheKey(this.selectedActivity.code),
      this.cloneActivityDetails(this.selectedActivity.competencyDetails || []),
    )
    this.activityMappedCompetenciesCache.set(
      this.buildMappingCacheKey(this.selectedActivity.code),
      this.competencyData.map(item => ({ ...item, levels: [...(item.levels || [])] })),
    )
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  /**
   * Takes all the edited rows and sends them to the server to be updated.
   */
  onSaveClicked(): void {
    this.syncCurrentSelectedActivitySelection()
    const payload = this.buildPayload()

    if (!payload.length) {
      this.snackbar.warning('Nothing to save !!')
      return
    }

    if (this.isSaving) {
      return
    }

    this.isSaving = true

    this.fracApiService.mapEntity(payload).subscribe({
      next: (res) => {
        this.isSaving = false
        this.hasUnsavedChanges = false
        this.activityDraftStore.clear()
        this.syncUpdatedActivitiesFromDraftStore()

        const mappedPairs = this.extractMappedPairs(res, payload)
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Activity to competency mappings were saved successfully.',
          errorDetails: mappedPairs.join('\n'),
        }
        this.showResultModal(successData, true)
      },
      error: (err) => {
        this.isSaving = false

        const errorMessage =
          err?.error?.params?.errmsg ||
          err?.error?.message ||
          err?.statusText ||
          err?.message ||
          'Failed to save activity to competency mapping.'

        const failureData: UploadResultData = {
          type: 'error',
          title: 'Mapping Failed',
          message: errorMessage,
          errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
        }

        this.showResultModal(failureData)
      },
    })
  }

  private buildPayload(): ActivityCompetencyApiRequestItem[] {
    const payloadByPair = new Map<string, ActivityCompetencyApiRequestItem>()

    for (const [key, competencyDetails] of this.activityDraftStore.entries()) {
      const activityCode = getCodeFromKey(key)
      if (!activityCode) continue

      for (const detail of competencyDetails) {
        const competencyCode = (detail?.code || '').trim()
        if (!competencyCode) continue

        payloadByPair.set(`${activityCode}::${competencyCode}`, {
          parentEntityType: 'Activity',
          parentEntityCode: activityCode,
          childEntityType: 'Competency',
          childEntityCode: competencyCode,
          competencies: this.extractCompetencyLevels(detail.levels),
        })
      }
    }

    return Array.from(payloadByPair.values())
  }

  private extractCompetencyLevels(levels: string): number[] {
    if (!levels) return []

    if (levels.includes('-')) {
      const [start, end] = levels.split('-')
      const startNum = Number(start.replace('L', ''))
      const endNum = Number(end.replace('L', ''))
      if (!Number.isFinite(startNum) || !Number.isFinite(endNum) || endNum < startNum) {
        return []
      }

      const result: number[] = []
      for (let i = startNum; i <= endNum; i++) {
        result.push(i)
      }
      return result
    }

    return levels
      .split(',')
      .map(l => Number(l.trim().replace('L', '')))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b)
  }

  /**
   * Updates the visual selection state (checkboxes) for the currently open activity card based on what is stored in memory.
   */
  private syncCurrentSelectedActivitySelection(): void {
    if (!this.selectedActivity) return

    if (!this.selectedActivity.competencyDetails) {
      this.selectedActivity.competencyDetails = []
    }

    this.transformSelectedCompetencies()
    this.removeDeselected()
    this.updateOrInsertSelected()
    this.refreshActivitiesState()
  }

  /**
   * Checks if a specific activity holds any unsaved changes stored in the draft cache.
   */
  private hasActivityMappings(key: string): boolean {
    return this.activityDraftStore.has(key) || this.activityMappingCache.has(key)
  }

  /**
   * Creates a deep copy of the activity details so we can compare changes without modifying the original data.
   */
  private cloneActivityDetails(details: ActivityCompetencyDetail[]): ActivityCompetencyDetail[] {
    return (details || [])
      .filter((detail) => !!detail?.code)
      .map((detail) => ({
        code: detail.code,
        label: detail.label || '',
        levels: detail.levels || '',
      }))
  }

  /**
   * Creates a unique string from all competency levels to detect if the user made any edits.
   */
  private getActivityCompetencyDetailsSignature(details: ActivityCompetencyDetail[]): string {
    return this.cloneActivityDetails(details)
      .map((detail) => ({
        code: detail.code,
        label: detail.label || '',
        levels: this.extractCompetencyLevels(detail.levels || '').join(','),
      }))
      .sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true, sensitivity: 'base' }))
      .map((detail) => `${detail.code}|${detail.label}|${detail.levels}`)
      .join('||')
  }


  private getHydratedActivityCompetencyDetails(activityCode: string): ActivityCompetencyDetail[] | null {
    const key = this.buildMappingCacheKey(activityCode)
    const draftDetails = this.activityDraftStore.get(key)
    if (draftDetails) {
      return this.cloneActivityDetails(draftDetails)
    }

    const mappedDetails = this.activityMappingCache.get(key)
    if (mappedDetails) {
      return this.cloneActivityDetails(mappedDetails)
    }

    return null
  }

  /**
   * Saves the current mapping selections for a specific activity into the temporary draft memory.
   */
  private setActivityDraft(activityCode: string, details: ActivityCompetencyDetail[]): void {
    const key = this.buildMappingCacheKey(activityCode)
    const normalizedDetails = this.cloneActivityDetails(details)

    if (normalizedDetails.length) {
      this.activityDraftStore.set(key, normalizedDetails)
    } else {
      this.activityDraftStore.delete(key)
    }

    this.activityMappingCache.set(key, normalizedDetails)
    this.syncUpdatedActivitiesFromDraftStore()
  }

  /**
   * Loops through memory to ensure any activities edited on previous pages still show their updated mapped counts.
   */
  private syncUpdatedActivitiesFromDraftStore(): void {
    const activityMap = new Map<string, ActivityCompetencyDetail[]>()

    for (const [key, details] of this.activityDraftStore.entries()) {
      const activityCode = getCodeFromKey(key)
      if (!activityCode || !details.length) continue
      activityMap.set(activityCode, this.cloneActivityDetails(details))
    }

    this.updatedActivities = Array.from(activityMap.entries()).map(([code, competencyDetails]) => {
      const metadata =
        this.activitiesData.find(activity => activity.code === code) ||
        this.activities.find(activity => activity.code === code) ||
        this.filteredActivities.find(activity => activity.code === code)

      return {
        code,
        title: metadata?.title || code,
        competencyDetails,
      }
    })
  }

  private extractMappedPairs(response: unknown, fallbackPayload: ActivityCompetencyApiRequestItem[]): string[] {
    const resultArray = Array.isArray((response as { result?: Array<Partial<ActivityCompetencyApiRequestItem>> })?.result)
      ? (response as { result?: Array<Partial<ActivityCompetencyApiRequestItem>> }).result || []
      : []
    const source = resultArray.length ? resultArray : fallbackPayload

    return source
      .map((item) => {
        const parentCode = item?.parentEntityCode || ''
        const childCode = item?.childEntityCode || ''
        const competencies = Array.isArray(item?.competencies) ? item.competencies : []
        const levelsText = competencies.length ? ` [L${competencies.join(',L')}]` : ''
        return `${parentCode} <=> ${childCode}${levelsText}`
      })
      .filter(Boolean)
  }

  /**
   * Opens a popup dialog to show the user if their action (upload, save) was successful or failed.
   */
  private showResultModal(data: UploadResultData, redirectOnClose = false): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: FRAC_DIALOG_SIZES.mapResult,
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data,
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (redirectOnClose && data.type === 'success') {
          this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
        }
      })
  }

  /**
   * Handles the user clicking the Home or Back button. Warns them if they have unsaved changes before leaving.
   */
  onHomeClick(): void {
    if (this.isSaving) {
      return
    }

    if (!this.hasUnsavedChanges) {
      this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
      return
    }

    const dialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: FRAC_DIALOG_SIZES.unsavedChanges,
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'unsaved-changes-dialog',
      data: {
        title: 'You Have Unsaved Changes',
        message: 'You’re about to return to the home screen. Any unsaved changes will be lost.',
        continueLabel: 'Continue',
        cancelLabel: 'Cancel',
      },
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((action: 'continue' | 'cancel' | undefined) => {
        if (action === 'continue') {
          this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
        }
      })
  }
}
