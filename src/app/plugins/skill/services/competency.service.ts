import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { map } from 'rxjs/operators'
import * as _ from 'lodash'

const API_END_POINTS = {
  getAllEntity: `/apis/protected/v8/entityCompetency/getAllEntity`,
}

@Injectable({
  providedIn: 'root'
})
export class CompetencyService {

  constructor(
    private http: HttpClient
  ) { }

  getAllEntity(serchBody: any) {
    return this.http.post<any>(`${API_END_POINTS.getAllEntity}`, serchBody)
      .pipe(map((data: any) => {
        return this.getFormatedData(data)
      }))
  }

  getFormatedData(data: any) {
    const actualData = _.get(data, 'result.response', [])
    if (actualData.length > 0) {
      let formatedData = _.reduce(actualData, (result: any, value) => {
        result.push({
          'value': _.get(value, 'id'),
          'displayName': _.get(value, 'name'),
          'type': _.get(value, 'type'),
          'additionalProperties': _.get(value, 'additionalProperties'),
          'isActive': _.get(value, 'isActive'),
          'levelId': _.get(value, 'levelId'),
          'level': _.get(value, 'level')
        })
        return result
      }, [])
      return formatedData
    }
    return actualData

  }
}
