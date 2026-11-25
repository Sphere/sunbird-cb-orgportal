import { Injectable, InjectionToken } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'

/**
 * Per-feature, role-based view-only access — single source of truth.
 *
 * To add a feature: add one entry to FEATURE_ACCESS, then provide its key via
 * FEATURE_KEY in that feature's module/route. Nothing else changes.
 *
 * Semantics (only the `*_read` role is ever restricted):
 *   - has admin role            -> full access (view + edit/create/delete)
 *   - has read role, not admin  -> view-only (mutating actions hidden)
 *   - neither                   -> untouched (no feature is impacted)
 */

/** Keys of features that support view-only gating. */
export type FeatureKey = 'frac' | 'playlist'

export interface FeatureRoleSet {
  /** Role that grants full access. */
  admin: string
  /** Role that grants read-only access. */
  read: string
}

/** Map each feature to its roles. Roles are lowercase (userRoles is lowercased). */
export const FEATURE_ACCESS: Record<FeatureKey, FeatureRoleSet> = {
  frac: { admin: 'frac_admin', read: 'frac_read' },
  playlist: { admin: 'playlist_admin', read: 'playlist_read' },
}

/**
 * DI token that tells view-only directives which feature they render inside.
 * Provided once per feature (FracModule / playlist routes).
 */
export const FEATURE_KEY = new InjectionToken<FeatureKey>('FEATURE_KEY')

@Injectable({ providedIn: 'root' })
export class FeatureAccessService {
  constructor(private readonly configSvc: ConfigurationsService) {}

  /**
   * Current user's roles, lowercased so matching is case-insensitive against the
   * lowercase config keys (DB stores e.g. FRAC_READ; userRoles is already
   * lowercased — this just guarantees it).
   */
  private roles(): Set<string> {
    const real = this.configSvc && this.configSvc.userRoles
    const source = real ? Array.from(real) : []
    return new Set<string>(source.map((r) => (r || '').toLowerCase()))
  }

  /**
   * True when the user may only view this feature (has read role, not admin).
   * Fails open (returns false) on any unexpected error so the UI is never blocked
   * or broken by an access check — view-only is strictly additive.
   */
  isViewOnly(feature: FeatureKey | null | undefined): boolean {
    try {
      if (!feature) {
        return false
      }
      const cfg = FEATURE_ACCESS[feature]
      if (!cfg) {
        return false
      }
      const roles = this.roles()
      return roles.has(cfg.read) && !roles.has(cfg.admin)
    } catch {
      return false
    }
  }

  /** True when the user has full (edit) access to this feature. Fails open. */
  canEdit(feature: FeatureKey): boolean {
    try {
      const cfg = FEATURE_ACCESS[feature]
      return !!cfg && this.roles().has(cfg.admin)
    } catch {
      return false
    }
  }
}
