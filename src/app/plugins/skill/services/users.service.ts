import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { map } from "rxjs/operators"
import { Observable } from "rxjs"
import * as _ from "lodash"

const API_END_POINTS = {
  PROFILE_REGISTRY_V1: '/apis/proxies/v8/user/v1/read/',
  PROFILE_REGISTRY_V2: '/apis/proxies/v8/api/user/v2/read'
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClient) { }

  getUserById(userid: string): Observable<any> {
    if (userid) {
      return this.http.get<any>(API_END_POINTS.PROFILE_REGISTRY_V1 + userid)
        .pipe(map((data: any) => {
          return this.getFormatedRequest(data.result.response)
        }))
    }
    return this.http.get<any>(API_END_POINTS.PROFILE_REGISTRY_V2).pipe(map(resp => resp.profiledetails))
  }

  getFormatedRequest(data: any) {
    const userDetails = {
      userName: '',
      role: '',
      designation: ''
    }
    let professionalDetails: any
    if (data) {
      userDetails.userName = data.userName
      userDetails.role = data.roles[0]
      if (data.profileDetails && data.profileDetails.profileReq) {
        professionalDetails = this.getprofessionalDetails(data.profileDetails.profileReq.professionalDetails)
      }
      userDetails.designation = professionalDetails.designation
    }
    return userDetails
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

}