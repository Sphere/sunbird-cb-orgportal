import { TextDecoder, TextEncoder } from 'util'
import { Blob as NodeBlob } from 'buffer'

Object.assign(global, { TextEncoder, TextDecoder })
;(window as { [key: string]: any })['env'] = (window as { [key: string]: any })['env'] || {}

// jsdom's Blob doesn't implement .text()/.arrayBuffer() (standard Web APIs
// present in real browsers and Node 18+); swap in Node's Blob so code that
// awaits blob.text() works the same under Jest as it does at runtime.
if (typeof Blob === 'undefined' || typeof Blob.prototype.text !== 'function') {
  Object.assign(global, { Blob: NodeBlob })
  Object.assign(window, { Blob: NodeBlob })
}

// jsdom's Blob doesn't implement .text()/.arrayBuffer() (standard Web APIs
// present in real browsers and Node 18+); swap in Node's Blob so code that
// awaits blob.text() works the same under Jest as it does at runtime.
if (typeof Blob === 'undefined' || typeof Blob.prototype.text !== 'function') {
  Object.assign(global, { Blob: NodeBlob })
  Object.assign(window, { Blob: NodeBlob })
}

import '@angular/localize/init'
import 'jest-preset-angular/setup-jest'
