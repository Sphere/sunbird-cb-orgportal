import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    ViewChild,
    inject,
    OnDestroy,
    OnInit,
    signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { take } from 'rxjs/operators'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import * as ace from 'brace'
import { ErrorDialogComponent, ErrorDialogData } from '../../components/error-dialog/error-dialog.component'
import { SuccessDialogComponent } from '../../components/success-dialog/success-dialog.component'
import { PLAYLIST_ROUTES, PLAYLIST_UI } from '../../constants/playlist.constants'
import { Playlist, PlaylistFilters } from '../../models/playlist.model'
import { PlaylistApiService, PlaylistType } from '../../services/playlist-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { log } from '../../utils/playlist-logger.utils'
import 'brace/ext/language_tools'
import 'brace/mode/json'
import 'brace/theme/chrome'
import { HideForViewOnlyDirective } from '../../../../shared/directives/hide-for-view-only.directive'
import { FeatureAccessService, FEATURE_KEY } from '../../../../shared/access/feature-access'

@Component({
    selector: 'app-manage-search',
    templateUrl: './manage-search.component.html',
    styleUrls: ['./manage-search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, HideForViewOnlyDirective],
})
export class ManageSearchComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('jsonEditor', { static: false }) private jsonEditorRef?: ElementRef<HTMLElement>

    readonly jsonText = signal('')
    readonly validationError = signal('')
    readonly saving = signal(false)

    private readonly destroyRef = inject(DestroyRef)
    private readonly router = inject(Router)
    private readonly dialog = inject(MatDialog)
    private readonly playlistApi = inject(PlaylistApiService)
    private readonly state = inject(PlaylistStateService)
    private readonly featureAccess = inject(FeatureAccessService)
    private readonly featureKey = inject(FEATURE_KEY, { optional: true })
    private editor?: any
    private editorChangeHandler?: () => void

    /** Read-only mode for view-only users — makes the JSON editor non-editable. */
    get isViewOnly(): boolean {
        return this.featureAccess.isViewOnly(this.featureKey)
    }

    ngOnInit(): void {
        const filters = this.state.getFilters()
        if (!filters) {
            this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
            return
        }

        const existingPlaylist = this.state.getExistingSearchPlaylist()
        const playlistJson = existingPlaylist
            ? this.buildEditorPlaylist(existingPlaylist, filters)
            : this.buildDefaultEditorPlaylist(filters)

        this.jsonText.set(this.formatJson(playlistJson))
    }

    ngAfterViewInit(): void {
        this.initializeEditor()
    }

    ngOnDestroy(): void {
        if (this.editor && this.editorChangeHandler) {
            this.editor.off('change', this.editorChangeHandler)
        }
        this.editor?.destroy()
        this.editor?.container.remove()
    }

    onJsonChange(value: string): void {
        this.jsonText.set(value)
        this.validateJson(value)
    }

    onFormatJson(): void {
        const parsed = this.parseJson(this.jsonText())
        if (!parsed) {
            return
        }

        this.jsonText.set(this.formatJson(parsed))
        if (this.editor && this.editor.getValue() !== this.jsonText()) {
            this.editor.setValue(this.jsonText(), -1)
        }
        this.validationError.set('')
    }

    onBack(): void {
        this.router.navigate([PLAYLIST_ROUTES.HOME_SUMMARY])
    }

    async onSave(): Promise<void> {
        const filters = this.state.getFilters()
        if (!filters) {
            this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
            return
        }

        const playlistJson = this.parseJson(this.jsonText())
        if (!playlistJson) {
            return
        }

        const queryPayload = this.resolveQueryPayload(playlistJson)
        if (!queryPayload) {
            return
        }

        this.saving.set(true)

        try {
            const existingPlaylist = this.state.getExistingSearchPlaylist()

            await this.playlistApi.savePlaylist(
                filters,
                queryPayload,
                existingPlaylist || undefined,
                PlaylistType.SEARCH
            ).pipe(take(1)).toPromise()

            await this.refreshSearchPlaylist(filters)

            const dialogRef = this.dialog.open(SuccessDialogComponent, {
                width: PLAYLIST_UI.SUCCESS_DIALOG_WIDTH,
                disableClose: true,
                panelClass: 'success-dialog-panel',
                data: {
                    title: 'Search Playlist Updated',
                    message: 'The search playlist query has been saved successfully.',
                },
            })

            dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
                this.router.navigate([PLAYLIST_ROUTES.HOME_SUMMARY])
            })
        } catch (err: unknown) {
            this.showSaveError(err)
        } finally {
            this.saving.set(false)
        }
    }

    private async refreshSearchPlaylist(filters: PlaylistFilters): Promise<void> {
        try {
            const freshPlaylists = await this.playlistApi.searchPlaylist(filters, PlaylistType.SEARCH).pipe(take(1)).toPromise()
            const freshPlaylist = freshPlaylists && freshPlaylists.length > 0 ? freshPlaylists[0] : null
            this.state.setExistingSearchPlaylist(freshPlaylist)
        } catch (error) {
            log.warn('Could not re-fetch search playlist data:', error)
        }
    }

    private initializeEditor(): void {
        if (!this.jsonEditorRef) {
            return
        }

        this.editor = ace.edit(this.jsonEditorRef.nativeElement)
        this.editor.setTheme('ace/theme/chrome')
        this.editor.getSession().setMode('ace/mode/json')
        this.editor.getSession().setUseWrapMode(true)
        this.editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            fontSize: '14px',
            highlightActiveLine: true,
            printMargin: false,
            showLineNumbers: true,
            showGutter: true,
            tabSize: 2,
            useSoftTabs: true,
        })
        this.editor.$blockScrolling = Infinity
        // View-only users can read the query but not edit it.
        this.editor.setReadOnly(this.isViewOnly)
        this.editor.setValue(this.jsonText(), -1)

        this.editorChangeHandler = () => {
            this.onJsonChange(this.editor?.getValue() || '')
        }
        this.editor.on('change', this.editorChangeHandler)
    }

    private validateJson(value: string): boolean {
        const parsed = this.parseJson(value)
        if (!parsed) {
            return false
        }

        this.validationError.set('')
        return true
    }

    private parseJson(value: string, showError: boolean = true): Record<string, unknown> | null {
        try {
            const parsed = JSON.parse(value)
            if (!this.isJsonObject(parsed)) {
                if (showError) {
                    this.validationError.set('Payload must be a JSON object.')
                }
                return null
            }

            return parsed
        } catch (error) {
            if (showError) {
                this.validationError.set(error instanceof Error ? error.message : 'Invalid JSON payload.')
            }
            return null
        }
    }

    private isJsonObject(value: unknown): value is Record<string, unknown> {
        return !!value && typeof value === 'object' && !Array.isArray(value)
    }

    private formatJson(value: Record<string, unknown>): string {
        return JSON.stringify(value, null, 2)
    }

    private buildEditorPlaylist(playlist: Playlist, filters: PlaylistFilters): Record<string, unknown> {
        const payload = this.isJsonObject(playlist?.dataSource?.payload)
            ? playlist.dataSource.payload
            : this.getDefaultQueryPayload(filters)

        return {
            id: playlist.id || '',
            playlistId: 'SEARCH_PLAYLIST',
            orgId: playlist.orgId || filters.orgId,
            role: playlist.role || filters.role || [],
            state: playlist.state || null,
            district: playlist.district || null,
            language: playlist.language || filters.language,
            dataSource: {
                type: 'query',
                payload,
            },
        }
    }

    private buildDefaultEditorPlaylist(filters: PlaylistFilters): Record<string, unknown> {
        return {
            id: '',
            playlistId: 'SEARCH_PLAYLIST',
            orgId: filters.orgId,
            role: filters.role || [],
            state: filters.state || null,
            district: filters.district || null,
            language: filters.language,
            dataSource: {
                type: 'query',
                payload: this.getDefaultQueryPayload(filters),
            },
        }
    }

    private resolveQueryPayload(value: Record<string, unknown>): Record<string, unknown> | null {
        const dataSource = value['dataSource']
        if (!this.isJsonObject(dataSource)) {
            return value
        }

        if (dataSource['type'] && dataSource['type'] !== 'query') {
            this.validationError.set('dataSource.type must be "query".')
            return null
        }

        const payload = dataSource['payload']
        if (!this.isJsonObject(payload)) {
            this.validationError.set('dataSource.payload must be a JSON object.')
            return null
        }

        return payload
    }

    private getDefaultQueryPayload(filters: PlaylistFilters): Record<string, unknown> {
        return {
            sort: [
                {
                    lastUpdatedOn: 'asc',
                },
            ],
            request: {
                limit: 10,
                exists: [
                    'competencies_v1',
                ],
                offset: 1,
                filters: {
                    lang: [
                        filters.language || 'en',
                    ],
                    sourceName: [
                        'IHAT',
                        'Jhpiego',
                    ],
                    primaryCategory: [
                        'Course',
                    ],
                },
                sort_by: {
                    lastUpdatedOn: 'asc',
                },
                not_exists: [
                    'selfAssessment',
                ],
            },
        }
    }

    private showSaveError(err: unknown): void {
        const errObj = err as Record<string, unknown>
        log.error('Search playlist save error:', JSON.stringify(errObj?.['error'] || err, null, 2))

        const apiError = (errObj?.['error'] as Record<string, unknown>) || errObj
        const result = apiError?.['result'] as Record<string, unknown> | undefined
        const params = apiError?.['params'] as Record<string, unknown> | undefined
        const firstError = result?.['errors'] as { message: string }[] | undefined
        const errorMessage = firstError?.[0]?.message
            || params?.['errmsg'] as string
            || apiError?.['message'] as string
            || 'Failed to save search playlist'

        const errorDialogData: ErrorDialogData = {
            title: 'Save Failed',
            message: errorMessage,
        }

        const errorDialogRef = this.dialog.open(ErrorDialogComponent, {
            width: PLAYLIST_UI.ERROR_DIALOG_WIDTH,
            disableClose: false,
            data: errorDialogData,
        })

        errorDialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((retry: boolean) => {
            if (retry) {
                this.onSave()
            }
        })
    }
}
