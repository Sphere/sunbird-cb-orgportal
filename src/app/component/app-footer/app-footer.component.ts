import { Component, OnDestroy } from '@angular/core'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
})
export class AppFooterComponent implements OnDestroy {
  private destroy$ = new Subject<void>()

  isXSmall = false
  termsOfUser = true

  constructor(
    private configSvc: ConfigurationsService,
    private valueSvc: ValueService
  ) {
    if (this.configSvc.restrictedFeatures) {
      if (this.configSvc.restrictedFeatures.has('termsOfUser')) {
        this.termsOfUser = false
      }
    }
    this.valueSvc.isXSmall$.pipe(takeUntil(this.destroy$)).subscribe(isXSmall => {
      this.isXSmall = isXSmall
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

}
