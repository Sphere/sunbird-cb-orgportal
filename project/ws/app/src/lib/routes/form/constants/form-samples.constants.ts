import { FormLayoutType } from '../models/form.model'
import webLayoutSample from './samples/web_layout.sample.json'
import appLayoutSample from './samples/app_layout.sample.json'

/**
 * Sample `data` per layout Type, for New Form's "Download sample JSON".
 * Generated from real staging forms (web_layout/ekshamata org
 * 013979705730662400309 and app_layout/app org 014005962721189888281,
 * framework '*'), with every list of objects trimmed to its first 2 items and
 * every value inside `orgData` emptied (keys kept) — shows every key and the nesting
 * without the ~18 KB / ~10 KB bulk. Edit the .json files to change them.
 */
export const FORM_SAMPLE_DATA: Record<FormLayoutType, Record<string, unknown>> = {
  web_layout: webLayoutSample,
  app_layout: appLayoutSample,
}

/**
 * New Form's "Empty form" starting point — the real top-level keys per Type.
 * The two Types have different shapes: app_layout is `{ orgData, schemas }`,
 * not the web_layout `LAYOUT_*` sections.
 */
export const FORM_EMPTY_DATA: Record<FormLayoutType, Record<string, unknown>> = {
  web_layout: { orgData: {}, LAYOUT_HEADER: {}, LAYOUT_BODY: {}, LAYOUT_FOOTER: {} },
  app_layout: { orgData: {}, schemas: {} },
}
