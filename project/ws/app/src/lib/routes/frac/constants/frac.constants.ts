export type FracDashboardIcon = 'upload' | 'manage' | 'map'

export const FRAC_ROUTES = {
  competencyUpload: '/app/frac/competency?mode=upload',
  competencyManage: '/app/frac/competency?mode=manage',
  activityUpload: '/app/frac/activity?mode=upload',
  activityManage: '/app/frac/activity?mode=manage',
  roleUpload: '/app/frac/role?mode=upload',
  roleManage: '/app/frac/role?mode=manage',
  positionUpload: '/app/frac/position?mode=upload',
  positionManage: '/app/frac/position?mode=manage',
  positionCardGrid: '/app/home/frac/position',
  mapActivity: '/app/frac/map-activity',
  mapRole: '/app/frac/map-role',
  mapRolePosition: '/app/frac/map-role-position',
  homeDashboard: '/app/home/frac/dashboard',
} as const

export interface FracLanguage {
  /** Display name shown in the dropdown (e.g. 'English', 'Hindi', 'Marathi') */
  label: string
  /** API language code used in all requests and file templates (e.g. 'en', 'hi', 'mr') */
  key: string
}

/**
 * Master language list. To add a new language:
 *   1. Append { label: 'Marathi', key: 'mr' } here.
 *   2. Add the template URL for each entity in FRAC_SAMPLE_TEMPLATE_URLS below.
 * No other code changes are needed.
 */
export const FRAC_LANGUAGES: readonly FracLanguage[] = [
  { label: 'English', key: 'en' },
  { label: 'Hindi', key: 'hi' },
] as const

export const FRAC_DEBOUNCE_MS = {
  searchInput: 500,
} as const

export const FRAC_DIALOG_SIZES = {
  uploadPopup: '425px',
  uploadResult: '400px',
  mapResult: '440px',
  unsavedChanges: '363px',
  mappingRequired: '425px',
  hierarchyChipDetails: '560px',
  positionHierarchyView: '860px',
} as const


export const FRAC_SNACKBAR_DURATION_MS = 3000
export const FRAC_WORD_WRAP_LIMIT = 40

export const FRAC_DASHBOARD_ICON_URLS: Record<FracDashboardIcon, string> = {
  upload: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/frac_upload_icon.svg',
  manage: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/frac_manage_icon.svg',
  map: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/map_icon.svg',
}

export const FRAC_SAMPLE_TEMPLATE_URLS = {
  competency: {
    hi: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_competency_hi_list.csv',
    en: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_competency_en_hi_list.csv',
  },
  activity: {
    hi: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_activity_hi_list.csv',
    en: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_activity_en_hi_list.csv',
  },
  role: {
    hi: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_role_hi_list.csv',
    en: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_role_en_hi_list.csv',
  },
  position: {
    hi: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_position_hi_list.csv',
    en: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_position_en_list.csv',
  },
} as const

export const FRAC_DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20] as const

export const FRAC_TABLE_LAYOUT = {
  rowHeightPx: 40,
  headerHeightPx: 40,
  containerHeightPx: 600,
} as const

export const FRAC_MAP_PAGE_SPINNER = {
  diameter: 42,
  strokeWidth: 4,
} as const

export const FRAC_UPLOAD_PAGE_SPINNER = {
  diameter: 50,
  strokeWidth: 4,
} as const

export const FRAC_LEGACY_UPLOAD_ENTITY_URL = 'https://aastrika-stage.tarento.com/api/v1/frac/entity/upload'
