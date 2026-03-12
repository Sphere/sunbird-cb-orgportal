import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export type HierarchyChipType = 'role' | 'activity' | 'competency'

export interface HierarchyDetailItem {
  entityCode: string
  entityName: string
  levels?: string[]
}

export interface HierarchyChipDetailsModalData {
  chipType: HierarchyChipType
  items: HierarchyDetailItem[]
}

@Component({
  selector: 'ws-app-hierarchy-chip-details-modal',
  templateUrl: './hierarchy-chip-details-modal.component.html',
  styleUrls: ['./hierarchy-chip-details-modal.component.scss'],
})
export class HierarchyChipDetailsModalComponent {
  constructor(
    private dialogRef: MatDialogRef<HierarchyChipDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HierarchyChipDetailsModalData,
  ) { }

  get title(): string {
    const labelMap: Record<HierarchyChipType, string> = {
      role: 'Roles',
      activity: 'Activities',
      competency: 'Competencies',
    }
    return labelMap[this.data.chipType]
  }

  get emptyLabel(): string {
    const labelMap: Record<HierarchyChipType, string> = {
      role: 'No mapped role found.',
      activity: 'No mapped activity found.',
      competency: 'No mapped competency found.',
    }
    return labelMap[this.data.chipType]
  }

  formatItem(item: HierarchyDetailItem): string {
    const code = (item.entityCode || '').trim()
    const name = (item.entityName || '').trim() || '-'
    const base = `${code} - ${name}`

    if (this.data.chipType !== 'competency') {
      return base
    }

    const levels = Array.isArray(item.levels) ? item.levels.filter(Boolean) : []
    return levels.length ? `${base} : ${levels.join(', ')}` : `${base} : -`
  }

  onClose(): void {
    this.dialogRef.close()
  }
}
