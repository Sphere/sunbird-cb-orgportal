import { Directive, ElementRef, HostListener } from '@angular/core'

const DISABLE_TIME = 1500

@Directive({
  selector: 'button[n-submit]',
})
export class DisableButtonOnSubmitDirective {
  constructor(private readonly elementRef: ElementRef) { }
  @HostListener('click', ['$event'])
  clickEvent() {
    this.elementRef.nativeElement.setAttribute('disabled', 'true')
    setTimeout(() => this.elementRef.nativeElement.removeAttribute('disabled'), DISABLE_TIME)
  }
}
