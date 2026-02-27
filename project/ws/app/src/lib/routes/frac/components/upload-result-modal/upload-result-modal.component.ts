import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export interface UploadResultData {
  type: 'success' | 'error'
  title: string
  message: string
  count?: number
  errorDetails?: string
  resultDetails?: { key: string; values: any[] }[]
}

interface MappingGroup {
  parent: string
  children: string[]
}

@Component({
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
      const match = line.match(/^(.+?)\s*<=>\s*(.+)$/)
      if (!match) {
        continue
      }

      const parent = match[1].trim()
      const child = match[2].trim()
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

  /**
   * Closes the modal window.
   */
  onClose(): void {
    this.dialogRef.close()
  }
}
