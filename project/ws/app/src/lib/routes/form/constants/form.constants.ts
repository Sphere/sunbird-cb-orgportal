import { FormApplicationType, FormAccessType, FormLayoutType, IFormFieldConfig } from '../models/form.model'

export const FORM_APPLICATION_TYPES: { label: string; value: FormApplicationType }[] = [
  { label: 'Ekshamata', value: 'ekshamata' },
  { label: 'Sphere', value: 'sphere' },
]

export const FORM_LAYOUT_TYPES: { label: string; value: FormLayoutType }[] = [
  { label: 'Web Layout', value: 'web_layout' },
  { label: 'App Layout', value: 'app_layout' },
]

export const FORM_ACCESS_TYPES: { label: string; value: FormAccessType }[] = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

// Application type -> the `component` value the form-service payload expects.
export const FORM_COMPONENT_BY_APP_TYPE: Record<FormApplicationType, string> = {
  ekshamata: 'ekshamata',
  sphere: 'web',
}

// One org can hold both a '*' and a 'v2' form for the same layout, so New Form
// asks for the framework explicitly instead of inferring it from Access.
export const FORM_FRAMEWORKS: { label: string; value: string }[] = [
  { label: '* (default)', value: '*' },
  { label: 'v2', value: 'v2' },
]

export type FormBrowseScope = 'public' | 'org' | 'all'

export const FORM_BROWSE_SCOPES: { label: string; value: FormBrowseScope }[] = [
  { label: 'Public', value: 'public' },
  { label: 'Organization', value: 'org' },
  { label: 'All forms', value: 'all' },
]

export const FORM_PREVIEW_DIALOG = {
  width: '1400px',
  maxWidth: '95vw',
  maxHeight: '85vh',
}

export const FORM_LAYOUT_DEFAULTS = {
  subtype: 'v1',
  privateFramework: 'v2',
  publicFramework: '*',
  publicRootOrgId: '*',
}

// "Select or add" options offered next to Add Field — 'Custom Field' is the
// blank fallback, the rest prefill common properties for known field kinds.
export const FORM_FIELD_TEMPLATES: { label: string; template: Partial<IFormFieldConfig> }[] = [
  { label: 'Custom Field', template: { code: '', type: 'text', label: '', placeholder: '', required: false, defaultValue: '' } },
  { label: 'Full Name', template: { code: 'name', type: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true } },
  { label: 'Email', template: { code: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true } },
  { label: 'Mobile Number', template: { code: 'mobile', type: 'text', label: 'Mobile Number', placeholder: 'Enter your mobile number' } },
  { label: 'Designation', template: { code: 'designation', type: 'text', label: 'Designation', placeholder: 'Enter designation' } },
  { label: 'Department', template: { code: 'department', type: 'text', label: 'Department', placeholder: 'Enter department' } },
  { label: 'Date of Birth', template: { code: 'dob', type: 'date', label: 'Date of Birth' } },
  { label: 'Gender', template: { code: 'gender', type: 'select', label: 'Gender' } },
]

export const FORM_ROUTES = {
  config: '/app/home/form/config',
}

// Max size of a .json file the node editor will import (bytes).
export const FORM_JSON_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
