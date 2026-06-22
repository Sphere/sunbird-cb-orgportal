import { Component, OnInit, OnDestroy } from '@angular/core'
import { ConfigurationsService, NsPage, ValueService } from '@sunbird-cb/utils'
import { Subject, Subscription } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-meetup',
  templateUrl: './meetup.component.html',
  styleUrls: ['./meetup.component.scss'],
})
export class MeetupComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar
  navBarTitle = 'iGOT Meetup Platform'
  screenSubscription: Subscription | null = null

  constructor(
    private configSvc: ConfigurationsService,
    private valSvc: ValueService,
  ) { }

  ngOnInit() {
    this.screenSubscription = this.valSvc.isLtMedium$.pipe(takeUntil(this.destroy$)).subscribe(isLtSMed => {
      if (isLtSMed) {
        this.navBarTitle = ''
      }
    })

    this.screenSubscription = this.valSvc.isXSmall$.pipe(takeUntil(this.destroy$)).subscribe(isXSmall => {
      if (isXSmall) {
        this.navBarTitle = ''
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

}
