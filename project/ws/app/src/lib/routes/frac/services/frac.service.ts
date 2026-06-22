import { HttpClient } from '@angular/common/http'
import { Injectable, OnDestroy } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { IFrac } from '../interfaces/frac.model'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class FracService implements OnDestroy {
  private destroy$ = new Subject<void>()

  constructor(
    private configSvc: ConfigurationsService,
    private http: HttpClient) { }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  /**
   * Fetches FRAC widget config JSON used by the container component.
   */
  fetchFrac(): Promise<IFrac> {
    return new Promise<IFrac>((resolve, reject) => {
      this.http.get<IFrac>(`${this.configSvc.baseUrl}/feature/frac.json`).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      })
    })
  }
}
