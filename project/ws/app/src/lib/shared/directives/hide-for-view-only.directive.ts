import { Directive, Inject, Input, OnInit, Optional, TemplateRef, ViewContainerRef } from '@angular/core'
import { FeatureAccessService, FEATURE_KEY, FeatureKey } from '../access/feature-access'

/**
 * Structural directive that removes the host element for view-only users of the
 * current feature.
 *
 * The feature is resolved from DI (FEATURE_KEY, provided once per feature module/
 * route), so templates don't repeat the feature name. Role rules live in
 * feature-access.ts. For non-restricted users the element renders unchanged, so
 * existing editor flows are untouched.
 *
 * Usage:
 *   <button *appHideForViewOnly (click)="onDelete()">Delete</button>
 *     -> always a mutation; hidden for view-only users of this feature.
 *
 *   <button *appHideForViewOnly="action.icon === 'upload'" ...>Upload</button>
 *     -> hidden for view-only users only when the expression is true,
 *        so navigation actions in the same *ngFor stay visible.
 */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({
  selector: '[appHideForViewOnly]',
  standalone: true,
})
export class HideForViewOnlyDirective implements OnInit {
  private isMutation = true
  private hasView = false
  private initialized = false

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
    private readonly access: FeatureAccessService,
    @Optional() @Inject(FEATURE_KEY) private readonly feature: FeatureKey | null,
  ) {}

  /**
   * Marks whether the host element is a mutating action. A bare
   * `*appHideForViewOnly` (empty string) is treated as a mutation. The setter
   * may not fire for a value-less attribute, so the initial render happens in
   * ngOnInit; this only re-renders on later value changes.
   */
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('appHideForViewOnly')
  set appHideForViewOnly(value: boolean | '') {
    this.isMutation = value === '' || value === undefined ? true : Boolean(value)
    if (this.initialized) {
      this.updateView()
    }
  }

  ngOnInit(): void {
    this.initialized = true
    this.updateView()
  }

  private updateView(): void {
    const shouldHide = this.isMutation && this.access.isViewOnly(this.feature)
    if (shouldHide && this.hasView) {
      this.viewContainer.clear()
      this.hasView = false
    } else if (!shouldHide && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef)
      this.hasView = true
    }
  }
}
