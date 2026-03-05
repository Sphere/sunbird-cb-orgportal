import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupResult } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracResponseParserUtil } from '../../../utils/frac-response-parser.util'
import { extractEntityList, sortEntitiesForDisplay, getLanguageCode } from '../../../utils/common.util'
import { fracLogger } from '../../../utils/frac-logger.util'
import { FracApiService } from '../../../services/frac-api.service'
import {
  FracEntityUploadOrchestratorService,
  UploadRouteMode,
  UploadSearchSource,
  UploadSearchTriggerPayload,
} from '../../../services/frac-entity-upload-orchestrator.service'
import { forkJoin, of, Subject, Subscription } from 'rxjs'
import { catchError, map, takeUntil } from 'rxjs/operators'
import { FRAC_UI_CONFIG } from '../../../models/ui.config.model'
import { FRAC_DIALOG_SIZES, FRAC_ROUTES, FRAC_UPLOAD_PAGE_SPINNER } from '../../../constants/frac.constants'
import { buildFracUploadPopupConfig, getFracSampleTemplateUrl } from '../../../utils/frac-upload-ui.util'
import { FracHierarchyNode, FracHierarchyResponse } from '../../../models/frac-api.models'
import {
  HierarchyChipDetailsModalComponent,
  HierarchyChipType,
  HierarchyDetailItem,
} from '../../../components/hierarchy-chip-details-modal/hierarchy-chip-details-modal.component'
import {
  PositionHierarchyViewModalComponent,
  PositionHierarchyViewModalData,
} from '../../../components/position-hierarchy-view-modal/position-hierarchy-view-modal.component'
import { buildPositionMappingTree } from '../../../utils/common.util'

interface UploadEmptyStateConfig {
  icon: string
  title: string
  message: string
  suggestion: string
}

interface PositionHierarchyCounts {
  role: number
  activity: number
  competency: number
}

interface PositionHierarchyDetails {
  role: HierarchyDetailItem[]
  activity: HierarchyDetailItem[]
  competency: HierarchyDetailItem[]
}

interface PositionHierarchyAggregate {
  counts: PositionHierarchyCounts
  details: PositionHierarchyDetails
}

@Component({
  selector: 'ws-app-position-upload',
  templateUrl: './position-upload.component.html',
  styleUrls: ['./position-upload.component.scss']
})
export class PositionUploadComponent implements OnInit, OnDestroy {

  constructor(
    private dialog: MatDialog,
    private fracApiService: FracApiService,
    private tableTransformUtil: TableTransformUtil,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private uploadOrchestrator: FracEntityUploadOrchestratorService,
  ) { }

  // ============= UI CONFIG =============
  uiConfig = FRAC_UI_CONFIG

  // ============= ROUTE STATE =============

  /**
   * Route mode:
   * - 'card'   → card grid (sidebar / no query param)
   * - 'manage' → role-like table manage (?mode=manage)
   * - 'upload' → upload flow (?mode=upload)
   */
  routeMode: UploadRouteMode | 'card' = 'card'

  /** Shows search & language on card grid only when accessed via explicit ?mode=manage from dashboard card */
  showManageSearch = false

  // ============= TABLE STATE =============

  /** Original table data for comparison */
  originalRowData: any[] = []

  /** Data removed via UI */
  removedData: any[] = []

  /** Table configuration with columns and data */
  tableConfig: ITableConfig = { columns: [], data: [] }

  /** Rows selected in table */
  selectedRows: any[] = []

  // ============= UI STATE =============

  /** Enable/disable edit mode */
  isEditing = false

  /** Button text changes based on mode */
  uploadButtonText: string = 'Upload File'

  /** Search and filter */
  searchTerm = ''
  searchResults: any[] = []

  /** Language selection */
  selectedLanguage = this.uploadOrchestrator.languages[0]
  languages = this.uploadOrchestrator.languages
  readonly uploadPageSpinner = FRAC_UPLOAD_PAGE_SPINNER
  isOpen = false
  readonly uploadEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'upload_file',
    title: 'No file uploaded yet',
    message: 'Upload your position file to preview the records.',
    suggestion: 'Choose a language and download the appropriate sample template.',
  }
  readonly noResultEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'search_off',
    title: 'No results found',
    message: 'No position records match the selected filters.',
    suggestion: 'Try a different search keyword or language.',
  }

  /** Shimmer placeholder cards shown while card grid is loading. Count is config-driven. */
  readonly shimmerCardCount = 15
  readonly shimmerCards = Array.from({ length: this.shimmerCardCount })
  readonly defaultHierarchyCounts: PositionHierarchyCounts = { role: 0, activity: 0, competency: 0 }
  readonly defaultHierarchyDetails: PositionHierarchyDetails = { role: [], activity: [], competency: [] }
  positionHierarchyCountMap: Record<string, PositionHierarchyCounts> = {}
  positionHierarchyDetailMap: Record<string, PositionHierarchyDetails> = {}


  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false
  isSearching = false
  isUpdating = false
  isDeleting = false
  apiResponse: any = null

  // ============= INTERNAL STATE =============

  private searchTrigger$ = new Subject<UploadSearchTriggerPayload>()
  private searchSubscription: Subscription | null = null
  private destroy$ = new Subject<void>()
  private baselineTableSignature = ''
  private baselineRowSignatureByCode = new Map<string, string>()
  private hierarchyAggregateCache = new Map<string, PositionHierarchyAggregate>()
  private hierarchyRawResponseCache = new Map<string, import('../../../models/frac-api.models').FracHierarchyResponse>()
  private hierarchyRequestToken = 0

  // ============= LIFECYCLE =============

  ngOnInit(): void {
    this.uploadOrchestrator.bindSearchTriggerStream(
      this.searchTrigger$,
      this.destroy$,
      (keyword, language) => this.fetchEntitiesForTable(keyword, language),
    )

    this.activatedRoute.queryParams.subscribe(queryParams => {
      const rawMode = queryParams['mode']
      if (rawMode === 'upload') {
        // Upload flow
        this.routeMode = 'upload'
        this.showManageSearch = false
      } else if (rawMode === 'manage') {
        // Explicit ?mode=manage -> role-like table manage
        this.routeMode = 'manage'
        this.showManageSearch = false
      } else {
        // No query param -> sidebar/home layout -> card grid
        this.routeMode = 'card'
        this.showManageSearch = false
      }
      this.updateButtonText()
      this.loadTableDataBasedOnMode()
    })
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe()
    this.destroy$.next()
    this.destroy$.complete()
  }

  // ============= TABLE INITIALIZATION =============

  loadTableDataBasedOnMode(): void {
    if (this.routeMode === 'card' || this.routeMode === 'manage') {
      this.triggerSearch('init')
    } else {
      this.tableConfig = { columns: [], data: [] }
      this.originalRowData = []
      this.selectedRows = []
      this.removedData = []
      this.isEditing = false
      this.captureBaselineTableState()
    }
  }

  // ============= BUTTON & UI STATE =============

  updateButtonText(): void {
    const mode = this.routeMode === 'card' ? 'manage' : this.routeMode
    this.uploadButtonText = this.uploadOrchestrator.resolveUploadButtonText(mode)
  }

  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
  }

  hasPendingTableChanges(): boolean {
    if (this.routeMode !== 'manage') {
      return false
    }
    return this.uploadOrchestrator.computeTableSignature(this.tableConfig.data as Array<Record<string, unknown>>) !== this.baselineTableSignature
  }

  // ============= SEARCH & FILTER =============

  onSearchTermChange(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('typing')
  }

  onSearch(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('icon')
  }

  onSearchEnter(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('enter')
  }

  private triggerSearch(source: UploadSearchSource): void {
    this.searchTrigger$.next(this.uploadOrchestrator.buildSearchPayload(this.searchTerm, this.selectedLanguage, source))
  }

  private fetchEntitiesForTable(keyword: string, language: string = this.selectedLanguage): void {
    this.searchSubscription?.unsubscribe()
    this.isSearching = true

    this.searchSubscription = this.fracApiService
      .searchEntities('position', keyword, language)
      .subscribe({
        next: (res) => {
          this.isSearching = false
          const entityList = extractEntityList(res)
          const sortedEntityList = sortEntitiesForDisplay(entityList)
          this.searchResults = sortedEntityList
          this.originalRowData = sortedEntityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(sortedEntityList)
          this.selectedRows = []
          this.removedData = []
          this.isEditing = false
          this.loadHierarchyCountsForCardPositions(sortedEntityList, language)
          this.captureBaselineTableState()
        },
        error: (err) => {
          this.isSearching = false
          this.positionHierarchyCountMap = {}
          this.positionHierarchyDetailMap = {}
          fracLogger.error('Position search failed', err)
        }
      })
  }

  private loadHierarchyCountsForCardPositions(positions: any[], language: string): void {
    if (this.routeMode !== 'card') {
      this.positionHierarchyCountMap = {}
      this.positionHierarchyDetailMap = {}
      return
    }

    const validPositions = (positions || []).filter((pos) => !!this.normalizeEntityCode(pos?.code))
    if (!validPositions.length) {
      this.positionHierarchyCountMap = {}
      this.positionHierarchyDetailMap = {}
      return
    }

    const requestToken = ++this.hierarchyRequestToken
    const requests = validPositions.map((position) => {
      const code = this.normalizeEntityCode(position?.code)
      const cacheKey = this.getHierarchyCacheKey(code, language)
      const cachedAggregate = this.hierarchyAggregateCache.get(cacheKey)

      if (cachedAggregate) {
        return of({ code, aggregate: cachedAggregate })
      }

      return this.fracApiService.searchEntityHierarchy('position', code, language).pipe(
        map((response) => {
          const aggregate = this.extractHierarchyAggregateFromResponse(response)
          this.hierarchyAggregateCache.set(cacheKey, aggregate)
          this.hierarchyRawResponseCache.set(cacheKey, response)
          return { code, aggregate }
        }),
        catchError(() => of({
          code,
          aggregate: { counts: this.defaultHierarchyCounts, details: this.defaultHierarchyDetails },
        })),
      )
    })

    forkJoin(requests).subscribe((results) => {
      if (requestToken !== this.hierarchyRequestToken) {
        return
      }

      const nextMap: Record<string, PositionHierarchyCounts> = {}
      const nextDetailsMap: Record<string, PositionHierarchyDetails> = {}
      results.forEach((item) => {
        nextMap[item.code] = item.aggregate.counts
        nextDetailsMap[item.code] = item.aggregate.details
      })
      this.positionHierarchyCountMap = nextMap
      this.positionHierarchyDetailMap = nextDetailsMap
    })
  }

  getPositionHierarchyCounts(position: Record<string, unknown>): PositionHierarchyCounts {
    const code = this.normalizeEntityCode(position?.['code'])
    return this.positionHierarchyCountMap[code] || this.defaultHierarchyCounts
  }

  private getPositionHierarchyDetails(position: Record<string, unknown>): PositionHierarchyDetails {
    const code = this.normalizeEntityCode(position?.['code'])
    return this.positionHierarchyDetailMap[code] || this.defaultHierarchyDetails
  }

  onCountChipClick(position: Record<string, unknown>, chipType: HierarchyChipType): void {
    const details = this.getPositionHierarchyDetails(position)[chipType] || []

    this.dialog.open(HierarchyChipDetailsModalComponent, {
      width: FRAC_DIALOG_SIZES.hierarchyChipDetails,
      disableClose: false,
      panelClass: 'hierarchy-chip-details-dialog',
      data: {
        chipType,
        items: details,
      },
    })
  }

  private extractHierarchyAggregateFromResponse(response: FracHierarchyResponse | null | undefined): PositionHierarchyAggregate {
    const resultNode = response?.result
    const roots = Array.isArray(resultNode) ? resultNode : resultNode ? [resultNode] : []
    const roleMap = new Map<string, HierarchyDetailItem>()
    const activityMap = new Map<string, HierarchyDetailItem>()
    const competencyMap = new Map<string, HierarchyDetailItem>()

    const visitNode = (node: FracHierarchyNode | null | undefined): void => {
      if (!node) {
        return
      }

      const entityType = (node.entityType || '').toString().trim().toUpperCase()
      const code = this.normalizeEntityCode(node.entityCode)
      const name = (node.entityName || node.entityDescription || '').toString().trim()

      if (entityType === 'ROLE') {
        this.upsertHierarchyItem(roleMap, code, name)
      } else if (entityType === 'ACTIVITY') {
        this.upsertHierarchyItem(activityMap, code, name)
      } else if (entityType === 'COMPETENCY') {
        const levels = this.extractCompetencyLevels(node.competencies)
        this.upsertHierarchyItem(competencyMap, code, name, levels)
      }

      const children = Array.isArray(node.children)
        ? node.children
        : Array.isArray(node.childHierarchy) ? node.childHierarchy : []
      children.forEach((child) => visitNode(child))
    }

    roots.forEach((root) => visitNode(root))
    const details: PositionHierarchyDetails = {
      role: this.getSortedHierarchyItems(roleMap),
      activity: this.getSortedHierarchyItems(activityMap),
      competency: this.getSortedHierarchyItems(competencyMap),
    }

    return {
      counts: {
        role: details.role.length,
        activity: details.activity.length,
        competency: details.competency.length,
      },
      details,
    }
  }

  private upsertHierarchyItem(
    store: Map<string, HierarchyDetailItem>,
    code: string,
    name: string,
    levels: string[] = [],
  ): void {
    if (!code) {
      return
    }

    const existing = store.get(code)
    if (!existing) {
      store.set(code, {
        entityCode: code,
        entityName: name || '-',
        levels: levels.length ? [...levels] : undefined,
      })
      return
    }

    if (!existing.entityName || existing.entityName === '-') {
      existing.entityName = name || existing.entityName
    }

    if (levels.length) {
      const merged = new Set<string>([...(existing.levels || []), ...levels])
      existing.levels = this.sortLevels([...merged])
    }
  }

  private getSortedHierarchyItems(store: Map<string, HierarchyDetailItem>): HierarchyDetailItem[] {
    return [...store.values()].sort((a, b) =>
      (a.entityCode || '').localeCompare((b.entityCode || ''), undefined, { numeric: true, sensitivity: 'base' }),
    )
  }

  private extractCompetencyLevels(competencies: unknown): string[] {
    if (!Array.isArray(competencies)) {
      return []
    }

    const levelSet = new Set<string>()
    competencies.forEach((entry) => {
      if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>
        const levelNumber = Number(obj.levelNumber)
        if (Number.isFinite(levelNumber) && levelNumber > 0) {
          levelSet.add(`L${levelNumber}`)
          return
        }

        const rawLevel = (obj.level || '').toString().trim()
        if (!rawLevel) {
          return
        }
        const normalizedLevel = rawLevel.toUpperCase().startsWith('L') ? rawLevel.toUpperCase() : `L${rawLevel}`
        levelSet.add(normalizedLevel)
      }
    })

    return this.sortLevels([...levelSet])
  }

  private sortLevels(levels: string[]): string[] {
    return levels.sort((a, b) => {
      const aNum = Number((a || '').replace(/[^0-9]/g, ''))
      const bNum = Number((b || '').replace(/[^0-9]/g, ''))
      if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
        return aNum - bNum
      }
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    })
  }

  private getHierarchyCacheKey(code: string, language: string): string {
    return `${code}|${this.getLanguageCode(language)}`
  }

  private normalizeEntityCode(code: unknown): string {
    return (code || '').toString().trim().toUpperCase()
  }

  // ============= LANGUAGE DROPDOWN =============

  toggleDropdown(): void {
    if (this.isLanguageDropdownDisabled()) {
      this.isOpen = false
      return
    }
    this.isOpen = !this.isOpen
  }

  selectLanguage(lang: string, event: MouseEvent): void {
    if (this.isLanguageDropdownDisabled()) {
      event.stopPropagation()
      return
    }
    event.stopPropagation()
    this.selectedLanguage = lang
    this.isOpen = false

    if (this.routeMode === 'card' || this.routeMode === 'manage') {
      this.triggerSearch('language')
    }
  }

  // ============= TABLE SELECTION =============

  onSelectionChange(selected: any[]): void {
    this.selectedRows = selected
  }

  // ============= TABLE ACTIONS: EDIT =============

  onEditClicked(): void {
    if (this.selectedRows.length === 0) {
      fracLogger.warn('Edit action ignored because no row is selected.')
      return
    }
    this.isEditing = true
  }

  onSaveClicked(): void {
    if (!this.selectedRows.length) {
      return
    }

    if (this.isUpdating) {
      return
    }

    const changedRows = this.selectedRows.filter(row => this.isRowChanged(row))
    if (!changedRows.length) {
      fracLogger.warn('Save action ignored because no table changes were detected.')
      return
    }

    const payloads = changedRows
      .map(row => this.buildPositionUpdatePayload(row))
      .filter(Boolean) as any[]

    if (!payloads.length) {
      return
    }

    this.isUpdating = true

    this.fracApiService.updateEntity(payloads).subscribe({
      next: () => {
        this.isUpdating = false
        this.isEditing = false
        this.selectedRows = []

        const successData: UploadResultData = {
          type: 'success',
          title: 'Update Successful',
          message: `${changedRows.length} position ${changedRows.length === 1 ? 'record' : 'records'} updated successfully.`,
          count: changedRows.length,
        }
        this.captureBaselineTableState()
        this.showResultModal(successData, true)
      },
      error: (err) => {
        this.isUpdating = false
        const failureData: UploadResultData = {
          type: 'error',
          title: 'Update Failed',
          message:
            err?.error?.params?.errmsg ||
            err?.error?.message ||
            err?.statusText ||
            err?.message ||
            'Failed to update position.',
          errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
        }
        this.showResultModal(failureData, false)
      },
    })
  }

  private buildPositionUpdatePayload(row: any): any | null {
    if (!row?.code) {
      return null
    }

    const original = this.originalRowData.find(item => item?.code === row.code) || {}
    const languageCode = original?.languageCode || this.getLanguageCode(this.selectedLanguage)

    return {
      entityType: 'Position',
      id: original?.id || row?.id || '',
      code: original?.code || row?.code || '',
      languageCode,
      name: row?.name ?? original?.name ?? '',
    }
  }

  private getLanguageCode(language: string): string {
    return getLanguageCode(language)
  }

  // ============= TABLE ACTIONS: REMOVE =============

  onRemoveClicked(): void {
    if (this.selectedRows.length === 0) {
      fracLogger.warn('Remove action ignored because no row is selected.')
      return
    }

    if (this.isDeleting) {
      return
    }

    const selectedCodes = this.selectedRows
      .map(row => (row?.code ?? '').toString().trim().toUpperCase())
      .filter(Boolean)

    const confirmationDialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: FRAC_DIALOG_SIZES.unsavedChanges,
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'unsaved-changes-dialog',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete these rows: ${selectedCodes.join(', ')}?`,
        continueLabel: 'Delete',
        cancelLabel: 'Cancel',
      },
    })

    confirmationDialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((action: 'continue' | 'cancel' | undefined) => {
      if (action !== 'continue') {
        return
      }

      const deletePayload = this.selectedRows
        .map(row => this.buildDeletePayload(row))
        .filter(Boolean) as any[]

      if (!deletePayload.length) {
        fracLogger.warn('Remove action ignored because delete payload could not be generated.')
        return
      }

      this.isDeleting = true
      this.fracApiService.deleteEntity(deletePayload).subscribe({
        next: () => {
          this.isDeleting = false
          this.removedData = []
          this.selectedRows = []
          this.isEditing = false

          this.showResultModal({
            type: 'success',
            title: 'Delete Successful',
            message: `${deletePayload.length} position ${deletePayload.length === 1 ? 'record' : 'records'} deleted successfully.`,
            count: deletePayload.length,
          }, true)
        },
        error: (err) => {
          this.isDeleting = false
          fracLogger.error('Position delete failed', err)
          this.showResultModal({
            type: 'error',
            title: 'Delete Failed',
            message:
              err?.error?.params?.errmsg ||
              err?.error?.message ||
              err?.statusText ||
              err?.message ||
              'Failed to delete position.',
            errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
          }, false)
        },
      })
    })
  }

  private buildDeletePayload(row: any): any | null {
    const code = (row?.code ?? '').toString().trim()
    if (!code) {
      return null
    }

    return {
      entityCode: code,
      entityType: 'Position',
      language: this.getLanguageCode(this.selectedLanguage),
      purgeAllLanguage: false,
    }
  }

  // ============= FILE OPERATIONS =============

  onDownloadTemplate(): void {
    const languageCode = this.getLanguageCode(this.selectedLanguage)
    const fileUrl = getFracSampleTemplateUrl('position', languageCode)

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'sample_position_en_list.csv'
    link.click()
  }

  openUploadPopup(): void {
    const config = buildFracUploadPopupConfig('position', this.languages, this.selectedLanguage)

    const dialogRef = this.dialog.open(FracUploadPopupComponent, {
      width: FRAC_DIALOG_SIZES.uploadPopup,
      disableClose: true,
      data: config,
    })

    dialogRef.afterClosed().subscribe((result: UploadPopupResult | undefined) => {
      if (result?.action === 'upload' && result?.file) {
        this.uploadFile(result.file, result.language || this.selectedLanguage)
      }
    })
  }

  uploadFile(file: File, language: string = this.selectedLanguage): void {
    this.selectedLanguage = language
    if (this.isUploading) {
      return
    }

    this.isUploading = true

    this.fracApiService.uploadFile(file, language).subscribe({
      next: async (res) => {
        this.isUploading = false
        const resolvedResponse = await FracResponseParserUtil.resolveApiPayload(res)
        this.apiResponse = resolvedResponse

        const normalizedResponse = FracResponseParserUtil.parseApiResponse(resolvedResponse)
        const resultObject = (normalizedResponse?.result || {}) as Record<string, unknown>
        const uploadedCodes = FracResponseParserUtil.getSuccessCodes(resolvedResponse, 'position')
        if (FracResponseParserUtil.isUploadSuccessful(resolvedResponse, 'position')) {
          const uploadedCount = uploadedCodes.length || Number(resultObject.count || 0) || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your position data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData, false, false, FRAC_ROUTES.positionManage)
        } else {
          this.showResultModal(this.handleFailure(resolvedResponse), false)
        }
      },
      error: (err) => {
        this.isUploading = false
        void this.handleUploadError(err)
      },
    })
  }

  private handleFailure(response: any): UploadResultData {
    const normalizedResponse = FracResponseParserUtil.parseApiResponse(response)
    const apiMessage = FracResponseParserUtil.getRawMessage(normalizedResponse)
    const responseCode = normalizedResponse?.responseCode || normalizedResponse?.code || normalizedResponse?.status
    const paramsStatus = normalizedResponse?.params?.status || normalizedResponse?.statusText
    const affectedCodes = FracResponseParserUtil.getAffectedCodes(normalizedResponse)
    const affectedCodesDetails = affectedCodes.length ? `Affected Codes: ${affectedCodes.join(', ')}` : undefined

    const message = FracResponseParserUtil.isUsefulMessage(apiMessage)
      ? apiMessage!.trim()
      : (affectedCodes.length ? 'Multiple occurrences or duplicates found.' : 'Upload failed. Please verify your file and try again.')

    return {
      type: 'error',
      title: 'Upload Failed',
      message,
      errorDetails: FracResponseParserUtil.formatErrorDetails(responseCode, paramsStatus, affectedCodesDetails),
      resultDetails: FracResponseParserUtil.getStructuredErrorDetails(response)
    }
  }

  private async readUploadError(err: any): Promise<any> {
    return FracResponseParserUtil.readErrorPayload(err)
  }

  private async handleUploadError(err: any): Promise<void> {
    const resolvedPayload = await this.readUploadError(err)

    if (
      resolvedPayload?.params?.errmsg ||
      resolvedPayload?.responseCode ||
      resolvedPayload?.result ||
      resolvedPayload?.message
    ) {
      this.showResultModal(this.handleFailure(resolvedPayload), false)
      return
    }

    const fallbackData: UploadResultData = {
      type: 'error',
      title: 'Upload Failed',
      message: err?.statusText || err?.message || 'An unexpected error occurred while uploading your file.',
      errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined
    }

    this.showResultModal(fallbackData, false)
  }

  private showResultModal(
    data: UploadResultData,
    refreshOnClose = false,
    redirectOnClose = false,
    redirectToUrl?: string,
  ): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: FRAC_DIALOG_SIZES.uploadResult,
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data: data
    })

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (redirectToUrl && data.type === 'success') {
        this.router.navigateByUrl(redirectToUrl)
        return
      }

      if (redirectOnClose && data.type === 'success') {
        this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
        return
      }

      if (!refreshOnClose) {
        return
      }
      this.triggerSearch('init')
    })
  }

  onHomeClick(): void {
    if (this.isUpdating) {
      return
    }

    if (!this.hasPendingTableChanges()) {
      this.router.navigateByUrl(FRAC_ROUTES.positionCardGrid)
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
          this.router.navigateByUrl(FRAC_ROUTES.positionCardGrid)
        }
      })
  }

  isFilterControlsDisabled(): boolean {
    return this.isUploading || this.routeMode === 'upload'
  }

  isLanguageDropdownDisabled(): boolean {
    return this.isUploading
  }

  get activeEmptyStateConfig(): UploadEmptyStateConfig {
    return (this.routeMode === 'card' || this.routeMode === 'manage')
      ? this.noResultEmptyStateConfig
      : this.uploadEmptyStateConfig
  }

  shouldShowTableEmptyState(): boolean {
    if (this.isUploading || this.isSearching || this.hasTableData()) {
      return false
    }
    return this.routeMode === 'upload' || this.routeMode === 'manage'
  }

  private isRowChanged(row: any): boolean {
    const code = (row?.code ?? '').toString().trim()
    if (!code) {
      return true
    }
    const baselineRowSignature = this.baselineRowSignatureByCode.get(code)
    const currentSignature = this.uploadOrchestrator.getRowSignature(row)
    return baselineRowSignature !== currentSignature
  }

  private captureBaselineTableState(): void {
    const baseline = this.uploadOrchestrator.captureBaselineState(this.tableConfig.data as Array<Record<string, unknown>>)
    this.baselineTableSignature = baseline.tableSignature
    this.baselineRowSignatureByCode = baseline.rowSignatureByCode
  }

  // ============= MANAGE MODE NAVIGATION =============

  /**
   * Navigates from manage card view back to upload mode.
   */
  goToUploadMode(): void {
    this.router.navigateByUrl(FRAC_ROUTES.positionUpload)
  }

  /**
   * Navigates to the role-like table manage view as a standalone page.
   */
  navigateToListManage(): void {
    this.router.navigateByUrl(FRAC_ROUTES.positionManage)
  }

  /**
   * Opens the hierarchy view dialog for a position card.
   * Reuses the cached raw hierarchy response if available; otherwise fetches from the API.
   * Side effects: opens MatDialog with the full mapping tree.
   * @param position The position card clicked by the user.
   */
  onViewPosition(position: Record<string, unknown>): void {
    const code = this.normalizeEntityCode(position?.['code'])
    const positionName = (position?.['name'] || position?.['code'] || '').toString()
    const language = this.selectedLanguage
    const cacheKey = this.getHierarchyCacheKey(code, language)
    const rawCached = this.hierarchyRawResponseCache.get(cacheKey)

    if (rawCached) {
      this.openPositionHierarchyDialogFromResponse(positionName, code, rawCached)
      return
    }

    this.fracApiService.searchEntityHierarchy('position', code, language)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const aggregate = this.extractHierarchyAggregateFromResponse(response)
          this.hierarchyAggregateCache.set(cacheKey, aggregate)
          this.hierarchyRawResponseCache.set(cacheKey, response)
          this.openPositionHierarchyDialogFromResponse(positionName, code, response)
        },
        error: () => {
          this.openPositionHierarchyDialogFromResponse(positionName, code, { result: [] })
        },
      })
  }

  /**
   * Opens PositionHierarchyViewModalComponent using the raw hierarchy API response.
   * @param positionName Display name shown in the dialog header.
   * @param positionCode Entity code for navigation on Edit.
   * @param response Raw FracHierarchyResponse to parse into the tree.
   * Side effects: opens MatDialog.
   */
  private openPositionHierarchyDialogFromResponse(
    positionName: string,
    positionCode: string,
    response: import('../../../models/frac-api.models').FracHierarchyResponse,
  ): void {
    const roles = buildPositionMappingTree(response)

    const dialogData: PositionHierarchyViewModalData = {
      positionName,
      positionCode,
      roles,
      language: this.selectedLanguage,
    }

    this.dialog.open(PositionHierarchyViewModalComponent, {
      width: FRAC_DIALOG_SIZES.positionHierarchyView,
      maxWidth: '96vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'position-hierarchy-view-dialog',
      data: dialogData,
    })
  }

  onViewEdit(position: Record<string, unknown>): void {
    const code = position?.['code'] as string | undefined
    const queryParams = code ? { positionCode: code } : {}
    this.router.navigate([FRAC_ROUTES.mapRolePosition], { queryParams })
  }

  /**
   * Removes a single position card from the grid by filtering it out of searchResults.
   * Does not call the API — removal is local until a save is triggered.
   * @param position The position card to remove.
   */
  onCardRemove(position: Record<string, unknown>): void {
    this.searchResults = this.searchResults.filter(p => p !== position)
  }

}
