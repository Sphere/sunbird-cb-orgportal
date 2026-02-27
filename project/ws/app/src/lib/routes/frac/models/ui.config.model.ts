export interface FracUiIconConfig {
  home: string
  back: string
  remove: string
  edit: string
  uploadDocs: string
  manage: string
  upload: string
}

export interface FracUiLabelConfig {
  home: string
  save: string
  saving: string
  uploadCompetency: string
  uploadCompetencySub: string
  manageCompetency: string
  manageCompetencySub: string
  uploadActivity: string
  uploadActivitySub: string
  manageActivity: string
  manageActivitySub: string
  uploadRole: string
  uploadRoleSub: string
  manageRole: string
  manageRoleSub: string
  uploadPosition: string
  uploadPositionSub: string
  managePosition: string
  managePositionSub: string
  managePositionBtn: string
  uploadPositionBtn: string
  viewEdit: string
  removePosition: string
  noPositionsFound: string
  noPositionsFoundMsg: string
  noPositionsFoundSuggestion: string
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
    manage: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/frac_manage_icon.svg',
    upload: 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/frac_upload_icon.svg',
  },
  labels: {
    home: 'Home',
    save: 'Save',
    saving: 'Saving...',
    uploadCompetency: 'Upload Competency',
    uploadCompetencySub: 'Upload Competency File (CSV or XLSX)',
    manageCompetency: 'Manage Competency',
    manageCompetencySub: 'Uploaded competencies are listed below. You can view, edit, or delete them as needed.',
    uploadActivity: 'Upload Activity',
    uploadActivitySub: 'Upload Activity File (CSV or XLSX)',
    manageActivity: 'Manage Activity',
    manageActivitySub: 'Uploaded activities are listed below. You can view, edit, or delete them as needed.',
    uploadRole: 'Upload Role',
    uploadRoleSub: 'Upload Role File (CSV or XLSX)',
    manageRole: 'Manage Role',
    manageRoleSub: 'Uploaded roles are listed below. You can view, edit, or delete them as needed.',
    uploadPosition: 'Upload Positions',
    uploadPositionSub: 'Upload position file (CSV or JSON)',
    managePosition: 'Manage Position',
    managePositionSub: 'Uploaded positions are listed below. You can view, edit, or delete them as needed',
    managePositionBtn: 'Manage Position',
    uploadPositionBtn: 'Upload Position',
    viewEdit: 'View / Edit',
    removePosition: 'Remove',
    noPositionsFound: 'No positions found',
    noPositionsFoundMsg: 'No positions have been uploaded yet.',
    noPositionsFoundSuggestion: 'Upload a position file to get started.',
    searchPlaceholder: 'Search by name, code',
    language: 'Language',
    remove: 'Remove',
    edit: 'Edit',
    downloadSample: 'Download sample',
    uploadLoaderContent: 'Uploading and processing your file...',
    uploadLoaderSubtext: 'Please wait...',
  },
} as FracUiConfig
