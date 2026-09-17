import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { FormConfigComponent } from './pages/form-config/form-config.component'

const routes: Routes = [
  { path: '', redirectTo: 'config', pathMatch: 'full' },
  { path: 'config', component: FormConfigComponent },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormRoutingModule { }
