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
    it('appends enabled local menus that do not already exist in the api menus', () => {
      const result = service.mergeMenus([{ key: 'dashboard' }])
      expect(result.length).toBe(3)
      expect(result.some((m: any) => m.key === 'mncAttendanceReport')).toBe(true)
      expect(result.some((m: any) => m.key === 'notification')).toBe(true)
      expect(result.some((m: any) => m.key === 'playlist')).toBe(false)
      expect(result.some((m: any) => m.key === 'competency')).toBe(false)
    })

    it('skips local menus that already exist in the api menus (case-insensitive)', () => {
      const result = service.mergeMenus([{ key: 'MncAttendanceReport' }])
      expect(result.length).toBe(2)
      expect(result.filter((m: any) => m.key?.toLowerCase() === 'mncattendancereport').length).toBe(1)
    })

    it('handles api menus with an undefined key via optional chaining', () => {
      const result = service.mergeMenus([{ name: 'no-key' }])
      expect(result.length).toBe(3)
    })

    it('handles an empty api menus array', () => {
      const result = service.mergeMenus([])
      expect(result.length).toBe(2)
      expect(result[0].key).toBe('mncAttendanceReport')
      expect(result[1].key).toBe('notification')
    })

    it('adds the Notification menu for admin roles, routed to /app/home/notifications', () => {
      const notification = service.mergeMenus([]).find((m: any) => m.key === 'notification')
      expect(notification.routerLink).toBe('/app/home/notifications')
      expect(notification.requiredRoles).toEqual(['admin', 'mdo_admin'])
    })

    it('skips local menus flagged as disabled', () => {
      const original = (service as any).localMenus
      const byKey = (key: string) => original.find((m: any) => m.key === key)
      ;(service as any).localMenus = [
        { ...byKey('mncAttendanceReport'), enabled: false },
        { ...byKey('playlist'), enabled: true },
      ]
      const result = service.mergeMenus([])
      expect(result.length).toBe(1)
      expect(result[0].key).toBe('playlist')
      ;(service as any).localMenus = original
    })
  })
})
