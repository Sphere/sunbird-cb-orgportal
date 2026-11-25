import { TemplateRef } from '@angular/core'
import { AutocompleteContentDirective } from './autocomplete-content.directive'

describe('AutocompleteContentDirective', () => {
  it('should create an instance', () => {
    const directive = new AutocompleteContentDirective({} as TemplateRef<any>)
    expect(directive).toBeTruthy()
  })
})
