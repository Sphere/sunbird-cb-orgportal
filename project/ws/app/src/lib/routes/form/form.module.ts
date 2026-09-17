import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { MatDialogModule } from '@angular/material/dialog'

import { FormRoutingModule } from './form-routing.module'
import { FormConfigComponent } from './pages/form-config/form-config.component'
import { FormPreviewDialogComponent } from './components/form-preview-dialog/form-preview-dialog.component'
import { FormNodeEditorComponent } from './components/form-node-editor/form-node-editor.component'

@NgModule({
  declarations: [
    FormConfigComponent,
    FormPreviewDialogComponent,
    FormNodeEditorComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormRoutingModule,
    FormsModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class FormModule { }
