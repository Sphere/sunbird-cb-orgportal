import { ElementRef, ViewContainerRef } from '@angular/core'
import { NgControl } from '@angular/forms'
import { Overlay } from '@angular/cdk/overlay'
import { Subject } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { AutocompleteDirective, overlayClickOutside } from './autocomplete.directive'

describe('AutocompleteDirective', () => {
  let directive: AutocompleteDirective
  let host: ElementRef<HTMLInputElement>
  let ngControl: any
  let vcr: ViewContainerRef
  let overlay: any
  let overlayRef: any
  let optionsClick$: Subject<any>

  beforeEach(() => {
    const input = document.createElement('input')
    Object.defineProperty(input, 'offsetWidth', { value: 100 })
    host = { nativeElement: input } as ElementRef<HTMLInputElement>
    ngControl = { control: { setValue: jest.fn() } }
    vcr = {} as ViewContainerRef

    optionsClick$ = new Subject<any>()
    overlayRef = {
      attach: jest.fn(),
      detach: jest.fn(),
      detachments: jest.fn().mockReturnValue(new Subject<void>()),
      overlayElement: { contains: () => false },
    }
    overlay = {
      create: jest.fn().mockReturnValue(overlayRef),
      scrollStrategies: { reposition: jest.fn().mockReturnValue('reposition-strategy') },
      position: jest.fn().mockReturnValue({
        flexibleConnectedTo: jest.fn().mockReturnThis(),
        withPositions: jest.fn().mockReturnThis(),
        withFlexibleDimensions: jest.fn().mockReturnThis(),
        withPush: jest.fn().mockReturnThis(),
      }),
    }

    directive = new AutocompleteDirective(host, ngControl, vcr, overlay as unknown as Overlay)
    directive.wsAppAutocomplete = {
      rootTemplate: {},
      optionsClick: jest.fn().mockReturnValue(optionsClick$.asObservable()),
    } as any
  })

  afterEach(() => directive.ngOnDestroy())

  it('should create an instance', () => {
    expect(directive).toBeTruthy()
  })

  it('control getter should return the NgControl control', () => {
    expect(directive.control).toBe(ngControl.control)
  })

  it('origin getter should return the host native element', () => {
    expect(directive.origin).toBe(host.nativeElement)
  })

  describe('ngOnInit / openDropdown', () => {
    it('should open the dropdown on focus (after the debounce) and wire option selection', () => {
      jest.useFakeTimers()
      directive.ngOnInit()
      host.nativeElement.dispatchEvent(new Event('focus'))
      jest.advanceTimersByTime(1000)

      expect(overlay.create).toHaveBeenCalled()
      expect(overlayRef.attach).toHaveBeenCalled()

      optionsClick$.next('picked')
      expect(ngControl.control.setValue).toHaveBeenCalledWith('picked')
      expect(overlayRef.detach).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should close an already-open overlay before reopening', () => {
      jest.useFakeTimers()
      directive.ngOnInit()
      host.nativeElement.dispatchEvent(new Event('focus'))
      jest.advanceTimersByTime(1000)
      overlayRef.detach.mockClear()

      host.nativeElement.dispatchEvent(new Event('focus'))
      jest.advanceTimersByTime(1000)

      expect(overlayRef.detach).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  describe('close (via option selection with no control)', () => {
    it('should skip setValue but still close when control is falsy', () => {
      jest.useFakeTimers()
      ngControl.control = null
      directive.ngOnInit()
      host.nativeElement.dispatchEvent(new Event('focus'))
      jest.advanceTimersByTime(1000)

      optionsClick$.next('picked')
      expect(overlayRef.detach).toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  it('ngOnDestroy should complete the destroyed subject', () => {
    const completeSpy = jest.spyOn((directive as any).destroyed$, 'complete')
    directive.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })

  describe('overlayClickOutside', () => {
    it('should emit when a click lands outside both the origin and the overlay', done => {
      const origin = document.createElement('div')
      const outside = document.createElement('div')
      document.body.appendChild(outside)
      const ref = {
        overlayElement: { contains: () => false },
        detachments: () => new Subject<void>(),
      } as any

      overlayClickOutside(ref, origin).subscribe(() => done())
      outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    it('should not emit for a click on the origin itself', () => {
      const origin = document.createElement('div')
      document.body.appendChild(origin)
      const ref = {
        overlayElement: { contains: () => false },
        detachments: () => new Subject<void>(),
      } as any

      const next = jest.fn()
      const sub = overlayClickOutside(ref, origin).subscribe(next)
      origin.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(next).not.toHaveBeenCalled()
      sub.unsubscribe()
    })
  })
})
