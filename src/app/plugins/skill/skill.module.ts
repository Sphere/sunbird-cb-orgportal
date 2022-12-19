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
  MatCheckboxModule,
  MatInputModule,
  MatButtonModule,
  MatDatepickerModule
} from '@angular/material'

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
    MatDatepickerModule
  ],
  entryComponents: [
    FilterDialogComponent,
    ConfirmDialogComponent,
    AddCompetencyDialogComponent,
    ProficiencyLevelDialogComponent
  ],
  exports: [SkillTableComponent, SearchSelectedFilterComponent],
})
export class SkillModule { }
