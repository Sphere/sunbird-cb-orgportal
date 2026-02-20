import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'
import { UploadResultData, UploadResultModalComponent } from '../../components/upload-result-modal/upload-result-modal.component'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { FracApiService } from '../../services/frac-api.service'
import { transformRoles, transformPositions } from '../../utils/common.util'

interface PositionRoleDetail {
  code: string
  label: string
}

interface PositionItem {
  code: string
  title: string
  expanded?: boolean
  roleDetails?: PositionRoleDetail[]
}

interface RoleItem {
  code: string
  title: string
}

interface PositionRoleApiRequestItem {
  parentEntityType: 'Position'
  parentEntityCode: string
  childEntityType: 'Role'
  childEntityCode: string
  competencies: any[]
}

@Component({
  selector: 'ws-app-map-role-position',
  templateUrl: './map-role-position.component.html',
  styleUrls: ['./map-role-position.component.scss'],
})
export class MapRolePositionComponent implements OnInit, OnDestroy {

  constructor(
    private snackbar: CustomSnackbarService,
    private fracApiService: FracApiService,
    private dialog: MatDialog,
  ) { }

  // language
  readonly languages = ['English', 'Hindi', 'Kannada', 'Tamil']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true
  isSaving = false

  // left – positions
  positionsData: PositionItem[] = []
  positions: PositionItem[] = []
  filteredPositions: PositionItem[] = []
  selectedPosition: PositionItem | null = null
  expandedPosition: PositionItem | null = null

  // right – roles
  rolesData: RoleItem[] = []
  roles: RoleItem[] = []
  filteredRoles: RoleItem[] = []

  // selection state (for current selectedPosition)
  selectedRoleMap: { [roleCode: string]: boolean } = {}
  selectedRoleSummary: PositionRoleDetail[] = []

  // positions that have mapping changes
  updatedPositions: PositionItem[] = []

  positionSearchTerm = ''
  roleSearchTerm = ''

  private positionSearch$ = new Subject<string>()
  private roleSearch$ = new Subject<string>()
  private destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.setupSearchStreams()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private setupSearchStreams(): void {
    this.positionSearch$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchPositions(keyword))

    this.roleSearch$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchRoles(keyword))
  }

  // ---------------------------------------------------------------------------
  // API search
  // ---------------------------------------------------------------------------

  private fetchPositions(keyword: string): void {
    this.fracApiService.searchEntities('position', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        const apiEntity = this.extractEntityList(res)
        const transformed = transformPositions(apiEntity) as PositionItem[]

        this.positionsData = transformed
        this.positions = [...transformed]
        this.filteredPositions = [...transformed]

        if (this.selectedPosition) {
          const matched = transformed.find(p => p.code === this.selectedPosition!.code)
          if (!matched) {
            this.selectedPosition = null
            this.selectedRoleMap = {}
            this.selectedRoleSummary = []
          }
        }
      },
      error: (e) => {
        console.error('Failed to load positions', e)
        this.positionsData = []
        this.positions = []
        this.filteredPositions = []
      },
    })
  }

  private fetchRoles(keyword: string): void {
    this.fracApiService.searchEntities('role', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        const apiEntity = this.extractEntityList(res)
        const transformed = transformRoles(apiEntity) as RoleItem[]

        this.rolesData = transformed
        this.roles = [...transformed]
        this.filteredRoles = [...transformed]

        this.buildSelectedRoleSummary()
      },
      error: (e) => {
        console.error('Failed to load roles', e)
        this.rolesData = []
        this.roles = []
        this.filteredRoles = []
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

  // ---------------------------------------------------------------------------
  // Language dropdown
  // ---------------------------------------------------------------------------
  toggleDropdown(): void {
    this.isOpen = !this.isOpen
  }

  selectLanguage(lang: string, event: MouseEvent): void {
    event.stopPropagation()
    if (!this.languages.includes(lang)) return
    this.selectedLanguage = lang
    this.isOpen = false

    if (this.positionSearchTerm) {
      this.positionSearch$.next(this.positionSearchTerm)
    } else {
      this.positionsData = []
      this.positions = []
      this.filteredPositions = []
      this.selectedPosition = null
      this.selectedRoleMap = {}
      this.selectedRoleSummary = []
    }

    if (this.roleSearchTerm) {
      this.roleSearch$.next(this.roleSearchTerm)
    } else {
      this.rolesData = []
      this.roles = []
      this.filteredRoles = []
    }
  }

  // ---------------------------------------------------------------------------
  // Positions (left pane)
  // ---------------------------------------------------------------------------
  onPositionSearch(keyword: string): void {
    this.positionSearchTerm = keyword.trim()
    this.positionSearch$.next(this.positionSearchTerm)
  }

  onPositionSelected(position: PositionItem): void {
    this.selectedPosition = position

    // restore per-position selection map
    this.restoreSelectedRoleMapFromPosition(position)
  }

  onPositionToggleExpand(position: PositionItem): void {
    this.expandedPosition = this.expandedPosition === position ? null : position
  }

  private restoreSelectedRoleMapFromPosition(position: PositionItem): void {
    this.selectedRoleMap = {}

    if (!position.roleDetails?.length) {
      this.selectedRoleSummary = []
      return
    }

    for (const r of position.roleDetails) {
      if (!r.code) continue
      this.selectedRoleMap[r.code] = true
    }

    this.buildSelectedRoleSummary()
  }

  // ---------------------------------------------------------------------------
  // Roles (right pane)
  // ---------------------------------------------------------------------------
  onRoleSearch(keyword: string): void {
    this.roleSearchTerm = keyword.trim()
    this.roleSearch$.next(this.roleSearchTerm)
  }

  onRoleCheckChanged(event: { code: string; checked: boolean }): void {
    const { code, checked } = event
    if (!code) return

    if (checked) {
      this.selectedRoleMap[code] = true
    } else {
      delete this.selectedRoleMap[code]
    }

    this.buildSelectedRoleSummary()
  }

  private buildSelectedRoleSummary(): void {
    const result: PositionRoleDetail[] = []

    for (const code of Object.keys(this.selectedRoleMap)) {
      if (!this.selectedRoleMap[code]) continue
      const meta = this.rolesData.find(r => r.code === code)
      result.push({
        code,
        label: meta?.title ?? '',
      })
    }

    this.selectedRoleSummary = result
  }

  // ---------------------------------------------------------------------------
  // Add Roles → Position (button)
  // ---------------------------------------------------------------------------
  onAddRoleToPosition(): void {
    if (!this.selectedPosition) {
      this.snackbar.warning('Please select a position first !!')
      return
    }

    const hasSelected = Object.keys(this.selectedRoleMap).length > 0
    const positionAlreadyHadRoles = !!this.selectedPosition.roleDetails?.length

    if (!hasSelected && !positionAlreadyHadRoles) {
      this.snackbar.warning('Please select at least one role to map !!')
      return
    }

    // ensure the property exists
    if (!this.selectedPosition.roleDetails) {
      this.selectedPosition.roleDetails = []
    }

    // Rebuild summarised selection
    this.buildSelectedRoleSummary()

    this.removeDeselectedRoles()
    this.updateOrInsertRoles()
    this.refreshPositionsState()

    this.snackbar.success('Position–role mapping updated successfully.')
  }

  private removeDeselectedRoles(): void {
    if (!this.selectedPosition?.roleDetails) return

    this.selectedPosition.roleDetails =
      this.selectedPosition.roleDetails.filter(detail =>
        this.selectedRoleSummary.some(s => s.code === detail.code),
      )
  }

  private updateOrInsertRoles(): void {
    if (!this.selectedPosition) return

    for (const summary of this.selectedRoleSummary) {
      const existing = this.selectedPosition.roleDetails!.find(
        r => r.code === summary.code,
      )

      if (existing) {
        existing.label = summary.label
      } else {
        this.selectedPosition.roleDetails!.push({
          code: summary.code,
          label: summary.label,
        })
      }
    }
  }

  private refreshPositionsState(): void {
    if (!this.selectedPosition) return

    const updatedSelectedPosition: PositionItem = {
      ...this.selectedPosition,
      code: this.selectedPosition.code,
      title: this.selectedPosition.title,
    }

    this.positions = this.positions.map(p =>
      p.code === updatedSelectedPosition.code ? updatedSelectedPosition : p,
    )

    this.positionsData = this.positionsData.map(p =>
      p.code === updatedSelectedPosition.code ? updatedSelectedPosition : p,
    )

    this.filteredPositions = this.filteredPositions.map(p =>
      p.code === updatedSelectedPosition.code ? updatedSelectedPosition : p,
    )

    // Track positions that will go into payload
    this.updatedPositions = this.positions.filter(p => p.roleDetails?.length)
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  onSaveClicked(): void {
    this.syncCurrentSelectedPositionSelection()
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
          message: 'Position to role mappings were saved successfully.',
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
          'Failed to save position to role mapping.'

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

  private buildPayload(): PositionRoleApiRequestItem[] {
    const payload: PositionRoleApiRequestItem[] = []

    for (const position of this.updatedPositions) {
      const childCodes = (position.roleDetails ?? []).map(r => r.code).filter(Boolean)
      for (const childCode of childCodes) {
        payload.push({
          parentEntityType: 'Position',
          parentEntityCode: position.code,
          childEntityType: 'Role',
          childEntityCode: childCode,
          competencies: [],
        })
      }
    }

    return payload
  }

  private syncCurrentSelectedPositionSelection(): void {
    if (!this.selectedPosition) return

    if (!this.selectedPosition.roleDetails) {
      this.selectedPosition.roleDetails = []
    }

    this.buildSelectedRoleSummary()
    this.removeDeselectedRoles()
    this.updateOrInsertRoles()
    this.refreshPositionsState()
  }

  private extractMappedPairs(response: any, fallbackPayload: PositionRoleApiRequestItem[]): string[] {
    const resultArray = Array.isArray(response?.result) ? response.result : []
    const source = resultArray.length ? response.result : fallbackPayload

    return source
      .map((item: any) => {
        const parentCode = item?.parentEntityCode || ''
        const childCode = item?.childEntityCode || ''
        return `${parentCode} <=> ${childCode}`
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
