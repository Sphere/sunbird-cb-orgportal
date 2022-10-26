import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'ws-app-self-assessment',
  templateUrl: './self-assessment.component.html',
  styleUrls: ['./self-assessment.component.scss']
})
export class SelfAssessmentComponent implements OnInit {
  tableData: any
  data: any
  topBarConfig: any

  constructor() { }

  ngOnInit() {
    this.initialization()
  }

  initialization() {
    this.topBarConfig = {
      left: [],
      right: [
        {
          type: 'anchor',
          title: 'Reset Assessment',
          actioName: 'resetAssessment'
        },
        {
          type: 'button',
          title: 'Enable Self Assessment',
          actioName: 'enableSelfAssessment'
        }
      ]
    }

    this.tableData = {
      columns: [
        { displayName: 'Full Name', key: 'fullName' },
        { displayName: 'Designation', key: 'designation' },
        { displayName: 'State', key: 'state' },
        { displayName: 'City', key: 'city' },
        { displayName: 'Block', key: 'block' },
        { displayName: 'Sub Center', key: 'subCenter' },
        { displayName: 'Self Assessment Status', key: 'selfAssessmentStatus' }

      ],
      needCheckBox: true,
      needHash: false,
      sortColumn: 'dateCreatedOn',
      sortState: 'desc',
      needUserMenus: false

    }

    this.data = ELEMENT_DATA
  }

}

const ELEMENT_DATA = [
  {
    fullName: 'User1'
    , designation: 'designation1'
    , state: 'State1', city: 'City1', block: 'Block1',
    subCenter: 'subCenter1',
    selfAssessmentStatus: 'selfAssessmentStatus2'
  },
  {
    fullName: 'User2'
    , designation: 'designation2'
    , state: 'State1', city: 'City2', block: 'Block2',
    subCenter: 'subCenter2',
    selfAssessmentStatus: 'selfAssessmentStatus2'
  }

]