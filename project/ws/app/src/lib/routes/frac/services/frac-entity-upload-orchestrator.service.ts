import { Injectable } from '@angular/core'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { FRAC_DEBOUNCE_MS, FRAC_LANGUAGES } from '../constants/frac.constants'
import { resolveFracClientConfig } from '../utils/frac-client-config.util'

export type UploadRouteMode = 'upload' | 'manage'
export type UploadSearchSource = 'typing' | 'icon' | 'enter' | 'language' | 'init'

export interface UploadSearchTriggerPayload {
  keyword: string
  language: string
  source: UploadSearchSource
}

export interface UploadBaselineState {
  tableSignature: string
  rowSignatureByCode: Map<string, string>
}

@Injectable({ providedIn: 'root' })
export class FracEntityUploadOrchestratorService {
  constructor(private configSvc: ConfigurationsService) { }

  /**
   * Returns client-aware languages from config with FRAC defaults as fallback.
   */
  get languages(): readonly string[] {
    return resolveFracClientConfig(this.configSvc?.instanceConfig).languages || FRAC_LANGUAGES
  }

  /**
   * Returns client-aware search debounce with safe default.
   */
  get searchDebounceMs(): number {
    return resolveFracClientConfig(this.configSvc?.instanceConfig).debounceMs.searchInput || FRAC_DEBOUNCE_MS.searchInput
  }

  /**
   * Returns route mode from URL query param without changing existing behavior.
   */
  resolveRouteMode(mode: string | null | undefined): UploadRouteMode {
    return mode === 'manage' ? 'manage' : 'upload'
  }

  /**
   * Returns the upload CTA label based on page mode.
   */
  resolveUploadButtonText(routeMode: UploadRouteMode): string {
    return routeMode === 'manage' ? 'Change File' : 'Upload File'
  }

  /**
   * Creates a search trigger payload used by upload pages.
   */
  buildSearchPayload(searchTerm: string, selectedLanguage: string, source: UploadSearchSource): UploadSearchTriggerPayload {
    return {
      keyword: (searchTerm || '').trim(),
      language: selectedLanguage,
      source,
    }
  }

  /**
   * Attaches shared search stream behavior (debounced typing, immediate click/enter/language/init).
   */
  bindSearchTriggerStream(
    searchTrigger$: Subject<UploadSearchTriggerPayload>,
    destroy$: Subject<void>,
    fetcher: (keyword: string, language: string) => void,
  ): void {
    const debouncedTypingSearch$ = searchTrigger$.pipe(
      filter(payload => payload.source === 'typing'),
      debounceTime(this.searchDebounceMs),
      distinctUntilChanged((previous, current) =>
        previous.keyword === current.keyword && previous.language === current.language,
      ),
    )

    const immediateSearch$ = searchTrigger$.pipe(
      filter(payload => payload.source !== 'typing'),
    )

    merge(debouncedTypingSearch$, immediateSearch$)
      .pipe(takeUntil(destroy$))
      .subscribe(payload => fetcher(payload.keyword, payload.language))
  }

  /**
   * Creates a unique string from a single row to detect if that row changed.
   */
  getRowSignature(row: Record<string, unknown>): string {
    const normalized: Record<string, string> = {}
    const keys = Object.keys(row || {}).sort()

    keys.forEach((key) => {
      normalized[key] = (row?.[key] ?? '').toString()
    })

    return JSON.stringify(normalized)
  }

  /**
   * Creates a unique string from all table rows to detect add/remove/edit changes.
   */
  computeTableSignature(rows: Array<Record<string, unknown>>): string {
    return (rows || [])
      .map(row => this.getRowSignature(row))
      .sort()
      .join('||')
  }

  /**
   * Captures a table snapshot used by "unsaved changes" checks.
   */
  captureBaselineState(rows: Array<Record<string, unknown>>): UploadBaselineState {
    const tableSignature = this.computeTableSignature(rows)
    const rowSignatureByCode = new Map<string, string>()

    rows.forEach((row) => {
      const code = (row?.code ?? '').toString().trim()
      if (!code) {
        return
      }
      rowSignatureByCode.set(code, this.getRowSignature(row))
    })

    return {
      tableSignature,
      rowSignatureByCode,
    }
  }
}
