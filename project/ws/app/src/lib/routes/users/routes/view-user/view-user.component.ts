import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router, Event, NavigationEnd } from '@angular/router'
// import moment from 'moment'
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormBuilder } from '@angular/forms'
import { UsersService } from '../../services/users.service'
import { MatSnackBar } from '@angular/material/snack-bar'
// tslint:disable-next-line
import _ from 'lodash'
import { EventService } from '@sunbird-cb/utils'
import { Subject, Subscription } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { RoleConfirmDialogComponent } from '../../../../../../../../../src/app/plugins/skill/components/role-confirm-dialog/role-confirm-dialog.component'
import { MatDialog } from '@angular/material/dialog'
import { constructReq } from './request-util'
import { NsUserProfileDetails } from '../models/NsUserProfile'

@Component({
  standalone: false,
  selector: 'ws-app-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  constructor(private readonly activeRoute: ActivatedRoute, private readonly router: Router, private readonly events: EventService,
    // tslint:disable-next-line:align
    private readonly fb: UntypedFormBuilder,
    // private cd: ChangeDetectorRef,

    private readonly usersSvc: UsersService,
    public dialog: MatDialog,
    // tslint:disable-next-line:align
    private readonly snackBar: MatSnackBar) {

    this.updateUserDetailsForm = new UntypedFormGroup({
      firstname: new UntypedFormControl('', [Validators.required]),
      middlename: new UntypedFormControl('', []),
      surname: new UntypedFormControl('', [Validators.required]),
      about: new UntypedFormControl(''),
      photo: new UntypedFormControl('', []),
      countryCode: new UntypedFormControl(''),
      mobile: new UntypedFormControl('', [Validators.pattern(this.phoneNumberPattern)]),
      telephone: new UntypedFormControl('', []),
      primaryEmail: new UntypedFormControl('', [Validators.email]),
      primaryEmailType: new UntypedFormControl(this.assignPrimaryEmailTypeCheckBox(this.ePrimaryEmailType.OFFICIAL), []),
      secondaryEmail: new UntypedFormControl('', []),
      nationality: new UntypedFormControl('', []),
      dob: new UntypedFormControl('', [Validators.required]),
      gender: new UntypedFormControl('', []),
      maritalStatus: new UntypedFormControl('', []),
      domicileMedium: new UntypedFormControl('', []),
      regNurseRegMidwifeNumber: new UntypedFormControl('', []),
      nationalUniqueId: new UntypedFormControl('', []),
      doctorRegNumber: new UntypedFormControl('', []),
      instituteName: new UntypedFormControl('', []),
      nursingCouncil: new UntypedFormControl('', []),
      knownLanguages: new UntypedFormControl([], []),
      postalAddress: new UntypedFormControl('', []),
      category: new UntypedFormControl('', []),
      pincode: new UntypedFormControl('', [Validators.pattern(this.pincodePattern)]),
      schoolName10: new UntypedFormControl('', []),
      yop10: new UntypedFormControl('', [Validators.pattern(this.yearPattern)]),
      schoolName12: new UntypedFormControl('', []),
      yop12: new UntypedFormControl('', [Validators.pattern(this.yearPattern)]),
      degreeName: new UntypedFormControl('', []),
      degreeInstitute: new UntypedFormControl('', []),
      yopDegree: new UntypedFormControl('', [Validators.pattern(this.yearPattern)]),
      postDegreeName: new UntypedFormControl('', []),
      postDegreeInstitute: new UntypedFormControl('', []),
      yopPostDegree: new UntypedFormControl('', [Validators.pattern(this.yearPattern)]),
      degrees: this.fb.array([this.createDegree()]),
      postDegrees: this.fb.array([this.createDegree()]),
      certificationDesc: new UntypedFormControl('', []),
      interests: new UntypedFormControl('', []),
      hobbies: new UntypedFormControl('', []),
      skillAquiredDesc: new UntypedFormControl('', []),
      isGovtOrg: new UntypedFormControl(false, []),
      orgName: new UntypedFormControl('', []),
      orgType: new UntypedFormControl(),
      orgOtherSpecify: new UntypedFormControl(),
      orgNameOther: new UntypedFormControl('', []),
      industry: new UntypedFormControl('', []),
      industryOther: new UntypedFormControl('', []),
      designation: new UntypedFormControl('', []),
      profession: new UntypedFormControl('', []),
      location: new UntypedFormControl('', []),
      locationOther: new UntypedFormControl('', []),
      doj: new UntypedFormControl('', []),
      orgDesc: new UntypedFormControl('', []),
      payType: new UntypedFormControl('', []),
      service: new UntypedFormControl('', []),
      cadre: new UntypedFormControl('', []),
      allotmentYear: new UntypedFormControl('', [Validators.pattern(this.yearPattern)]),
      otherDetailsDoj: new UntypedFormControl('', []),
      civilListNo: new UntypedFormControl('', []),
      employeeCode: new UntypedFormControl('', []),
      otherDetailsOfficeAddress: new UntypedFormControl('', []),
      otherDetailsOfficePinCode: new UntypedFormControl('', []),
      professionOtherSpecify: new UntypedFormControl(),
      professional: new UntypedFormControl(),
      courseDegree: new UntypedFormControl(true),
    })
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.handleProfileNavigation()
      }
    })

    this.updateUserRoleForm = new UntypedFormGroup({
      roles: new UntypedFormControl('', [Validators.required]),
    })
  }

  private handleProfileNavigation() {
    this.configSvc = this.activeRoute.snapshot.data.configService || {}
    const profileDataAll = this.activeRoute.snapshot.data.profileData.data || {}
    const profileData = profileDataAll.profileDetails

    this.populateProfileDetails(profileDataAll, profileData)

    const userData = profileData ? profileData.profileReq : ''
    this.userData = userData
    const academics = this.populateAcademics(userData)
    const organisations = this.populateOrganisationDetails(userData)
    if (userData) {
      this.constructFormFromRegistry(userData, academics, organisations)
    }

    this.buildRolesList()
    this.populateUserRoles(profileDataAll)

    this.subscribeToProfileData()
    this.subscribeToBreadcrumbs()
  }

  private populateProfileDetails(profileDataAll: any, profileData: any) {
    if (!profileData) {
      return
    }
    this.userID = profileDataAll.id
    this.basicInfo = profileData.profileReq.personalDetails
    if (this.basicInfo) {
      this.fullname = `${this.basicInfo.firstname} ${this.basicInfo.surname}`
    }
    this.academicDetails = profileData.profileReq.academics
    this.professionalDetails = profileData.profileReq.professionalDetails ? profileData.profileReq.professionalDetails[0] : []
    this.employmentDetails = profileData.profileReq.employmentDetails
    this.skillDetails = profileData.profileReq.skills
    this.interests = profileData.profileReq.interests
    this.userStatus = profileDataAll.isDeleted ? 'Inactive' : 'Active'
  }

  private buildRolesList() {
    const fullProfile = _.get(this.activeRoute.snapshot, 'data.configService')
    this.department = fullProfile.unMappedUser.rootOrgId
    this.departmentName = fullProfile ? fullProfile.unMappedUser.channel : ''
    const orgLst = _.get(this.activeRoute.snapshot, 'data.rolesList.data.orgTypeList')
    const filteredDept = _.compact(_.map(orgLst, ls => {
      const f = _.filter(ls.flags, (fl: any) => fullProfile.unMappedUser.rootOrg[fl])
      return f && f.length > 0 ? ls : null
    }))
    /* tslint:disable-next-line */
    const rolesListFull = _.uniq(_.map(_.compact(_.flatten(_.map(filteredDept, 'roles'))), rol => ({ roleName: rol, description: rol })))

    rolesListFull.forEach((role: any) => {
      if (!this.rolesList.some((item: any) => item.roleName === role.roleName)) {
        this.rolesList.push(role)
      }
    })
  }

  private populateUserRoles(profileDataAll: any) {
    const usrRoles = profileDataAll.roles
    if (usrRoles && usrRoles.length > 0) {
      usrRoles.forEach((role: any) => {
        this.orguserRoles.push(role)
        this.modifyUserRoles(role)
      })
    }
  }

  private subscribeToProfileData() {
    this.activeRoute.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.profileData = data.pageData.data.profileData ? data.pageData.data.profileData : []
      this.profileDataKeys = data.pageData.data.profileDataKey ? data.pageData.data.profileDataKey : []
    })
  }

  private subscribeToBreadcrumbs() {
    this.routeSubscription = this.activeRoute.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(qParamsMap => {
      this.qpParam = qParamsMap.get('param')
      this.qpPath = qParamsMap.get('path')
      if (this.qpParam === 'MDOinfo') {
        // tslint:disable-next-line:max-line-length
        this.breadcrumbs = { titles: [{ title: 'Users', url: '/app/home/users' }, { title: this.userStatus, url: 'none' }, { title: 'MDO information', url: '/app/home/mdoinfo/leadership' }, { title: this.fullname, url: 'none' }] }
      } else {
        // tslint:disable-next-line:max-line-length
        this.breadcrumbs = { titles: [{ title: 'Users', url: '/app/home/users' }, { title: this.userStatus, url: 'none' }, { title: this.fullname, url: 'none' }] }
      }
    })
  }
  tabsData!: any[]
  currentTab = 'personalInfo'
  sticky = false
  elementPosition: any
  basicInfo: any
  fullname = ''
  academicDetails: any
  professionalDetails: any
  employmentDetails: any
  skillDetails: any
  interests: any
  profileData: any[] = []
  profileDataKeys: any[] = []
  wfHistory: any[] = []
  updateUserRoleForm: UntypedFormGroup
  updateUserDetailsForm!: UntypedFormGroup
  ePrimaryEmailType = NsUserProfileDetails.EPrimaryEmailType
  eUserGender = NsUserProfileDetails.EUserGender
  eMaritalStatus = NsUserProfileDetails.EMaritalStatus
  eCategory = NsUserProfileDetails.ECategory
  department: any = {}
  departmentName = ''
  rolesList: any = []
  configSvc: any
  userID: any
  isOfficialEmail = false
  phoneNumberPattern = '^((\\+91-?)|0)?[0-9]{10}$'
  pincodePattern = '(^[0-9]{6}$)'
  yearPattern = '(^[0-9]{4}$)'
  namePatern = `^[a-zA-Z\\s\\']{1,32}$`
  telephonePattern = `^[0-9]+-?[0-9]+$`
  public userRoles: Set<string> = new Set()
  orguserRoles: any = []
  @ViewChild('stickyMenu', { static: true }) menuElement!: ElementRef
  userStatus: any
  routeSubscription: Subscription | null = null
  qpParam: any
  qpPath: any
  breadcrumbs: any
  orgOthersField = false
  professionOtherField = false
  hide = true
  loadDob = false
  userData: any = ''
  maxDate = new Date()
  minDate = new Date(1900, 1, 1)
  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset
    if (windowScroll >= this.elementPosition) {
      this.sticky = true
    } else {
      this.sticky = false
    }
  }
  private populateOrganisationDetails(data: any) {
    let org = {
      orgName: '',
      industry: '',
      designation: '',
      location: '',
      responsibilities: '',
      doj: '',
      orgDesc: '',
      completePostalAddress: '',
      orgNameOther: '',
      industryOther: '',
      profession: '',
      orgType: '',
      orgOtherSpecify: '',
      professionOtherSpecify: '',
    }
    if (data && data.professionalDetails && data.professionalDetails.length > 0) {
      const organisation = data.professionalDetails[0]
      org = {
        orgName: organisation.name,
        orgType: organisation.orgType,
        orgOtherSpecify: organisation.orgOtherSpecify,
        orgNameOther: organisation.nameOther,
        industry: organisation.industry,
        industryOther: organisation.industryOther,
        designation: organisation.designation,
        profession: organisation.profession,
        professionOtherSpecify: organisation.professionOtherSpecify,
        location: organisation.location,
        responsibilities: organisation.responsibilities,
        doj: this.getDateFromText(organisation.doj),
        orgDesc: organisation.description,
        completePostalAddress: organisation.completePostalAddress,
      }
    }

    return org
  }
  private populateAcademics(data: any) {
    const academics: NsUserProfileDetails.IAcademics = {
      X_STANDARD: {
        schoolName10: '',
        yop10: '',
      },
      XII_STANDARD: {
        schoolName12: '',
        yop12: '',
      },
      degree: [],
      postDegree: [],
    }
    if (data.academics && Array.isArray(data.academics)) {
      data.academics.forEach((item: any) => {
        switch (item.type) {
          case 'X_STANDARD': academics.X_STANDARD.schoolName10 = item.nameOfInstitute
            academics.X_STANDARD.yop10 = item.yearOfPassing
            break
          case 'XII_STANDARD': academics.XII_STANDARD.schoolName12 = item.nameOfInstitute
            academics.XII_STANDARD.yop12 = item.yearOfPassing
            break
          case 'GRADUATE': academics.degree.push({
            degree: item.nameOfQualification,
            instituteName: item.nameOfInstitute,
            yop: item.yearOfPassing,
          })
            break
          case 'POSTGRADUATE': academics.postDegree.push({
            degree: item.nameOfQualification,
            instituteName: item.nameOfInstitute,
            yop: item.yearOfPassing,
          })
            break
        }
      })
    }
    return academics
  }
  private getDateFromText(dateString: string): any {
    if (dateString) {
      const splitValues: string[] = dateString.split('-')
      const [dd, mm, yyyy] = splitValues
      const dateToBeConverted = `${yyyy}-${mm}-${dd}`
      return new Date(dateToBeConverted)
    }
    return ''
  }
  dobData(event: any) {
    this.updateUserDetailsForm.patchValue({
      dob: event,
    })
  }
  private constructFormFromRegistry(data: any, academics: NsUserProfileDetails.IAcademics, organisation: any) {
    if (organisation.orgType === 'Others') {
      this.orgOthersField = true
    } else {
      this.orgOthersField = false
    }

    organisation.profession === 'Others' ? this.professionOtherField = true : this.professionOtherField = false
    this.updateUserDetailsForm.patchValue({
      firstname: data.personalDetails.firstname,
      middlename: data.personalDetails.middlename,
      surname: data.personalDetails.lastName || data.personalDetails.surname,
      about: data.personalDetails.about,
      photo: data.photo,
      dob: data.personalDetails.dob,
      nationality: data.personalDetails.nationality,
      domicileMedium: data.personalDetails.domicileMedium,
      regNurseRegMidwifeNumber: data.personalDetails.regNurseRegMidwifeNumber,
      nationalUniqueId: data.personalDetails.nationalUniqueId,
      doctorRegNumber: data.personalDetails.doctorRegNumber,
      instituteName: data.personalDetails.instituteName,
      nursingCouncil: data.personalDetails.nursingCouncil,
      gender: data.personalDetails.gender,
      maritalStatus: data.personalDetails.maritalStatus,
      category: data.personalDetails.category,
      knownLanguages: data.personalDetails.knownLanguages,
      countryCode: data.personalDetails.countryCode,
      mobile: data.personalDetails.mobile,
      telephone: data.personalDetails.telephone,
      primaryEmail: data.personalDetails.primaryEmail,
      secondaryEmail: data.personalDetails.personalEmail,
      primaryEmailType: this.filterPrimaryEmailType(data),
      postalAddress: data.personalDetails.postalAddress,
      pincode: data.personalDetails.pincode,
      schoolName10: academics.X_STANDARD.schoolName10,
      yop10: academics.X_STANDARD.yop10,
      schoolName12: academics.XII_STANDARD.schoolName12,
      yop12: academics.XII_STANDARD.yop12,
      degreeName: academics.degree[0] ? academics.degree[0].degree : '',
      degreeInstitute: academics.degree[0] ? academics.degree[0].instituteName : '',
      yopDegree: academics.degree[0] ? academics.degree[0].yop : '',
      postDegreeName: academics.postDegree[0] ? academics.postDegree[0].degree : '',
      postDegreeInstitute: academics.postDegree[0] ? academics.postDegree[0].instituteName : '',
      yopPostDegree: academics.postDegree[0] ? academics.postDegree[0].yop : '',
      isGovtOrg: organisation.isGovtOrg,
      orgName: organisation.orgName,
      orgType: organisation.orgType,
      orgOtherSpecify: organisation.orgOtherSpecify,
      industry: organisation.industry,
      designation: organisation.designation,
      location: organisation.location,
      doj: organisation.doj,
      orgDesc: organisation.orgDesc,
      orgNameOther: organisation.orgNameOther,
      industryOther: organisation.industryOther,
      profession: organisation.profession,
      professionOtherSpecify: organisation.professionOtherSpecify,
      // orgName: _.get(data, 'employmentDetails.departmentName') || '',
      service: _.get(data, 'employmentDetails.service') || '',
      cadre: _.get(data, 'employmentDetails.cadre') || '',
      allotmentYear: this.checkvalue(_.get(data, 'employmentDetails.allotmentYearOfService') || ''),
      otherDetailsDoj: this.getDateFromText(_.get(data, 'employmentDetails.dojOfService') || ''),
      payType: _.get(data, 'employmentDetails.payType') || '',
      civilListNo: _.get(data, 'employmentDetails.civilListNo') || '',
      employeeCode: this.checkvalue(_.get(data, 'employmentDetails.employeeCode') || ''),
      otherDetailsOfficeAddress: this.checkvalue(_.get(data, 'employmentDetails.officialPostalAddress') || ''),
      otherDetailsOfficePinCode: this.checkvalue(_.get(data, 'employmentDetails.pinCode') || ''),
      skillAquiredDesc: _.get(data, 'skills.additionalSkills') || '',
      certificationDesc: _.get(data, 'skills.certificateDetails') || '',
      professional: data.interests ? data.interests.professional : '',
      hobbies: data.interests ? data.interests.hobbies : '',

    },
      {
        emitEvent: true,
      })
    this.loadDob = true
    // /* tslint:enable */
    // this.cd.detectChanges()
    // this.cd.markForCheck()
    // this.setDropDownOther(organisation)
    // this.setProfilePhotoValue(data)
  }
  private filterPrimaryEmailType(data: any) {
    if (data.personalDetails.officialEmail) {
      this.isOfficialEmail = true
    } else {
      this.isOfficialEmail = false
    }
    // this.cd.detectChanges()
    return this.ePrimaryEmailType.OFFICIAL
    // this.assignPrimaryEmailTypeCheckBox(this.ePrimaryEmailType.PERSONAL)
    // return this.ePrimaryEmailType.PERSONAL
  }
  checkvalue(value: any) {
    if (value && value === 'undefined') {
      // tslint:disable-next-line:no-parameter-reassignment
      value = ''
    } else {
      return value
    }
  }
  createDegree(): UntypedFormGroup {
    return this.fb.group({
      degree: new UntypedFormControl('', []),
      instituteName: new UntypedFormControl('', []),
      yop: new UntypedFormControl('', [Validators.pattern(this.yearPattern)]),
    })
  }
  private assignPrimaryEmailTypeCheckBox(primaryEmailType: any) {
    if (primaryEmailType === this.ePrimaryEmailType.OFFICIAL) {
      this.isOfficialEmail = true
    } else {
      this.isOfficialEmail = false
    }
    // this.assignPrimaryEmailType(this.isOfficialEmail)
  }
  ngOnInit() {
    this.tabsData = [
      {
        name: 'Personal details',
        key: 'personalInfo',
        render: true,
        enabled: true,
      },
      {
        name: 'Academics',
        key: 'academics',
        render: true,
        enabled: true,
      },
      {
        name: 'Professional details',
        key: 'profdetails',
        render: true,
        enabled: true,
      },
      {
        name: 'Certification and skills',
        key: 'skills',
        render: true,
        enabled: true,
      },
      {
        name: 'Update roles',
        key: 'roles',
        render: true,
        enabled: true,
      }]
  }

  ngAfterViewInit() {
    this.elementPosition = this.menuElement.nativeElement.parentElement.offsetTop
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  modifyUserRoles(role: string) {
    if (this.userRoles.has(role)) {
      this.userRoles.delete(role)
    } else {
      this.userRoles.add(role)
    }
  }

  onSideNavTabClick(id: string) {
    let menuName = ''
    this.tabsData.forEach(e => {
      if (e.key === id) {
        menuName = e.name
      }
    })
    this.currentTab = id
    const el = document.getElementById(id)
    if (el != null) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' })
    }
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.SIDE_NAV,
        id: `${_.camelCase(menuName)}-scrolly-menu `,
      },
      {}
    )
  }
  changeToDefaultImg($event: any) {
    $event.target.src = 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/aastrika_menu_logo.svg'
  }

  resetRoles() {
    this.updateUserRoleForm.controls['roles'].setValue(this.orguserRoles)
  }
  changeformat(date: Date): string {
    let day: string = date.getDate().toString()
    day = +day < 10 ? `0${day}` : day
    let month: string = (date.getMonth() + 1).toString()
    month = +month < 10 ? `0${month}` : month
    const year = date.getFullYear()
    // return `${year}-${month}-${day}`
    return `${day}-${month}-${year}`
  }
  updateUser(form: any) {
    // if (this.configSvc.userProfile) {
    //   this.userID = this.configSvc.userProfile.userId || ''
    // }
    const userAgent = ''
    const userCookie = ''
    const profileRequest = constructReq(this.userID, form.value, this.userData, userAgent, userCookie)

    // const userdata = Object.assign(profileRequest, obj)
    const reqUpdate = {
      request: {
        userId: this.userID,
        profileDetails: profileRequest,
      },
    }

    this.usersSvc.updateProfileDetails(reqUpdate).pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data) {
        // this.router.navigate('./app/users')
        // this.router.navigate(['/app/users', this.userID, 'details'])
        this.openSnackbar('User profile details updated successfully!')
        if (this.qpParam === 'MDOinfo') {
          this.router.navigate(['/app/home/mdoinfo/leadership'])
        } else {
          this.router.navigate(['/app/home/users'])
        }
        // this.userData = profileData.profileReq
        // const academics = this.populateAcademics(userData)
        // this.setDegreeValuesArray(academics)
        // this.setPostDegreeValuesArray(academics)
        // const organisations = this.populateOrganisationDetails(userData)
        // this.constructFormFromRegistry(userData, academics, organisations)
        // this.router.navigate([`app/users/${this.userID}/details`])
      }
    })
  }
  onSubmit(form: any) {
    if (form.value.roles !== this.orguserRoles) {
      const dreq = {
        request: {
          organisationId: this.department,
          userId: this.userID,
          roles: form.value.roles,
        },
      }

      this.usersSvc.addUserToDepartment(dreq).pipe(takeUntil(this.destroy$)).subscribe(dres => {
        if (dres) {
          // this.openSnackbar('User role updated Successfully')
          const dialogRef = this.dialog.open(RoleConfirmDialogComponent, {
            maxHeight: '90vh',
            minHeight: '60%',
            width: '40%',
            autoFocus: false, // To remove auto select
            restoreFocus: false,
            panelClass: 'competencies',
            data: { user: this.fullname, role: form.value.roles },
          })
          dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response) {
              // this.updateUserRole(form)
              this.updateUserRoleForm.reset({ roles: '' })
              if (this.qpParam === 'MDOinfo') {
                this.router.navigate(['/app/home/mdoinfo/leadership'])
              } else {
                this.router.navigate(['/app/home/users'])
              }
            }

          })

        }
      })
    } else {
      this.openSnackbar('Select new roles')
    }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
}
