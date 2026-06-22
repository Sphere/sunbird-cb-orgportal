import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router, NavigationEnd, Event } from '@angular/router'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-education',
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.scss'],
})
export class EducationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()
  academicDetails: any
  constructor(private activeRoute: ActivatedRoute, private router: Router) {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        // const profileData = this.activeRoute.snapshot.data.profileData.data.result.UserProfile[0] || {}
        const profileData = this.activeRoute.snapshot.data.profileData.data.result.response.profileDetails || {}
        this.academicDetails = profileData.academics
      }
    })
  }
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnInit() { }
}
