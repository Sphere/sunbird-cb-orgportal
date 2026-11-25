import { TestBed } from '@angular/core/testing'

import { MobileAppsService } from './mobile-apps.service'
import { NavigationExternalService } from './navigation-external.service'
import { DISPLAY_SETTING, GO_OFFLINE, GET_PLAYERCONTENT_JSON, DOWNLOAD_REQUESTED, CHAT_BOT_VISIBILITY, IOS_OPEN_IN_BROWSER } from '../models/mobile-events.model'

declare const window: any

describe('MobileAppsService', () => {
  let service: MobileAppsService
  let mockNavigateSvc: any

  beforeEach(() => {
    mockNavigateSvc = { init: jest.fn() }
    TestBed.configureTestingModule({
      providers: [{ provide: NavigationExternalService, useValue: mockNavigateSvc }],
    })
    service = TestBed.inject(MobileAppsService)
    delete window.appRef
    delete window.webkit
    delete window.dispatchEventFlag
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('init: sets up global methods and initializes navigation service', () => {
    service.init()
    expect(mockNavigateSvc.init).toHaveBeenCalled()
    expect(typeof window.navigateTo).toBe('function')
  })

  it('simulateMobile: sets appRef and webkit objects', () => {
    service.simulateMobile()
    expect(window.appRef).toEqual({})
    expect(window.webkit).toEqual({})
  })

  describe('isAndroidApp', () => {
    it('returns true when window.appRef exists', () => {
      window.appRef = {}
      expect(service.isAndroidApp).toBe(true)
    })

    it('returns false when window.appRef is absent', () => {
      expect(service.isAndroidApp).toBe(false)
    })
  })

  describe('iOsAppRef', () => {
    it('returns appRef handler when webkit.messageHandlers.appRef present', () => {
      window.webkit = { messageHandlers: { appRef: { postMessage: jest.fn() } } }
      expect(service.iOsAppRef).toBe(window.webkit.messageHandlers.appRef)
    })

    it('returns null when webkit missing', () => {
      expect(service.iOsAppRef).toBeNull()
    })

    it('returns null when webkit present but messageHandlers missing', () => {
      window.webkit = {}
      expect(service.iOsAppRef).toBeNull()
    })

    it('returns null when messageHandlers present but appRef missing', () => {
      window.webkit = { messageHandlers: {} }
      expect(service.iOsAppRef).toBeNull()
    })
  })

  describe('isMobile', () => {
    it('returns true when isAndroidApp is true', () => {
      window.appRef = {}
      expect(service.isMobile).toBe(true)
    })

    it('returns true when iOsAppRef is set', () => {
      window.webkit = { messageHandlers: { appRef: {} } }
      expect(service.isMobile).toBe(true)
    })

    it('returns false when neither is set', () => {
      expect(service.isMobile).toBe(false)
    })
  })

  describe('canShowSettings', () => {
    it('returns true when appRef has DISPLAY_SETTING', () => {
      window.appRef = { [DISPLAY_SETTING]: jest.fn() }
      expect(service.canShowSettings).toBe(true)
    })

    it('returns true when webkit and iOsAppRef present', () => {
      window.webkit = { messageHandlers: { appRef: {} } }
      expect(service.canShowSettings).toBe(true)
    })

    it('returns false when neither condition matches', () => {
      expect(service.canShowSettings).toBe(false)
    })

    it('returns false when webkit present but no iOsAppRef', () => {
      window.webkit = {}
      expect(service.canShowSettings).toBe(false)
    })
  })

  it('goOffline: sends GO_OFFLINE event', () => {
    const spy = jest.spyOn(service, 'sendDataAppToClient')
    service.goOffline()
    expect(spy).toHaveBeenCalledWith(GO_OFFLINE, {})
  })

  it('viewSettings: sends DISPLAY_SETTING event', () => {
    const spy = jest.spyOn(service, 'sendDataAppToClient')
    service.viewSettings()
    expect(spy).toHaveBeenCalledWith(DISPLAY_SETTING, {})
  })

  it('sendViewerData: sends GET_PLAYERCONTENT_JSON event', () => {
    const spy = jest.spyOn(service, 'sendDataAppToClient')
    const data = { id: 'c1' } as any
    service.sendViewerData(data)
    expect(spy).toHaveBeenCalledWith(GET_PLAYERCONTENT_JSON, data)
  })

  it('downloadResource: sends DOWNLOAD_REQUESTED event', () => {
    const spy = jest.spyOn(service, 'sendDataAppToClient')
    service.downloadResource('id1')
    expect(spy).toHaveBeenCalledWith(DOWNLOAD_REQUESTED, 'id1')
  })

  it('appChatbotVisibility: sends CHAT_BOT_VISIBILITY event', () => {
    const spy = jest.spyOn(service, 'sendDataAppToClient')
    service.appChatbotVisibility('yes')
    expect(spy).toHaveBeenCalledWith(CHAT_BOT_VISIBILITY, 'yes')
  })

  it('iosOpenInBrowserRequest: sends IOS_OPEN_IN_BROWSER event with url', () => {
    const spy = jest.spyOn(service, 'sendDataAppToClient')
    service.iosOpenInBrowserRequest('http://x.com')
    expect(spy).toHaveBeenCalledWith(IOS_OPEN_IN_BROWSER, { url: 'http://x.com' })
  })

  describe('isFunctionAvailableInAndroid', () => {
    it('returns true when function exists on appRef', () => {
      window.appRef = { myFn: jest.fn() }
      expect(service.isFunctionAvailableInAndroid('myFn')).toBe(true)
    })

    it('returns false when appRef missing', () => {
      expect(service.isFunctionAvailableInAndroid('myFn')).toBe(false)
    })

    it('returns false when function missing on appRef', () => {
      window.appRef = {}
      expect(service.isFunctionAvailableInAndroid('myFn')).toBe(false)
    })
  })

  describe('sendDataAppToClient', () => {
    it('calls DISPLAY_SETTING function with no args when eventName is DISPLAY_SETTING', () => {
      const fn = jest.fn()
      window.appRef = { [DISPLAY_SETTING]: fn }
      service.sendDataAppToClient(DISPLAY_SETTING, {})
      expect(fn).toHaveBeenCalledWith()
    })

    it('calls appRef function with stringified data for other events', () => {
      const fn = jest.fn()
      window.appRef = { [GO_OFFLINE]: fn }
      service.sendDataAppToClient(GO_OFFLINE, { a: 1 })
      expect(fn).toHaveBeenCalledWith(JSON.stringify({ a: 1 }))
    })

    it('posts message to iOsAppRef when appRef function missing but iOS available', () => {
      const postMessage = jest.fn()
      window.webkit = { messageHandlers: { appRef: { postMessage } } }
      service.sendDataAppToClient(GO_OFFLINE, { a: 1 })
      expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ eventName: GO_OFFLINE, data: { a: 1 } }))
    })

    it('dispatches document event when dispatchEventFlag is true and no app refs available', () => {
      window.dispatchEventFlag = true
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent')
      service.sendDataAppToClient(GO_OFFLINE, { a: 1 })
      expect(dispatchSpy).toHaveBeenCalled()
      dispatchSpy.mockRestore()
    })

    it('does nothing when dispatchEventFlag is false and no app refs available', () => {
      window.dispatchEventFlag = false
      const dispatchSpy = jest.spyOn(document, 'dispatchEvent')
      service.sendDataAppToClient(GO_OFFLINE, { a: 1 })
      expect(dispatchSpy).not.toHaveBeenCalled()
      dispatchSpy.mockRestore()
    })
  })

  it('setupGlobalMethods: navigateTo dispatches NAVIGATION_DATA_INCOMING event', () => {
    service.setupGlobalMethods()
    const dispatchSpy = jest.spyOn(document, 'dispatchEvent')
    window.navigateTo('someUrl', { a: 1 })
    expect(dispatchSpy).toHaveBeenCalled()
    dispatchSpy.mockRestore()
  })
})
