import { MenuConfigService } from './menu-config.service'

describe('MenuConfigService', () => {
  let service: MenuConfigService

  beforeEach(() => {
    service = new MenuConfigService()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('mergeMenus', () => {
    it('appends local menus that do not already exist in the api menus', () => {
      const result = service.mergeMenus([{ key: 'dashboard' }])
      expect(result.length).toBe(3)
      expect(result.some((m: any) => m.key === 'playlist')).toBe(true)
      expect(result.some((m: any) => m.key === 'competency')).toBe(true)
    })

    it('skips local menus that already exist in the api menus (case-insensitive)', () => {
      const result = service.mergeMenus([{ key: 'Playlist' }, { key: 'COMPETENCY' }])
      expect(result.length).toBe(2)
    })

    it('handles api menus with an undefined key via optional chaining', () => {
      const result = service.mergeMenus([{ name: 'no-key' }])
      expect(result.length).toBe(3)
    })

    it('handles an empty api menus array', () => {
      const result = service.mergeMenus([])
      expect(result.length).toBe(2)
    })

    it('skips local menus flagged as disabled', () => {
      const original = (service as any).localMenus
      ;(service as any).localMenus = [
        { ...original[0], enabled: false },
        original[1],
      ]
      const result = service.mergeMenus([])
      expect(result.length).toBe(1)
      expect(result[0].key).toBe('competency')
      ;(service as any).localMenus = original
    })
  })
})
