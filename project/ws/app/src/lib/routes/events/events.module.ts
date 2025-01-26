import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { CreateEventComponent } from './routes/create-event/create-event.component'
import { ViewEventComponent } from './routes/view-event/view-event.component'
import { ListEventComponent } from './routes/list/list-event.component'
import { ParticipantsComponent } from './components/participants/participants.component'
import { SuccessComponent } from './components/success/success.component'
import { EventListViewComponent } from './components/event-list-view/event-list-view.component'
import { EventsHomeComponent } from './routes/events-home/events-home.component'
import { EventThumbnailComponent } from './components/event-thumbnail/event-thumbnail.component'
import { RouterModule } from '@angular/router'
import { EventsRoutingModule } from './events.routing.module'
import { BreadcrumbsOrgModule, ScrollspyLeftMenuModule } from '@sunbird-cb/collection'
import { PipeFilterModule, PipeHtmlTagRemovalModule, PipeOrderByModule, PipeRelativeTimeModule } from '@sunbird-cb/utils'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
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
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatTableModule } from '@angular/material/table'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatNativeDateModule } from '@angular/material/core'
import { MatSortModule } from '@angular/material/sort'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatMenuModule } from '@angular/material/menu'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

@NgModule({
  declarations: [
    CreateEventComponent,
    ViewEventComponent,
    ParticipantsComponent,
    ListEventComponent,
    EventListViewComponent,
    EventsHomeComponent,
    EventThumbnailComponent,
    SuccessComponent,
  ],
  imports:
    [
      CommonModule,
      RouterModule,
      EventsRoutingModule,
      BreadcrumbsOrgModule,
      MatSidenavModule,
      MatListModule,
      ScrollspyLeftMenuModule,
      MatCardModule,
      FormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      MatIconModule,
      MatGridListModule,
      MatRadioModule,
      MatDialogModule,
      MatSelectModule,
      MatDatepickerModule,
      ReactiveFormsModule,
      MatTableModule,
      MatCheckboxModule,
      MatNativeDateModule,
      MatSortModule,
      MatAutocompleteModule,
      MatMenuModule,
      MatPaginatorModule,
      PipeFilterModule,
      PipeHtmlTagRemovalModule,
      PipeRelativeTimeModule,
      PipeOrderByModule,
      BreadcrumbsOrgModule,
      WidgetResolverModule,
      ScrollspyLeftMenuModule,
      MatRadioModule,
      MatExpansionModule,
      MatDividerModule,
    ],
  entryComponents: [
    ParticipantsComponent,
    EventThumbnailComponent,
    SuccessComponent,
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
    MatDatepickerModule,
    MatNativeDateModule,
    DatePipe,
  ],
})
export class EventsModule { }
