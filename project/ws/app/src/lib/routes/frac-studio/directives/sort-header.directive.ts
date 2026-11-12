import { Directive, HostBinding, HostListener, Input } from '@angular/core'
import { ColumnSort } from '../utils/frac-studio-sort.util'

/**
 * Makes a table header sort its column: click, Enter or Space cycles ascending, descending and the saved order.
 * The arrow is drawn by the fs-sortable-headers mixin from aria-sort.
 *
 *   <th wsFracSort="title" [sortWith]="sort">Title</th>
 */
@Directive({
  selector: 'th[wsFracSort]',
  standalone: false,
})
export class FracSortHeaderDirective {
  @Input('wsFracSort') key = ''
  @Input() sortWith!: ColumnSort

  @HostBinding('attr.tabindex') readonly tabindex = 0
  @HostBinding('class.sortable') readonly sortable = true

  @HostBinding('attr.aria-sort') get ariaSort(): string {
    return this.sortWith.ariaSort(this.key)
  }

  @HostListener('click')
  @HostListener('keydown.enter')
  toggle(): void {
    this.sortWith.toggle(this.key)
  }

  @HostListener('keydown.space', ['$event'])
  onSpace(event: Event): void {
    event.preventDefault() // the page would scroll
    this.toggle()
  }
}
