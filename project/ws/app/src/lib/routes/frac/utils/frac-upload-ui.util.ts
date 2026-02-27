import { FracEntityType } from '../models/frac-api.models'
import { UploadPopupConfig } from '../models/upload-popup-config.model'
import { FRAC_SAMPLE_TEMPLATE_URLS } from '../constants/frac.constants'

type UploadTemplateEntity = Extract<FracEntityType, 'competency' | 'activity' | 'role'>

/**
 * Builds the upload popup config used by upload pages.
 * This keeps labels and text in one shared place.
 */
export function buildFracUploadPopupConfig(
  entity: UploadTemplateEntity,
  languages: readonly string[],
  defaultLanguage: string,
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
      options: [...languages],
      defaultValue: defaultLanguage,
    },
    actions: {
      secondary: { label: 'Cancel' },
      primary: { label: 'Confirm & Upload', disabled: false },
    },
    validationMessages: {
      invalidFileTypePrefix: 'Invalid file type. Allowed:',
      fileRequired: 'Please select a file first.',
      languageRequired: 'Please select language.',
    },
  }
}

/**
 * Returns sample template URL for the selected entity and language.
 * FRAC currently supports hi and en templates; non-hi falls back to en.
 */
export function getFracSampleTemplateUrl(entity: UploadTemplateEntity, languageCode: string): string {
  const normalizedLanguage = (languageCode || '').toLowerCase()
  const templateLanguage = normalizedLanguage === 'hi' ? 'hi' : 'en'
  return FRAC_SAMPLE_TEMPLATE_URLS[entity][templateLanguage]
}
