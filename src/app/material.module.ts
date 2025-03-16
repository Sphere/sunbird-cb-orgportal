import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
// Import Material components that you need
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatDividerModule } from '@angular/material/divider'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
// import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar'
// import { MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS } from '@angular/material/progress-spinner'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar'
import { MatRippleModule } from '@angular/material/core'
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider'
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatNativeDateModule } from '@angular/material/core'
import { MatSortModule } from '@angular/material/sort'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  exports: [
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
    MatSliderModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatRippleModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatNativeDateModule,
    MatSortModule,
    MatTabsModule,
  ]
})
export class MaterialModule { }
