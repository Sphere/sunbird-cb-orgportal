import { TestBed } from '@angular/core/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { FeatureAccessService } from './feature-access'

describe('FeatureAccessService', () => {
  let service: FeatureAccessService
  let mockConfigSvc: { userRoles: Set<string> | null }

  function setup(userRoles: Set<string> | null) {
    mockConfigSvc = { userRoles }
    TestBed.configureTestingModule({
      providers: [
        FeatureAccessService,
        { provide: ConfigurationsService, useValue: mockConfigSvc },
      ],
    })
    service = TestBed.inject(FeatureAccessService)
  }

  it('should be created', () => {
    setup(new Set())
    expect(service).toBeTruthy()
  })

  describe('isViewOnly', () => {
    it('should return false when feature is null/undefined', () => {
      setup(new Set(['frac_read']))
      expect(service.isViewOnly(null)).toBe(false)
      expect(service.isViewOnly(undefined)).toBe(false)
    })

    it('should return true when the user has the read role but not the admin role', () => {
      setup(new Set(['frac_read']))
      expect(service.isViewOnly('frac')).toBe(true)
    })

    it('should return false when the user has the admin role too', () => {
      setup(new Set(['frac_read', 'frac_admin']))
      expect(service.isViewOnly('frac')).toBe(false)
    })

    it('should return false when the user has neither role', () => {
      setup(new Set(['some_other_role']))
      expect(service.isViewOnly('frac')).toBe(false)
    })

    it('should match roles case-insensitively', () => {
      setup(new Set(['FRAC_READ']))
      expect(service.isViewOnly('frac')).toBe(true)
    })

    it('should work independently per feature', () => {
      setup(new Set(['playlist_read']))
      expect(service.isViewOnly('playlist')).toBe(true)
      expect(service.isViewOnly('frac')).toBe(false)
    })

    it('should fail open (return false) when userRoles is null', () => {
      setup(null)
      expect(service.isViewOnly('frac')).toBe(false)
    })
  })

  describe('canEdit', () => {
    it('should return true when the user has the admin role', () => {
      setup(new Set(['frac_admin']))
      expect(service.canEdit('frac')).toBe(true)
    })

    it('should return false when the user only has the read role', () => {
      setup(new Set(['frac_read']))
      expect(service.canEdit('frac')).toBe(false)
    })

    it('should return false when the user has neither role', () => {
      setup(new Set())
      expect(service.canEdit('frac')).toBe(false)
    })

    it('should fail open (return false) when userRoles is null', () => {
      setup(null)
      expect(service.canEdit('frac')).toBe(false)
    })
  })
})
