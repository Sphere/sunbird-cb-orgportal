import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'
import { UploadResultData, UploadResultModalComponent } from '../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../components/unsaved-changes-modal/unsaved-changes-modal.component'
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
    private router: Router,
  ) { }

  // language
  readonly languages = ['English', 'Hindi', 'Kannada', 'Tamil']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true
  isSaving = false
  isPositionsLoading = false
  isRolesLoading = false
  isPositionRoleMappingLoading = false
  hasUnsavedChanges = false

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
  private readonly positionRoleMappingCache = new Map<string, PositionRoleDetail[]>()
  private readonly positionDraftStore = new Map<string, PositionRoleDetail[]>()
  private activePositionRoleMappingRequestKey: string | null = null

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
    this.isPositionsLoading = true
    this.fracApiService.searchEntities('position', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isPositionsLoading = false
        const apiEntity = this.extractEntityList(res)
        const transformed = transformPositions(apiEntity) as PositionItem[]
        const hydrated = transformed.map((position) => {
          const details = this.getHydratedPositionRoleDetails(position.code)
          return details ? { ...position, roleDetails: details } : position
        })

        this.positionsData = hydrated
        this.positions = [...hydrated]
        this.filteredPositions = [...hydrated]

        if (this.selectedPosition) {
          const hasSearchKeyword = !!keyword.trim()
          const matched = hydrated.find(p => p.code === this.selectedPosition!.code)
          if (!matched) {
            if (hasSearchKeyword) {
              return
            }
            this.selectedPosition = null
            this.selectedRoleMap = {}
            this.selectedRoleSummary = []
          } else {
            this.selectedPosition = matched
            this.applyMappedRolesToPosition(matched, matched.roleDetails || [])
          }
        }
      },
      error: (e) => {
        this.isPositionsLoading = false
        console.error('Failed to load positions', e)
        this.positionsData = []
        this.positions = []
        this.filteredPositions = []
      },
    })
  }

  private fetchRoles(keyword: string): void {
    this.isRolesLoading = true
    this.fracApiService.searchEntities('role', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isRolesLoading = false
        const apiEntity = this.extractEntityList(res)
        const transformed = transformRoles(apiEntity) as RoleItem[]

        this.rolesData = transformed
        this.roles = [...transformed]
        this.filteredRoles = [...transformed]

        this.buildSelectedRoleSummary()
      },
      error: (e) => {
        this.isRolesLoading = false
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
    this.activePositionRoleMappingRequestKey = null

    this.positionSearch$.next(this.positionSearchTerm)
    this.roleSearch$.next(this.roleSearchTerm)

    if (this.selectedPosition?.code) {
      this.loadPositionRoleMappings(this.selectedPosition)
    }
  }

  // ---------------------------------------------------------------------------
  // Positions (left pane)
  // ---------------------------------------------------------------------------
  onPositionSearch(keyword: string): void {
    this.positionSearchTerm = keyword.trim()
    this.positionSearch$.next(this.positionSearchTerm)
  }

  onPositionSearchSubmit(keyword: string): void {
    this.positionSearchTerm = keyword.trim()
    this.fetchPositions(this.positionSearchTerm)
  }

  onPositionSelected(position: PositionItem): void {
    this.selectedPosition = position
    this.selectedRoleMap = {}
    this.selectedRoleSummary = []
    this.loadPositionRoleMappings(position)
  }

  onPositionToggleExpand(position: PositionItem): void {
    this.expandedPosition = this.expandedPosition === position ? null : position
  }

  private loadPositionRoleMappings(position: PositionItem): void {
    const requestKey = this.buildPositionMappingKey(position.code)
    this.isPositionRoleMappingLoading = true

    const draft = this.positionDraftStore.get(requestKey)
    if (draft) {
      this.applyMappedRolesToPosition(position, draft)
      this.isPositionRoleMappingLoading = false
      return
    }

    const cached = this.positionRoleMappingCache.get(requestKey)
    if (cached) {
      this.applyMappedRolesToPosition(position, cached)
      this.isPositionRoleMappingLoading = false
      return
    }

    if (this.activePositionRoleMappingRequestKey === requestKey) {
      this.isPositionRoleMappingLoading = false
      return
    }

    this.activePositionRoleMappingRequestKey = requestKey

    this.fracApiService.searchEntityMapping('position', position.code, this.selectedLanguage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (this.activePositionRoleMappingRequestKey === requestKey) {
            this.activePositionRoleMappingRequestKey = null
          }

          if (this.selectedPosition?.code !== position.code || this.buildPositionMappingKey(position.code) !== requestKey) {
            return
          }
          this.isPositionRoleMappingLoading = false
          const mappedRoles = this.extractMappedRoles(res)
          this.positionRoleMappingCache.set(requestKey, this.cloneRoleDetails(mappedRoles))
          this.applyMappedRolesToPosition(position, mappedRoles)
        },
        error: (err) => {
          if (this.activePositionRoleMappingRequestKey === requestKey) {
            this.activePositionRoleMappingRequestKey = null
          }

          if (this.selectedPosition?.code !== position.code || this.buildPositionMappingKey(position.code) !== requestKey) {
            return
          }
          this.isPositionRoleMappingLoading = false
          console.error('Failed to load position mappings', err)
          this.selectedRoleMap = {}
          this.selectedRoleSummary = []
          this.snackbar.error('Unable to fetch existing position mappings.')
        },
      })
  }

  private extractMappedRoles(response: any): PositionRoleDetail[] {
    const result = Array.isArray(response?.result) ? response.result : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy
      .filter((child: any) => (child?.entityType || '').toLowerCase() === 'role')
      .map((child: any) => ({
        code: (child?.entityCode || '').trim(),
        label: child?.entityName || '',
      }))
      .filter((item: PositionRoleDetail) => !!item.code)
  }

  private applyMappedRolesToPosition(position: PositionItem, mappedRoles: PositionRoleDetail[]): void {
    const roleDetails: PositionRoleDetail[] = mappedRoles.map((mapped) => ({
      code: mapped.code,
      label: mapped.label || '',
    }))

    this.applyPositionDetailsToCollections(position.code, position.title, roleDetails)

    if (this.selectedPosition?.code === position.code) {
      this.selectedPosition = {
        ...this.selectedPosition,
        roleDetails: this.cloneRoleDetails(roleDetails),
      }
    }

    position.roleDetails = roleDetails
    this.selectedRoleMap = {}
    roleDetails.forEach((detail) => {
      this.selectedRoleMap[detail.code] = true
    })
    this.selectedRoleSummary = [...roleDetails]

    const shouldKeepSearchedList = !!this.roleSearchTerm
    if (shouldKeepSearchedList) {
      this.roleSearch$.next(this.roleSearchTerm)
      return
    }

    const mappedList: RoleItem[] = roleDetails.map((role) => ({
      code: role.code,
      title: role.label,
    }))
    this.rolesData = [...mappedList]
    this.roles = [...mappedList]
    this.filteredRoles = [...mappedList]
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
      const existing = this.selectedPosition?.roleDetails?.find(r => r.code === code)
      result.push({
        code,
        label: meta?.title || existing?.label || '',
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
    this.hasUnsavedChanges = true

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

    const normalizedRoleDetails = this.cloneRoleDetails(this.selectedPosition.roleDetails || [])
    const updatedSelectedPosition: PositionItem = {
      ...this.selectedPosition,
      code: this.selectedPosition.code,
      title: this.selectedPosition.title,
      roleDetails: normalizedRoleDetails,
    }

    this.selectedPosition = updatedSelectedPosition
    this.applyPositionDetailsToCollections(updatedSelectedPosition.code, updatedSelectedPosition.title, normalizedRoleDetails)
    this.setPositionDraft(updatedSelectedPosition.code, normalizedRoleDetails)
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
        this.hasUnsavedChanges = false
        this.positionDraftStore.clear()
        this.syncUpdatedPositionsFromDraftStore()

        const mappedPairs = this.extractMappedPairs(res, payload)
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Position to role mappings were saved successfully.',
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
    const mappedPairs = new Set<string>()

    for (const [key, roleDetails] of this.positionDraftStore.entries()) {
      const positionCode = this.extractEntityCodeFromMappingKey(key)
      if (!positionCode) continue

      for (const roleDetail of roleDetails) {
        const childCode = (roleDetail?.code || '').trim()
        if (!childCode) continue

        const pairKey = `${positionCode}::${childCode}`
        if (mappedPairs.has(pairKey)) {
          continue
        }
        mappedPairs.add(pairKey)

        payload.push({
          parentEntityType: 'Position',
          parentEntityCode: positionCode,
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

  private buildPositionMappingKey(positionCode: string): string {
    return `${this.selectedLanguage.trim().toLowerCase()}::${(positionCode || '').trim()}`
  }

  private extractEntityCodeFromMappingKey(key: string): string {
    const separator = '::'
    const separatorIndex = key.indexOf(separator)
    if (separatorIndex === -1) {
      return key
    }

    return key.slice(separatorIndex + separator.length)
  }

  private cloneRoleDetails(details: PositionRoleDetail[]): PositionRoleDetail[] {
    return (details || [])
      .filter((detail) => !!detail?.code)
      .map((detail) => ({
        code: detail.code,
        label: detail.label || '',
      }))
  }

  private getHydratedPositionRoleDetails(positionCode: string): PositionRoleDetail[] | null {
    const key = this.buildPositionMappingKey(positionCode)
    const draftDetails = this.positionDraftStore.get(key)
    if (draftDetails) {
      return this.cloneRoleDetails(draftDetails)
    }

    const mappedDetails = this.positionRoleMappingCache.get(key)
    if (mappedDetails) {
      return this.cloneRoleDetails(mappedDetails)
    }

    return null
  }

  private applyPositionDetailsToCollections(positionCode: string, positionTitle: string, details: PositionRoleDetail[]): void {
    const positionUpdater = (position: PositionItem): PositionItem => {
      if (position.code !== positionCode) {
        return position
      }

      return {
        ...position,
        title: positionTitle || position.title,
        roleDetails: this.cloneRoleDetails(details),
      }
    }

    this.positions = this.positions.map(positionUpdater)
    this.positionsData = this.positionsData.map(positionUpdater)
    this.filteredPositions = this.filteredPositions.map(positionUpdater)
  }

  private setPositionDraft(positionCode: string, details: PositionRoleDetail[]): void {
    const key = this.buildPositionMappingKey(positionCode)
    const normalizedDetails = this.cloneRoleDetails(details)

    if (normalizedDetails.length) {
      this.positionDraftStore.set(key, normalizedDetails)
    } else {
      this.positionDraftStore.delete(key)
    }

    this.positionRoleMappingCache.set(key, normalizedDetails)
    this.syncUpdatedPositionsFromDraftStore()
  }

  private syncUpdatedPositionsFromDraftStore(): void {
    const positionMap = new Map<string, PositionRoleDetail[]>()

    for (const [key, details] of this.positionDraftStore.entries()) {
      const positionCode = this.extractEntityCodeFromMappingKey(key)
      if (!positionCode || !details.length) continue
      positionMap.set(positionCode, this.cloneRoleDetails(details))
    }

    this.updatedPositions = Array.from(positionMap.entries()).map(([code, roleDetails]) => {
      const metadata =
        this.positionsData.find(position => position.code === code) ||
        this.positions.find(position => position.code === code) ||
        this.filteredPositions.find(position => position.code === code)

      return {
        code,
        title: metadata?.title || code,
        roleDetails,
      }
    })
  }

  private extractMappedPairs(response: any, fallbackPayload: PositionRoleApiRequestItem[]): string[] {
    const resultArray = Array.isArray(response?.result) ? response.result : []
    const source = resultArray.length ? resultArray : fallbackPayload

    return source
      .map((item: any) => {
        const parentCode = item?.parentEntityCode || ''
        const childCode = item?.childEntityCode || ''
        return `${parentCode} <=> ${childCode}`
      })
      .filter(Boolean)
  }

  private showResultModal(data: UploadResultData, redirectOnClose = false): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: '440px',
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data,
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (redirectOnClose && data.type === 'success') {
          this.router.navigateByUrl('/app/home/frac/dashboard')
        }
      })
  }

  onHomeClick(): void {
    if (this.isSaving) {
      return
    }

    if (!this.hasUnsavedChanges) {
      this.router.navigateByUrl('/app/home/frac/dashboard')
      return
    }

    const dialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: '363px',
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
          this.router.navigateByUrl('/app/home/frac/dashboard')
        }
      })
  }
}
