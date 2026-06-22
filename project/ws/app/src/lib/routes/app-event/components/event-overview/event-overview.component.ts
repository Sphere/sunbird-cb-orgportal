import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { IEventDetails } from '../../interfaces/event-details.model'
import { EventService } from '../../services/event.service'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-event-overview',
  templateUrl: './event-overview.component.html',
  styleUrls: ['./event-overview.component.scss'],
})
export class EventOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  data: IEventDetails[] = []
  eventFooter: any
  constructor(
    private activatedRoute: ActivatedRoute,
    private appEventSvc: EventService,
  ) { }

  ngOnInit() {
    this.appEventSvc.bannerisEnabled.next(true)
    if (this.activatedRoute.parent) {
      this.activatedRoute.parent.data.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
        this.data = []
        this.eventFooter = data.eventdata.data.Home
        Object.keys(data.eventdata.data.Home.SessionTypes).forEach((v: any) => {
          this.data.push({
            plannedImage: data.eventdata.data.Home.SessionTypes[v].SessionTypeImage,
            plannedName: data.eventdata.data.Home.SessionTypes[v].SessionTypeTitle,
            plannedDetails: data.eventdata.data.Home.SessionTypes[v].SessionTypeBody,
          })
        })
      })
    }

  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

}
