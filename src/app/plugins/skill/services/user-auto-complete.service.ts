import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import * as _ from 'lodash'
// TODO: move this in some common place
const PROTECTED_SLAG_V8 = '/apis/protected/v8'
const API_END_POINTS = {
  getUserDetails: `${PROTECTED_SLAG_V8}/autoCompletev2/getUserDetails`
}

@Injectable({
  providedIn: 'root',
})
export class UserAutoCompleteService {

  constructor(private http: HttpClient) { }

  fetchAutoComplete(
    query: string,
  ): Observable<any[]> {
    let url = API_END_POINTS.getUserDetails

    const body = {
      "details": query
    }

    return this.http.get<any[]>(url, { params: body }).pipe(map((data: any) => {
      return data.result.response
    }))
  }
  getStringifiedQueryParams(obj: { [key: string]: number | string | undefined | string[] }) {
    return Object.entries(obj)
      .filter(u => u[1])
      .map(u => {
        return `${u[0]}=${u[1]}`
      })
      .join('&')
  }

  fetchUserList(data: string): Observable<any[]> {
    return this.fetchAutoComplete(data).pipe(
      map((response: any) => {
        return this.getFormatedRequest(response)
      }),
    )
  }

  getFormatedRequest(data: any) {
    const activeUsersData: any[] = []
    if (data && data.content && data.content.length > 0) {
      _.filter(data.content, { isDeleted: false }).forEach((user: any) => {
        let professionalDetails = null
        let addressDetails = null
        if (user && user.profileDetails && user.profileDetails.profileReq) {
          const profileReq = user.profileDetails.profileReq
          professionalDetails = profileReq.professionalDetails ? this.getprofessionalDetails(profileReq.professionalDetails) : null
          addressDetails = profileReq.personalDetails ? this.getPostalAdress(profileReq.personalDetails) : null
        }
        activeUsersData.push({
          fullName: user ? _.get(user, 'profileDetails.profileReq.personalDetails.firstname', '').concat(' ', _.get(user, 'profileDetails.profileReq.personalDetails.lastname', '')) : null,
          // tslint:disable-next-line:max-line-length
          email: _.get(user, 'profileDetails.profileReq.personalDetails.primaryEmail', user.email),
          userId: user.id,
          active: !user.isDeleted,
          blocked: user.blocked !== null && user.blocked !== undefined ? user.blocked : null,
          designation: professionalDetails ? professionalDetails.designation : '',
          state: addressDetails && addressDetails.state ? addressDetails.state : '',
          city: addressDetails && addressDetails.city ? addressDetails.city : '',
        })
      })
    }
    return activeUsersData
  }

  getprofessionalDetails(data: any) {
    const professionalDetails: any = {}
    if (data && data.length > 0) {
      // tslint:disable-next-line:max-line-length
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
