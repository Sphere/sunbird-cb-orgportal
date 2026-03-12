import { FRAC_LANGUAGES, FRAC_WORD_WRAP_LIMIT } from '../constants/frac.constants'
import { resolveFracClientConfig } from './frac-client-config.util'

describe('resolveFracClientConfig', () => {
  it('should return defaults when instance config is missing', () => {
    const resolved = resolveFracClientConfig(undefined)

    expect(resolved.languages).toEqual(FRAC_LANGUAGES)
    expect(resolved.wordWrapLimit).toBe(FRAC_WORD_WRAP_LIMIT)
    expect(resolved.api.endpoints.searchEntity).toBe('/apis/proxies/v8/entity/v1/search')
    expect(resolved.featureFlags.enableRolePositionMapping).toBe(true)
  })

  it('should apply frac overrides when present', () => {
    const resolved = resolveFracClientConfig({
      frac: {
        routes: {
          mapRolePosition: '/client/frac/map-role-position',
        },
        languages: ['English', 'Telugu'],
        dialogSizes: {
          uploadPopup: '500px',
        },
        api: {
          endpoints: {
            searchEntity: '/client/search',
          },
        },
        featureFlags: {
          enableRolePositionMapping: false,
        },
      },
    })

    expect(resolved.routes.mapRolePosition).toBe('/client/frac/map-role-position')
    expect(resolved.languages).toEqual(['English', 'Telugu'])
    expect(resolved.dialogSizes.uploadPopup).toBe('500px')
    expect(resolved.api.endpoints.searchEntity).toBe('/client/search')
    expect(resolved.featureFlags.enableRolePositionMapping).toBe(false)
  })
})
