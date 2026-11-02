/**
 * Models for the Form Configuration feature.
 * New to this feature — do not merge into or reuse any existing model file.
 */

export type FormApplicationType = 'ekshamata' | 'sphere'
export type FormAccessType = 'public' | 'private'
export type FormLayoutType = 'web_layout' | 'app_layout'

export interface IFormReadRequest {
  type: string
  subtype: string
  // 'get' for layouts; other stored forms use actions like 'config_public' / 'create'.
  action: string
  component: string
  framework: string
  rootOrgId: string
}

export interface IFormLayoutResult {
  type: string
  subtype: string
  action: string
  component: string
  framework: string
  rootOrgId: string
  // snake_case exactly as the API returns them — not camelCase.
  created_on?: string | null
  last_modified_on?: string | null
  data: any
}

/**
 * The create/update request body is the exact same shape as the `form` object
 * the read call returns (`IFormLayoutResult`) — confirmed against the real
 * create curl. Aliased separately so call sites can name their intent.
 */
export type IFormUpdateRequest = IFormLayoutResult

/**
 * One editable field definition inside a form layout's `data.fields` array
 * (the standard Sunbird `web_layout` shape). Loosely typed with an index
 * signature — the actual set of properties a given form config carries can
 * vary, so unrecognized properties round-trip through untouched instead of
 * being silently dropped.
 */
export interface IFormFieldConfig {
  code?: string
  type?: string
  label?: string
  placeholder?: string
  required?: boolean
  defaultValue?: any
  [key: string]: any
}

export interface IFormApiResponse {
  id?: string
  ver?: string
  ts?: string
  params?: { status?: string, errmsg?: string | null }
  responseCode?: string
  result: {
    form: IFormLayoutResult
  }
}

/**
 * One row of the Browse table — a form's identifying keys only. Built from
 * the `list` / `fetchAll` responses, which return `root_org` (snake_case,
 * unlike `read`'s `rootOrgId`) and `data` as a JSON *string*; `data` is
 * dropped on arrival (fetchAll is ~2 MB) and re-fetched via `read` on Edit.
 * `list` rows carry no timestamps, `fetchAll` rows do.
 */
export interface IFormSummary {
  type: string
  subtype: string
  action: string
  component: string
  framework: string
  rootOrgId: string
  created_on?: string | null
  last_modified_on?: string | null
}

/** Raw row shape returned by `list` / `fetchAll`. */
export interface IFormListApiItem {
  type: string
  subtype: string
  action: string
  component: string
  framework: string
  root_org: string
  created_on?: string | null
  last_modified_on?: string | null
  data?: string
}

export interface IFormListApiResponse {
  result: { forms: IFormListApiItem[], count?: number }
}
