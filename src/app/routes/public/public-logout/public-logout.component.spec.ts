import { PublicLogoutComponent } from './public-logout.component'

describe('PublicLogoutComponent', () => {
  let component: PublicLogoutComponent
  let originalLocation: Location

  beforeEach(() => {
    component = new PublicLogoutComponent()
    originalLocation = window.location
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { origin: 'https://app.example.com', href: '' } as any
  })

  afterEach(() => {
    window.location = originalLocation
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`
      }
    })
    jest.restoreAllMocks()
  })

  it('should be created', () => {
    expect(component).toBeTruthy()
  })

  it('login() navigates to the protected resource url', () => {
    component.login()
    expect(window.location.href).toBe('https://app.example.com/protected/v8/resource')
  })

  it('ngOnInit calls deleteAllCookies and swallows errors', () => {
    const spy = jest.spyOn(component, 'deleteAllCookies').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(() => component.ngOnInit()).not.toThrow()
    expect(spy).toHaveBeenCalled()
  })

  it('ngOnDestroy unsubscribes when a subscription exists', () => {
    const unsubscribe = jest.fn()
    ;(component as any).subscriptionContact = { unsubscribe }
    component.ngOnDestroy()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('ngOnDestroy is a no-op when no subscription exists', () => {
    ;(component as any).subscriptionContact = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('deleteAllCookies clears cookies, sets redirectUrl, and redirects to keycloak logout', async () => {
    document.cookie = 'foo=bar'
    document.cookie = 'baz=qux'
    component.http = { get: jest.fn().mockReturnValue({ toPromise: () => Promise.resolve({}) }) }

    await component.deleteAllCookies()

    expect(component.redirectUrl).toBe(`${document.baseURI}openid/keycloak`)
    expect(window.location.href).toContain('auth/realms/sunbird/protocol/openid-connect/logout')
    expect(component.http.get).toHaveBeenCalledWith('/apis/proxies/v8/logout/user')
  })
})
