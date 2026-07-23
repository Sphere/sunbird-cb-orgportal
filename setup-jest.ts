import '@angular/localize/init'
import 'jest-preset-angular/setup-jest'

// Polyfill Blob.text() for jsdom environments that don't implement it
if (typeof globalThis.Blob !== 'undefined' && !globalThis.Blob.prototype.text) {
  globalThis.Blob.prototype.text = function(this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(this)
    })
  }
}
