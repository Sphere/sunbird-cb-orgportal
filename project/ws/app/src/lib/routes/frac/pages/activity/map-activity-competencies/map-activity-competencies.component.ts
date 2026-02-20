import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
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
import { transformActivities, transformCompetencies } from '../../../utils/common.util'
import { CustomSnackbarService } from '../../../services/custom-snackbar.service'
import { FracApiService } from '../../../services/frac-api.service'
import { UploadResultData, UploadResultModalComponent } from '../../../components/upload-result-modal/upload-result-modal.component'

interface ActivityCompetencyApiRequestItem {
  parentEntityType: 'Activity'
  parentEntityCode: string
  childEntityType: 'Competency'
  childEntityCode: string
  competencies: number[]
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
  ) { }

  readonly languages = ['English', 'Hindi', 'Kannada', 'Tamil']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true
  isSaving = false

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

  private activitySearch$ = new Subject<string>()
  private competencySearch$ = new Subject<string>()
  private destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.setupSearchStreams()
    this.resetInitialView()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private setupSearchStreams(): void {
    this.activitySearch$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchActivities(keyword))

    this.competencySearch$
      .pipe(
        debounceTime(500),
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

  private resetInitialView(): void {
    this.activitiesData = []
    this.activities = []
    this.filteredActivities = []

    this.clearCompetencies()
    this.selectedMap = {}
    this.selectedCompetencies = []
    this.selectedActivity = null
    this.expandedActivity = null
    this.updatedActivities = []
  }

  // ---------------------------------------------------------------------------
  // API Search Integration
  // ---------------------------------------------------------------------------

  private fetchActivities(keyword: string): void {
    this.fracApiService.searchEntities('activity', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        const entityList = this.extractEntityList(res)
        const transformed = transformActivities(entityList)

        this.activitiesData = transformed
        this.activities = [...transformed]
        this.filteredActivities = [...transformed]

        if (this.selectedActivity) {
          const matchingActivity = transformed.find(a => a.code === this.selectedActivity!.code)
          if (!matchingActivity) {
            this.selectedActivity = null
            this.selectedMap = {}
            this.selectedCompetencies = []
            this.clearCompetencies()
          }
        }
      },
      error: (err) => {
        console.error('Failed to fetch activities', err)
        this.activitiesData = []
        this.activities = []
        this.filteredActivities = []
      },
    })
  }

  private fetchCompetencies(keyword: string): void {
    this.fracApiService.searchEntities('competency', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        const entityList = this.extractEntityList(res)
        const transformed = transformCompetencies(entityList)

        this.competencyData = transformed
        this.competencies = [...transformed]
        this.filteredCompetencies = [...transformed]
        this.levels = this.extractLevels(transformed)
      },
      error: (err) => {
        console.error('Failed to fetch competencies', err)
        this.clearCompetencies()
      },
    })
  }

  private extractEntityList(response: any): any[] {
    if (!response) return []
    if (Array.isArray(response)) return response

    const entityList =
      response?.result?.entity ||
      response?.result?.data?.entity ||
      response?.data?.entity ||
      response?.entity

    return Array.isArray(entityList) ? entityList : []
  }

  private clearCompetencies(): void {
    this.competencyData = []
    this.competencies = []
    this.filteredCompetencies = []
    this.levels = []
  }

  private extractLevels(competencies: Competency[]): string[] {
    if (!competencies.length || !competencies[0].levels) return []
    return competencies[0].levels.map((l: any) => l.level)
  }

  // ---------------------------------------------------------------------------
  // Language Dropdown
  // ---------------------------------------------------------------------------

  toggleDropdown(): void {
    this.isOpen = !this.isOpen
  }

  selectLanguage(lang: string, event: MouseEvent): void {
    event.stopPropagation()
    if (!this.languages.includes(lang)) return

    this.selectedLanguage = lang
    this.isOpen = false

    // Re-run activity search in selected language (or keep empty state on no search)
    if (this.activitySearchTerm) {
      this.activitySearch$.next(this.activitySearchTerm)
    } else {
      this.activitiesData = []
      this.activities = []
      this.filteredActivities = []
      this.selectedActivity = null
      this.selectedMap = {}
      this.selectedCompetencies = []
    }

    // Competency search depends on selected activity and query.
    if (this.selectedActivity && this.competencySearchTerm) {
      this.competencySearch$.next(this.competencySearchTerm)
    } else {
      this.clearCompetencies()
    }
  }

  // ---------------------------------------------------------------------------
  // Activity Selection
  // ---------------------------------------------------------------------------

  expand(activity: Activity): void {
    this.expandedActivity = this.expandedActivity === activity ? null : activity
  }

  onActivitySelected(activity: Activity): void {
    if (!activity.code) return

    const typed = activity as Activity & { competencyDetails?: ActivityCompetencyDetail[] }
    this.selectedActivity = typed
    this.restoreSelectedMapFromActivity(typed)

    // As requested: competency search depends on selected activity.
    // Keep competency section in empty state until user searches.
    this.clearCompetencies()
  }

  onActivitySearch(keyword: string): void {
    this.activitySearchTerm = keyword.trim()
    this.activitySearch$.next(this.activitySearchTerm)
  }

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

  // ---------------------------------------------------------------------------
  // Competency Table Events
  // ---------------------------------------------------------------------------

  onCompetencySearch(keyword: string): void {
    this.competencySearchTerm = keyword.trim()

    if (!this.selectedActivity) {
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

  onAddCompetencyToActivity($event: Event): void {
    console.log('Add competency event:', $event)
    if (!this.selectedActivity) {
      this.snackbar.warning('Please select an activity first !!')
      return
    }
    if (!this.selectedActivity.competencyDetails)
      this.selectedActivity.competencyDetails = []

    this.transformSelectedCompetencies()
    const hasSelectedLevels =
      Object.values(this.selectedMap).some((levels: any) => levels.length > 0)
    const activityAlreadyHadCompetencies =
      this.selectedActivity.competencyDetails.length > 0

    if (!hasSelectedLevels && !activityAlreadyHadCompetencies) {
      this.snackbar.warning('Please select at least one competency level to map !!')
      return
    }

    this.removeDeselected()
    this.updateOrInsertSelected()
    this.refreshActivitiesState()
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

    const updatedSelectedActivity: Activity & { competencyDetails?: ActivityCompetencyDetail[] } = {
      ...this.selectedActivity,
      code: this.selectedActivity.code,
      title: this.selectedActivity.title,
    }

    this.activities = this.activities.map(a =>
      a.code === updatedSelectedActivity.code ? updatedSelectedActivity : a,
    )

    this.filteredActivities = this.filteredActivities.map(a =>
      a.code === updatedSelectedActivity.code ? updatedSelectedActivity : a,
    )

    this.updatedActivities = this.activities
      .filter((a): a is Activity & { competencyDetails: ActivityCompetencyDetail[] } =>
        !!(a as any).competencyDetails?.length,
      )
      .map(a => a as Activity & { competencyDetails: ActivityCompetencyDetail[] })
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

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

        const mappedPairs = this.extractMappedPairs(res, payload)
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Activity to competency mappings were saved successfully.',
          errorDetails: mappedPairs.join('\n'),
        }
        this.showResultModal(successData)
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
    const payload: ActivityCompetencyApiRequestItem[] = []

    for (const activity of this.updatedActivities) {
      for (const detail of activity.competencyDetails ?? []) {
        if (!detail?.code) continue

        payload.push({
          parentEntityType: 'Activity',
          parentEntityCode: activity.code,
          childEntityType: 'Competency',
          childEntityCode: detail.code,
          competencies: this.extractCompetencyLevels(detail.levels),
        })
      }
    }

    return payload
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

  private extractMappedPairs(response: any, fallbackPayload: ActivityCompetencyApiRequestItem[]): string[] {
    const resultArray = Array.isArray(response?.result) ? response.result : []
    const source = resultArray.length ? resultArray : fallbackPayload

    return source
      .map((item: any) => {
        const parentCode = item?.parentEntityCode || ''
        const childCode = item?.childEntityCode || ''
        const competencies = Array.isArray(item?.competencies) ? item.competencies : []
        const levelsText = competencies.length ? ` [L${competencies.join(',L')}]` : ''
        return `${parentCode} <=> ${childCode}${levelsText}`
      })
      .filter(Boolean)
  }

  private showResultModal(data: UploadResultData): void {
    this.dialog.open(UploadResultModalComponent, {
      width: '440px',
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data,
    })
  }
}
