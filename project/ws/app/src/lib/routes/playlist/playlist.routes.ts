import { Routes } from '@angular/router'
import { PlaylistFiltersComponent } from './pages/playlist-filters/playlist-filters.component'
import { PlaylistSummaryComponent } from './pages/playlist-summary/playlist-summary.component'
import { SelectCoursesComponent } from './pages/select-courses/select-courses.component'
import { ManageCourseOrderComponent } from './pages/manage-course-order/manage-course-order.component'
import { SelectCompetenciesComponent } from './pages/select-competencies/select-competencies.component'
import { ManageCompetencyOrderComponent } from './pages/manage-competency-order/manage-competency-order.component'
import { ManageSearchComponent } from './pages/manage-search/manage-search.component'

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
        path: 'manage-course-order',
        component: ManageCourseOrderComponent,
    },
    {
        path: 'select-competencies',
        component: SelectCompetenciesComponent,
    },
    {
        path: 'manage-competency-order',
        component: ManageCompetencyOrderComponent,
    },
    {
        path: 'manage-search',
        component: ManageSearchComponent,
    },
]
