import { Injectable } from '@angular/core'
import { CustomSnackbarComponent } from '../components/custom-snackbar/custom-snackbar.component'

@Injectable({
  providedIn: 'root'
})
export class CustomSnackbarService {
  private snackbar!: CustomSnackbarComponent

  /**
   * Registers the shared snackbar component instance used across FRAC pages.
   */
  register(snackbar: CustomSnackbarComponent) {
    this.snackbar = snackbar
  }

  /**
   * Shows a success message.
   */
  success(message: string) {
    this.snackbar?.show(message, 'success')
  }

  /**
   * Shows an error message.
   */
  error(message: string) {
    this.snackbar?.show(message, 'error')
  }

  /**
   * Shows a warning message.
   */
  warning(message: string) {
    this.snackbar?.show(message, 'warning')
  }
}
