import { FracEntityType } from '../models/frac-api.models'
import { UploadPopupConfig } from '../models/upload-popup-config.model'
import { FracLanguage, FRAC_SAMPLE_TEMPLATE_URLS } from '../constants/frac.constants'

type UploadTemplateEntity = Extract<FracEntityType, 'competency' | 'activity' | 'role' | 'position'>

/**
 * Builds the upload popup config used by upload pages.
 * This keeps labels and text in one shared place.
 */
export function buildFracUploadPopupConfig(
  entity: UploadTemplateEntity,
  languages: readonly FracLanguage[],
  defaultLanguageKey: string,
): UploadPopupConfig {
  const configByEntity: Record<UploadTemplateEntity, { title: string; subText: string }> = {
    competency: {
      title: 'Upload Competency Data',
      subText: 'Supported file formats: CSV or XLSX',
    },
    activity: {
      title: 'Upload Activity Data',
      subText: 'Supported file format: CSV or JSON',
    },
    role: {
      title: 'Upload Roles Data',
      subText: 'Supported file format: CSV or JSON',
    },
    position: {
      title: 'Upload Positions Data',
      subText: 'Supported file format: CSV or JSON',
    },
  }

  return {
    title: configByEntity[entity].title,
    subText: configByEntity[entity].subText,
    fileSection: {
      dragText: 'Drag & drop a file here',
      uploadButton: 'Upload File',
    },
    dropdown: {
      label: 'Select Language',
      placeholder: 'Language',
      options: languages.map(l => l.key),
      defaultValue: defaultLanguageKey,
    },
    actions: {
      secondary: { label: 'Cancel' },
      primary: { label: 'Confirm & Upload', disabled: false },
    },
    validationMessages: {
      invalidFileTypePrefix: 'Invalid file type. Allowed:',
      fileRequired: 'Please select a file first.',
    },
  }
}

/**
 * Returns the sample template URL for the given entity and language key.
 * Falls back to 'en' if no URL is configured for the requested key.
 * Adding a new language only requires adding its URL to FRAC_SAMPLE_TEMPLATE_URLS.
 */
export function getFracSampleTemplateUrl(entity: UploadTemplateEntity, languageKey: string): string {
  const templates = FRAC_SAMPLE_TEMPLATE_URLS[entity] as Record<string, string>
  return templates[(languageKey || '').toLowerCase()] || templates['en'] || ''
}
