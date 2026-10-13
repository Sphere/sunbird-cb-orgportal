import { NavigationEnd } from '@angular/router'
import { Subject } from 'rxjs'
import { BasicInfoComponent } from './basic-info.component'

describe('BasicInfoComponent', () => {
  let component: BasicInfoComponent
  let activeRoute: any
  let router: any
  let routerEvents$: Subject<any>

  const personalDetails = { name: 'John' }
  const photo = 'photo.png'

  const createComponent = (profileData: any = { personalDetails, photo }) => {
    routerEvents$ = new Subject<any>()
    activeRoute = {
      snapshot: {
        data: {
          profileData: {
            data: {
              result: {
                response: {
                  profileDetails: profileData,
                },
              },
            },
          },
        },
      },
    }
    router = { events: routerEvents$.asObservable() }
    component = new BasicInfoComponent(activeRoute, router)
    return component
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create', () => {
    createComponent()
    expect(component).toBeTruthy()
  })

  it('should set basicInfo and imagePath from profile details on NavigationEnd', () => {
    createComponent()
    routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.basicInfo).toEqual(personalDetails)
    expect(component.imagePath).toBe(photo)
  })

  it('should not update basicInfo/imagePath for non-NavigationEnd router events', () => {
    createComponent()
    component.basicInfo = 'unchanged'
    component.imagePath = 'unchanged'
    routerEvents$.next({})
    expect(component.basicInfo).toBe('unchanged')
    expect(component.imagePath).toBe('unchanged')
  })

  it('should default to empty object when profileDetails is falsy', () => {
    createComponent(null)
    routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.basicInfo).toBeUndefined()
    expect(component.imagePath).toBeUndefined()
  })

  it('ngOnInit should not throw', () => {
    createComponent()
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('ngOnDestroy should complete destroy subject without throwing', () => {
    createComponent()
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('changeToGlobalSymbol should set target src to the blank profile picture path', () => {
    createComponent()
    const event = { target: { src: 'original.png' } }
    component.changeToGlobalSymbol(event)
    expect(event.target.src).toBe('/assets/images/profile/blank-profilePcture.png')
  })
})
