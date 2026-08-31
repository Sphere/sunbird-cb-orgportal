import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit } from '@angular/core'
import { fromEvent, Observable } from 'rxjs'
import { mapTo } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-option',
  templateUrl: './option.component.html',
  styleUrls: ['./option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionComponent implements OnInit {

  @Input() value!: string
  click!: Observable<string>

  constructor(private readonly host: ElementRef) {
  }

  ngOnInit() {
    this.click = fromEvent(this.element, 'click').pipe(mapTo(this.value))
  }

  get element() {
    return this.host.nativeElement
  }

}
