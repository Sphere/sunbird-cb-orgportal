// Jest mock for 'keycloak-js'.
// The real package ships as a browser-targeted module that Jest's transform can't
// consume directly, and tests never need real Keycloak behavior — specs that touch
// auth always override KeycloakService/AuthKeycloakService with their own spies.
// This just needs to be a resolvable, non-throwing stand-in for static imports.
class Keycloak {
  constructor() {
    this.authenticated = false
    this.token = ''
    this.tokenParsed = {}
    this.realmAccess = { roles: [] }
  }

  init() {
    return Promise.resolve(false)
  }

  login() {
    return Promise.resolve()
  }

  logout() {
    return Promise.resolve()
  }

  updateToken() {
    return Promise.resolve(false)
  }

  loadUserProfile() {
    return Promise.resolve({})
  }

  hasRealmRole() {
    return false
  }

  hasResourceRole() {
    return false
  }
}

module.exports = Keycloak
module.exports.default = Keycloak
