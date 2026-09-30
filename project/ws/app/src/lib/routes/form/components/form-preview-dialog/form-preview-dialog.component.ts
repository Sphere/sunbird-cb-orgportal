import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DIFF_LINE_LIMIT, SideBySideRow, diffLines, toSideBySideRows } from '../../utils/diff-lines.util'

/** One section's before/after JSON, as computed by FormConfigComponent before opening this dialog. */
export interface FormSectionDiffInput {
  name: string
  before: string
  after: string
  changed: boolean
}

export interface FormPreviewDialogData {
  component: string
  framework: string
  rootOrgId: string
  dataJson: string
  sectionDiffs: FormSectionDiffInput[]
}

interface FormSectionDiffView extends FormSectionDiffInput {
  /** null when the section's combined line count exceeds DIFF_LINE_LIMIT — shown as before/after blocks instead. */
  rows: SideBySideRow[] | null
  expanded: boolean
}

/**
 * Read-only confirmation dialog: shows a per-section diff between the
 * originally loaded data and the edited data, so the admin can manually
 * reverify exactly what changed before confirming. Mirrors playlist-view-
 * dialog's header/scroll-body/footer structure.
 */
@Component({
  standalone: false,
  selector: 'app-form-preview-dialog',
  templateUrl: './form-preview-dialog.component.html',
  styleUrls: ['./form-preview-dialog.component.scss'],
})
export class FormPreviewDialogComponent {
  readonly sectionDiffs: FormSectionDiffView[]
  readonly hasAnyChange: boolean

  constructor(
    private readonly dialogRef: MatDialogRef<FormPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormPreviewDialogData,
  ) {
    this.sectionDiffs = (data.sectionDiffs || []).map(section => {
      const totalLines = section.before.split('\n').length + section.after.split('\n').length
      const tooLargeToDiff = totalLines > DIFF_LINE_LIMIT
      return {
        ...section,
        rows: section.changed && !tooLargeToDiff ? toSideBySideRows(diffLines(section.before, section.after)) : null,
        // Changed sections open expanded so the diff is immediately visible;
        // unchanged ones stay collapsed since there's nothing to review.
        expanded: section.changed,
      }
    })
    this.hasAnyChange = this.sectionDiffs.some(s => s.changed)
  }

  toggleSection(section: FormSectionDiffView): void {
    section.expanded = !section.expanded
  }

  onCancel(): void {
    this.dialogRef.close(false)
  }

  onConfirm(): void {
    this.dialogRef.close(true)
  }
}
