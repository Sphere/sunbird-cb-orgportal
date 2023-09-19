import { Component, OnDestroy, OnInit } from '@angular/core'
import { NSProfileDataV2 } from '../../models/profile-v2.model'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { UsersService } from '../../../users/services/users.service'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
import { environment } from 'src/environments/environment'
import { ITableData } from '@sunbird-cb/collection/lib/ui-org-table/interface/interfaces'
import { MatSnackBar } from '@angular/material'
import { EventService } from '@sunbird-cb/utils'
import { NsContent } from '@sunbird-cb/collection'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { FilterDialogComponent } from '../../../../../../../../../src/app/plugins/skill/components/filter-dialog/filter-dialog.component'

@Component({
  selector: 'ws-app-users-view',
  templateUrl: './users-view.component.html',
  styleUrls: ['./users-view.component.scss'],
  providers: [LoaderService],
  /* tslint:disable */
  host: { class: 'flex flex-1 margin-top-l' },
  /* tslint:enable */
})

export class UsersViewComponent implements OnInit, OnDestroy {
  /* tslint:disable */
  Math: any
  /* tslint:enable */
  currentFilter = 'active'
  discussionList!: any
  discussProfileData!: any
  portalProfile!: NSProfileDataV2.IProfile
  userDetails: any
  location!: string | null
  tabs: any
  // tabsData: NSProfileDataV2.IProfileTab[]
  currentUser!: any
  connectionRequests!: any[]
  data: any = []
  usersData!: any
  configSvc: any
  activeUsersData!: any[]
  inactiveUsersData!: any[]
  content: NsContent.IContent = {} as NsContent.IContent
  selectedFilters: any = []
  filterValues: any = []

  tabledata: ITableData = {
    actions: [],
    columns: [
      { displayName: 'Full Name', key: 'fullname' },
      { displayName: 'User Name', key: 'userName' },
      { displayName: 'Roles', key: 'roles', isList: true },
      // { displayName: 'Full Name', key: 'fullName' },
      // { displayName: 'Competency', key: 'competency' },
      { displayName: 'Designation', key: 'designation' },
      { displayName: 'State', key: 'state' },
      { displayName: 'City', key: 'city' },
      { displayName: 'Block', key: 'block' },
    ],
    needCheckBox: false,
    needHash: false,
    sortColumn: 'fullName',
    sortState: 'asc',
    needUserMenus: true,
  }
  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private events: EventService,
    private loaderService: LoaderService,
    // private telemetrySvc: TelemetryService,
    // private configSvc: ConfigurationsService,
    // private discussService: DiscussService,
    // private configSvc: ConfigurationsService,
    // private networkV2Service: NetworkV2Service,
    // private profileV2Svc: ProfileV2Service
    private usersService: UsersService
  ) {
    this.Math = Math
    this.configSvc = this.route.parent && this.route.parent.snapshot.data.configService
    this.currentUser = this.configSvc.userProfile && this.configSvc.userProfile.userId
    // console.log(_.get(this.route, 'snapshot.data.usersList.data'))
    // this.usersData = _.get(this.route, 'snapshot.data.usersList.data') || {}
    // this.filterData()
  }

  // decideAPICall() {
  // }
  ngOnDestroy() {
    if (this.tabs) {
      this.tabs.unsubscribe()
    }

  }
  ngOnInit() {
    this.getAllUsers()
    console.log("selectedFilters", this.selectedFilters)
  }

  filter(filter: string) {
    this.currentFilter = filter
    // this.events.raiseInteractTelemetry(
    //   {
    //     type: TelemetryEvents.EnumInteractTypes.CLICK,
    //     subType: TelemetryEvents.EnumInteractSubTypes.TAB_CONTENT,
    //   }, {}
    // )
  }

  public tabTelemetry(label: string, index: number) {
    const data: TelemetryEvents.ITelemetryTabData = {
      label,
      index,
    }
    this.events.handleTabTelemetry(
      TelemetryEvents.EnumInteractSubTypes.USER_TAB,
      data,
    )
  }

  get dataForTable() {

    switch (this.currentFilter) {
      case 'active':
        return this.activeUsersData
      case 'inactive':
        return this.inactiveUsersData
      // case 'blocked':
      //   return this.blockedUsers()
      default:
        return []
    }

  }
  filterData() {
    console.log("filterData")
    this.activeUsersData = this.activeUsers
    this.inactiveUsersData = this.inActiveUsers
  }
  get activeUsers() {
    this.loaderService.changeLoad.next(true)
    const activeUsersData: any[] = []
    if (this.usersData && this.usersData.content && this.usersData.content.length > 0) {
      this.filterValues["isDeleted"] = false

      // const filteredUsers = _.filter(this.usersData.content, _.matches(this.filterValues))

      // filteredUsers.forEach((user: any) => {
      //   // Rest of your existing logic for processing filtered users
      //   // ...
      // });
      console.log("this.filterValues", this.usersData.content)
      _.filter(this.usersData.content, { isDeleted: false }).forEach((user: any) => {
        // tslint:disable-next-line
        console.log("yser", user)
        let professionalDetails: any
        let addressDetails: any
        if (_.get(user, 'profileDetails') && _.get(user, 'profileDetails.profileReq.professionalDetails')) {
          professionalDetails = this.getprofessionalDetails(user.profileDetails.profileReq.professionalDetails)
          addressDetails = this.getPostalAdress(user.profileDetails.profileReq.personalDetails)
        }
        const org = { roles: _.get(_.first(_.filter(user.organisations, { organisationId: _.get(this.configSvc, 'unMappedUser.rootOrg.id') })), 'roles') }
        activeUsersData.push({
          fullname: user ? `${user.firstName} ${user.lastName}` : null,
          email: user.personalDetails && user.personalDetails.primaryEmail ? user.personalDetails.primaryEmail : user.email,
          role: org.roles || [],
          userId: user.id,
          active: !user.isDeleted,
          blocked: user.blocked,
          roles: _.join(_.map((org.roles || []), i => `<li>${i}</li>`), ''),
          designation: _.get(professionalDetails, 'designation') ? _.get(professionalDetails, 'designation') : '',
          state: _.get(addressDetails, 'state') ? _.get(addressDetails, 'state') : '',
          city: _.get(addressDetails, 'city') ? _.get(addressDetails, 'city') : '',
          userName: user.userName
        })
      })
    }
    return activeUsersData
  }
  getprofessionalDetails(data: any) {
    const professionalDetails: any = {}
    if (data && data.length > 0) {
      // tslint:disable-next-line
      _.reduce(data, (_key: any, value: any) => {
        professionalDetails['designation'] = value.designation ? value.designation : ''
      }, professionalDetails)
    }
    return professionalDetails
  }
  getPostalAdress(data: any) {
    const addressDetails: any = {}
    if (data && _.get(data, 'postalAddress')) {
      const postalAddress = _.split(_.get(data, 'postalAddress'), ',')
      addressDetails['country'] = postalAddress[0]
      addressDetails['state'] = postalAddress[1]
      addressDetails['city'] = postalAddress[2]

    }
    return addressDetails
  }
  filterTable() {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      maxHeight: '90vh',
      minHeight: '65%',
      width: '80%',
      autoFocus: false, // To remove auto select
      restoreFocus: false,
      panelClass: 'competencies',
      data: { isUser: true }
    })
    dialogRef.afterClosed().subscribe((response: any) => {
      if (response) {
        this.constuctSelectedFilter(response)
        console.log("this.selectedFilter", this.filterValues)
        // this.changeUserTable()
        const data = this.dataForTable
        this.filterData
        this.activeUsersData = this.activeUsers
        this.inactiveUsersData = this.inActiveUsers
        console.log("data", this.activeUsersData, this.inactiveUsersData, data)

      }

    })

  }
  changeUserTable() {

  }
  constuctSelectedFilter(response: any) {
    this.selectedFilters = []
    // const nonEmptyData: { [key: string]: any } = {}
    this.filterValues = []
    const nonEmptyData: { [key: string]: any } = {}

    _.forIn(response, (value: any, key: any) => {
      if (!_.isEmpty(value)) {
        this.selectedFilters.push({
          label: key,
          item: value,
        })

      }
      if (value !== '' && (!Array.isArray(value) || value.length > 0)) {
        nonEmptyData[key] = value
      }
    })
    this.filterValues = nonEmptyData
    return this.selectedFilters
  }
  get inActiveUsers() {
    this.loaderService.changeLoad.next(true)
    const inactiveUsersData: any[] = []
    if (this.usersData && this.usersData.content && this.usersData.content.length > 0) {
      _.filter(this.usersData.content, { isDeleted: true }).forEach((user: any) => {
        // tslint:disable-next-line
        const org = { roles: _.get(_.first(_.filter(user.organisations, { organisationId: _.get(this.configSvc, 'unMappedUser.rootOrg.id') })), 'roles') || [] }
        inactiveUsersData.push({
          fullname: user ? `${user.firstName} ${user.lastName}` : null,
          email: user.personalDetails && user.personalDetails.primaryEmail ? user.personalDetails.primaryEmail : user.email,
          role: org.roles || [],
          userId: user.id,
          active: !user.isDeleted,
          blocked: user.blocked,
          roles: _.join(_.map((org.roles || []), i => `<li>${i}</li>`), ''),
        })
      })
    }
    return inactiveUsersData
  }

  blockedUsers() {
    const blockedUsersData: any[] = []
    if (this.usersData && this.usersData.content && this.usersData.content.length > 0) {
      _.filter(this.usersData.content, { isDeleted: false }).forEach((user: any) => {
        blockedUsersData.push({
          fullname: user ? `${user.firstName} ${user.lastName}` : null,
          email: user.personalDetails && user.personalDetails.primaryEmail ? user.personalDetails.primaryEmail : user.email,
          role: user.roles,
          userId: user.id,
          active: !user.isDeleted,
          blocked: user.blocked,
          roles: _.join(_.map(user.roleInfo, i => `<li>${i}</li>`), ''),
        })
      })
    }
    return blockedUsersData
  }

  getAllUsers() {
    this.loaderService.changeLoad.next(true)
    const rootOrgId = _.get(this.route.snapshot.parent, 'data.configService.unMappedUser.rootOrg.rootOrgId')
    // const filterObj = {
    //   request: {
    //     query: '',
    //     filters: {
    //       rootOrgId: this.configSvc,
    //     },
    //   },
    // }
    // this.usersService.getAllUsers(filterObj).subscribe(data => {
    //   console.log(data)
    //   this.usersData = data
    //   this.filterData()
    // })
    this.usersService.getAllKongUsers(rootOrgId).subscribe(data => {
      this.usersData = data.result.response
      this.filterData()
    })
  }

  onCreateClick(event: any) {
    // tslint:disable-next-line: no-console
    console.log('clickHandler :: event ', event)
    switch (event.type) {
      case 'createUser':
        this.onCreateUser()
        break
      case 'upload':
        this.onUploadClick()
        break
    }

  }

  onCreateUser() {
    this.router.navigate([`/app/users/create-user`])
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.CREATE_BTN,
      },
      {}
    )
  }

  onUploadClick() {
    this.filter('upload')
  }

  onRoleClick(user: any) {
    this.router.navigate([`/app/users/${user.userId}/details`])
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.CARD_CONTENT,
        id: TelemetryEvents.EnumIdtype.USER_ROW,
      },
      {
        id: user.userId,
        type: TelemetryEvents.EnumIdtype.USER,
      }
    )
  }
  menuActions($event: { action: string, row: any }) {
    this.loaderService.changeLoad.next(true)
    const loggedInUserId = _.get(this.route, 'snapshot.parent.data.configService.userProfile.userId')
    // const user = { userId: _.get($event.row, 'userId') }
    // _.set(user, 'deptId', _.get(_.first(_.filter(this.usersData.content, { id: user.userId })), 'rootOrgId'))
    // _.set(user, 'isBlocked', _.get($event.row, 'blocked'))
    // _.set(user, 'isDeleted', _.get($event.row, 'active'))
    // _.set(user, 'requestedBy', this.currentUser)
    const user = {
      request: {
        userId: _.get($event.row, 'userId'),
        requestedBy: this.currentUser,
      },
    }
    switch ($event.action) {

      case 'showOnKarma':
        window.open(`${environment.karmYogiPath}/app/person-profile/${user.request.userId}`)
        break
      case 'block':
        _.set(user, 'isBlocked', true)
        _.set(user, 'isDeleted', false)
        _.set(user, 'roles', _.map(_.get($event.row, 'role'), i => i))
        this.usersService.blockUser(user).subscribe(response => {
          if (response) {
            this.getAllUsers()
            this.snackBar.open(response.result.response)
          }
        })
        break
      case 'unblock':
        _.set(user, 'isBlocked', false)
        _.set(user, 'roles', _.map(_.get($event.row, 'role'), i => i))
        this.usersService.blockUser(user).subscribe(response => {
          if (response) {
            this.getAllUsers()
            this.snackBar.open('Updated successfully !')
          }
        })
        break
      case 'deactive':
        // _.set(user, 'isDeleted', true)
        // _.set(user, 'roles', _.map(_.get($event.row, 'role'), i => i))
        // this.usersService.deActiveUser(user).subscribe(response => {
        this.usersService.newBlockUser(loggedInUserId, user.request.userId).subscribe(response => {
          if (_.toUpper(response.params.status) === 'SUCCESS') {
            setTimeout(() => {
              this.getAllUsers()

              this.snackBar.open('Deactivated successfully!')
            },
              // tslint:disable-next-line: align
              1500)
            // this.changeDetectorRefs.detectChanges()
          } else {
            this.loaderService.changeLoad.next(false)
            this.snackBar.open('Update unsuccess!')
          }
        },
          // tslint:disable-next-line:align
          () => {
            this.snackBar.open('Given User Data doesnt exist in our records. Please provide a valid one.')
          })
        break
      case 'active':
        const state = _.get(user, 'isBlocked')
        if (state === true) {
          _.set(user, 'isDeleted', false)
          _.set(user, 'isBlocked', false)
        } else {
          _.set(user, 'isDeleted', false)
        }
        _.set(user, 'roles', _.map(_.get($event.row, 'role'), i => i))
        // this.usersService.deActiveUser(user).subscribe(response => {
        this.usersService.newUnBlockUser(loggedInUserId, user.request.userId).subscribe(response => {
          if (_.toUpper(response.params.status) === 'SUCCESS') {
            setTimeout(() => {
              this.getAllUsers()
              this.snackBar.open('Activated successfully!')
              // tslint:disable-next-line: align
            }, 1500)
          } else {
            this.loaderService.changeLoad.next(false)
            this.snackBar.open('Update unsuccess!')
          }
        })
        break
      //   case 'delete':
      //     _.set(user, 'isBlocked', false)
      //     this.usersSvc.deleteUser(user)
      //     break
    }
  }

  onEnterkySearch(enterValue: any) {
    const rootOrgId = _.get(this.route.snapshot.parent, 'data.configService.unMappedUser.rootOrg.rootOrgId')

    this.usersService.searchUserByenter(enterValue, rootOrgId).subscribe(data => {
      this.usersData = data.result.response
      this.filterData()
    })
  }
}
