import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  MatSidenavModule,
} from '@angular/material/sidenav'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
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
    ]
})
export class ComponentSharedModule { }
