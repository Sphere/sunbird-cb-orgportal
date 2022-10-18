import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  MatIconModule,
  MatListModule,
  MatFormFieldModule,
  MatDialogModule,
  MatChipsModule,
  MatTableModule,
  MatCardModule,
  MatExpansionModule,
  MatGridListModule,
  MatDividerModule,
  MatPaginatorModule,
  MatSelectModule,
  MatCheckboxModule
} from '@angular/material'

import { MatMenuModule } from '@angular/material/menu'
import { SkillTableComponent } from './components'
import { FilterTableComponent } from './components/filter-table/filter-table.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'


@NgModule({
  declarations: [SkillTableComponent, FilterTableComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatGridListModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatDividerModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDialogModule,
    MatSelectModule
  ],
  entryComponents: [
    FilterTableComponent
  ],
  exports: [SkillTableComponent]
})
export class SkillModule { }
