import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router, NavigationEnd, Event } from '@angular/router'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-position',
  templateUrl: './position.component.html',
  styleUrls: ['./position.component.scss'],
})
export class PositionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()
  professionalDetails: any
  employmentDetails: any
  constructor(private activeRoute: ActivatedRoute, private router: Router) {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        // const profileData = this.activeRoute.snapshot.data.profileData.data.result.UserProfile[0] || {}
        const profileData = this.activeRoute.snapshot.data.profileData.data.result.response.profileDetails || {}
        this.professionalDetails = profileData.professionalDetails[0]
        this.employmentDetails = profileData.employmentDetails
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnInit() { }
}
