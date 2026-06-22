import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router, NavigationEnd, Event } from '@angular/router'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-certification-and-skills',
  templateUrl: './certification-and-skills.component.html',
  styleUrls: ['./certification-and-skills.component.scss'],
})
export class CertificationAndSkillsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  skillDetails: any
  interests: any

  constructor(private activeRoute: ActivatedRoute, private router: Router) {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        // const profileData = this.activeRoute.snapshot.data.profileData.data.result.UserProfile[0] || {}
        const profileData = this.activeRoute.snapshot.data.profileData.data.result.response.profileDetails || {}
        this.skillDetails = profileData.skills
        this.interests = profileData.interests
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnInit() { }

}
