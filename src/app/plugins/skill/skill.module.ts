import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatDialogModule } from '@angular/material/dialog'
import { MatChipsModule } from '@angular/material/chips'
import { MatTableModule } from '@angular/material/table'
import { MatCardModule } from '@angular/material/card'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatDividerModule } from '@angular/material/divider'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatSelectModule } from '@angular/material/select'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatDatepickerModule } from '@angular/material/datepicker'

import { MatMenuModule } from '@angular/material/menu'
import {
  FilterDialogComponent,
  SearchSelectedFilterComponent,
  AddCompetencyDialogComponent,
  ConfirmDialogComponent,
  SkillTableComponent, UserCompetencyComponent,
  ProficiencyLevelDialogComponent,
} from './components'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

@NgModule({
  declarations: [
    SkillTableComponent,
    FilterDialogComponent,
    ConfirmDialogComponent,
    AddCompetencyDialogComponent,
    SearchSelectedFilterComponent,
    UserCompetencyComponent,
    ProficiencyLevelDialogComponent],
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
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  entryComponents: [
    FilterDialogComponent,
    ConfirmDialogComponent,
    AddCompetencyDialogComponent,
    ProficiencyLevelDialogComponent,
  ],
  exports: [SkillTableComponent, SearchSelectedFilterComponent],
})
export class SkillModule { }
