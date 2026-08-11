import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export interface MappingModalLabels {
  /** e.g. 'Position–Role Mappings' */
  sectionTitle: string
  /** e.g. 'positions' — used in the count badge */
  parentCountLabel: string
  /** e.g. 'Position' — shown above the parent code */
  parentLabel: string
  /** e.g. 'Roles' — shown as the children section header */
  childrenLabel: string
}

export interface UploadResultData {
  type: 'success' | 'error'
  title: string
  message: string
  count?: number
  errorDetails?: string
  resultDetails?: { key: string; values: any[] }[]
  /** Optional: configures labels inside the mapping summary card */
  mappingLabels?: MappingModalLabels
}

interface MappingGroup {
  parent: string
  children: string[]
}

@Component({
  standalone: false,
  selector: 'ws-app-upload-result-modal',
  templateUrl: './upload-result-modal.component.html',
  styleUrls: ['./upload-result-modal.component.scss']
})
export class UploadResultModalComponent {
  constructor(
    public dialogRef: MatDialogRef<UploadResultModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UploadResultData
  ) { }

  isSuccess(): boolean {
    return this.data.type === 'success'
  }

  isError(): boolean {
    return this.data.type === 'error'
  }

  get detailLines(): string[] {
    return (this.data.errorDetails || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
  }

  get resultErrorLines(): { key: string; values: any[] }[] {
    return this.data.resultDetails || []
  }

  formatResultKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  get mappingGroups(): MappingGroup[] {
    const groups: Record<string, Set<string>> = {}

    for (const line of this.detailLines) {
      const separatorIndex = line.indexOf('<=>')
      if (separatorIndex === -1) {
        continue
      }

      const parent = line.slice(0, separatorIndex).trim()
      const child = line.slice(separatorIndex + '<=>'.length).trim()
      if (!parent || !child) {
        continue
      }

      if (!groups[parent]) {
        groups[parent] = new Set<string>()
      }
      groups[parent].add(child)
    }

    return Object.keys(groups).map(parent => ({
      parent,
      children: Array.from(groups[parent]),
    }))
  }

  get hasMappingDetails(): boolean {
    return this.mappingGroups.length > 0
  }

  get mappingPairCount(): number {
    return this.mappingGroups.reduce((total, group) => total + group.children.length, 0)
  }

  get mappedRoleCount(): number {
    return this.mappingGroups.length
  }

  get modalLabels(): MappingModalLabels {
    return this.data.mappingLabels || {
      sectionTitle: 'Mappings',
      parentCountLabel: 'items',
      parentLabel: 'Item',
      childrenLabel: 'Mapped',
    }
  }

  /**
   * Closes the modal window.
   */
  onClose(): void {
    this.dialogRef.close()
  }
}
