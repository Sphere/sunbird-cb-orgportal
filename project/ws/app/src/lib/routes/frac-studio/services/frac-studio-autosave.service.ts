import { Injectable, OnDestroy } from '@angular/core'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { FRAC_STUDIO_AUTOSAVE_MS } from '../constants/frac-studio.constants'
import { Frac, FracEditableField, FracEdits, FracSaveStatus, FracStep } from '../models/frac-studio.models'
import { FracStudioApiService } from './frac-studio-api.service'

/**
 * Debounced autosave for one FRAC (spec 8: PATCH 1.4 s after the last edit).
 * Provided by the Creator page, so each page gets its own queue. Only changed top-level
 * fields are sent; edits made while a save is in flight are sent by the next save.
 */
@Injectable()
export class FracStudioAutosaveService implements OnDestroy {
  readonly status$ = new BehaviorSubject<FracSaveStatus>('idle')
  /** The FRAC as the server returned it after each successful save. */
  readonly saved$ = new Subject<Frac>()

  private fracId = ''
  private pending: FracEdits = {}
  private inFlight = false
  private readonly trigger = new Subject<void>()
  private readonly subs = new Subscription()

  constructor(private readonly api: FracStudioApiService) {
    this.subs.add(this.trigger.pipe(debounceTime(FRAC_STUDIO_AUTOSAVE_MS)).subscribe(() => this.save()))
  }

  ngOnDestroy(): void {
    this.flush()
    this.subs.unsubscribe()
  }

  /** Points the queue at a FRAC. Pending edits for another FRAC are dropped. */
  attach(fracId: string): void {
    if (fracId !== this.fracId) {
      this.fracId = fracId
      this.pending = {}
      this.status$.next('idle')
    }
  }

  queue<K extends FracEditableField>(field: K, value: Frac[K]): void {
    this.pending = { ...this.pending, [field]: value }
    this.status$.next('pending')
    this.trigger.next()
  }

  /** Removes roles copied from a matched position; replaces any roles edit still waiting to be sent. */
  queueClearCopiedRoles(): void {
    const rest = { ...this.pending }
    delete rest.roles
    this.pending = { ...rest, clearCopiedRoles: true }
    this.status$.next('pending')
    this.trigger.next()
  }

  /** The team checked a step after an earlier one changed; sent with the next save. */
  queueChecked(step: FracStep): void {
    this.pending = { ...this.pending, checked: [...new Set([...this.pending.checked ?? [], step])] }
    this.status$.next('pending')
    this.trigger.next()
  }

  /** Saves now instead of waiting for the debounce (leaving the page, retry). */
  flush(): void {
    this.save()
  }

  retry(): void {
    this.save()
  }

  get hasUnsaved(): boolean {
    return Object.keys(this.pending).length > 0
  }

  private save(): void {
    if (!this.fracId || this.inFlight || !this.hasUnsaved) {
      return
    }
    const edits = this.pending
    this.pending = {}
    this.inFlight = true
    this.status$.next('saving')
    this.api.patchFrac(this.fracId, edits).subscribe({
      next: frac => {
        this.inFlight = false
        this.saved$.next(frac)
        if (this.hasUnsaved) {
          this.save()
        } else {
          this.status$.next('saved')
        }
      },
      error: () => {
        this.inFlight = false
        // Put the failed edits back under anything typed since, so Retry sends both
        this.pending = { ...edits, ...this.pending }
        this.status$.next('error')
      },
    })
  }
}
