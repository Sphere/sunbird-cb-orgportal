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
  MatCheckboxModule
} from '@angular/material'

import { MatMenuModule } from '@angular/material/menu'
import { SkillTableComponent } from './components'


@NgModule({
  declarations: [SkillTableComponent],
  imports: [
    CommonModule,
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
    MatDialogModule
  ],
  exports: [SkillTableComponent]
})
export class SkillModule { }
