import { Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { DisableForViewOnlyDirective } from './disable-for-view-only.directive'
import { FeatureAccessService, FEATURE_KEY } from '../access/feature-access'

@Component({
  standalone: true,
  imports: [DisableForViewOnlyDirective],
  template: `<input type="checkbox" appDisableForViewOnly [disabled]="externalDisabled" />`,
})
class TestHostComponent {
  externalDisabled = false
}

describe('DisableForViewOnlyDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>
  let mockAccess: { isViewOnly: jest.Mock }

  function setup(isViewOnly: boolean) {
    mockAccess = { isViewOnly: jest.fn().mockReturnValue(isViewOnly) }

    TestBed.configureTestingModule({
      imports: [TestHostComponent, DisableForViewOnlyDirective],
      providers: [
        { provide: FeatureAccessService, useValue: mockAccess },
        { provide: FEATURE_KEY, useValue: 'frac' },
      ],
    })

    fixture = TestBed.createComponent(TestHostComponent)
    fixture.detectChanges()
  }

  it('should disable the native checkbox when the user is view-only', () => {
    setup(true)
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    expect(input.disabled).toBe(true)
  })

  it('should leave the native checkbox enabled when the user is not view-only', () => {
    setup(false)
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    expect(input.disabled).toBe(false)
  })

  it('should query isViewOnly with the feature provided via FEATURE_KEY', () => {
    setup(true)
    expect(mockAccess.isViewOnly).toHaveBeenCalledWith('frac')
  })

  it('should not re-enable a control that was already disabled via [disabled] when not view-only', () => {
    mockAccess = { isViewOnly: jest.fn().mockReturnValue(false) }
    TestBed.configureTestingModule({
      imports: [TestHostComponent, DisableForViewOnlyDirective],
      providers: [
        { provide: FeatureAccessService, useValue: mockAccess },
        { provide: FEATURE_KEY, useValue: 'frac' },
      ],
    })
    fixture = TestBed.createComponent(TestHostComponent)
    fixture.componentInstance.externalDisabled = true
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    expect(input.disabled).toBe(true)
  })
})
