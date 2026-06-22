import { Injectable, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { fromEvent, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { NAVIGATION_DATA_INCOMING } from '../models/mobile-events.model'

@Injectable({
  providedIn: 'root',
})
export class NavigationExternalService implements OnDestroy {
  private destroy$ = new Subject<void>()

  dummy = 1
  constructor(private router: Router) {
    fromEvent(document, NAVIGATION_DATA_INCOMING).pipe(takeUntil(this.destroy$)).subscribe((event: CustomEventInit) => {
      this.navigateTo(event.detail.url, event.detail.params)
    })
  }
  init() {
    this.dummy += 1
  }
  navigateTo(url: string, params?: any) {
    const newParams = params || {}
    newParams.ref = encodeURIComponent(newParams.ref || this.router.url.replace(/ref=[^&]*&?/, '').replace(/\?$/, ''))
    this.router.navigate([url], { queryParams: newParams })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
