import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PlaylistSharedModule } from '@ws/app/src/lib/routes/playlist/playlist-shared.module'
import { STANDALONE_PLAYLIST_ROUTES } from '@ws/app/src/lib/routes/playlist/playlist-routing.module'

// Components for /app/playlist/ routes (standalone, no home wrapper)
import { SelectCoursesComponent } from '@ws/app/src/lib/routes/playlist/pages/select-courses/select-courses.component'
import { ManageCourseOrderComponent } from '@ws/app/src/lib/routes/playlist/pages/manage-course-order/manage-course-order.component'
import { SuccessDialogComponent } from '@ws/app/src/lib/routes/playlist/components/success-dialog/success-dialog.component'

/**
 * Standalone Playlist Module for routes outside home (/app/playlist/)
 * Contains select-courses and manage-order pages without sidebar
 */
@NgModule({
    declarations: [
        SelectCoursesComponent,
        ManageCourseOrderComponent,
        SuccessDialogComponent,
    ],
    imports: [
        RouterModule.forChild(STANDALONE_PLAYLIST_ROUTES),
        PlaylistSharedModule,
    ],
})
export class RoutePlaylistStandaloneModule { }
