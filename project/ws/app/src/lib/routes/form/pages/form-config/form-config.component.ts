import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Observable } from 'rxjs'
import { FormApiService, formApiErrorMessage } from '../../services/form-api.service'
import {
  FormPreviewDialogComponent,
  FormPreviewDialogData,
  FormSectionDiffInput,
} from '../../components/form-preview-dialog/form-preview-dialog.component'
import {
  FORM_APPLICATION_TYPES,
  FORM_ACCESS_TYPES,
  FORM_LAYOUT_TYPES,
  FORM_COMPONENT_BY_APP_TYPE,
  FORM_LAYOUT_DEFAULTS,
  FORM_FRAMEWORKS,
  FORM_BROWSE_SCOPES,
  FORM_PREVIEW_DIALOG,
  FormBrowseScope,
} from '../../constants/form.constants'
import { FORM_EMPTY_DATA, FORM_SAMPLE_DATA } from '../../constants/form-samples.constants'
import {
  FormApplicationType,
  FormAccessType,
  FormLayoutType,
  IFormLayoutResult,
  IFormSummary,
} from '../../models/form.model'
import {
  FormNode,
  buildFormNode,
  findFormNodeIssue,
  formNodeToValue,
  setFormNodeCollapsed,
} from '../../models/form-node.model'

interface FormSection {
  name: string
  node: FormNode
}

/** How `data` was shaped when it was read, so it can be rebuilt the same way on save. */
type DataShape = 'named-sections' | 'single-node'

/**
 * Form Configuration — Browse → Edit, on one page (no route navigation).
 *
 * Browse: pick a scope (Public / Organization / All forms); the matching
 * forms come from the form-service `list` / `fetchAll` calls and are shown in
 * a table. Edit on a row reads that exact form (type, subtype, action,
 * component, framework, rootOrgId) — no guessing the framework, which matters
 * because one org often has both a `'*'` and a `'v2'` form for the same layout.
 *
 * Edit: details panel + section tabs, each backed by the recursive
 * `FormNodeEditorComponent`. Update Form previews a per-section diff, then
 * saves (stamping `last_modified_on`); on success the editor stays open.
 *
 * New Form: the Type / Application Type / Access / Org / Framework selectors.
 * Before seeding an empty form, `list` is checked for that exact combination
 * so an existing form is opened instead of being overwritten.
 */
@Component({
  standalone: false,
  selector: 'ws-app-form-config',
  templateUrl: './form-config.component.html',
  styleUrls: ['./form-config.component.scss'],
})
export class FormConfigComponent implements OnInit {
  readonly applicationTypes = FORM_APPLICATION_TYPES
  readonly accessTypes = FORM_ACCESS_TYPES
  readonly layoutTypes = FORM_LAYOUT_TYPES
  readonly frameworks = FORM_FRAMEWORKS
  readonly browseScopes = FORM_BROWSE_SCOPES
  readonly shimmerRows = [1, 2, 3, 4, 5]

  // ---- org options (Browse org picker + New Form) ----
  /** Org dropdown options — fetched once from the org-search API (see loadRootOrgOptions()). */
  rootOrgOptions: { value: string, label: string }[] = []
  loadingRootOrgs = false
  private orgNameById = new Map<string, string>()

  // ---- Browse ----
  scope: FormBrowseScope = 'public'
  browseOrgId = ''
  browseOrgFilter = ''
  forms: IFormSummary[] = []
  loadingForms = false
  formsError = ''
  formsFilter = ''
  formsTypeFilter = ''

  // ---- New Form selectors ----
  showCreatePanel = false
  applicationType: FormApplicationType | '' = ''
  accessType: FormAccessType | '' = ''
  layoutType: FormLayoutType | '' = ''
  rootOrgId = ''
  framework = ''
  createOrgFilter = ''
  checkingExisting = false
  createError = ''
  /** Set when New Form's combination already exists — offered as "Open existing" instead of creating. */
  existingMatch: IFormSummary | null = null
  /** New Form's starting content: an empty skeleton for the Type, or an uploaded JSON file. */
  startFrom: 'empty' | 'upload' = 'empty'
  uploadFileName = ''
  uploadError = ''
  /** Top-level keys of the upload that the Type's sample doesn't have — shown as a warning, not blocked. */
  uploadUnexpectedKeys: string[] = []
  /** The parsed upload's `data` (null until a valid file is picked). */
  uploadedData: any = null

  // ---- Edit ----
  /** The Browse row currently being opened/edited (null for a brand-new form). */
  openSummary: IFormSummary | null = null
  opening = false
  openError = ''

  layout: IFormLayoutResult | null = null
  sections: FormSection[] = []
  selectedSectionIndex = 0

  saving = false
  saveError = ''
  saveSuccess = ''
  validationError = ''

  private dataShape: DataShape = 'single-node'

  constructor(
    private readonly dialog: MatDialog,
    private readonly formApiSvc: FormApiService,
  ) { }

  ngOnInit(): void {
    this.loadRootOrgOptions()
    this.loadForms()
  }

  /**
   * Single upfront fetch of the org list — mirrors Playlist's
   * playlist-filters.component.ts loadOrganizations(): fetched once on init,
   * no app-level cache, re-fetched on a fresh navigation to this page.
   */
  private loadRootOrgOptions(): void {
    this.loadingRootOrgs = true
    this.formApiSvc.searchOrganizations().subscribe({
      next: (orgs) => {
        // Alphabetical by name (case-insensitive, numbers in natural order) — the API returns newest first.
        this.rootOrgOptions = [...orgs].sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: 'base', numeric: true }))
        this.orgNameById = new Map(orgs.map(o => [o.value, o.label]))
        this.loadingRootOrgs = false
      },
      error: () => {
        this.loadingRootOrgs = false
      },
    })
  }

  // ===========================================================================
  // Browse
  // ===========================================================================

  setScope(scope: FormBrowseScope): void {
    if (this.scope === scope) {
      return
    }
    this.scope = scope
    this.forms = []
    this.formsError = ''
    this.formsTypeFilter = ''
    if (scope !== 'org' || this.browseOrgId) {
      this.loadForms()
    }
  }

  onBrowseOrgChange(): void {
    this.forms = []
    this.formsError = ''
    if (this.browseOrgId) {
      this.loadForms()
    }
  }

  loadForms(): void {
    let request$: Observable<IFormSummary[]>
    if (this.scope === 'all') {
      request$ = this.formApiSvc.fetchAllForms()
    } else if (this.scope === 'org') {
      if (!this.browseOrgId) {
        return
      }
      request$ = this.formApiSvc.listForms(this.browseOrgId)
    } else {
      request$ = this.formApiSvc.listForms()
    }

    this.loadingForms = true
    this.formsError = ''
    request$.subscribe({
      next: (forms) => {
        this.forms = forms
        this.loadingForms = false
      },
      error: (err) => {
        this.forms = []
        this.loadingForms = false
        this.formsError = formApiErrorMessage(err, 'Could not load forms. Please try again.')
      },
    })
  }

  /** Org options narrowed by the picker's text filter (name or id). */
  filterOrgOptions(filter: string): { value: string, label: string }[] {
    const q = filter.trim().toLowerCase()
    if (!q) {
      return this.rootOrgOptions
    }
    return this.rootOrgOptions.filter(o => o.label.toLowerCase().includes(q) || o.value.includes(q))
  }

  get formTypeOptions(): string[] {
    return Array.from(new Set(this.forms.map(f => f.type))).sort()
  }

  get filteredForms(): IFormSummary[] {
    const q = this.formsFilter.trim().toLowerCase()
    return this.forms.filter(f => {
      if (this.formsTypeFilter && f.type !== this.formsTypeFilter) {
        return false
      }
      if (!q) {
        return true
      }
      return [f.type, f.component, f.framework, f.action, f.rootOrgId, this.orgLabel(f.rootOrgId)]
        .some(v => (v || '').toLowerCase().includes(q))
    })
  }

  orgLabel(rootOrgId: string): string {
    if (rootOrgId === FORM_LAYOUT_DEFAULTS.publicRootOrgId) {
      return 'Public'
    }
    return this.orgNameById.get(rootOrgId) || rootOrgId
  }

  /** Most recent timestamp a row carries (`list` rows have none; `fetchAll` rows do). */
  lastChanged(form: IFormSummary): string | null {
    return form.last_modified_on || form.created_on || null
  }

  isOpen(form: IFormSummary): boolean {
    return !!this.openSummary && this.sameForm(this.openSummary, form)
  }

  trackByForm(_index: number, f: IFormSummary): string {
    return `${f.rootOrgId}|${f.type}|${f.subtype}|${f.action}|${f.component}|${f.framework}`
  }

  // ===========================================================================
  // Edit
  // ===========================================================================

  /** Reads the exact form a Browse row (or an "Open existing" match) points at. */
  openForm(summary: IFormSummary): void {
    if (!this.confirmDiscardChanges()) {
      return
    }
    this.resetLoadedState()
    this.showCreatePanel = false
    this.openSummary = summary
    this.opening = true
    this.openError = ''

    this.formApiSvc.readForm({
      type: summary.type,
      subtype: summary.subtype,
      action: summary.action,
      component: summary.component,
      framework: summary.framework,
      rootOrgId: summary.rootOrgId,
    }).subscribe({
      next: (response) => {
        this.opening = false
        const layout = response?.result?.form || null
        if (!layout) {
          this.openError = 'The form-service returned no layout for this form.'
          return
        }
        this.layout = layout
        this.loadSectionsFromData(layout.data)
      },
      error: (err) => {
        this.opening = false
        this.openError = formApiErrorMessage(err, 'Could not load this form. Please try again.')
      },
    })
  }

  /** Leaves the editor and returns to the Browse table (asks first if there are unsaved edits). */
  backToForms(): void {
    if (!this.confirmDiscardChanges()) {
      return
    }
    this.resetLoadedState()
    this.openSummary = null
    this.openError = ''
  }

  /** Throws away edits and rebuilds the editor from the form as it was loaded. */
  discardChanges(): void {
    if (!this.layout || !this.hasUnsavedChanges()) {
      return
    }
    if (!window.confirm('Discard all unsaved changes to this form?')) {
      return
    }
    const index = this.selectedSectionIndex
    this.loadSectionsFromData(this.layout.data)
    this.selectedSectionIndex = Math.min(index, this.sections.length - 1)
    this.validationError = ''
  }

  /** Downloads the form as it was loaded (not the edits) — a backup before overwriting it. */
  downloadJson(): void {
    if (!this.layout) {
      return
    }
    const l = this.layout
    const fileName = [l.type, l.component, l.framework, l.rootOrgId].map(p => String(p).replace(/[^a-zA-Z0-9_-]/g, '_')).join('__')
    this.downloadFile(`${fileName}.json`, l)
  }

  private downloadFile(fileName: string, value: unknown): void {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  expandAll(): void {
    if (this.currentSection) {
      setFormNodeCollapsed(this.currentSection.node, false)
    }
  }

  collapseAll(): void {
    if (this.currentSection) {
      setFormNodeCollapsed(this.currentSection.node, true)
      // Keep the section root open so its first level stays visible.
      this.currentSection.node.collapsed = false
    }
  }

  get hasSections(): boolean {
    return this.sections.length > 0
  }

  get currentSection(): FormSection | null {
    return this.sections[this.selectedSectionIndex] || null
  }

  get canSave(): boolean {
    return this.hasSections && !this.saving
  }

  /** A brand-new form (seeded by New Form) has never been saved, so it has no created_on. */
  get isNewForm(): boolean {
    return !!this.layout && !this.layout.created_on
  }

  selectSection(index: number): void {
    this.selectedSectionIndex = index
  }

  /**
   * True when the editor's data differs from the form as loaded. Not bound in
   * the template — serializing ~1000 nodes on every change-detection pass
   * would be wasteful; it's only checked when leaving or discarding.
   */
  hasUnsavedChanges(): boolean {
    if (!this.layout || !this.hasSections) {
      return false
    }
    return JSON.stringify(this.buildEditedData()) !== JSON.stringify(this.layout.data)
  }

  private confirmDiscardChanges(): boolean {
    if (!this.hasUnsavedChanges()) {
      return true
    }
    return window.confirm('You have unsaved changes to this form. Leave without saving?')
  }

  // ===========================================================================
  // New Form
  // ===========================================================================

  openCreatePanel(): void {
    if (!this.confirmDiscardChanges()) {
      return
    }
    this.resetLoadedState()
    this.openSummary = null
    this.openError = ''
    this.showCreatePanel = true
    this.layoutType = ''
    this.applicationType = ''
    this.accessType = ''
    this.rootOrgId = ''
    this.framework = ''
    this.createOrgFilter = ''
    this.createError = ''
    this.existingMatch = null
    this.startFrom = 'empty'
    this.clearUpload()
  }

  cancelCreate(): void {
    this.showCreatePanel = false
    this.createError = ''
    this.existingMatch = null
    this.clearUpload()
  }

  /** Application Type only applies to 'web_layout' — clear it when switching away so a stale pick can't linger. */
  onLayoutTypeChange(): void {
    this.clearCreateFeedback()
    if (this.layoutType !== 'web_layout') {
      this.applicationType = ''
    }
    // The shape check depends on Type — re-run it for an upload already picked.
    if (this.uploadedData) {
      this.uploadUnexpectedKeys = this.unexpectedKeys(this.uploadedData)
    }
  }

  setStartFrom(startFrom: 'empty' | 'upload'): void {
    this.startFrom = startFrom
    this.clearCreateFeedback()
    if (startFrom === 'empty') {
      this.clearUpload()
    }
  }

  /** Downloads the sample `data` for the chosen Type — a starting point to edit and upload back. */
  downloadSample(): void {
    if (!this.layoutType) {
      return
    }
    this.downloadFile(`sample_${this.layoutType}.json`, FORM_SAMPLE_DATA[this.layoutType])
  }

  onUploadFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files && input.files[0]
    // Reset so picking the same file again still fires `change`.
    input.value = ''
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => this.applyUploadText(file.name, String(reader.result || ''))
    reader.onerror = () => this.failUpload(file.name, 'Could not read this file.')
    reader.readAsText(file)
  }

  /**
   * Parses an uploaded file. Accepts either a bare `data` object/array, or a
   * full form export (what Download JSON produces) — then its `data` is used,
   * so one org's form can be copied into a new org.
   */
  applyUploadText(fileName: string, text: string): void {
    this.clearCreateFeedback()
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      this.failUpload(fileName, 'This file is not valid JSON.')
      return
    }
    const isFullExport = !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      && !!parsed.data && typeof parsed.data === 'object' && typeof parsed.type === 'string'
    const data = isFullExport ? parsed.data : parsed
    if (!data || typeof data !== 'object') {
      this.failUpload(fileName, 'The JSON must be an object (the form\'s data), or a full form export with a "data" object.')
      return
    }
    this.uploadFileName = fileName
    this.uploadError = ''
    this.uploadedData = data
    this.uploadUnexpectedKeys = this.unexpectedKeys(data)
  }

  clearUpload(): void {
    this.uploadFileName = ''
    this.uploadError = ''
    this.uploadUnexpectedKeys = []
    this.uploadedData = null
  }

  /** "orgData, LAYOUT_HEADER, …" for the upload summary. */
  get uploadSectionNames(): string[] {
    const data = this.uploadedData
    return data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : []
  }

  private failUpload(fileName: string, message: string): void {
    this.clearUpload()
    this.uploadFileName = fileName
    this.uploadError = message
  }

  /** Top-level keys not in the chosen Type's sample (real forms vary, so this only warns). */
  private unexpectedKeys(data: any): string[] {
    if (!this.layoutType || !data || typeof data !== 'object' || Array.isArray(data)) {
      return []
    }
    const expected = Object.keys(FORM_SAMPLE_DATA[this.layoutType])
    return Object.keys(data).filter(k => !expected.includes(k))
  }

  /**
   * Defaults rootOrgId + framework when access type changes: '*' / '*' for
   * public, org-to-pick / 'v2' for private. Framework stays editable — one org
   * can have both a '*' and a 'v2' form.
   */
  onAccessTypeChange(): void {
    this.clearCreateFeedback()
    if (this.accessType === 'public') {
      this.rootOrgId = FORM_LAYOUT_DEFAULTS.publicRootOrgId
      this.framework = FORM_LAYOUT_DEFAULTS.publicFramework
    } else if (this.accessType === 'private') {
      this.rootOrgId = ''
      this.framework = FORM_LAYOUT_DEFAULTS.privateFramework
    } else {
      this.rootOrgId = ''
      this.framework = ''
    }
  }

  clearCreateFeedback(): void {
    this.createError = ''
    this.existingMatch = null
  }

  /** Application Type is only asked for (and only required) when Type is 'web_layout'. */
  get showApplicationType(): boolean {
    return this.layoutType === 'web_layout'
  }

  get canCreate(): boolean {
    const applicationOk = !this.showApplicationType || !!this.applicationType
    const startOk = this.startFrom === 'empty' || !!this.uploadedData
    return !!this.layoutType && applicationOk && !!this.accessType && !!this.rootOrgId && !!this.framework
      && startOk && !this.checkingExisting
  }

  /**
   * Checks `list` for this exact combination first; only when none exists is
   * a new form seeded — from the uploaded JSON, or the Type's empty skeleton
   * (FORM_EMPTY_DATA) — with no timestamps. Nothing is saved until Update. If the check itself fails, nothing is created — a failed
   * check must never be mistaken for "no form exists".
   */
  onCreateForm(): void {
    if (!this.canCreate) {
      return
    }
    this.clearCreateFeedback()
    this.checkingExisting = true

    const candidate: IFormSummary = {
      type: this.layoutType as string,
      subtype: FORM_LAYOUT_DEFAULTS.subtype,
      action: 'get',
      component: this.resolveComponent(),
      framework: this.framework,
      rootOrgId: this.rootOrgId,
    }
    const isPublic = this.rootOrgId === FORM_LAYOUT_DEFAULTS.publicRootOrgId

    this.formApiSvc.listForms(isPublic ? undefined : this.rootOrgId).subscribe({
      next: (forms) => {
        this.checkingExisting = false
        const match = forms.find(f => this.sameForm(f, candidate, true))
        if (match) {
          this.existingMatch = match
          return
        }
        this.seedNewForm(candidate)
      },
      error: (err) => {
        this.checkingExisting = false
        this.createError = formApiErrorMessage(err, 'Could not check for an existing form, so nothing was created. Please try again.')
      },
    })
  }

  openExistingMatch(): void {
    if (this.existingMatch) {
      this.openForm(this.existingMatch)
    }
  }

  private seedNewForm(candidate: IFormSummary): void {
    const data = this.startFrom === 'upload' && this.uploadedData
      ? JSON.parse(JSON.stringify(this.uploadedData))
      : JSON.parse(JSON.stringify(FORM_EMPTY_DATA[this.layoutType as FormLayoutType]))
    this.clearUpload()
    this.resetLoadedState()
    this.showCreatePanel = false
    this.openSummary = null
    this.layout = {
      type: candidate.type,
      subtype: candidate.subtype,
      action: candidate.action,
      component: candidate.component,
      framework: candidate.framework,
      rootOrgId: candidate.rootOrgId,
      created_on: null,
      last_modified_on: null,
      data,
    }
    this.loadSectionsFromData(this.layout.data)
  }

  /**
   * Type 'app_layout' always resolves to the 'app' component, regardless of
   * application type/access. For 'web_layout', Public forms are always served
   * under the 'web' component; the ekshamata/web split only applies to
   * Private forms. Callers only reach here after `canCreate` confirmed
   * `showApplicationType` is satisfied.
   */
  private resolveComponent(): string {
    if (this.layoutType === 'app_layout') {
      return 'app'
    }
    if (this.accessType === 'public') {
      return 'web'
    }
    return FORM_COMPONENT_BY_APP_TYPE[this.applicationType as FormApplicationType]
  }

  /**
   * Same stored form? `ignoreSubtype` for the New Form check: stored forms
   * carry subtype '*' while New Form sends 'v1', and the form-service treats
   * those as the same form (read falls back from 'v1' to '*').
   */
  private sameForm(a: IFormSummary, b: IFormSummary, ignoreSubtype = false): boolean {
    return a.type === b.type
      && a.action === b.action
      && a.component === b.component
      && a.framework === b.framework
      && a.rootOrgId === b.rootOrgId
      && (ignoreSubtype || a.subtype === b.subtype)
  }

  // ===========================================================================
  // Save
  // ===========================================================================

  /** Validates the whole tree, then opens a read-only preview of the exact payload before the update call fires. */
  onUpdateForm(): void {
    if (!this.layout || !this.hasSections) {
      return
    }

    const issue = this.sections.map(s => findFormNodeIssue(s.node)).find(i => !!i) || null
    if (issue) {
      this.validationError = issue
      return
    }
    this.validationError = ''
    this.saveError = ''
    this.saveSuccess = ''

    const editedData = this.buildEditedData()

    const dialogRef = this.dialog.open(FormPreviewDialogComponent, {
      ...FORM_PREVIEW_DIALOG,
      data: {
        component: this.layout.component,
        framework: this.layout.framework,
        rootOrgId: this.layout.rootOrgId,
        dataJson: JSON.stringify(editedData, null, 2),
        sectionDiffs: this.buildSectionDiffs(editedData),
      } as FormPreviewDialogData,
    })

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.saveForm(editedData)
      }
    })
  }

  /**
   * Before/after JSON per section, for the Preview dialog's diff view.
   * Diffing per section (rather than the whole `data` document at once)
   * keeps each diff's line count small — the real fetched `data` runs to
   * ~1000 nodes across all sections combined (see FORM_FEATURE_GUIDE.md).
   * `this.layout.data` is never mutated by editing (buildFormNode() copies
   * primitive values into a parallel FormNode tree), so it's still the
   * pristine originally-loaded (or last-saved) value here.
   */
  private buildSectionDiffs(editedData: any): FormSectionDiffInput[] {
    const originalData = this.layout?.data
    if (this.dataShape === 'named-sections') {
      const original = (originalData && typeof originalData === 'object' && !Array.isArray(originalData)) ? originalData : {}
      return this.sections.map(s => {
        const before = JSON.stringify(original[s.name] ?? null, null, 2)
        const after = JSON.stringify(editedData?.[s.name] ?? null, null, 2)
        return { name: s.name, before, after, changed: before !== after }
      })
    }

    const before = JSON.stringify(originalData ?? null, null, 2)
    const after = JSON.stringify(editedData ?? null, null, 2)
    return [{ name: this.sections[0]?.name || 'Data', before, after, changed: before !== after }]
  }

  private resetLoadedState(): void {
    this.layout = null
    this.sections = []
    this.selectedSectionIndex = 0
    this.validationError = ''
    this.saveError = ''
    this.saveSuccess = ''
    this.dataShape = 'single-node'
  }

  private loadSectionsFromData(data: any): void {
    // Every top-level key of `data` becomes its own section — whatever its
    // shape (array, object, or primitive) — so nothing needs a read-only
    // fallback: FormNodeEditorComponent renders any of them recursively.
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      this.dataShape = 'named-sections'
      this.sections = Object.entries(data).map(([key, value]) => ({ name: key, node: buildFormNode(value) }))
      return
    }

    // `data` itself is an array, a primitive, or missing — a single implicit
    // section wrapping the whole value.
    this.dataShape = 'single-node'
    this.sections = [{ name: 'Data', node: buildFormNode(data) }]
  }

  private buildEditedData(): any {
    if (this.dataShape === 'named-sections') {
      const rebuilt: Record<string, any> = {}
      this.sections.forEach(s => {
        rebuilt[s.name] = formNodeToValue(s.node)
      })
      return rebuilt
    }
    return this.sections[0] ? formNodeToValue(this.sections[0].node) : this.layout?.data
  }

  private saveForm(editedData: any): void {
    if (!this.layout) {
      return
    }
    this.saving = true
    this.saveError = ''
    this.saveSuccess = ''

    // The create/update payload's `request` is the same object the read call
    // returned as `result.form` — with `data` replaced by the edited sections,
    // and `last_modified_on` stamped to now (same ISO shape as `created_on`).
    const now = new Date().toISOString()
    const request = {
      ...this.layout,
      data: editedData,
      last_modified_on: now,
    }

    this.formApiSvc.updateForm(request).subscribe({
      next: () => {
        this.saving = false
        // Stay in the editor; the saved data becomes the new baseline for
        // diffs / unsaved-change checks. A first save gives a new form its created_on.
        this.layout = { ...request, created_on: request.created_on || now }
        this.saveSuccess = 'Form saved successfully.'
        this.loadForms()
      },
      error: (err) => {
        this.saving = false
        this.saveError = formApiErrorMessage(err, 'Saving failed — your changes are still here. Please try again.')
      },
    })
  }
}
