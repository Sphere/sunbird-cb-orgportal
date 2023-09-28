import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router, Event, NavigationEnd } from '@angular/router'
// import moment from 'moment'
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms'
import { UsersService } from '../../services/users.service'
import { MatSnackBar } from '@angular/material'
// tslint:disable-next-line
import _ from 'lodash'
import { EventService } from '@sunbird-cb/utils'
import { Subscription } from 'rxjs'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { RoleConfirmDialogComponent } from '../../../../../../../../../src/app/plugins/skill/components/role-confirm-dialog/role-confirm-dialog.component'
import { MatDialog } from '@angular/material/dialog'
import { constructReq } from './request-util'
import { NsUserProfileDetails } from '../models/NsUserProfile'

@Component({
  selector: 'ws-app-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent implements OnInit, AfterViewInit {
  constructor(private activeRoute: ActivatedRoute, private router: Router, private events: EventService,
    // tslint:disable-next-line:align
    private fb: FormBuilder,
    // private cd: ChangeDetectorRef,

    private usersSvc: UsersService,
    public dialog: MatDialog,
    // tslint:disable-next-line:align
    private snackBar: MatSnackBar) {

    this.updateUserDetailsForm = new FormGroup({
      firstname: new FormControl('', [Validators.required]),
      middlename: new FormControl('', []),
      surname: new FormControl('', [Validators.required]),
      about: new FormControl(''),
      photo: new FormControl('', []),
      countryCode: new FormControl(''),
      mobile: new FormControl('', [Validators.pattern(this.phoneNumberPattern)]),
      telephone: new FormControl('', []),
      primaryEmail: new FormControl('', [Validators.email]),
      primaryEmailType: new FormControl(this.assignPrimaryEmailTypeCheckBox(this.ePrimaryEmailType.OFFICIAL), []),
      secondaryEmail: new FormControl('', []),
      nationality: new FormControl('', []),
      dob: new FormControl('', [Validators.required]),
      gender: new FormControl('', []),
      maritalStatus: new FormControl('', []),
      domicileMedium: new FormControl('', []),
      regNurseRegMidwifeNumber: new FormControl('', []),
      nationalUniqueId: new FormControl('', []),
      doctorRegNumber: new FormControl('', []),
      instituteName: new FormControl('', []),
      nursingCouncil: new FormControl('', []),
      knownLanguages: new FormControl([], []),
      postalAddress: new FormControl('', []),
      category: new FormControl('', []),
      pincode: new FormControl('', [Validators.pattern(this.pincodePattern)]),
      schoolName10: new FormControl('', []),
      yop10: new FormControl('', [Validators.pattern(this.yearPattern)]),
      schoolName12: new FormControl('', []),
      yop12: new FormControl('', [Validators.pattern(this.yearPattern)]),
      degreeName: new FormControl('', []),
      degreeInstitute: new FormControl('', []),
      yopDegree: new FormControl('', [Validators.pattern(this.yearPattern)]),
      postDegreeName: new FormControl('', []),
      postDegreeInstitute: new FormControl('', []),
      yopPostDegree: new FormControl('', [Validators.pattern(this.yearPattern)]),
      degrees: this.fb.array([this.createDegree()]),
      postDegrees: this.fb.array([this.createDegree()]),
      certificationDesc: new FormControl('', []),
      interests: new FormControl('', []),
      hobbies: new FormControl('', []),
      skillAquiredDesc: new FormControl('', []),
      isGovtOrg: new FormControl(false, []),
      orgName: new FormControl('', []),
      orgType: new FormControl(),
      orgOtherSpecify: new FormControl(),
      orgNameOther: new FormControl('', []),
      industry: new FormControl('', []),
      industryOther: new FormControl('', []),
      designation: new FormControl('', []),
      profession: new FormControl('', []),
      location: new FormControl('', []),
      locationOther: new FormControl('', []),
      doj: new FormControl('', []),
      orgDesc: new FormControl('', []),
      payType: new FormControl('', []),
      service: new FormControl('', []),
      cadre: new FormControl('', []),
      allotmentYear: new FormControl('', [Validators.pattern(this.yearPattern)]),
      otherDetailsDoj: new FormControl('', []),
      civilListNo: new FormControl('', []),
      employeeCode: new FormControl('', []),
      otherDetailsOfficeAddress: new FormControl('', []),
      otherDetailsOfficePinCode: new FormControl('', []),
      professionOtherSpecify: new FormControl(),
      professional: new FormControl(),
      courseDegree: new FormControl(true),
    })
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.configSvc = this.activeRoute.snapshot.data.configService || {}
        const profileDataAll = this.activeRoute.snapshot.data.profileData.data || {}
        const profileData = profileDataAll.profileDetails
        if (profileData) {
          this.userID = profileData.profileReq.id || profileData.profileReq.userId || profileDataAll.id
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
        const userData = profileData ? profileData.profileReq : ''
        this.userData = profileData ? profileData.profileReq : ''
        const academics = this.populateAcademics(userData)
        // this.setDegreeValuesArray(academics)
        // this.setPostDegreeValuesArray(academics)
        const organisations = this.populateOrganisationDetails(userData)
        if (userData) {
          this.constructFormFromRegistry(userData, academics, organisations)
        }
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

        const usrRoles = profileDataAll.roles
        if (usrRoles && usrRoles.length > 0) {
          usrRoles.forEach((role: any) => {
            this.orguserRoles.push(role)
            this.modifyUserRoles(role)
          })
        }

        // if (this.department.active_users && this.department.active_users.length > 0) {
        //   this.department.active_users.forEach((user: any) => {
        //     if (this.userID === user.userId) {
        //       this.userStatus = 'Active'
        //       const usrRoles = user.roleInfo
        //       usrRoles.forEach((role: any) => {
        //         this.orguserRoles.push(role.roleName)
        //         this.modifyUserRoles(role.roleName)
        //       })
        //     }
        //   })
        // }
        // if (this.department.blocked_users && this.department.blocked_users.length > 0) {
        //   this.department.blocked_users.forEach((user: any) => {
        //     if (this.userID === user.userId) {
        //       this.userStatus = 'Blocked'
        //     }
        //   })
        // }
        // if (this.department.inActive_users && this.department.inActive_users.length > 0) {
        //   this.department.inActive_users.forEach((user: any) => {
        //     if (this.userID === user.userId) {
        //       this.userStatus = 'Inactive'
        //     }
        //   })
        // }

        // let wfHistoryDatas = this.activeRoute.snapshot.data.workflowHistoryData.data.result.data || {}
        // const datas: any[] = Object.values(wfHistoryDatas)
        // wfHistoryDatas = [].concat.apply([], datas)
        // const wfHistoryData = wfHistoryDatas.filter((wfh: { inWorkflow: any }) => !wfh.inWorkflow)
        // let currentdate: Date

        this.activeRoute.data.subscribe(data => {
          this.profileData = data.pageData.data.profileData ? data.pageData.data.profileData : []
          this.profileDataKeys = data.pageData.data.profileDataKey ? data.pageData.data.profileDataKey : []
        })

        this.routeSubscription = this.activeRoute.queryParamMap.subscribe(qParamsMap => {
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

        // wfHistoryData.forEach((wfh: any) => {
        //   currentdate = new Date(wfh.createdOn)
        //   if (typeof wfh.updateFieldValues === 'string') {
        //     const fields = JSON.parse(wfh.updateFieldValues)
        //     let pendingwfh: any
        //     let feildNameObj: any
        //     let feildKeyObj: any
        //     if (fields.length > 0) {
        //       fields.forEach((field: any) => {
        //         pendingwfh = field
        //         const labelKey = Object.keys(field.toValue)[0]
        //         const fieldKey = field.fieldKey
        //         feildNameObj = this.profileData ? this.profileData.filter(userData => userData.key === labelKey)[0] : {}
        //         feildKeyObj = this.profileDataKeys ? this.profileDataKeys.filter(userData => userData.key === fieldKey)[0] : {}
        //       })
        //       this.wfHistory.push({
        //         fieldKey: feildKeyObj ? feildKeyObj.name : null,
        //         requestedon: `${currentdate.getDate()}
        //           ${moment(currentdate.getMonth() + 1, 'MM').format('MMM')}
        //           ${currentdate.getFullYear()}
        //           ${currentdate.getHours()} :
        //           ${currentdate.getMinutes()} :
        //           ${currentdate.getSeconds()}`,
        //         toValue: pendingwfh.toValue ? pendingwfh.toValue[Object.keys(pendingwfh.toValue)[0]] : null,
        //         fromValue: pendingwfh.fromValue ? pendingwfh.fromValue[Object.keys(pendingwfh.fromValue)[0]] : null,
        //         fieldName: feildNameObj ? feildNameObj.name : null,
        //         comment: wfh.comment ? wfh.comment : null,
        //         action: wfh.action ? wfh.action : null,
        //       })

        //     }
        //   }
        // })
      }
    })

    this.updateUserRoleForm = new FormGroup({
      roles: new FormControl('', [Validators.required]),
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
  updateUserRoleForm: FormGroup
  updateUserDetailsForm!: FormGroup
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
      data.academics.map((item: any) => {
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
  createDegree(): FormGroup {
    return this.fb.group({
      degree: new FormControl('', []),
      instituteName: new FormControl('', []),
      yop: new FormControl('', [Validators.pattern(this.yearPattern)]),
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
    $event.target.src = '/assets/instances/eagle/app_logos/default.png'
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
    if (this.configSvc.userProfile) {
      this.userID = this.configSvc.userProfile.userId || ''
    }
    const userAgent = ''
    const userCookie = ''
    const profileRequest = constructReq(form.value, this.userData, userAgent, userCookie)

    // const userdata = Object.assign(profileRequest, obj)
    const reqUpdate = {
      request: {
        userId: this.userID,
        profileDetails: profileRequest,
      },
    }

    this.usersSvc.updateProfileDetails(reqUpdate).subscribe(data => {
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

      this.usersSvc.addUserToDepartment(dreq).subscribe(dres => {
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
          dialogRef.afterClosed().subscribe((response: any) => {
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
