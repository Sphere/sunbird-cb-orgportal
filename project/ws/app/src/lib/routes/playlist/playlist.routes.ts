import { Routes } from '@angular/router'
import { PlaylistFiltersComponent } from './pages/playlist-filters/playlist-filters.component'
import { PlaylistSummaryComponent } from './pages/playlist-summary/playlist-summary.component'
import { SelectCoursesComponent } from './pages/select-courses/select-courses.component'
import { ManageCourseOrderComponent } from './pages/manage-course-order/manage-course-order.component'
import { SelectCompetenciesComponent } from './pages/select-competencies/select-competencies.component'
import { ManageCompetencyOrderComponent } from './pages/manage-competency-order/manage-competency-order.component'
import { ManageSearchComponent } from './pages/manage-search/manage-search.component'
import { FEATURE_KEY } from '../../shared/access/feature-access'

/**
 * Tells view-only directives in these standalone components that they render
 * inside the Playlist feature. Inherited by all components under each route.
 */
const PLAYLIST_FEATURE_PROVIDERS = [{ provide: FEATURE_KEY, useValue: 'playlist' }]

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
        providers: PLAYLIST_FEATURE_PROVIDERS,
    },
    {
        path: 'summary',
        component: PlaylistSummaryComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
    },
]

/**
 * Routes for /app/playlist/ (standalone, no sidebar)
 */
export const STANDALONE_PLAYLIST_ROUTES: Routes = [
    {
        path: 'select-courses',
        component: SelectCoursesComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
    },
    {
        path: 'manage-course-order',
        component: ManageCourseOrderComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
    },
    {
        path: 'select-competencies',
        component: SelectCompetenciesComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
    },
    {
        path: 'manage-competency-order',
        component: ManageCompetencyOrderComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
    },
    {
        path: 'manage-search',
        component: ManageSearchComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
    },
    // ASKME course flow — same screens, driven by the 'askme' course context
    // so it reads and writes the ASKME_COURSES_V1 playlist instead.
    {
        path: 'askme/select-courses',
        component: SelectCoursesComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
        data: { courseContext: 'askme' },
    },
    {
        path: 'askme/manage-course-order',
        component: ManageCourseOrderComponent,
        providers: PLAYLIST_FEATURE_PROVIDERS,
        data: { courseContext: 'askme' },
    },
]
