import { DebounceClickDirective } from './DebounceClickDirective'

describe('DebounceClickDirective', () => {
  let directive: DebounceClickDirective

  beforeEach(() => {
    jest.useFakeTimers()
    directive = new DebounceClickDirective()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should be created', () => {
    expect(directive).toBeTruthy()
  })

  it('emits debounceClick only after debounceTime has elapsed since the last click', () => {
    directive.ngOnInit()
    const emitSpy = jest.spyOn(directive.debounceClick, 'emit')
    const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() }

    directive.clickEvent(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
    jest.advanceTimersByTime(499)
    expect(emitSpy).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(emitSpy).toHaveBeenCalledWith(event)
  })

  it('uses the custom debounceTime input when set', () => {
    directive.debounceTime = 100
    directive.ngOnInit()
    const emitSpy = jest.spyOn(directive.debounceClick, 'emit')
    directive.clickEvent({ preventDefault: jest.fn(), stopPropagation: jest.fn() })
    jest.advanceTimersByTime(100)
    expect(emitSpy).toHaveBeenCalled()
  })

  it('ngOnDestroy unsubscribes from the clicks stream', () => {
    directive.ngOnInit()
    const unsubscribeSpy = jest.spyOn((directive as any).subscription, 'unsubscribe')
    directive.ngOnDestroy()
    expect(unsubscribeSpy).toHaveBeenCalled()
  })
})
