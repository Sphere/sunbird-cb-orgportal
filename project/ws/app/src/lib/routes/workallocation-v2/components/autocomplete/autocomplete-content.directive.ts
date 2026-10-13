import { Directive, TemplateRef } from '@angular/core'

@Directive({
  standalone: false,
  selector: '[wsAppAutocompleteContent]',
})
export class AutocompleteContentDirective {
  constructor(public tpl: TemplateRef<any>) {
  }
}
