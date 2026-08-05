import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { EventService } from '../../services/event.service'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-app-event',
  templateUrl: './app-event.component.html',
  styleUrls: ['./app-event.component.scss'],
})
export class AppEventComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  data: any
  error = false
  isRegisteredUser = false
  isEnabled = true
  pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly appEventSvc: EventService,
    private readonly configSvc: ConfigurationsService,
  ) { }

  ngOnInit() {
    this.appEventSvc.bannerisEnabled.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.isEnabled = data
    })
    this.activatedRoute.data.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (data.eventdata && data.eventdata.data) {
        this.data = data.eventdata.data
        this.isRegisteredUser = this.data.RegistrationStatus.RegisteredUser === 'true'
      } else if (!data.eventdata || data.eventdata.error) {
        this.error = true
      }
    })

  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

}
