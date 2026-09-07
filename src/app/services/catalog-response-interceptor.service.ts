import { Injectable } from '@angular/core'
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * Normalizes the /apis/protected/v8/catalog response to a plain array.
 *
 * The Sunbird catalog API returns a wrapped object:
 *   { responseCode: "OK", result: [...] }
 * but ws-widget-btn-catalog (from @sunbird-cb/collection) passes the raw body
 * straight to Angular's SlicePipe, which in Angular 20 throws
 * NG02100 InvalidPipeArgument when it receives an object instead of an array.
 * We cannot modify the widget (it ships from npm), so we unwrap the envelope here.
 */
@Injectable({ providedIn: 'root' })
export class CatalogResponseInterceptorService implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/v8/catalog')) {
      return next.handle(req)
    }
    return next.handle(req).pipe(
      map(event => {
        if (!(event instanceof HttpResponse) || Array.isArray(event.body)) {
          return event
        }
        if (event.body && typeof event.body === 'object') {
          return event.clone({ body: this.extractCatalogArray(event.body.result) })
        }
        return event
      }),
    )
  }

  /**
   * Walks the known Sunbird catalog response shapes to find the actual array.
   * Always returns an array — if nothing matched, returns [] so SlicePipe never
   * sees an object. The menu will show "No categories" which is safe.
   */
  private extractCatalogArray(result: any): any[] {
    if (Array.isArray(result)) {
      return result
    }
    if (!result || typeof result !== 'object') {
      return []
    }
    for (const key of ['catalog', 'data', 'content', 'children', 'list', 'items']) {
      if (Array.isArray(result[key])) {
        return result[key]
      }
    }
    if (result.response && Array.isArray(result.response.content)) {
      return result.response.content
    }
    return []
  }
}
