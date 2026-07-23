/**
 * Fallback roles that are always included even if window.env.portalRoles is missing.
 * Update this list when Jenkins/DevOps config is not yet set.
 */
const DEFAULT_REQUIRED_ROLES: string[] = [
  'MDO_ADMIN',
  'MDO_DASHBOARD_VIEWER',
  'FRAC_ADMIN',
  'FRAC_READ',
  'PLAYLIST_ADMIN',
  'PLAYLIST_READ',
]

type EnvMap = { [key: string]: any }

const readEnvString = (key: string): string => {
  const env = (window as EnvMap)?.env as EnvMap | undefined
  const value = env && typeof env[key] === 'string' ? env[key] : ''
  return value
}

export const readPortalRoles = (requiredRoles: string[] = DEFAULT_REQUIRED_ROLES): string[] => {
  const rawRoles = readEnvString('portalRoles')
  const roles = rawRoles
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0)

  const merged = new Set<string>([...roles, ...requiredRoles])
  return Array.from(merged)
}
