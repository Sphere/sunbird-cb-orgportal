import { ElementRef, ViewContainerRef } from '@angular/core'
import { NgControl } from '@angular/forms'
import { Overlay } from '@angular/cdk/overlay'
import { AutocompleteDirective } from './autocomplete.directive'

describe('AutocompleteDirective', () => {
  it('should create an instance', () => {
    const directive = new AutocompleteDirective(
      {} as ElementRef<HTMLInputElement>,
      {} as NgControl,
      {} as ViewContainerRef,
      {} as Overlay,
    )
    expect(directive).toBeTruthy()
  })
})
