import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivityLabelsComponent } from './activity-labels.component'
import {
    MatLegacyAutocompleteModule as MatAutocompleteModule,
} from '@angular/material/legacy-autocomplete'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { CdkStepperModule } from '@angular/cdk/stepper'
import { CdkTableModule } from '@angular/cdk/table'
import { CdkTreeModule } from '@angular/cdk/tree'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { AutocompleteModule } from '../autocomplete/autocomplete.module'
import { ComponentSharedModule } from '../component-shared.module'
import { WatRolePopupComponent } from './wat-role-popup/wat-role-popup.component'
import { MatDividerModule } from '@angular/material/divider'
// import { DialogConfirmComponent } from '../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
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
        MatDividerModule
    ],
    exports: [ActivityLabelsComponent]
})
export class ActivityLabelsModule { }
