import { ViewContainerRef } from '@angular/core'
import { LoginRootDirective } from './login-root.directive'

describe('LoginRootDirective', () => {
  it('should create an instance', () => {
    const directive = new LoginRootDirective({} as ViewContainerRef)
    expect(directive).toBeTruthy()
  })
})
