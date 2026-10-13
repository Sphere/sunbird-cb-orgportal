import { Subject } from 'rxjs'
import { NavigationEnd, NavigationStart } from '@angular/router'
import { PositionComponent } from './position.component'

describe('PositionComponent', () => {
  let router: any
  let route: any
  let routerEvents: Subject<any>

  const buildComponent = () => new PositionComponent(route, router)

  beforeEach(() => {
    routerEvents = new Subject<any>()
    router = { events: routerEvents }
    route = {
      snapshot: {
        data: {
          profileData: {
            data: {
              result: {
                response: {
                  profileDetails: {
                    professionalDetails: [{ designation: 'Officer' }],
                    employmentDetails: { department: 'IAS' },
                  },
                },
              },
            },
          },
        },
      },
    }
  })

  it('should be created', () => {
    const component = buildComponent()
    expect(component).toBeTruthy()
  })

  it('sets professionalDetails and employmentDetails on NavigationEnd', () => {
    const component = buildComponent()
    routerEvents.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.professionalDetails).toEqual({ designation: 'Officer' })
    expect(component.employmentDetails).toEqual({ department: 'IAS' })
  })

  it('does not set details for non NavigationEnd events', () => {
    const component = buildComponent()
    routerEvents.next(new NavigationStart(1, '/a'))
    expect(component.professionalDetails).toBeUndefined()
    expect(component.employmentDetails).toBeUndefined()
  })

  it('falls back to empty object when profileDetails is missing', () => {
    route.snapshot.data.profileData.data.result.response.profileDetails = undefined
    const component = buildComponent()
    routerEvents.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.professionalDetails).toBeUndefined()
  })

  it('ngOnInit does nothing observable', () => {
    const component = buildComponent()
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('ngOnDestroy completes destroy subject and stops further updates', () => {
    const component = buildComponent()
    component.ngOnDestroy()
    routerEvents.next(new NavigationEnd(2, '/b', '/b'))
    expect(component.professionalDetails).toBeUndefined()
  })
})
