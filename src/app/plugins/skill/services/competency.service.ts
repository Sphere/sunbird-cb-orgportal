import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
// import { map } from 'rxjs/operators'
import * as _ from 'lodash'

const API_END_POINTS = {
  getAllEntity: `/apis/protected/v8/entityCompetency/getAllEntity`,
  getPassbook: `/apis/proxies/v8/user/v1/admin/passbook`,
  updatePassbook: `/apis/proxies/v8/user/v1/passbook`,
}

@Injectable({
  providedIn: 'root',
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
      const formatedData = _.reduce(actualData, (result: any, value) => {
        result.push({
          value: _.get(value, 'id'),
          displayName: _.get(value, 'name'),
          type: _.get(value, 'type'),
          additionalProperties: _.get(value, 'additionalProperties'),
          isActive: _.get(value, 'isActive'),
          levelId: _.get(value, 'levelId'),
          level: _.get(value, 'level'),
        })
        return result
      }, [])
      return formatedData
    }
    return actualData

  }

  updatePassbook(passbookBody: any) {
    return this.http.patch(`${API_END_POINTS.updatePassbook}`, passbookBody)
  }

  getUserPassbook(passbookBody: any) {
    return this.http.post<any>(`${API_END_POINTS.getPassbook}`, passbookBody)
  }

  formatedUserCompetency(entity: any, passbook: any) {
    const response: any = []
    _.forEach(entity, (value: any) => {
      const cid = _.get(value, 'id')
      _.forEach(passbook, (passbookValue: any) => {
        if (passbookValue.competencies.hasOwnProperty(cid)) {
          const competency = passbookValue.competencies[cid]
          response.push({
            title: _.get(competency, 'acquiredDetails[0].competencyName'),
            logs: this.acquiredPassbookLogs(_.get(competency, 'acquiredDetails')),
            competencyId: _.get(competency, 'competencyId'),
            proficiencyLevels: this.acauiredChannelColourCode(_.get(competency, 'acquiredDetails')),
          })

        }
      })
    })
    return response
  }

  acquiredPassbookLogs(acquiredDetails: any) {
    const response: any = []
    if (acquiredDetails.length > 0) {
      _.forEach(acquiredDetails, (value: any) => {
        const channel = _.get(value, 'acquiredChannel')
        response.push({
          source: _.get(value, 'acquiredChannel') ? _.get(value, 'acquiredChannel') : '',
          date: _.get(value, 'createdDate'),
          level: 'Level '.concat(_.replace(_.get(value, 'competencyLevelId'), 'l', '')),
          color: this.getColor(channel),
          remarks: _.get(value, 'additionalParams.remarks'),
        })
      })
    }
    return response
  }

  acauiredChannelColourCode(acquiredDetails: any) {
    const response = [
      {
        color: '#FFFBB0',
        displayLevel: '1',
        selected: false,
      },
      {
        color: '#FFFBB0',
        displayLevel: '2',
        selected: false,
      },
      {
        color: '#FFFBB0',
        displayLevel: '3',
        selected: false,
      },
      {
        color: '#FFFBB0',
        displayLevel: '4',
        selected: false,
      },
      {
        color: '#FFFBB0',
        displayLevel: '5',
        selected: false,
      },
    ]

    _.forEach(acquiredDetails, (value: any) => {
      const channel = _.get(value, 'acquiredChannel')
      const competencyLevelId = _.replace(_.get(value, 'competencyLevelId'), 'l', '').trim()
      _.forEach(response, (level: any) => {
        if (level.displayLevel === competencyLevelId) {
          level.color = this.getColor(channel)
          level.selected = true
        }
      })
    })
    return response
  }

  getColor(channel: string): string {
    switch (channel) {
      case 'course': {
        return '#FFFBB0'
      }
      case 'selfAssessment': {
        return '#7CB5E6'
      }
      case 'admin': {
        return '#A4DFCA'
      }
    }
    return '#FFFBB0'
  }

}
