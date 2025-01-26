import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router, Event, NavigationEnd } from '@angular/router'
import { UsersService } from '../../services/users.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ILeftMenu } from '@sunbird-cb/collection'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { ValueService } from '@sunbird-cb/utils'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
@Component({
  selector: 'ws-app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
})
export class CreateUserComponent implements OnInit, OnDestroy {
  sideNavBarOpened = true
  currentRoute = 'users'
  myRoles!: Set<string>
  widgetData!: NsWidgetResolver.IWidgetData<ILeftMenu>
  @ViewChild('stickyMenu', { static: true }) menuElement!: ElementRef
  elementPosition: any
  sticky = false
  private defaultSideNavBarOpenedSubscription: any
  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$
  createUserForm: FormGroup
  namePatern = `^[a-zA-Z\\s\\']{1,32}$`
  department: any = {}
  departmentName = ''
  toastSuccess: any
  rolesList: any = []
  public userRoles: Set<string> = new Set()
  configService: any

  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset
    if (windowScroll >= this.elementPosition) {
      this.sticky = true
    } else {
      this.sticky = false
    }
  }

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private usersSvc: UsersService,
    private valueSvc: ValueService) {
    this.configService = this.activeRoute.snapshot.data.configService
    if (this.configService.userRoles) {
      this.myRoles = this.configService.userRoles
    }
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.bindUrl(event.urlAfterRedirects.replace('/app/home/', ''))
        if (_.get(this.activeRoute.snapshot, 'data.profileData.data')) {
          const leftData = this.activeRoute.snapshot.data.pageData.data.menus
          _.set(leftData, 'widgetData.logo', true)
          _.set(leftData, 'widgetData.logoPath', '/assets/instances/eagle/app_logos/aastar-source.png')
          _.set(leftData, 'widgetData.name', _.get(this.activeRoute, 'snapshot.data.profileData.data.channel')
            || _.get(this.activeRoute, 'snapshot.data.profileData.data.rootOrg.description'))
          _.set(leftData, 'widgetData.userRoles', this.myRoles)
          this.widgetData = leftData
        } else {
          this.widgetData = this.activeRoute.snapshot.data.pageData.data.menus
        }
      }
    })
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        const fullProfile = _.get(this.activeRoute.snapshot, 'data.configService')
        this.department = fullProfile.unMappedUser.rootOrgId
        this.departmentName = fullProfile ? fullProfile.unMappedUser.channel : ''
        const orgLst = _.get(this.activeRoute.snapshot, 'data.rolesList.data.orgTypeList')
        const filteredDept = _.compact(_.map(orgLst, ls => {
          const f = _.filter(ls.flags, (fl: any) => fullProfile.unMappedUser.rootOrg[fl])
          if (f && f.length > 0) {
            return ls
          }
          return null
        }))
        /* tslint:disable-next-line */
        const rolesListFull = _.uniq(_.map(_.compact(_.flatten(_.map(filteredDept, 'roles'))), rol => ({ roleName: rol, description: rol })))
        rolesListFull.forEach((role: any) => {
          if (!this.rolesList.some((item: any) => item.roleName === role.roleName)) {
            this.rolesList.push(role)
          }
        })
        if (this.configService.userProfile && this.configService.userProfile.departmentName) {
          this.configService.userProfile.departmentName = this.departmentName
        }

        // this.rolesList = [
        //   { roleName: 'CONTENT_CREATOR' },
        //   { roleName: 'CONTENT_REVIEWER' },
        //   { roleName: 'FRAC_ADMIN' },
        //   { roleName: 'CONTENT_PUBLISHER' },
        //   { roleName: 'EDITOR' },
        //   { roleName: 'FRAC_ADMIN' },
        //   { roleName: 'MDO_ADMIN' },
        //   { roleName: 'SPV_ADMIN' },
        //   { roleName: 'PUBLIC' },
        //   { roleName: 'FRAC_COMPETENCY_MEMBER' },
        //   { roleName: 'FRAC_COMPETENCY_REVIEWER' },
        //   { roleName: 'FRAC_REVIEWER_L2' },
        //   { roleName: 'ORG_ADMIN' },
        // ]
      }
    })
    this.createUserForm = new FormGroup({
      fname: new FormControl('', [Validators.required]),
      lname: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      department: new FormControl(''),
      roles: new FormControl(''),
    })
  }

  ngOnInit() {
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(isLtMedium => {
      this.sideNavBarOpened = !isLtMedium
      this.screenSizeIsLtMedium = isLtMedium
    })
  }

  onSubmit(form: any) {
    const newobj = {
      personalDetails: {
        email: form.value.email,
        userName: form.value.fname,
        firstName: form.value.fname,
        lastName: form.value.lname,
        channel: this.departmentName ? this.departmentName : null,
      },
    }

    this.usersSvc.createUser(newobj).subscribe(res => {
      if (res) {
        const dreq = {
          request: {
            organisationId: this.department,
            userId: res.userId,
            roles: _.toLength(form.value.roles) === 0 ? ['PUBLIC'] : form.value.roles,
          },
        }

        this.usersSvc.addUserToDepartment(dreq).subscribe(dres => {
          if (dres) {
            this.createUserForm.reset({ fname: '', lname: '', email: '', department: this.departmentName, roles: '' })
            this.openSnackbar('User Created Successfully')
            this.router.navigate(['/app/home/users'])
          }
        },
          // tslint:disable-next-line
          (err: any) => { this.openSnackbar(err.error || err || `Some error occurred while updateing new user's role, Please try again later!`) })
      }
    },
      // tslint:disable-next-line
      (err: any) => { this.openSnackbar(err.error || err || 'Some error occurred while creating user, Please try again later!') })
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  modifyUserRoles(role: string) {
    if (this.userRoles.has(role)) {
      this.userRoles.delete(role)
    } else {
      this.userRoles.add(role)
    }
  }

  bindUrl(path: string) {
    if (path) {
      this.currentRoute = path
    }
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }
  }
}
