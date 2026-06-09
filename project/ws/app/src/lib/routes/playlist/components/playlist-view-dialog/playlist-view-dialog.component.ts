import { CommonModule } from '@angular/common'
import { Component, Inject, ViewEncapsulation } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'

export interface PlaylistViewCourseRow {
    index: number
    identifier: string
    name: string
    sourceName: string
}

export interface PlaylistViewLevelRow {
    level: number | string
    name: string
    description: string
    courseId: string
    courseName: string
}

export interface PlaylistViewCompetencyRow {
    index: number
    code: string
    name: string
    levels: PlaylistViewLevelRow[]
}

export interface PlaylistViewDialogData {
    mode: 'course' | 'competency' | 'search'
    title: string
    orgId: string
    orgName: string
    roles: string[]
    language: string
    playlistId: string
    courseRows: PlaylistViewCourseRow[]
    competencyRows: PlaylistViewCompetencyRow[]
    searchPayloadJson?: string
}

@Component({
    selector: 'app-playlist-view-dialog',
    standalone: true,
    templateUrl: './playlist-view-dialog.component.html',
    styleUrls: ['./playlist-view-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, MatDialogModule, MatIconModule],
})
export class PlaylistViewDialogComponent {
    expandedCompetencies = new Set<string>()

    constructor(
        private dialogRef: MatDialogRef<PlaylistViewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PlaylistViewDialogData,
    ) {
        if (data.mode === 'competency' && data.competencyRows.length > 0) {
            this.expandedCompetencies.add(this.getCompKey(data.competencyRows[0]))
        }
    }

    get totalCourses(): number {
        return this.data.courseRows.length
    }

    get totalCompetencies(): number {
        return this.data.competencyRows.length
    }

    get totalMappedLevels(): number {
        return this.data.competencyRows.reduce((sum, c) => sum + c.levels.length, 0)
    }

    toggleCompetency(comp: PlaylistViewCompetencyRow): void {
        const key = this.getCompKey(comp)
        if (this.expandedCompetencies.has(key)) {
            this.expandedCompetencies.delete(key)
        } else {
            this.expandedCompetencies.add(key)
        }
    }

    isCompetencyExpanded(comp: PlaylistViewCompetencyRow): boolean {
        return this.expandedCompetencies.has(this.getCompKey(comp))
    }

    private getCompKey(comp: PlaylistViewCompetencyRow): string {
        return `${comp.index}::${comp.code}`
    }

    onClose(): void {
        this.dialogRef.close()
    }
}
