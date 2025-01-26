import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivityLabelsComponent } from './activity-labels.component'
import {
  MatAutocompleteModule
} from '@angular/material/autocomplete'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { CdkStepperModule } from '@angular/cdk/stepper'
import { CdkTableModule } from '@angular/cdk/table'
import { CdkTreeModule } from '@angular/cdk/tree'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { AutocompleteModule } from '../autocomplete/autocomplete.module'
import { ComponentSharedModule } from '../component-shared.module'
import { WatRolePopupComponent } from './wat-role-popup/wat-role-popup.component'
@NgModule({
  declarations: [
    ActivityLabelsComponent,
    WatRolePopupComponent,
  ],
  imports: [
    CommonModule,
    AutocompleteModule,
    MatCardModule,
    MatIconModule,
    CdkStepperModule,
    CdkTableModule,
    CdkTreeModule,
    DragDropModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    ComponentSharedModule,
    MatDialogModule,
    MatCheckboxModule,
    FormsModule,
  ],
  entryComponents: [WatRolePopupComponent],
  exports: [ActivityLabelsComponent],
  // providers: [{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } },
  // { provide: MatDialogRef, useValue: {} },]
})
export class ActivityLabelsModule { }
