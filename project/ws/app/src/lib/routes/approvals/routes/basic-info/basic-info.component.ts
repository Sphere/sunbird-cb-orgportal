import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router, NavigationEnd, Event } from '@angular/router'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
// import { ConfigurationsService } from '@sunbird-cb/utils'

@Component({
  standalone: false,
  selector: 'ws-app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss'],
})
export class BasicInfoComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  basicInfo: any
  imagePath: any
  constructor(private readonly activeRoute: ActivatedRoute, private readonly router: Router) {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        // const profileData = this.activeRoute.snapshot.data.profileData.data.result.UserProfile[0] || {}
        const profileData = this.activeRoute.snapshot.data.profileData.data.result.response.profileDetails || {}
        // if (this.configSvc.userProfile && this.configSvc.userProfile.departmentName) {
        //   this.configSvc.userProfile.departmentName = _.get(this.activeRoute, 'snapshot.data.department.data.deptName')
        // }
        this.basicInfo = profileData.personalDetails
        this.imagePath = profileData.photo
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnInit() { }
  changeToGlobalSymbol($event: any) {
    $event.target.src = '/assets/images/profile/blank-profilePcture.png'
  }
}
