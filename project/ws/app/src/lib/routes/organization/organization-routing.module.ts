import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { OrganizationListComponent } from './pages/organization-list/organization-list.component'

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: OrganizationListComponent },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationRoutingModule { }
