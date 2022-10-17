import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material'
// tslint:disable-next-line
import _ from 'lodash'
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component'
@Component({
  selector: 'app-competencies',
  templateUrl: './competencies.component.html',
  styleUrls: ['./competencies.component.scss'],
})
export class CompetenciesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator | undefined

  displayedColumns: string[] = ['Full_Name', 'Designation', 'State', 'City', 'Block', 'Sub_Centre', 'Competency_Status'];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  constructor(
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.dataSource.paginator = this.paginator ? this.paginator : null
  }

  filterTable() {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      maxHeight: '90vh',
      minHeight: '65%',
      width: '80%',
      autoFocus: false, // To remove auto select
      restoreFocus: false,
      panelClass: 'competencies'
    })
    dialogRef.afterClosed().subscribe((responce: any) => {
      if (responce) { }
    })
  }

  ngOnDestroy() { }
}

export interface PeriodicElement {
  Full_Name: string
  Designation: string
  State: string
  City: string
  Block: string
  Sub_Centre: string
  Competency_Status: string
}

const ELEMENT_DATA: PeriodicElement[] = [
  { Full_Name: 'Full_Name1', Designation: 'Designation1', State: 'State1', City: 'City1', Block: 'Block1', Sub_Centre: 'Sub_Centre1', Competency_Status: 'Competency_Status1' },
  { Full_Name: 'Full_Name2', Designation: 'Designation2', State: 'State2', City: 'City2', Block: 'Block2', Sub_Centre: 'Sub_Centre2', Competency_Status: 'Competency_Status2' },
  { Full_Name: 'Full_Name3', Designation: 'Designation3', State: 'State3', City: 'City3', Block: 'Block3', Sub_Centre: 'Sub_Centre3', Competency_Status: 'Competency_Status3' },
  { Full_Name: 'Full_Name4', Designation: 'Designation4', State: 'State4', City: 'City4', Block: 'Block4', Sub_Centre: 'Sub_Centre4', Competency_Status: 'Competency_Status4' },
  { Full_Name: 'Full_Name5', Designation: 'Designation5', State: 'State5', City: 'City5', Block: 'Block5', Sub_Centre: 'Sub_Centre5', Competency_Status: 'Competency_Status5' },
  { Full_Name: 'Full_Name6', Designation: 'Designation6', State: 'State6', City: 'City6', Block: 'Block6', Sub_Centre: 'Sub_Centre6', Competency_Status: 'Competency_Status6' },
  { Full_Name: 'Full_Name7', Designation: 'Designation7', State: 'State7', City: 'City7', Block: 'Block7', Sub_Centre: 'Sub_Centre7', Competency_Status: 'Competency_Status7' },
]
