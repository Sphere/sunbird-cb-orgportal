import { Injectable } from '@angular/core'
import { CustomSnackbarComponent } from '../components/custom-snackbar/custom-snackbar.component'

@Injectable({
  providedIn: 'root'
})
export class CustomSnackbarService {
  private snackbar!: CustomSnackbarComponent

  register(snackbar: CustomSnackbarComponent) {
    this.snackbar = snackbar
  }

  success(message: string) {
    this.snackbar?.show(message, 'success')
  }

  error(message: string) {
    this.snackbar?.show(message, 'error')
  }

  warning(message: string) {
    this.snackbar?.show(message, 'warning')
  }
}
