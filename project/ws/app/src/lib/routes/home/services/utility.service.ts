import { Injectable } from '@angular/core'
import _ from 'lodash'
@Injectable()
export class UtilityService {
  constructor() {

  }
  getFormatedRequest(data: any) {
    const activeUsersData: any[] = []
    if (data && data.content && data.content.length > 0) {
      _.filter(data.content, { isDeleted: false }).forEach((user: any) => {
        // tslint:disable-next-line
        const professionalDetails = this.getprofessionalDetails(user.profileDetails.profileReq.professionalDetails)
        activeUsersData.push({
          fullName: user ? `${user.firstName} ${user.lastName}` : null,
          email: user.personalDetails && user.personalDetails.primaryEmail ? user.personalDetails.primaryEmail : user.email,
          userId: user.id,
          active: !user.isDeleted,
          blocked: user.blocked,
          designation: professionalDetails.designation
        })
      })
    }
    return activeUsersData
  }
  getprofessionalDetails(data: any) {
    console.log(data)
    const professionalDetails: any = {}
    if (data && data.length > 0) {
      // tslint:disable-next-line
      _.reduce(data, (_key: any, value: any) => {
        professionalDetails['designation'] = value.designation ? value.designation : ''
      }, professionalDetails)
    }
    return professionalDetails
  }
}