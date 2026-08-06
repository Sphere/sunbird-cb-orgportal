import { Subject } from 'rxjs'
import { NavigationEnd, NavigationStart } from '@angular/router'
import { CertificationAndSkillsComponent } from './certification-and-skills.component'

describe('CertificationAndSkillsComponent', () => {
  let router: any
  let route: any
  let routerEvents: Subject<any>

  const buildComponent = () => new CertificationAndSkillsComponent(route, router)

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
                    skills: ['Angular', 'RxJS'],
                    interests: ['Reading'],
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

  it('sets skillDetails and interests on NavigationEnd', () => {
    const component = buildComponent()
    routerEvents.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.skillDetails).toEqual(['Angular', 'RxJS'])
    expect(component.interests).toEqual(['Reading'])
  })

  it('does not set skillDetails/interests for non NavigationEnd events', () => {
    const component = buildComponent()
    routerEvents.next(new NavigationStart(1, '/a'))
    expect(component.skillDetails).toBeUndefined()
    expect(component.interests).toBeUndefined()
  })

  it('falls back to empty object when profileDetails is missing', () => {
    route.snapshot.data.profileData.data.result.response.profileDetails = null
    const component = buildComponent()
    routerEvents.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.skillDetails).toBeUndefined()
    expect(component.interests).toBeUndefined()
  })

  it('ngOnInit does nothing observable', () => {
    const component = buildComponent()
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('ngOnDestroy completes destroy subject and stops further updates', () => {
    const component = buildComponent()
    component.ngOnDestroy()
    routerEvents.next(new NavigationEnd(2, '/b', '/b'))
    expect(component.skillDetails).toBeUndefined()
  })
})
