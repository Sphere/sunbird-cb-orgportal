import { Directive, DoCheck, ElementRef, Inject, Optional, Self } from '@angular/core'
import { MatCheckbox } from '@angular/material/checkbox'
import { FeatureAccessService, FEATURE_KEY, FeatureKey } from '../access/feature-access'

/**
 * Attribute directive that disables the host control for view-only users of the
 * current feature — keeps it visible but non-interactive. Works on native form
 * controls (e.g. <input type="checkbox">) and on Angular Material <mat-checkbox>.
 *
 * Companion to `appHideForViewOnly`: use *hide* for action buttons, use *disable*
 * for selection controls that should stay visible but greyed out (no meaning
 * without the hidden action). Feature is resolved from DI (FEATURE_KEY); rules
 * live in feature-access.ts.
 *
 * It only ever *adds* the disabled state for view-only users — it never re-enables
 * a control — so any existing [disabled] logic (e.g. [disabled]="isReadOnly") is
 * preserved for everyone else.
 *
 * Usage: <input type="checkbox" appDisableForViewOnly ...>
 *        <mat-checkbox appDisableForViewOnly [disabled]="isReadOnly" ...>
 */
@Directive({
  selector: '[appDisableForViewOnly]',
  standalone: true,
})
export class DisableForViewOnlyDirective implements DoCheck {
  constructor(
    private el: ElementRef<HTMLElement>,
    private access: FeatureAccessService,
    @Optional() @Inject(FEATURE_KEY) private feature: FeatureKey | null,
    @Optional() @Self() private matCheckbox: MatCheckbox | null,
  ) {}

  ngDoCheck(): void {
    if (!this.access.isViewOnly(this.feature)) {
      return
    }
    if (this.matCheckbox) {
      if (!this.matCheckbox.disabled) {
        this.matCheckbox.disabled = true
      }
    } else {
      const native = this.el.nativeElement as HTMLInputElement
      if (!native.disabled) {
        native.disabled = true
      }
    }
  }
}
