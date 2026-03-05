import {
  FRAC_DASHBOARD_ICON_URLS,
  FRAC_DEBOUNCE_MS,
  FRAC_DIALOG_SIZES,
  FRAC_LANGUAGES,
  FRAC_LEGACY_UPLOAD_ENTITY_URL,
  FRAC_MAP_PAGE_SPINNER,
  FRAC_ROUTES,
  FRAC_SAMPLE_TEMPLATE_URLS,
  FRAC_SNACKBAR_DURATION_MS,
  FRAC_UPLOAD_PAGE_SPINNER,
  FRAC_WORD_WRAP_LIMIT,
} from '../constants/frac.constants'
import { FRAC_UI_CONFIG } from '../models/ui.config.model'

export interface FracClientConfigOverride {
  icons?: Record<string, string>
  labels?: Record<string, string>
  routes?: Record<string, string>
  dashboardIconUrls?: Record<string, string>
  sampleTemplateUrls?: Record<string, unknown>
  languages?: string[]
  dialogSizes?: Record<string, string>
  debounceMs?: {
    searchInput?: number
    [key: string]: number | undefined
  }
  snackbarDurationMs?: number
  wordWrapLimit?: number
  mapPageSpinner?: {
    diameter?: number
    strokeWidth?: number
  }
  uploadPageSpinner?: {
    diameter?: number
    strokeWidth?: number
  }
  api?: {
    endpoints?: Partial<Record<'updateEntity' | 'deleteEntity' | 'uploadEntity' | 'searchEntity' | 'mapEntity' | 'searchMapping' | 'hierarchy', string>>
    uploadEntityUrl?: string
  }
  uploadEntityUrl?: string
  featureFlags?: {
    enableRolePositionMapping?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface FracResolvedClientConfig {
  ui: {
    icons: Record<string, string>
    labels: Record<string, string>
  }
  routes: Record<string, string>
  dashboardIconUrls: Record<string, string>
  sampleTemplateUrls: typeof FRAC_SAMPLE_TEMPLATE_URLS
  languages: readonly string[]
  dialogSizes: Record<string, string>
  debounceMs: {
    searchInput: number
  }
  snackbarDurationMs: number
  wordWrapLimit: number
  mapPageSpinner: {
    diameter: number
    strokeWidth: number
  }
  uploadPageSpinner: {
    diameter: number
    strokeWidth: number
  }
  api: {
    endpoints: {
      updateEntity: string
      deleteEntity: string
      uploadEntity: string
      searchEntity: string
      mapEntity: string
      searchMapping: string
      hierarchy: string
    }
    uploadEntityUrl: string
  }
  featureFlags: {
    enableRolePositionMapping: boolean
  }
}

interface FracRootInstanceConfig {
  frac?: FracClientConfigOverride
}

const FRAC_DEFAULT_API_ENDPOINTS = {
  updateEntity: '/apis/proxies/v8/entity/v1/update',
  deleteEntity: '/apis/proxies/v8/entity/v1/delete',
  uploadEntity: '/apis/proxies/v8/entity/v1/upload',
  searchEntity: '/apis/proxies/v8/entity/v1/search',
  mapEntity: '/apis/proxies/v8/entity/v1/mapping',
  searchMapping: '/apis/proxies/v8/entity/v1/mapping/search',
  hierarchy: '/apis/proxies/v8/entity/v1/hierarchy',
} as const

function safeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getOverride(instanceConfig: unknown): FracClientConfigOverride {
  const rootConfig = (instanceConfig || {}) as FracRootInstanceConfig
  return (rootConfig.frac || {}) as FracClientConfigOverride
}

function resolveUiConfig(override: FracClientConfigOverride): FracResolvedClientConfig['ui'] {
  return {
    icons: {
      ...FRAC_UI_CONFIG.icons,
      ...(override.icons || {}),
    },
    labels: {
      ...FRAC_UI_CONFIG.labels,
      ...(override.labels || {}),
    },
  }
}

function resolveRoutes(override: FracClientConfigOverride): FracResolvedClientConfig['routes'] {
  return {
    ...FRAC_ROUTES,
    ...(override.routes || {}),
  }
}

function resolveDashboardIcons(override: FracClientConfigOverride): FracResolvedClientConfig['dashboardIconUrls'] {
  return {
    ...FRAC_DASHBOARD_ICON_URLS,
    ...(override.dashboardIconUrls || {}),
  }
}

function resolveSampleTemplateUrls(override: FracClientConfigOverride): FracResolvedClientConfig['sampleTemplateUrls'] {
  return {
    ...FRAC_SAMPLE_TEMPLATE_URLS,
    ...(override.sampleTemplateUrls || {}),
  } as typeof FRAC_SAMPLE_TEMPLATE_URLS
}

function resolveLanguages(override: FracClientConfigOverride): readonly string[] {
  return Array.isArray(override.languages) && override.languages.length
    ? override.languages
    : FRAC_LANGUAGES
}

function resolveDialogSizes(override: FracClientConfigOverride): FracResolvedClientConfig['dialogSizes'] {
  return {
    ...FRAC_DIALOG_SIZES,
    ...(override.dialogSizes || {}),
  }
}

function resolveDebounceMs(override: FracClientConfigOverride): FracResolvedClientConfig['debounceMs'] {
  return {
    ...FRAC_DEBOUNCE_MS,
    ...((override.debounceMs || {}) as Partial<typeof FRAC_DEBOUNCE_MS>),
  }
}

function resolveMapPageSpinner(override: FracClientConfigOverride): FracResolvedClientConfig['mapPageSpinner'] {
  return {
    diameter: safeNumber(override.mapPageSpinner?.diameter, FRAC_MAP_PAGE_SPINNER.diameter),
    strokeWidth: safeNumber(override.mapPageSpinner?.strokeWidth, FRAC_MAP_PAGE_SPINNER.strokeWidth),
  }
}

function resolveUploadPageSpinner(override: FracClientConfigOverride): FracResolvedClientConfig['uploadPageSpinner'] {
  return {
    diameter: safeNumber(override.uploadPageSpinner?.diameter, FRAC_UPLOAD_PAGE_SPINNER.diameter),
    strokeWidth: safeNumber(override.uploadPageSpinner?.strokeWidth, FRAC_UPLOAD_PAGE_SPINNER.strokeWidth),
  }
}

function resolveApiConfig(override: FracClientConfigOverride): FracResolvedClientConfig['api'] {
  const apiOverride = override.api || {}
  const apiEndpoints = {
    ...FRAC_DEFAULT_API_ENDPOINTS,
    ...(apiOverride.endpoints || {}),
  }

  return {
    endpoints: apiEndpoints,
    uploadEntityUrl: apiOverride.uploadEntityUrl || override.uploadEntityUrl || FRAC_LEGACY_UPLOAD_ENTITY_URL,
  }
}

function resolveFeatureFlags(override: FracClientConfigOverride): FracResolvedClientConfig['featureFlags'] {
  return {
    enableRolePositionMapping: override.featureFlags?.enableRolePositionMapping !== false,
  }
}

/**
 * Returns a merged FRAC config where client overrides come from `instanceConfig.frac`.
 * Defaults are always preserved to keep behavior backward compatible.
 */
export function resolveFracClientConfig(instanceConfig: unknown): FracResolvedClientConfig {
  const override = getOverride(instanceConfig)

  return {
    ui: resolveUiConfig(override),
    routes: resolveRoutes(override),
    dashboardIconUrls: resolveDashboardIcons(override),
    sampleTemplateUrls: resolveSampleTemplateUrls(override),
    languages: resolveLanguages(override),
    dialogSizes: resolveDialogSizes(override),
    debounceMs: resolveDebounceMs(override),
    snackbarDurationMs: safeNumber(override.snackbarDurationMs, FRAC_SNACKBAR_DURATION_MS),
    wordWrapLimit: safeNumber(override.wordWrapLimit, FRAC_WORD_WRAP_LIMIT),
    mapPageSpinner: resolveMapPageSpinner(override),
    uploadPageSpinner: resolveUploadPageSpinner(override),
    api: resolveApiConfig(override),
    featureFlags: resolveFeatureFlags(override),
  }
}
