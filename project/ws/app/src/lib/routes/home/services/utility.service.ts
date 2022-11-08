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
        let professionalDetails: any
        let addressDetails: any
        if (_.get(user, 'profileDetails') && _.get(user, 'profileDetails.profileReq.professionalDetails')) {
          professionalDetails = this.getprofessionalDetails(user.profileDetails.profileReq.professionalDetails)
          addressDetails = this.getPostalAdress(user.profileDetails.profileReq.personalDetails)
        }
        activeUsersData.push({
          fullName: user ? `${user.firstName} ${user.lastName}` : null,
          email: user.personalDetails && user.personalDetails.primaryEmail ? user.personalDetails.primaryEmail : user.email,
          userId: user.id,
          active: !user.isDeleted,
          blocked: user.blocked,
          designation: professionalDetails ? professionalDetails.designation : '',
          state: addressDetails ? addressDetails.state : '',
          city: addressDetails ? addressDetails.city : '',
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
}