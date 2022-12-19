import { Component, OnInit, OnDestroy, ViewChild, Self } from '@angular/core'
import { MatPaginator } from '@angular/material'
import { ActivatedRoute, Router } from '@angular/router'
// tslint:disable-next-line
import _ from 'lodash'
import { map } from 'rxjs/operators'
import { UsersService } from '../../../users/services/users.service'
import { UtilityService } from '../../services/utility.service'
@Component({
  selector: 'app-competencies',
  templateUrl: './competencies.component.html',
  styleUrls: ['./competencies.component.scss'],
  providers: [UtilityService],
})
export class CompetenciesComponent implements OnInit, OnDestroy {
  tableData: any
  usersData: any
  topBarConfig: any

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator | undefined

  constructor(private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService, @Self() private utilityService: UtilityService) { }

  ngOnInit() {
    this.topBarConfig = {
      right: [
        {
          type: 'button',
          title: 'Add Competency',
          actioName: 'addCompetency',
        }
      ],
    }
    this.tableData = {
      columns: [
        { displayName: 'Full Name', key: 'fullName' },
        { displayName: 'Competency', key: 'competency' },
        { displayName: 'Designation', key: 'designation' },
        { displayName: 'State', key: 'state' },
        { displayName: 'City', key: 'city' },
        { displayName: 'Block', key: 'block' },

      ],
      needCheckBox: true,
      needHash: false,
      sortColumn: 'dateCreatedOn',
      sortState: 'desc',
      needUserMenus: false,

    }
    this.getAllUserCompetency()
  }

  ngOnDestroy() { }

  getAllUserCompetency() {
    const rootOrgId = _.get(this.route.snapshot.parent, 'data.configService.unMappedUser.rootOrg.rootOrgId')
    this.usersService.getAllKongUsers(rootOrgId).pipe(map((data: any) => {
      return this.utilityService.getFormatedRequest(data.result.response)
    })).subscribe(data => {
      this.usersData = data
    })
  }
  searchByEnterKey(event: any) {
    if (_.isEmpty(event)) {
      this.getAllUserCompetency()
    }
  }

  onRowClick(event: any) {
    this.router.navigate([`app/home/competencies/${event.userId}`])
  }
}

export interface IPeriodicElement {
  Full_Name: string
  Designation: string
  State: string
  City: string
  Block: string
  Sub_Centre: string
  Competency_Status: string
}
