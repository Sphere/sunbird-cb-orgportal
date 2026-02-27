export interface FracUiIconConfig {
  home: string
  back: string
  remove: string
  edit: string
  uploadDocs: string
}

export interface FracUiLabelConfig {
  home: string
  save: string
  saving: string
  uploadCompetency: string
  uploadCompetencySub: string
  uploadActivity: string
  uploadActivitySub: string
  uploadRole: string
  uploadRoleSub: string
  searchPlaceholder: string
  language: string
  remove: string
  edit: string
  downloadSample: string
  uploadLoaderContent: string
  uploadLoaderSubtext: string
}

export interface FracUiConfig {
  icons: FracUiIconConfig
  labels: FracUiLabelConfig
}

/**
 * Default FRAC UI config. Client-specific overrides can be provided from `instanceConfig.frac`.
 */
export const FRAC_UI_CONFIG = {
  icons: {
    home: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/home-frac.svg',
    back: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/frac-left-arrow.svg',
    remove: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/delete_red_icon.svg',
    edit: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/edit_blue_icon.svg',
    uploadDocs: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/icons/upload_docs_icon.svg',
  },
  labels: {
    home: 'Home',
    save: 'Save',
    saving: 'Saving...',
    uploadCompetency: 'Upload Competency',
    uploadCompetencySub: 'Upload Competency File (CSV or XLSX)',
    uploadActivity: 'Upload Activity',
    uploadActivitySub: 'Upload Activity File (CSV or XLSX)',
    uploadRole: 'Upload Role',
    uploadRoleSub: 'Upload Role File (CSV or XLSX)',
    searchPlaceholder: 'Search by name, code',
    language: 'Language',
    remove: 'Remove',
    edit: 'Edit',
    downloadSample: 'Download sample',
    uploadLoaderContent: 'Uploading and processing your file...',
    uploadLoaderSubtext: 'Please wait...',
  },
} as FracUiConfig
