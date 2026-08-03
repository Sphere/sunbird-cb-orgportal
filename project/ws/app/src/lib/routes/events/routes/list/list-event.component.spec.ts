import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of } from 'rxjs'
import { ListEventComponent } from './list-event.component'
import { EventsService } from '../../services/events.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

// Under this repo's tsconfig.spec.json (esModuleInterop: true), a namespace import
// (`import * as moment from 'moment'`) is only left callable by TypeScript's __importStar
// helper when the required module carries an `__esModule` marker; otherwise it gets wrapped
// in a plain (non-callable) object. Mark the real moment factory function accordingly so the
// component's `moment(...)` calls keep working exactly as they do at runtime in the app.
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment')
  actualMoment.__esModule = true
  return actualMoment
})

describe('ListEventComponent', () => {
  let component: ListEventComponent
  let fixture: ComponentFixture<ListEventComponent>
  let mockEventSvc: jest.Mocked<EventsService>
  let mockRouter: jest.Mocked<Router>
  let mockConfigSvc: any
  let mockActiveRoute: any

  const buildTestBed = async () => {
    mockEventSvc = createSpyObj('EventsService', ['getEventsList'])
    mockEventSvc.getEventsList.mockReturnValue(of(undefined) as any)
    mockRouter = createSpyObj('Router', ['navigate'])

    await TestBed.configureTestingModule({
      declarations: [ListEventComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: EventsService, useValue: mockEventSvc },
        { provide: ConfigurationsService, useValue: mockConfigSvc },
        { provide: ActivatedRoute, useValue: mockActiveRoute },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(ListEventComponent)
    component = fixture.componentInstance
  }

  describe('constructor with userProfile from configService', () => {
    beforeEach(async () => {
      mockConfigSvc = { userProfile: { userId: 'u1', departmentName: 'Dept1', rootOrgId: 'org1' } }
      mockActiveRoute = { snapshot: { data: {} } }
      await buildTestBed()
    })

    it('should create and populate fields from configService.userProfile', () => {
      expect(component).toBeTruthy()
      expect(component.currentUser).toBe('u1')
      expect(component.department).toBe('Dept1')
      expect(component.departmentID).toBe('org1')
    })
  })

  describe('constructor with fallback to activeRoute snapshot data', () => {
    beforeEach(async () => {
      mockConfigSvc = { userProfile: null }
      mockActiveRoute = {
        snapshot: {
          data: {
            configService: {
              userProfile: { rootOrgId: 'org2', departmentName: 'Dept2', userId: 'u2' },
            },
          },
        },
      }
      await buildTestBed()
    })

    it('should populate fields from activeRoute snapshot when configService has no userProfile', () => {
      expect(component.departmentID).toBe('org2')
      expect(component.department).toBe('Dept2')
      expect(component.currentUser).toBe('u2')
    })
  })

  describe('with default department set from configService', () => {
    beforeEach(async () => {
      mockConfigSvc = { userProfile: { userId: 'u1', departmentName: 'Dept1', rootOrgId: 'dep-1' } }
      mockActiveRoute = { snapshot: { data: {} } }
      await buildTestBed()
    })

    it('ngOnInit should set tabledata columns and call fetchEvents', () => {
      const fetchSpy = jest.spyOn(component, 'fetchEvents')
      component.ngOnInit()
      expect(component.tabledata.columns.length).toBe(6)
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('ngAfterViewInit and ngOnDestroy should not throw', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow()
      expect(() => component.ngOnDestroy()).not.toThrow()
    })

    it('onEventClick should navigate to event details', () => {
      component.onEventClick({ id: 'ev1' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/events/ev1'])
    })

    it('onCreateClick should navigate to create-user route', () => {
      component.onCreateClick()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/create-user'])
    })

    it('onRoleClick should navigate to user details', () => {
      component.onRoleClick({ userId: 'u5' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/users/u5/details'])
    })

    it('fetchEvents should call getEventsList and set data via setEventListData', () => {
      const setSpy = jest.spyOn(component, 'setEventListData')
      mockEventSvc.getEventsList.mockReturnValue(of({ result: { Event: {} } }) as any)
      component.fetchEvents()
      expect(mockEventSvc.getEventsList).toHaveBeenCalled()
      expect(setSpy).toHaveBeenCalled()
    })

    it('setEventListData should no-op when eventObj is undefined', () => {
      expect(() => component.setEventListData(undefined)).not.toThrow()
    })

    it('setEventListData should skip events not matching departmentID', () => {
      component.departmentID = 'dep-1'
      const eventObj = {
        result: {
          Event: {
            0: { createdFor: ['other-dept'], name: 'Ev', startDate: '2020-01-01', startTime: '0900+0530', endDate: '2020-01-02', endTime: '1000+0530', duration: 60, createdOn: '2020-01-01T00:00:00Z' },
          },
        },
      }
      component.setEventListData(eventObj)
      expect(component.eventData.upcomingEvents).toEqual([])
      expect(component.eventData.pastEvents).toEqual([])
    })

    it('setEventListData should process a matching event and bucket it as past', () => {
      component.departmentID = 'dep-1'
      const eventObj = {
        result: {
          Event: {
            0: {
              createdFor: ['dep-1'],
              name: 'Past Event With Long Name Here',
              startDate: '2000-01-01',
              startTime: '0900+0530',
              endDate: '2000-01-02',
              endTime: '1000+0530',
              duration: 90,
              createdOn: '2000-01-01T00:00:00Z',
              creatorDetails: undefined,
              appIcon: null,
            },
          },
        },
      }
      component.setEventListData(eventObj)
      expect(component.eventData.pastEvents).toHaveLength(1)
      expect(component.eventData.upcomingEvents).toEqual([])
      expect(component.eventData.pastEvents[0]).toMatchObject({ eventName: 'Past Event With Long Name' })
    })

    it('customDateFormat should combine date and parsed time', () => {
      expect(component.customDateFormat('2020-01-01', '0930+0530')).toBe('2020-01-01 0930')
    })

    it('filter should set data based on key: upcoming', () => {
      component.eventData = { upcomingEvents: [{ a: 1 }], pastEvents: [{ b: 2 }] }
      component.filter('upcoming')
      expect(component.data).toEqual([{ a: 1 }])
      expect(component.currentFilter).toBe('upcoming')
    })

    it('filter should set data based on key: past', () => {
      component.eventData = { upcomingEvents: [{ a: 1 }], pastEvents: [{ b: 2 }] }
      component.filter('past')
      expect(component.data).toEqual([{ b: 2 }])
    })

    it('filter should default to upcoming for unknown key', () => {
      component.eventData = { upcomingEvents: [{ a: 1 }], pastEvents: [{ b: 2 }] }
      component.filter('saved')
      expect(component.data).toEqual([{ a: 1 }])
    })

    it('filter should handle empty eventData gracefully', () => {
      component.eventData = {}
      component.filter('upcoming')
      expect(component.data).toEqual([])
    })

    it('compareDate should return true when date is in the past', () => {
      expect(component.compareDate('2000-01-01 00:00')).toBe(true)
    })

    it('compareDate should return false when date is in the future', () => {
      expect(component.compareDate('2999-01-01 00:00')).toBe(false)
    })

    it('allEventDateFormat should format a datetime to YYYY-MM-DD', () => {
      const result = component.allEventDateFormat('2021-05-10T12:00:00Z')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('formatTimeAmPm should format am time correctly', () => {
      const date = new Date(2021, 0, 1, 9, 5)
      expect(component.formatTimeAmPm(date)).toBe('9:05 am')
    })

    it('formatTimeAmPm should format pm time correctly with midnight/noon edge cases', () => {
      const noon = new Date(2021, 0, 1, 12, 0)
      expect(component.formatTimeAmPm(noon)).toBe('12:00 pm')
      const midnight = new Date(2021, 0, 1, 0, 0)
      expect(component.formatTimeAmPm(midnight)).toBe('12:00 am')
    })
  })
})
