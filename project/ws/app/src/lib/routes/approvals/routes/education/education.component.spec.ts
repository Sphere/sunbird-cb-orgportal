import { Subject } from 'rxjs'
import { NavigationEnd, NavigationStart } from '@angular/router'
import { EducationComponent } from './education.component'

describe('EducationComponent', () => {
  let router: any
  let route: any
  let routerEvents: Subject<any>

  const buildComponent = () => new EducationComponent(route, router)

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
                    academics: [{ degree: 'B.Tech' }],
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

  it('sets academicDetails on NavigationEnd', () => {
    const component = buildComponent()
    routerEvents.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.academicDetails).toEqual([{ degree: 'B.Tech' }])
  })

  it('does not set academicDetails for non NavigationEnd events', () => {
    const component = buildComponent()
    routerEvents.next(new NavigationStart(1, '/a'))
    expect(component.academicDetails).toBeUndefined()
  })

  it('falls back to empty object when profileDetails is missing', () => {
    route.snapshot.data.profileData.data.result.response.profileDetails = undefined
    const component = buildComponent()
    routerEvents.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.academicDetails).toBeUndefined()
  })

  it('ngOnInit does nothing observable', () => {
    const component = buildComponent()
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('ngOnDestroy completes destroy subject and stops further updates', () => {
    const component = buildComponent()
    component.ngOnDestroy()
    routerEvents.next(new NavigationEnd(2, '/b', '/b'))
    expect(component.academicDetails).toBeUndefined()
  })
})
