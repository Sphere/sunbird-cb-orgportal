import { Component, OnInit, Self, ViewChild } from '@angular/core'
import { MatPaginator } from '@angular/material'
import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { map } from 'rxjs/operators'
import { UsersService } from '../../../users/services/users.service'
import { UtilityService } from '../../services/utility.service'

@Component({
  selector: 'ws-app-self-assessment',
  templateUrl: './self-assessment.component.html',
  styleUrls: ['./self-assessment.component.scss'],
  providers: [UtilityService]
})
export class SelfAssessmentComponent implements OnInit {
  tableData: any
  usersData: any
  topBarConfig: any

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator | undefined

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    @Self() private utilityService: UtilityService
  ) { }

  ngOnInit() {
    this.initialization()
  }

  initialization() {
    this.topBarConfig = {
      left: [{}],
      right: [
        {
          type: 'anchor',
          title: 'Reset Assessment',
          actioName: 'resetAssessment',
        },
        {
          type: 'button',
          title: 'Enable Self Assessment',
          actioName: 'enableSelfAssessment',
        },
      ],
    }

    this.tableData = {
      actions: [{ name: 'Reset', label: 'Reset', type: 'link' }],
      columns: [
        { displayName: 'Full Name', key: 'fullName' },
        { displayName: 'Designation', key: 'designation' },
        { displayName: 'State', key: 'state' },
        { displayName: 'City', key: 'city' },
        { displayName: 'Block', key: 'block' },
        { displayName: 'Sub Center', key: 'subCenter' },
        { displayName: 'Self Assessment Status', key: 'selfAssessmentStatus', status: 'enable' },

      ],
      needCheckBox: true,
      needHash: false,
      sortColumn: 'dateCreatedOn',
      sortState: 'desc',
      needUserMenus: false,

    }

    this.getAllUserSelfAssessment()
  }

  getAllUserSelfAssessment() {
    const rootOrgId = _.get(this.route.snapshot.parent, 'data.configService.unMappedUser.rootOrg.rootOrgId')
    this.usersService.getAllKongUsers(rootOrgId).pipe(map((data: any) => {
      return this.utilityService.getFormatedRequest(data.result.response)
    })).subscribe(data => {
      this.usersData = data
    })
  }

  searchByEnterKey(event: any) {
    if (_.isEmpty(event)) {
      this.getAllUserSelfAssessment()
    }
  }

}

