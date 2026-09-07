import { readPortalRoles } from './env.util'

export const environment = {
  production: true,
  sitePath: (window as any)?.env?.sitePath || '',
  karmYogiPath: (window as any)?.env?.karmYogiPath || '',
  cbpPath: (window as any)?.env?.cbpPath || '',
  portalRoles: readPortalRoles(),
}
