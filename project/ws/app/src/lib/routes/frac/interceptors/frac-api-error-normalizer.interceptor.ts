import { Injectable } from '@angular/core'
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http'
import { Observable, from, throwError } from 'rxjs'
import { catchError, mergeMap } from 'rxjs/operators'
import { FracResponseParserUtil } from '../utils/frac-response-parser.util'

@Injectable()
export class FracApiErrorNormalizerInterceptor implements HttpInterceptor {
  private readonly fracApiPathPattern = /\/(?:apis\/proxies\/v8\/entity\/v1|api\/v1\/frac\/entity)\//i

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse) || !this.isFracRequest(req.url)) {
          // RxJS 6 (this app's version): throwError takes the error value directly —
          // it has no factory-function overload, so `throwError(() => err)` would
          // throw the function itself instead of `err`.
          return throwError(err)
        }

        if (err.error instanceof Blob) {
          return from(err.error.text()).pipe(
            mergeMap((blobText) => {
              const normalizedError = this.normalizeHttpError(err, blobText)
              return throwError(normalizedError)
            }),
            catchError(() => throwError(err)),
          )
        }

        const normalizedError = this.normalizeHttpError(err, err.error)
        return throwError(normalizedError)
      }),
    )
  }

  private isFracRequest(url: string): boolean {
    return this.fracApiPathPattern.test(url || '')
  }

  private normalizeHttpError(sourceError: HttpErrorResponse, rawPayload: unknown): HttpErrorResponse {
    const normalizedPayload = FracResponseParserUtil.parseApiResponse(rawPayload)
    return new HttpErrorResponse({
      error: normalizedPayload,
      headers: sourceError.headers,
      status: sourceError.status,
      statusText: sourceError.statusText,
      url: sourceError.url || undefined,
    })
  }
}
