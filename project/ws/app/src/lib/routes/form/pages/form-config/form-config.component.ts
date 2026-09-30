import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { FormApiService } from '../../services/form-api.service'
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
} from '../../constants/form.constants'
import { FormApplicationType, FormAccessType, FormLayoutType, IFormLayoutResult } from '../../models/form.model'
import { FormNode, buildFormNode, findFormNodeIssue, formNodeToValue } from '../../models/form-node.model'

interface FormSection {
  name: string
  node: FormNode
}

/** How `data` was shaped when it was read, so it can be rebuilt the same way on save. */
type DataShape = 'named-sections' | 'single-node'

/**
 * Single-page Form Configuration flow: pick Application Type / Access / Root
 * Org Id, Load Form fetches the layout and renders its editor inline on this
 * same page (no route navigation) — a details panel shows every top-level
 * layout field except `data`, and `data` itself is edited as section tabs,
 * each backed by a fully recursive `FormNodeEditorComponent` so every array,
 * object, or primitive in `data`, at any nesting depth, is a real editable
 * form control — nothing falls back to read-only JSON. Update Form previews
 * the final JSON, and on confirm pushes it (stamping `last_modified_on` to
 * now); after a successful save the page resets back to the selector state.
 */
@Component({
  standalone: false,
  selector: 'app-form-config',
  templateUrl: './form-config.component.html',
  styleUrls: ['./form-config.component.scss'],
})
export class FormConfigComponent implements OnInit {
  readonly applicationTypes = FORM_APPLICATION_TYPES
  readonly accessTypes = FORM_ACCESS_TYPES
  readonly layoutTypes = FORM_LAYOUT_TYPES

  applicationType: FormApplicationType | '' = ''
  accessType: FormAccessType | '' = ''
  layoutType: FormLayoutType | '' = ''
  rootOrgId = ''
  framework = ''

  /** Root Org Id dropdown options — fetched once from the org-search API (see loadRootOrgOptions()). */
  rootOrgOptions: { value: string, label: string }[] = []
  loadingRootOrgs = false

  loading = false
  loadError = ''

  layout: IFormLayoutResult | null = null
  sections: FormSection[] = []
  selectedSectionIndex = 0

  saving = false
  validationError = ''

  private dataShape: DataShape = 'single-node'

  constructor(
    private readonly dialog: MatDialog,
    private readonly formApiSvc: FormApiService,
  ) { }

  ngOnInit(): void {
    this.loadRootOrgOptions()
  }

  /**
   * Single upfront fetch of the org list for Root Org Id — mirrors Playlist's
   * playlist-filters.component.ts loadOrganizations(): fetched once on init,
   * no app-level cache, re-fetched on a fresh navigation to this page.
   */
  private loadRootOrgOptions(): void {
    this.loadingRootOrgs = true
    this.formApiSvc.searchOrganizations().subscribe({
      next: (orgs) => {
        this.rootOrgOptions = orgs
        this.loadingRootOrgs = false
      },
      error: () => {
        this.loadingRootOrgs = false
      },
    })
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

  /** Application Type only applies to 'web_layout' — clear it when switching away so a stale pick can't linger. */
  onLayoutTypeChange(): void {
    this.loadError = ''
    if (this.layoutType !== 'web_layout') {
      this.applicationType = ''
    }
  }

  /** Recomputes rootOrgId + framework when access type changes: '*' for public, real values for private. */
  onAccessTypeChange(): void {
    this.loadError = ''
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

  /** Application Type is only asked for (and only required) when Type is 'web_layout'. */
  get showApplicationType(): boolean {
    return this.layoutType === 'web_layout'
  }

  get canLoad(): boolean {
    const applicationOk = !this.showApplicationType || !!this.applicationType
    return !!this.layoutType && applicationOk && !!this.accessType && !!this.rootOrgId && !this.loading
  }

  /** Fetches the layout and renders its editor inline on this same page — no route navigation. */
  loadForm(): void {
    if (!this.canLoad) {
      return
    }
    this.loading = true
    this.loadError = ''
    this.resetLoadedState()

    const request = {
      type: this.layoutType,
      subtype: FORM_LAYOUT_DEFAULTS.subtype,
      action: 'get' as const,
      component: this.resolveComponent(),
      framework: this.framework,
      rootOrgId: this.rootOrgId,
    }

    this.formApiSvc.readForm(request).subscribe({
      next: (response) => {
        this.loading = false
        const layout = response?.result?.form || null
        if (!layout) {
          this.loadError = 'The form-service returned no layout for this selection.'
          return
        }
        this.layout = layout
        this.loadSectionsFromData(layout.data)
      },
      error: () => {
        this.loading = false
        this.loadError = 'No form exists yet for this selection. Create one below, or double-check your selections and load again.'
      },
    })
  }

  /**
   * Seeds a brand-new form for this selection when Load Form fails because
   * none exists yet — same request metadata Load Form would have used, an
   * empty `data` skeleton matching the confirmed real shape
   * (`orgData`/`LAYOUT_HEADER`/`LAYOUT_BODY`/`LAYOUT_FOOTER`), and no
   * `created_on`/`last_modified_on` yet since nothing has been saved. Update
   * Form still goes through the same preview → confirm → save flow, which
   * posts to the create endpoint either way.
   */
  onCreateForm(): void {
    if (!this.canLoad) {
      return
    }
    this.loadError = ''
    this.resetLoadedState()

    this.layout = {
      type: this.layoutType as string,
      subtype: FORM_LAYOUT_DEFAULTS.subtype,
      action: 'get',
      component: this.resolveComponent(),
      framework: this.framework,
      rootOrgId: this.rootOrgId,
      created_on: null,
      last_modified_on: null,
      data: { orgData: {}, LAYOUT_HEADER: {}, LAYOUT_BODY: {}, LAYOUT_FOOTER: {} },
    }
    this.loadSectionsFromData(this.layout.data)
  }

  selectSection(index: number): void {
    this.selectedSectionIndex = index
  }

  /**
   * Type 'app_layout' always resolves to the 'app' component, regardless of
   * application type/access. For 'web_layout', the existing rule still
   * applies: Public forms are always served under the 'web' component,
   * regardless of application type; the ekshamata/web split only applies to
   * Private forms. Guaranteed a valid applicationType when needed — callers
   * only reach here after `canLoad` confirmed `showApplicationType` is
   * satisfied.
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

    const editedData = this.buildEditedData()

    const dialogRef = this.dialog.open(FormPreviewDialogComponent, {
      width: '1400px',
      maxWidth: '95vw',
      maxHeight: '85vh',
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
   * ~1000 nodes across all sections combined (see FORM_FEATURE_GUIDE.md),
   * which would make one document-wide diff expensive and unreadable.
   * `this.layout.data` is never mutated by editing (buildFormNode() copies
   * primitive values into a parallel FormNode tree), so it's still the
   * pristine originally-loaded value here.
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

    // The create/update payload's `request` is the same object the read call
    // returned as `result.form` — with `data` replaced by the edited sections,
    // and `last_modified_on` stamped to now (same ISO shape as `created_on`).
    const request = {
      ...this.layout,
      data: editedData,
      last_modified_on: new Date().toISOString(),
    }

    this.formApiSvc.updateForm(request).subscribe({
      next: () => {
        this.saving = false
        // Back to the plain selector state on this same page — no route change.
        this.resetLoadedState()
      },
      error: () => {
        this.saving = false
      },
    })
  }
}
