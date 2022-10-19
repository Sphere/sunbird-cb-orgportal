import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'ws-app-add-competencies',
  templateUrl: './add-competencies.component.html',
  styleUrls: ['./add-competencies.component.scss']
})
export class AddCompetenciesComponent implements OnInit {

  //#region (Global variables);
  competencyDataList: {
    title: string
    levelData: {
      title: string
    }[]
  }[] = [];

  //#endregion

  //#region (constructor)
  constructor() { }
  //#endregion

  //#region onInit region
  //#region (ngOnInit)
  ngOnInit() {
    this.initialization()
  }
  //#endregion

  //#region (initialization) intializing intial variables
  initialization() {
    this.competencyDataList = [{
      title: "Procurement and Distribution of HCM", levelData: [{ title: "levle1" }, { title: "levle2" }]
    },
    {
      title: "Store management and planning and coordination of THR and Dry ration", levelData: [{ title: "levle1" }, { title: "levle3" }]
    },
    ]
  }
  //#endregion

  //#endregion

}
