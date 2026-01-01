import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { PlaylistFiltersComponent } from './pages/playlist-filters/playlist-filters.component'
import { PlaylistSummaryComponent } from './pages/playlist-summary/playlist-summary.component'
import { SelectCoursesComponent } from './pages/select-courses/select-courses.component'
import { ManageCourseOrderComponent } from './pages/manage-course-order/manage-course-order.component'

/**
 * Routes for /app/home/playlist/ (with sidebar)
 */
export const HOME_PLAYLIST_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'filters',
        pathMatch: 'full',
    },
    {
        path: 'filters',
        component: PlaylistFiltersComponent,
    },
    {
        path: 'summary',
        component: PlaylistSummaryComponent,
    },
]

/**
 * Routes for /app/playlist/ (standalone, no sidebar)
 */
export const STANDALONE_PLAYLIST_ROUTES: Routes = [
    {
        path: 'select-courses',
        component: SelectCoursesComponent,
    },
    {
        path: 'manage-order',
        component: ManageCourseOrderComponent,
    },
]

@NgModule({
    imports: [RouterModule.forChild(HOME_PLAYLIST_ROUTES)],
    exports: [RouterModule],
})
export class PlaylistRoutingModule { }
