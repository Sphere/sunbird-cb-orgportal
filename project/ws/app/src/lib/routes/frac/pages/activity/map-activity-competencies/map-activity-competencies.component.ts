import { Component, OnInit } from '@angular/core'
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
import mockCompentencyRes from '../../../mock-api-response/mockCompentencyRes.json'
import mockAcitivityRes from '../../../mock-api-response/mockActivityRes.json'
import { CustomSnackbarService } from '../../../services/custom-snackbar.service'



interface MappingRequestItem {
  type: 'ACTIVITY_COMPETENCY_LEVEL'
  parentId: string
  childMap: SelectedMap
  childIds: string[] | null
}

interface MappingRequestPayload {
  request: MappingRequestItem[]
}

interface RuntimeApiResponse<T> {
  entity?: T
}

@Component({
  selector: 'ws-app-map-activitiy-competencies',
  templateUrl: './map-activity-competencies.component.html',
  styleUrls: ['./map-activity-competencies.component.scss'],
})
export class MapActivityCompetenciesComponent implements OnInit {
  constructor(private snackbar: CustomSnackbarService) { }
  readonly languages = ['English', 'Hindi', 'Kannada']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true

  apiResponse?: RuntimeApiResponse<unknown>

  levels: string[] = []

  competencyData: Competency[] = []
  competencies: Competency[] = []
  filteredCompetencies: Competency[] = []

  activitiesData: Activity[] = []
  activities: any[] = []
  filteredActivities: Activity[] = []

  selectedMap: SelectedMap = {}
  selectedCompetencies: SelectedCompetencySummary[] = []

  expandedActivity: Activity | null = null
  selectedActivity: (Activity & { competencyDetails?: ActivityCompetencyDetail[] }) | null = null

  updatedActivities: (Activity & { competencyDetails?: ActivityCompetencyDetail[] })[] = []

  ngOnInit(): void {
    this.loadActivities()
    this.loadCompetencies()
  }

  // ---------------------------------------------------------------------------
  // Load Competencies
  // ---------------------------------------------------------------------------

  private loadCompetencies(): void {
    try {
      const mockEnvelope = mockCompentencyRes
      const apiEntity = mockEnvelope.result?.data?.entity ?? this.apiResponse?.entity

      if (!apiEntity) {
        console.warn('No competency data available')
        return
      }

      const transformed = transformCompetencies(apiEntity)
      this.competencyData = transformed
      this.filteredCompetencies = [...transformed]

      this.levels = this.extractLevels(transformed)
    } catch (err) {
      console.error('Failed to load competencies', err)
      this.competencyData = []
      this.filteredCompetencies = []
      this.levels = []
    }
  }

  private extractLevels(competencies: Competency[]): string[] {
    if (!competencies.length || !competencies[0].levels) return []
    return competencies[0].levels.map(l => l.level)
  }

  // ---------------------------------------------------------------------------
  // Load Activities
  // ---------------------------------------------------------------------------

  private loadActivities(): void {
    try {
      const mockEnvelope = mockAcitivityRes

      const apiEntity = mockEnvelope.result?.data?.entity

      if (!apiEntity) {
        console.warn('No activities data available')
        return
      }

      const transformed = transformActivities(apiEntity)
      this.activitiesData = transformed
      this.activities = [...transformed]
      this.filteredActivities = [...transformed]
    } catch (err) {
      console.error('Failed to load activities', err)
      this.activitiesData = []
      this.activities = []
      this.filteredActivities = []
    }
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

    this.competencies = [...this.competencyData]
    this.levels = this.extractLevels(this.competencyData)
  }

  onActivitySearch(keyword: string): void {
    const value = keyword.trim().toLowerCase()
    if (!value) {
      this.filteredActivities = [...this.activitiesData]
      this.activities = [...this.activitiesData]
      return
    }

    this.filteredActivities = this.activitiesData.filter(
      a =>
        a.code.toLowerCase().includes(value) ||
        a.title.toLowerCase().includes(value),
    )

    this.activities = [...this.filteredActivities]
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
  }

  // ---------------------------------------------------------------------------
  // Competency Table Events
  // ---------------------------------------------------------------------------

  onCompetencySearch(keyword: string): void {
    const value = keyword.trim().toLowerCase()

    if (!value) {
      this.filteredCompetencies = [...this.competencyData]
      this.competencies = [...this.competencyData]
      this.levels = this.extractLevels(this.competencyData)
      return
    }

    this.filteredCompetencies = this.competencyData.filter(
      c =>
        c.code.toLowerCase().includes(value) ||
        c.label.toLowerCase().includes(value),
    )

    this.competencies = [...this.filteredCompetencies]
    this.levels = this.extractLevels(this.filteredCompetencies)
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
      this.snackbar.warning("Please select an activity first !!")
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
      this.snackbar.warning("Please select at least one competency level to map !!")
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

    this.activities = this.activities.map(a =>
      a.code === this.selectedActivity!.code ? { ...this.selectedActivity } : a,
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
    const payload = this.buildPayload()

    if (!payload.request.length) {
      console.warn('Nothing to save')
      return
    }

    console.log('Payload:', payload)
  }

  private buildPayload(): MappingRequestPayload {
    return {
      request: this.updatedActivities.map(a => ({
        type: 'ACTIVITY_COMPETENCY_LEVEL',
        parentId: a.code,
        childMap: this.buildChildMap(a),
        childIds: null,
      })),
    }
  }

  private buildChildMap(activity: Activity & { competencyDetails?: ActivityCompetencyDetail[] }): SelectedMap {
    const map: SelectedMap = {}

    for (const detail of activity.competencyDetails ?? []) {
      const { code, levels } = detail
      if (!code || !levels) continue

      map[code] = []

      if (levels.includes('-')) {
        const [s, e] = levels.split('-')
        for (let i = Number(s.replace('L', '')); i <= Number(e.replace('L', '')); i++)
          map[code].push(`${code}_L${i}`)
      } else {
        levels
          .split(',')
          .map(l => l.trim())
          .forEach(l => map[code].push(`${code}_L${l}`))
      }
    }

    return map
  }
}
