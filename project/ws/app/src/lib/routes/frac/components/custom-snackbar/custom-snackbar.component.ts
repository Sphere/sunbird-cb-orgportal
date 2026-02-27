import { Component } from '@angular/core'
import { FRAC_SNACKBAR_DURATION_MS } from '../../constants/frac.constants'

@Component({
  selector: 'app-custom-snackbar',
  templateUrl: './custom-snackbar.component.html',
  styleUrls: ['./custom-snackbar.component.scss']
})
export class CustomSnackbarComponent {
  message = '';
  type: 'success' | 'error' | 'warning' = 'success';
  visible = false;

  /**
   * Displays the notification or snackbar message to the user.
   */
  show(message: string, type: 'success' | 'error' | 'warning', duration = FRAC_SNACKBAR_DURATION_MS) {
    this.message = message
    this.type = type
    this.visible = true

    setTimeout(() => (this.visible = false), duration)
  }
}
