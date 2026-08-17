import { Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { HideForViewOnlyDirective } from './hide-for-view-only.directive'
import { FeatureAccessService, FEATURE_KEY } from '../access/feature-access'

@Component({
  standalone: true,
  imports: [HideForViewOnlyDirective],
  template: `
    <button *appHideForViewOnly class="mutation-btn">Delete</button>
    <button *appHideForViewOnly="false" class="non-mutation-btn">Navigate</button>
  `,
})
class TestHostComponent {}

describe('HideForViewOnlyDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>
  let mockAccess: { isViewOnly: jest.Mock }

  function setup(isViewOnly: boolean) {
    mockAccess = { isViewOnly: jest.fn().mockReturnValue(isViewOnly) }

    TestBed.configureTestingModule({
      imports: [TestHostComponent, HideForViewOnlyDirective],
      providers: [
        { provide: FeatureAccessService, useValue: mockAccess },
        { provide: FEATURE_KEY, useValue: 'frac' },
      ],
    })

    fixture = TestBed.createComponent(TestHostComponent)
    fixture.detectChanges()
  }

  it('should hide the bare (mutation) button when the user is view-only', () => {
    setup(true)
    expect(fixture.nativeElement.querySelector('.mutation-btn')).toBeNull()
  })

  it('should show the bare (mutation) button when the user is not view-only', () => {
    setup(false)
    expect(fixture.nativeElement.querySelector('.mutation-btn')).not.toBeNull()
  })

  it('should always show a button whose expression is false (non-mutation), even for view-only users', () => {
    setup(true)
    expect(fixture.nativeElement.querySelector('.non-mutation-btn')).not.toBeNull()
  })

  it('should query isViewOnly with the feature provided via FEATURE_KEY', () => {
    setup(true)
    expect(mockAccess.isViewOnly).toHaveBeenCalledWith('frac')
  })
})
