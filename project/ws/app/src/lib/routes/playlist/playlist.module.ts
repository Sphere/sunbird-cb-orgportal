import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PlaylistRoutingModule } from './playlist-routing.module'
import { PlaylistSharedModule } from './playlist-shared.module'

// Components for /app/home/playlist/ routes
import { PlaylistFiltersComponent } from './pages/playlist-filters/playlist-filters.component'
import { PlaylistSummaryComponent } from './pages/playlist-summary/playlist-summary.component'

/**
 * Playlist Module for home routes (/app/home/playlist/)
 * Contains filters and summary pages with sidebar visible
 */
@NgModule({
    declarations: [
        PlaylistFiltersComponent,
        PlaylistSummaryComponent,
    ],
    imports: [
        RouterModule,
        PlaylistRoutingModule,
        PlaylistSharedModule,
    ],
})
export class PlaylistModule { }
