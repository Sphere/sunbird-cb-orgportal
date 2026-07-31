import { WsEvents } from '@sunbird-cb/utils'
import { NsContent } from './widget-content.model'

// The source file imports two modules that do not exist anywhere in the repo
// ('../collection.config' and '../_models/player-media.model'). They are only
// used for a constant and a type, respectively, so we provide virtual mocks
// to allow the module under test to be loaded in isolation.
jest.mock(
  '../collection.config',
  () => ({
    ROOT_WIDGET_CONFIG: {
      player: { _type: 'player' },
    },
  }),
  { virtual: true },
)
jest.mock('../_models/player-media.model', () => ({}), { virtual: true })

// Avoid pulling in the real video.js player implementation / its plugins.
let lastPlayerInstance: any
jest.mock('video.js', () => {
  const fn = jest.fn(() => {
    const handlers: { [key: string]: Array<(...args: any[]) => void> } = {}
    const player = {
      on: jest.fn((event: string, cb: (...args: any[]) => void) => {
        handlers[event] = handlers[event] || []
        handlers[event].push(cb)
      }),
      trigger: (event: string, ...args: any[]) => {
        (handlers[event] || []).forEach(cb => cb(...args))
      },
      currentTime: jest.fn(() => 0),
      duration: jest.fn(() => 100),
    }
    lastPlayerInstance = player
    return player
  })
  return fn
})
jest.mock('videojs-youtube', () => ({}), { virtual: true })
jest.mock('videojs-contrib-quality-levels', () => ({}), { virtual: true })
jest.mock('videojs-hls-quality-selector', () => ({}), { virtual: true })
jest.mock('videojs-vr', () => ({}), { virtual: true })

// eslint-disable-next-line import/first
import {
  videoInitializer,
  videoJsInitializer,
  videojsEventNames,
  youtubeInitializer,
} from './videojs-util'

const widgetData: any = { identifier: 'id-1' }

describe('videojs-util', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe('videoJsInitializer', () => {
    it('creates a player and dispose() saves continue-learning data when telemetry disabled', () => {
      const dispatcher = jest.fn()
      const saveCLearning = jest.fn()
      const fireRProgress = jest.fn()
      const elem = document.createElement('video')

      const { player, dispose } = videoJsInitializer(
        elem,
        {} as any,
        dispatcher,
        saveCLearning,
        fireRProgress,
        { some: 'data' },
        'widget-sub-type',
        0,
        false,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )

      expect(player).toBeTruthy()
      dispose()
      expect(saveCLearning).toHaveBeenCalledWith(
        expect.objectContaining({ resourceId: 'id-1' }),
      )
      expect(dispatcher).not.toHaveBeenCalled()
      expect(fireRProgress).not.toHaveBeenCalled()
    })

    it('registers telemetry handlers and dispatches Loaded/HeartBeat on play, Unloaded on pause and ended', () => {
      const dispatcher = jest.fn()
      const saveCLearning = jest.fn()
      const fireRProgress = jest.fn()
      const elem = document.createElement('video')

      videoJsInitializer(
        elem,
        {} as any,
        dispatcher,
        saveCLearning,
        fireRProgress,
        { some: 'data' },
        'widget-sub-type',
        0,
        true,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )

      const player = lastPlayerInstance
      expect(player.on).toHaveBeenCalledWith(videojsEventNames.loadeddata, expect.any(Function))
      expect(player.on).toHaveBeenCalledWith(videojsEventNames.play, expect.any(Function))
      expect(player.on).toHaveBeenCalledWith(videojsEventNames.pause, expect.any(Function))
      expect(player.on).toHaveBeenCalledWith(videojsEventNames.ended, expect.any(Function))

      // play -> Loaded event + heartbeat interval scheduled
      player.currentTime.mockReturnValue(0)
      player.duration.mockReturnValue(100)
      player.trigger(videojsEventNames.play)
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Loaded }),
        }),
      )
      dispatcher.mockClear()

      // advance timers so the heartbeat fires
      jest.advanceTimersByTime(2 * 60000)
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventSubType: WsEvents.EnumTelemetrySubType.HeartBeat }),
        }),
      )

      // move currentTime into the "middle" band so readyToRaise flips true,
      // then into the "near end" band so real-time progress fires.
      player.currentTime.mockReturnValue(10)
      jest.advanceTimersByTime(500)
      player.currentTime.mockReturnValue(96)
      jest.advanceTimersByTime(500)
      expect(fireRProgress).toHaveBeenCalledWith('id-1', expect.objectContaining({ mime_type: NsContent.EMimeTypes.MP4 }))

      // pause -> Unloaded
      dispatcher.mockClear()
      player.trigger(videojsEventNames.pause)
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Unloaded }),
        }),
      )

      // play again then ended -> Unloaded (ended path)
      player.trigger(videojsEventNames.play)
      dispatcher.mockClear()
      player.trigger(videojsEventNames.ended)
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Unloaded }),
        }),
      )
    })

    it('seeks to resume point on loadeddata when far enough from start/end', () => {
      const dispatcher = jest.fn()
      const elem = document.createElement('video')

      videoJsInitializer(
        elem,
        {} as any,
        dispatcher,
        jest.fn(),
        jest.fn(),
        {},
        'widget-sub-type',
        30,
        true,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )
      const player = lastPlayerInstance
      player.duration.mockReturnValue(1000)
      player.trigger(videojsEventNames.loadeddata)
      expect(player.currentTime).toHaveBeenCalledWith(20)
    })

    it('does not seek when resume point is small or too close to duration', () => {
      const elem = document.createElement('video')
      videoJsInitializer(
        elem,
        {} as any,
        jest.fn(),
        jest.fn(),
        jest.fn(),
        {},
        'widget-sub-type',
        5,
        true,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )
      const player = lastPlayerInstance
      player.currentTime.mockClear()
      player.duration.mockReturnValue(1000)
      player.trigger(videojsEventNames.loadeddata)
      // resumePoint (5) is not > 10, so currentTime() setter should not be invoked
      expect(player.currentTime).not.toHaveBeenCalledWith(expect.anything())
    })

    it('dispose unsubscribes active subscriptions and fires pending real-time progress', () => {
      const dispatcher = jest.fn()
      const fireRProgress = jest.fn()
      const elem = document.createElement('video')

      const { dispose } = videoJsInitializer(
        elem,
        {} as any,
        dispatcher,
        jest.fn(),
        fireRProgress,
        {},
        'widget-sub-type',
        0,
        true,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )
      const player = lastPlayerInstance
      player.currentTime.mockReturnValue(10)
      player.duration.mockReturnValue(100)
      player.trigger(videojsEventNames.play)
      jest.advanceTimersByTime(500) // readyToRaise becomes true

      dispose()
      expect(fireRProgress).toHaveBeenCalled()
    })
  })

  describe('videoInitializer', () => {
    function makeVideoEl() {
      const elem = document.createElement('video')
      Object.defineProperty(elem, 'currentTime', { value: 0, writable: true, configurable: true })
      Object.defineProperty(elem, 'duration', { value: 100, writable: true, configurable: true })
      return elem
    }

    it('does nothing telemetry-related when disabled, dispose still saves progress', () => {
      const dispatcher = jest.fn()
      const saveCLearning = jest.fn()
      const elem = makeVideoEl()

      const { dispose } = videoInitializer(
        elem,
        dispatcher,
        saveCLearning,
        jest.fn(),
        {},
        'widget-sub-type',
        false,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )
      dispose()
      expect(saveCLearning).toHaveBeenCalled()
      expect(dispatcher).not.toHaveBeenCalled()
    })

    it('dispatches Loaded/HeartBeat on play, Unloaded on pause/ended, and fires real-time progress', () => {
      const dispatcher = jest.fn()
      const fireRProgress = jest.fn()
      const elem = makeVideoEl()

      videoInitializer(
        elem,
        dispatcher,
        jest.fn(),
        fireRProgress,
        {},
        'widget-sub-type',
        true,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )

      elem.dispatchEvent(new Event('play'))
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Loaded }),
        }),
      )
      dispatcher.mockClear()

      jest.advanceTimersByTime(2 * 60000)
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventSubType: WsEvents.EnumTelemetrySubType.HeartBeat }),
        }),
      )

      Object.defineProperty(elem, 'currentTime', { value: 10, writable: true, configurable: true })
      jest.advanceTimersByTime(500)
      Object.defineProperty(elem, 'currentTime', { value: 96, writable: true, configurable: true })
      jest.advanceTimersByTime(500)
      expect(fireRProgress).toHaveBeenCalledWith('id-1', expect.objectContaining({ mime_type: NsContent.EMimeTypes.MP4 }))

      dispatcher.mockClear()
      elem.dispatchEvent(new Event('pause'))
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Unloaded }),
        }),
      )

      elem.dispatchEvent(new Event('play'))
      dispatcher.mockClear()
      elem.dispatchEvent(new Event('ended'))
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Unloaded }),
        }),
      )
    })

    it('dispose unsubscribes all subscriptions cleanly after activity', () => {
      const dispatcher = jest.fn()
      const fireRProgress = jest.fn()
      const elem = makeVideoEl()

      const { dispose } = videoInitializer(
        elem,
        dispatcher,
        jest.fn(),
        fireRProgress,
        {},
        'widget-sub-type',
        true,
        widgetData,
        NsContent.EMimeTypes.MP4,
      )
      elem.dispatchEvent(new Event('play'))
      Object.defineProperty(elem, 'currentTime', { value: 10, writable: true, configurable: true })
      jest.advanceTimersByTime(500)
      expect(() => dispose()).not.toThrow()
    })
  })

  describe('youtubeInitializer', () => {
    let stateChangeCb: (event: any) => void
    let ytPlayerInstance: any

    beforeEach(() => {
      ytPlayerInstance = {
        getCurrentTime: jest.fn(() => 0),
        getDuration: jest.fn(() => 100),
      }
      ;(window as any).YT = {
        PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
        Player: jest.fn((_elem: any, options: any) => {
          stateChangeCb = options.events.onStateChange
          return ytPlayerInstance
        }),
      }
    })

    afterEach(() => {
      delete (window as any).YT
    })

    it('creates a YT.Player and drives Loaded/HeartBeat/Unloaded through state changes', () => {
      const dispatcher = jest.fn()
      const fireRProgress = jest.fn()
      const elem = document.createElement('div')

      youtubeInitializer(
        elem,
        'yt-id',
        dispatcher,
        jest.fn(),
        fireRProgress,
        {},
        'widget-sub-type',
        true,
        widgetData,
        NsContent.EMimeTypes.YOUTUBE,
        '480px',
      )

      expect((window as any).YT.Player).toHaveBeenCalled()

      stateChangeCb({ data: (window as any).YT.PlayerState.PLAYING })
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Loaded }),
        }),
      )
      dispatcher.mockClear()

      jest.advanceTimersByTime(2 * 60000)
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventSubType: WsEvents.EnumTelemetrySubType.HeartBeat }),
        }),
      )

      ytPlayerInstance.getCurrentTime.mockReturnValue(10)
      jest.advanceTimersByTime(500)
      ytPlayerInstance.getCurrentTime.mockReturnValue(96)
      jest.advanceTimersByTime(500)
      expect(fireRProgress).toHaveBeenCalledWith('id-1', expect.objectContaining({ mime_type: NsContent.EMimeTypes.YOUTUBE }))

      dispatcher.mockClear()
      stateChangeCb({ data: (window as any).YT.PlayerState.PAUSED })
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Unloaded }),
        }),
      )

      stateChangeCb({ data: (window as any).YT.PlayerState.PLAYING })
      dispatcher.mockClear()
      stateChangeCb({ data: (window as any).YT.PlayerState.ENDED })
      expect(dispatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ state: WsEvents.EnumTelemetrySubType.Unloaded }),
        }),
      )
    })

    it('does not set up telemetry dispatch when disabled, dispose still saves progress', () => {
      const dispatcher = jest.fn()
      const saveCLearning = jest.fn()
      const elem = document.createElement('div')

      const { dispose } = youtubeInitializer(
        elem,
        'yt-id',
        dispatcher,
        saveCLearning,
        jest.fn(),
        {},
        'widget-sub-type',
        false,
        widgetData,
        NsContent.EMimeTypes.YOUTUBE,
        '480px',
      )
      dispose()
      expect(saveCLearning).toHaveBeenCalled()
      expect(dispatcher).not.toHaveBeenCalled()
    })
  })
})
