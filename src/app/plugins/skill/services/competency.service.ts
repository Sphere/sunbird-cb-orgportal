import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
// import { map } from 'rxjs/operators'
import * as _ from 'lodash'

const API_END_POINTS = {
  getAllEntity: `/apis/protected/v8/entityCompetency/getAllEntity`,
  passbook: `/apis/proxies/v8/user/v1/passbook`
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
    // .pipe(map((data: any) => {
    //   return this.getFormatedData(data)
    // }))
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

  updatePassbook(passbookBody: any) {
    return this.http.patch(`${API_END_POINTS.passbook}`, passbookBody)
  }

  getUserPassbook(passbookBody: any) {
    return this.http.post<any>(`${API_END_POINTS.passbook}`, passbookBody)
  }

  formatedUserCompetency(entity: any, passbook: any) {
    let response: any = []
    _.forEach(entity, (value: any) => {
      const cid = _.get(value, 'id')
      _.forEach(passbook, (passbookValue: any) => {
        if (passbookValue.competencies.hasOwnProperty(cid)) {
          const competency = passbookValue.competencies[cid]
          response.push({
            'title': _.get(competency, 'additionalParams.competencyName'),
            'logs': this.acquiredPassbookLogs(_.get(competency, 'acquiredDetails')),
            'proficiencyLevels': this.acauiredChannelColourCode(_.get(competency, 'acquiredDetails'))
          })

        }
      })
    })
    return response
  }

  acquiredPassbookLogs(acquiredDetails: any) {
    let response: any = []
    if (acquiredDetails.length > 0) {
      _.forEach(acquiredDetails, (value: any) => {
        response.push({
          'source': _.get(value, 'courseName') ? _.get(value, 'courseName') : '',
          'date': _.get(value, 'createdDate'),
          'description': _.get(value, 'additionalParams.description'),
          'keyboardArrowUp': true,
          'level': _.get(value, 'competencyLevelId')
        })
      })
    }
    return response
  }

  acauiredChannelColourCode(acquiredDetails: any) {
    let response = [
      {
        'color': '#FFFBB0',
        'displayLevel': 1,
        'selected': false,
      },
      {
        'color': '#FFFBB0',
        'displayLevel': 2,
        'selected': false,
      },
      {
        'color': '#FFFBB0',
        'displayLevel': 3,
        'selected': false,
      },
      {
        'color': '#FFFBB0',
        'displayLevel': 4,
        'selected': false,
      },
      {
        'color': '#FFFBB0',
        'displayLevel': 5,
        'selected': false,
      }
    ]

    _.forEach(acquiredDetails, (value: any) => {
      const channel = _.get(value, 'acquiredChannel')
      switch (channel) {
        case 'course': {
          _.forEach(response, (level: any) => {
            if (level.displayLevel == _.get(value, 'competencyLevelId')) {
              level.color = '#FFFBB0'
              level.selected = true
            }
          })

          break
        }
        case 'selfAssessment': {
          _.forEach(response, (level: any) => {
            if (level.displayLevel == _.get(value, 'competencyLevelId')) {
              level.color = '#7CB5E6'
              level.selected = true

            }
          })

          break
        }
        case 'admin': {
          _.forEach(response, (level: any) => {
            if (level.displayLevel == _.get(value, 'competencyLevelId')) {
              level.color = '#A4DFCA'
              level.selected = true
            }
          })

          break
        }
        default: {
          _.forEach(response, (level: any) => {
            if (level.displayLevel == _.get(value, 'competencyLevelId')) {
              level.color = '#FFFBB0'
              level.selected = false
            }
          })

          break
        }
      }
    })
    return response
  }

}
