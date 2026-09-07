// Jest mock for 'keycloak-angular'.
// Specs always override { provide: KeycloakService, useValue: createSpyObj(...) }
// via TestBed, so this stub's method bodies are never exercised — it only needs to
// exist so the static `import { KeycloakService } from 'keycloak-angular'` at the
// top of each spec/component file resolves without pulling in the real package
// (which depends on keycloak-js's browser-only build).
class KeycloakService {
  init() {
    return Promise.resolve(true)
  }

  isLoggedIn() {
    return false
  }

  login() {
    return Promise.resolve()
  }

  logout() {
    return Promise.resolve()
  }

  getToken() {
    return Promise.resolve('')
  }

  getUsername() {
    return ''
  }

  getUserRoles() {
    return []
  }

  loadUserProfile() {
    return Promise.resolve({})
  }

  isTokenExpired() {
    return false
  }

  updateToken() {
    return Promise.resolve(false)
  }

  getKeycloakInstance() {
    return {}
  }

  keycloakEvents$ = {
    subscribe: () => ({ unsubscribe: () => undefined }),
  }
}

class KeycloakAngularModule {}

module.exports = {
  KeycloakService,
  KeycloakAngularModule,
}
