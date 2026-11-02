import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core'
import { Subscription } from 'rxjs'
import { Frac, FracVersion } from '../../models/frac-studio.models'
import { FracStudioApiService } from '../../services/frac-studio-api.service'
import { apiErrorMessage } from '../../utils/frac-studio-download.util'

/** Snapshots of a FRAC (saved on step completion) with an inline-confirmed restore. */
@Component({
  selector: 'ws-app-frac-version-history',
  templateUrl: './version-history.component.html',
  styleUrls: ['./version-history.component.scss'],
  standalone: false,
})
export class VersionHistoryComponent implements OnChanges, OnDestroy {
  @Input() fracId = ''
  /** Bump to reload, e.g. after an expert check adds a snapshot. */
  @Input() refreshKey = 0
  @Output() readonly restored = new EventEmitter<Frac>()

  versions: FracVersion[] = []
  loading = false
  error = ''
  confirmId: number | null = null
  restoringId: number | null = null

  private readonly subs = new Subscription()

  constructor(private readonly api: FracStudioApiService) { }

  ngOnChanges(): void {
    if (this.fracId) {
      this.load()
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe()
  }

  restore(version: FracVersion): void {
    this.confirmId = null
    this.restoringId = version.id
    this.subs.add(
      this.api.restoreVersion(this.fracId, version.id).subscribe({
        next: frac => {
          this.restoringId = null
          this.restored.emit(frac)
          this.load()
        },
        error: err => {
          this.restoringId = null
          this.error = apiErrorMessage(err, 'The version could not be restored.')
        },
      }),
    )
  }

  trackById(_index: number, version: FracVersion): number {
    return version.id
  }

  private load(): void {
    this.loading = true
    this.error = ''
    this.subs.add(
      this.api.listVersions(this.fracId).subscribe({
        next: versions => {
          this.versions = versions
          this.loading = false
        },
        error: err => {
          this.loading = false
          this.error = apiErrorMessage(err, 'The history could not be loaded.')
        },
      }),
    )
  }
}
