import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { FracStudioShellComponent } from './components/frac-studio-shell/frac-studio-shell.component'
import { CreatorBriefComponent } from './pages/creator-brief/creator-brief.component'
import { CreatorDetailComponent } from './pages/creator-detail/creator-detail.component'
import { MyFracsComponent } from './pages/my-fracs/my-fracs.component'
import { ReviewerComponent } from './pages/reviewer/reviewer.component'

const routes: Routes = [
  {
    path: '',
    component: FracStudioShellComponent,
    children: [
      { path: '', redirectTo: 'reviewer', pathMatch: 'full' },
      { path: 'reviewer', component: ReviewerComponent },
      { path: 'creator', component: CreatorBriefComponent },
      { path: 'creator/:id', component: CreatorDetailComponent },
      { path: 'my-fracs', component: MyFracsComponent },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FracStudioRoutingModule { }
