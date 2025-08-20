import { Component, OnInit, ViewEncapsulation } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
// import {
//   dashboardListData,
//   mapFilePath,
//   dashboardOneData,
//   dashboardOneLastMonthData,
//   dashboardTwoData,
//   dashboardThreeData,
//   dashboardFourData,
//   dashboardFiveData,
//   dashboardSixData,
//   dashboardEmptyData,
// } from '../../../../../../../../../src/mdo-assets/data/data'
import { HttpClient } from '@angular/common/http'

@Component({
  selector: 'ws-app-my-dashboard-home',
  templateUrl: './my-dashboard-home.component.html',
  styleUrls: ['./my-dashboard-home.component.scss'],
  /* tslint:disable-next-line */
  encapsulation: ViewEncapsulation.None,
  /* tslint:enable */
})
export class MyDashboardHomeComponent implements OnInit {

  constructor(private router: Router, private configSvc: ConfigurationsService, private http: HttpClient) { }
  // pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar

  // selectedDashboardId = ''

  // dashboardList = dashboardListData

  // mapPath = mapFilePath

  // currentDashboard: any = []

  // dashboardOne = dashboardOneData

  // dashboardOneLastMonth = dashboardOneLastMonthData

  // dashboardTwo = dashboardTwoData

  // dashboardThree = dashboardThreeData

  // dashboardFour = dashboardFourData

  // dashboardFive = dashboardFiveData

  // dashboardSix = dashboardSixData

  // dashboardEmpty = dashboardEmptyData
  selectedIndex = 0
  dashboardData: any = []
  ngOnInit() {
    this.loadDashboardBasedOnOrg()
    console.log("this.configSvc.userProfile.rootOrgId", this.configSvc?.userProfile?.rootOrgId)
    // if (this.selectedDashboardId === '') {
    //   this.selectedDashboardId = this.dashboardList[0].responseData[0].id
    //   this.currentDashboard.push(this.dashboardOne)
    // }
  }
  loadDashboardBasedOnOrg(): void {
    const orgPowerBiDashboardUrl = `https://aastar-assets.s3.ap-south-1.amazonaws.com/orgPowerBiDashboard.json?cb=${Date.now()}`
    // const orgPowerBiDashboardUrl = `mdo-assets/files/orgPowerBiDashboard.json?cb=${Date.now()}`
    this.http.get<any>(orgPowerBiDashboardUrl).subscribe(
      data => {
        const currentOrgId = this.configSvc?.userProfile?.rootOrgId
        const orgData = data.organisations.find((org: any) => org.orgId === currentOrgId)

        if (orgData && orgData.reportRefs) {
          this.dashboardData = orgData.reportRefs
            .map((ref: any) => data.reports[ref])
            .filter((report: any) => !!report)
        } else {
          this.dashboardData = []
        }

        console.log('Loaded dashboard reports:', this.dashboardData)
      },
      error => {
        console.error('Error fetching org power bi dashboard:', error)
      }
    )
  }


  // getDashboardId(value: string) {
  //   this.selectedDashboardId = value

  //   if (this.selectedDashboardId === 'workAllocation') {
  //     this.currentDashboard = []
  //     this.currentDashboard.push(this.dashboardOne)
  //   } else if (this.selectedDashboardId === 'cbpOverview') {
  //     this.currentDashboard = []
  //     this.currentDashboard.push(this.dashboardTwo)
  //   } else if (this.selectedDashboardId === 'pltEnage') {
  //     this.currentDashboard = []
  //     this.currentDashboard.push(this.dashboardThree)
  //   } else if (this.selectedDashboardId === 'overallStatus') {
  //     this.currentDashboard = []
  //     this.currentDashboard.push(this.dashboardFour)
  //   } else {
  //     this.currentDashboard = []
  //     this.currentDashboard.push(this.dashboardEmpty)
  //   }
  // }

  backToHome() {
    this.router.navigate(['page', 'home'])
  }

}
