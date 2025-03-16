import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatDividerModule } from '@angular/material/divider'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatDatepickerModule } from '@angular/material/datepicker'

import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
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
        ProficiencyLevelDialogComponent
    ],
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
    exports: [SkillTableComponent, SearchSelectedFilterComponent]
})
export class SkillModule { }
