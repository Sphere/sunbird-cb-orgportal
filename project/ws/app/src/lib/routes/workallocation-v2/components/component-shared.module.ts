import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  MatSidenavModule
} from '@angular/material/sidenav'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatListModule } from '@angular/material/list'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatRadioModule } from '@angular/material/radio'
import { MatDialogModule } from '@angular/material/dialog'
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { MatTabsModule } from '@angular/material/tabs'
import { MatMenuModule } from '@angular/material/menu'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { UserAutocompleteCardComponent } from './user-autocomplete-card/user-autocomplete-card.component'
import { ExportAsModule } from 'ngx-export-as'
import { AutocompleteModule } from './autocomplete/autocomplete.module'
import { InitialAvatarComponent } from './initial-avatar/initial-avatar.component'
import { PublishPopupComponent } from './publish-popup/publish-popup.component'
import { PdfViewerModule } from 'ng2-pdf-viewer'
import { PlayerDialogComponent } from './player-dialog/player-dialog.component'

@NgModule({
  declarations: [
    UserAutocompleteCardComponent,
    InitialAvatarComponent,
    PublishPopupComponent,
    PlayerDialogComponent,
  ],
  imports: [
    CommonModule, PdfViewerModule,
    MatCardModule, FormsModule, ReactiveFormsModule, MatSidenavModule, MatListModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatGridListModule,
    MatRadioModule, MatDialogModule, MatSelectModule, MatProgressSpinnerModule,
    MatExpansionModule, MatDividerModule, MatPaginatorModule, MatTableModule,
    ExportAsModule, MatMenuModule, MatTabsModule, MatProgressSpinnerModule, MatAutocompleteModule,
    AutocompleteModule,
  ],
  exports: [
    UserAutocompleteCardComponent,
    InitialAvatarComponent,
    PublishPopupComponent,
    PlayerDialogComponent,
  ],
  entryComponents: [PublishPopupComponent, PlayerDialogComponent],
})
export class ComponentSharedModule { }
