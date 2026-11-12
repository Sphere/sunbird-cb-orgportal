import { Component } from '@angular/core'
import { FRAC_STUDIO_ROUTES } from '../../constants/frac-studio.constants'

/** Page frame: title, the three tabs, and the routed tab content. */
@Component({
  selector: 'ws-app-frac-studio-shell',
  templateUrl: './frac-studio-shell.component.html',
  styleUrls: ['./frac-studio-shell.component.scss'],
  standalone: false,
})
export class FracStudioShellComponent {
  readonly tabs = [
    { label: 'Create FRAC', link: FRAC_STUDIO_ROUTES.creator },
    { label: 'Review FRAC', link: FRAC_STUDIO_ROUTES.reviewer },
    { label: 'My FRACs', link: FRAC_STUDIO_ROUTES.myFracs },
  ]
}
