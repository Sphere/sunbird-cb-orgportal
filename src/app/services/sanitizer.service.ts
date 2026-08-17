import { Injectable } from '@angular/core'
import { DomSanitizer, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser'

@Injectable({
  providedIn: 'root',
})
export class SanitizerService {
  constructor(private readonly domSanitizer: DomSanitizer) { }

  /**
   * Relative paths (e.g. 'mdo-assets/icons/pin.svg', '/frac') and http(s) URLs
   * are safe; any other URI scheme (javascript:, data:, vbscript:, ...) is
   * rejected. Guards against script-executing schemes when the value
   * originates from remote config or CMS content rather than a compile-time
   * constant.
   */
  isHttpUrl(value: string): boolean {
    if (typeof value !== 'string') {
      return false
    }
    const trimmed = value.trim()
    const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)
    return !schemeMatch || /^https?$/i.test(schemeMatch[1])
  }

  /**
   * Rejects anything that isn't a plain http(s)/relative URL before bypassing
   * sanitization, so a javascript:/data: URI from remote config or CMS content
   * can never reach the DOM as a trusted resource URL.
   */
  trustResourceUrl(value: string): SafeResourceUrl {
    if (!this.isHttpUrl(value)) {
      return this.domSanitizer.bypassSecurityTrustResourceUrl('')
    }
    return this.domSanitizer.bypassSecurityTrustResourceUrl(value)
  }

  trustUrl(value: string): SafeUrl {
    if (!this.isHttpUrl(value)) {
      return this.domSanitizer.bypassSecurityTrustUrl('')
    }
    return this.domSanitizer.bypassSecurityTrustUrl(value)
  }

  /**
   * Builds a `url('...')` CSS value from a plain http(s)/relative URL,
   * rejecting anything else and escaping quotes so the URL can't break out
   * of the CSS url() context.
   */
  trustStyleUrl(url: string): SafeStyle {
    if (!this.isHttpUrl(url)) {
      return this.domSanitizer.bypassSecurityTrustStyle('')
    }
    const escaped = url.replace(/'/g, '%27')
    return this.domSanitizer.bypassSecurityTrustStyle(`url('${escaped}')`)
  }

  trustScript(value: string): SafeScript {
    return this.domSanitizer.bypassSecurityTrustScript(value)
  }
}
