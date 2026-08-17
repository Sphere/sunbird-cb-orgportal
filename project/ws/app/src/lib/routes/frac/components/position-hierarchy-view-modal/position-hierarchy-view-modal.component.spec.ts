import { PositionHierarchyViewModalComponent, PositionHierarchyViewModalData } from './position-hierarchy-view-modal.component'
import { MappedRole } from '../../utils/common.util'
import { FRAC_ROUTES } from '../../constants/frac.constants'

describe('PositionHierarchyViewModalComponent', () => {
  let component: PositionHierarchyViewModalComponent
  let dialogRef: any
  let router: any

  const roles: MappedRole[] = [
    {
      code: 'R2',
      name: 'Beta Role',
      activities: [
        {
          code: 'A2',
          name: 'Beta Activity',
          competencies: [
            { code: 'C1', name: 'Comp1', levels: ['L1', 'L2', 'L3'] },
          ],
        },
        {
          code: 'A1',
          name: 'Alpha Activity',
          competencies: [
            { code: 'C2', name: 'Comp2', levels: ['L1', 'L3'] },
            { code: 'C1', name: 'Comp1', levels: [] },
          ],
        },
      ],
    },
    {
      code: 'R1',
      name: 'Alpha Role',
      activities: [],
    },
  ]

  const createComponent = (data: PositionHierarchyViewModalData) => {
    dialogRef = { close: jest.fn() }
    router = { navigate: jest.fn() }
    component = new PositionHierarchyViewModalComponent(dialogRef, data, router)
    return component
  }

  beforeEach(() => {
    createComponent({ positionName: 'Chief Officer', positionCode: 'POS1', roles })
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('roles getter', () => {
    it('should sort roles by code', () => {
      expect(component.roles.map(r => r.code)).toEqual(['R1', 'R2'])
    })

    it('should return empty array when data.roles is undefined', () => {
      createComponent({ positionName: 'X', positionCode: 'P', roles: undefined as any })
      expect(component.roles).toEqual([])
    })
  })

  describe('totals', () => {
    it('totalRoles should count roles', () => {
      expect(component.totalRoles).toBe(2)
    })

    it('totalActivities should sum activities across roles', () => {
      expect(component.totalActivities).toBe(2)
    })

    it('totalCompetencies should sum competencies across activities', () => {
      expect(component.totalCompetencies).toBe(3)
    })

    it('hasMapping should be true when roles exist', () => {
      expect(component.hasMapping).toBe(true)
    })

    it('hasMapping should be false when no roles', () => {
      createComponent({ positionName: 'X', positionCode: 'P', roles: [] })
      expect(component.hasMapping).toBe(false)
    })
  })

  describe('toggleRole / isRoleExpanded', () => {
    it('should expand and collapse a role', () => {
      expect(component.isRoleExpanded('R1')).toBe(false)
      component.toggleRole('R1')
      expect(component.isRoleExpanded('R1')).toBe(true)
      component.toggleRole('R1')
      expect(component.isRoleExpanded('R1')).toBe(false)
    })
  })

  describe('toggleActivity / isActivityExpanded', () => {
    it('should expand and collapse an activity keyed by role+activity', () => {
      expect(component.isActivityExpanded('R1', 'A1')).toBe(false)
      component.toggleActivity('R1', 'A1')
      expect(component.isActivityExpanded('R1', 'A1')).toBe(true)
      component.toggleActivity('R1', 'A1')
      expect(component.isActivityExpanded('R1', 'A1')).toBe(false)
    })
  })

  describe('formatLevelRange', () => {
    it('should return empty string for no levels', () => {
      expect(component.formatLevelRange({ code: 'C', name: 'N', levels: [] })).toBe('')
    })

    it('should return the single level when only one present', () => {
      expect(component.formatLevelRange({ code: 'C', name: 'N', levels: ['L2'] })).toBe('L2')
    })

    it('should return a compact range for consecutive levels', () => {
      expect(component.formatLevelRange({ code: 'C', name: 'N', levels: ['L1', 'L2', 'L3'] })).toBe('L1-L3')
    })

    it('should return comma-joined levels for sparse sets', () => {
      expect(component.formatLevelRange({ code: 'C', name: 'N', levels: ['L1', 'L3'] })).toBe('L1, L3')
    })

    it('should return comma-joined levels when levels are non-numeric', () => {
      expect(component.formatLevelRange({ code: 'C', name: 'N', levels: ['LA', 'LB'] })).toBe('LA, LB')
    })
  })

  describe('getLevels', () => {
    it('should return levels array when present', () => {
      expect(component.getLevels({ code: 'C', name: 'N', levels: ['L1'] })).toEqual(['L1'])
    })

    it('should return empty array when levels is not an array', () => {
      expect(component.getLevels({ code: 'C', name: 'N', levels: undefined as any })).toEqual([])
    })
  })

  describe('getActivities', () => {
    it('should sort activities by code', () => {
      const sorted = component.getActivities(roles[0])
      expect(sorted.map(a => a.code)).toEqual(['A1', 'A2'])
    })

    it('should return empty array when role has no activities', () => {
      expect(component.getActivities({ code: 'R', name: 'N', activities: undefined as any })).toEqual([])
    })
  })

  describe('getCompetencies', () => {
    it('should sort competencies by code then name', () => {
      const sorted = component.getCompetencies(roles[0].activities[1])
      expect(sorted.map(c => c.code)).toEqual(['C1', 'C2'])
    })

    it('should return empty array when activity has no competencies', () => {
      expect(component.getCompetencies({ code: 'A', name: 'N', competencies: undefined as any })).toEqual([])
    })
  })

  describe('onEditMapping', () => {
    it('should close dialog and navigate with positionCode query param', () => {
      component.onEditMapping()
      expect(dialogRef.close).toHaveBeenCalled()
      expect(router.navigate).toHaveBeenCalledWith([FRAC_ROUTES.mapRolePosition], { queryParams: { positionCode: 'POS1' } })
    })

    it('should navigate with empty query params when positionCode is missing', () => {
      createComponent({ positionName: 'X', positionCode: '', roles })
      component.onEditMapping()
      expect(router.navigate).toHaveBeenCalledWith([FRAC_ROUTES.mapRolePosition], { queryParams: {} })
    })
  })

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose()
      expect(dialogRef.close).toHaveBeenCalled()
    })
  })
})
