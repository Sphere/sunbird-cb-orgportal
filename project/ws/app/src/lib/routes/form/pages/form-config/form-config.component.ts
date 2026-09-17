import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { FormApiService } from '../../services/form-api.service'
import {
  FormPreviewDialogComponent,
  FormPreviewDialogData,
} from '../../components/form-preview-dialog/form-preview-dialog.component'
import {
  FORM_APPLICATION_TYPES,
  FORM_ACCESS_TYPES,
  FORM_LAYOUT_TYPES,
  FORM_COMPONENT_BY_APP_TYPE,
  FORM_LAYOUT_DEFAULTS,
} from '../../constants/form.constants'
import { ROOT_ORG_IDS } from '../../constants/root-org-ids.constants'
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
export class FormConfigComponent {
  readonly applicationTypes = FORM_APPLICATION_TYPES
  readonly accessTypes = FORM_ACCESS_TYPES
  readonly layoutTypes = FORM_LAYOUT_TYPES
  readonly rootOrgIds = ROOT_ORG_IDS

  applicationType: FormApplicationType | '' = ''
  accessType: FormAccessType | '' = ''
  layoutType: FormLayoutType | '' = ''
  rootOrgId = ''
  framework = ''

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
    if (!this.layoutType || !this.accessType || !this.rootOrgId) {
      return
    }
    if (this.showApplicationType && !this.applicationType) {
      return
    }
    this.loading = true
    this.loadError = ''
    this.resetLoadedState()

    // Type 'app_layout' always resolves to the 'app' component, regardless of
    // application type/access. For 'web_layout', the existing rule still
    // applies: Public forms are always served under the 'web' component,
    // regardless of application type; the ekshamata/web split only applies to
    // Private forms.
    const component = this.layoutType === 'app_layout'
      ? 'app'
      : this.accessType === 'public'
        ? 'web'
        // Guaranteed truthy here: showApplicationType is true whenever
        // layoutType === 'web_layout', and loadForm() already returned above
        // if applicationType was empty in that case.
        : FORM_COMPONENT_BY_APP_TYPE[this.applicationType as FormApplicationType]

    const request = {
      type: this.layoutType,
      subtype: FORM_LAYOUT_DEFAULTS.subtype,
      action: 'get' as const,
      component,
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
        this.loadError = 'Could not load the form config. Please check the selections and try again.'
      },
    })
  }

  selectSection(index: number): void {
    this.selectedSectionIndex = index
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
      width: '720px',
      maxHeight: '85vh',
      data: {
        component: this.layout.component,
        framework: this.layout.framework,
        rootOrgId: this.layout.rootOrgId,
        dataJson: JSON.stringify(editedData, null, 2),
      } as FormPreviewDialogData,
    })

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.saveForm(editedData)
      }
    })
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
