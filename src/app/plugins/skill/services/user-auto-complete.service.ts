import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { map, } from 'rxjs/operators'
// TODO: move this in some common place
const PROTECTED_SLAG_V8 = '/apis/proxies/v8'
const API_END_POINTS = {
  AUTOCOMPLETE: (query: string) => `${PROTECTED_SLAG_V8}/user/v1/autocomplete/${query}`,
}

@Injectable({
  providedIn: 'root'
})
export class UserAutoCompleteService {

  constructor(private http: HttpClient, private configSvc: ConfigurationsService) { }

  fetchAutoComplete(
    query: string,
  ): Observable<any[]> {
    let url = API_END_POINTS.AUTOCOMPLETE(query)

    const stringifiedQueryParams = this.getStringifiedQueryParams({
      dealerCode: this.configSvc.userProfile && this.configSvc.userProfile.dealerCode ? this.configSvc.userProfile.dealerCode : undefined,
      sourceFields: this.configSvc.instanceConfig && this.configSvc.instanceConfig.sourceFieldsUserAutocomplete
        ? this.configSvc.instanceConfig.sourceFieldsUserAutocomplete
        : undefined,
    })

    url += stringifiedQueryParams ? `?${stringifiedQueryParams}` : ''

    return this.http.get<any[]>(
      url,
    ).pipe(map((data: any) => {
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
        const users: any = response.content
        return users.map((user: any) => {
          console.log(user)
          return {
            fullName: `${user.firstName || ''} ${user.lastName || ''}`,
            id: user.id,
            mail: user.email,
            department: user.department_name,
          }
        })
      }),
    )
  }
}
