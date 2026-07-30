import { TestBed } from '@angular/core/testing'
import { LoaderService } from './loader.service'

describe('LoaderService', () => {
  let service: LoaderService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderService],
    })
    service = TestBed.inject(LoaderService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should default changeLoad to false', done => {
    service.changeLoad.subscribe(value => {
      expect(value).toBe(false)
      done()
    })
  })

  it('should default currentState to false', done => {
    service.currentState.subscribe(value => {
      expect(value).toBe(false)
      done()
    })
  })

  it('should emit the new state on currentState when changeLoadState is called', () => {
    const emitted: boolean[] = []
    service.currentState.subscribe(value => emitted.push(value))

    service.changeLoadState(true)
    service.changeLoadState(false)

    expect(emitted).toEqual([false, true, false])
  })

  it('should not affect changeLoad when changeLoadState is called', () => {
    service.changeLoadState(true)
    expect(service.changeLoad.value).toBe(false)
  })
})
