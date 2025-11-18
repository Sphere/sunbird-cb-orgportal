import { Component } from '@angular/core'

@Component({
  selector: 'app-custom-snackbar',
  templateUrl: './custom-snackbar.component.html',
  styleUrls: ['./custom-snackbar.component.scss']
})
export class CustomSnackbarComponent {
  message = '';
  type: 'success' | 'error' | 'warning' = 'success';
  visible = false;

  show(message: string, type: 'success' | 'error' | 'warning', duration = 3000) {
    this.message = message
    this.type = type
    this.visible = true

    setTimeout(() => (this.visible = false), duration)
  }
}
