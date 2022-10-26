import { Component, OnInit, Input } from '@angular/core'

@Component({
  selector: 'ws-user-competency',
  templateUrl: './user-competency.component.html',
  styleUrls: ['./user-competency.component.scss'],
})
export class UserCompetencyComponent implements OnInit {

  @Input() legends: Legend[] = [
    {
      name: 'Self Assessment',
      color: '#f3c581bd',
    },
    {
      name: 'Course',
      color: '#b9eeff',
    },
    {
      name: 'Admin added',
      color: '#a8f6c1',
    },
    {
      name: 'Required',
      color: '#0075B7',
    },
  ];

  constructor() { }

  ngOnInit() {
  }

}

export class Legend {
  name?: string
  color?: string
}
