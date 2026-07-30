import { TextDecoder, TextEncoder } from 'util'

Object.assign(global, { TextEncoder, TextDecoder })
;(window as { [key: string]: any })['env'] = (window as { [key: string]: any })['env'] || {}

import '@angular/localize/init'
import 'jest-preset-angular/setup-jest'
