import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EMPTY, Observable, Subject } from 'rxjs'
import { catchError, distinctUntilChanged, finalize, switchMap, takeUntil, tap } from 'rxjs/operators'
import {
  NOTIFICATION_KIND_CONFIG,
  NOTIFICATION_LIMITS,
  NOTIFICATION_ROUTES,
  NotificationKind,
  NotificationKindConfig,
} from '../../constants/notifications.constants'
import {
  NotificationApiService,
  NotificationItem,
  NotificationOrg,
  NotificationUser,
  TopicSendResult,
} from '../../services/notification-api.service'

type SearchableDropdown = 'org' | 'item' | 'position' | 'user'

const SEARCH_INPUT_IDS: Record<SearchableDropdown, string> = {
  org: 'notificationOrgSearch',
  item: 'notificationItemSearch',
  position: 'notificationPositionSearch',
  user: 'notificationUserSearch',
}

/**
 * Send-notification screen shared by the Course, Competency, Program and Certificate cards.
 * The route's `data.kind` picks the item list, labels and push payload.
 * Course/Competency/Program go to topics (organisation, optionally per position); Certificate goes to chosen users.
 */
@Component({
  selector: 'ws-app-send-notification',
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.scss'],
  standalone: false,
})
export class SendNotificationComponent implements OnInit, OnDestroy {
  readonly form = new FormGroup({
    orgId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    itemId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    // Optional multi-select: no position means the notification goes to the whole organisation.
    positions: new FormControl<string[]>([], { nonNullable: true }),
    // Certificate only: the users to notify. Made required in ngOnInit for the Certificate page.
    userIds: new FormControl<string[]>([], { nonNullable: true }),
    // Message fields — prefilled with the kind's defaults in ngOnInit, editable by the admin.
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    body: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    // Notification picture: prefilled with the selected item's logo, editable, optional.
    imageUrl: new FormControl('', { nonNullable: true, validators: Validators.pattern(/^\s*https?:\/\/\S+\s*$/) }),
  })

  kind: NotificationKind = 'course'
  config: NotificationKindConfig = NOTIFICATION_KIND_CONFIG.course

  organisations: NotificationOrg[] = []
  items: NotificationItem[] = []
  filteredOrganisations: NotificationOrg[] = []
  filteredItems: NotificationItem[] = []

  /** Which searchable dropdown is open, if any. */
  openDropdown: SearchableDropdown | null = null
  orgSearch = ''
  itemSearch = ''
  positionSearch = ''
  /** Positions of the selected organisation — reloaded whenever the organisation changes. */
  positions: string[] = []
  filteredPositions: string[] = []
  userSearch = ''
  /** Certificate only: users of the selected organisation — reloaded whenever the organisation changes. */
  users: NotificationUser[] = []
  filteredUsers: NotificationUser[] = []
  loadingUsers = false
  loadingOrganisations = false
  loadingItems = false
  loadingPositions = false
  sending = false
  imageFailed = false

  private readonly destroy$ = new Subject<void>()

  constructor(
    private readonly notificationApi: NotificationApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly elRef: ElementRef<HTMLElement>,
  ) { }

  /** Closes the open dropdown when the user clicks anywhere outside it. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.openDropdown) {
      return
    }
    const wrapper = this.elRef.nativeElement.querySelector(`[data-dropdown="${this.openDropdown}"]`)
    if (wrapper && !wrapper.contains(event.target as Node)) {
      this.closeDropdown()
    }
  }

  ngOnInit(): void {
    const kind = this.route.snapshot.data['kind'] as NotificationKind
    if (kind && NOTIFICATION_KIND_CONFIG[kind]) {
      this.kind = kind
      this.config = NOTIFICATION_KIND_CONFIG[kind]
    }
    if (this.isCertificate) {
      this.form.controls.userIds.setValidators(Validators.required)
    }
    this.resetForm()
    this.loadOrganisations()
    // Programs belong to an organisation, so they load when one is picked; the other lists load now.
    if (this.itemsNeedOrg) {
      this.watchOrgForPrograms()
    } else {
      this.loadItems()
    }
    // Certificate notifications go to chosen users; the others can be narrowed to positions.
    if (this.isCertificate) {
      this.watchOrgForUsers()
    } else {
      this.watchOrgForPositions()
    }
    this.form.controls.itemId.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.imageFailed = false
      this.form.controls.imageUrl.setValue(this.selectedItem?.image || '')
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  get selectedItem(): NotificationItem | undefined {
    const id = this.form.controls.itemId.value
    return this.items.find(i => i.identifier === id)
  }

  /** Text in the closed Course / Competency / Program field when nothing is selected. */
  get itemPlaceholder(): string {
    if (this.itemsNeedOrg && !this.form.controls.orgId.value) {
      return 'Select an organisation first'
    }
    return this.loadingItems ? 'Loading...' : `Select ${this.config.itemLabel}`
  }

  /** Certificate notifications go to chosen users (send-by-token) instead of topics. */
  get isCertificate(): boolean {
    return this.kind === 'certificate'
  }

  /** Text shown in the closed Users field. */
  get userSummary(): string {
    const selected = this.form.controls.userIds.value
    if (!selected.length) {
      return this.loadingUsers ? 'Loading...' : 'Select users'
    }
    const byId = new Map(this.users.map(user => [user.id, user.name]))
    // Long lists are cut off with an ellipsis by the field's CSS; the full list is in the tooltip.
    return selected.map(id => byId.get(id) || id).join(', ')
  }

  /** Count line shown at the top of the open Users panel. */
  get userSelectionText(): string {
    return `${this.form.controls.userIds.value.length} of ${this.users.length} selected`
  }

  /** True for Program: its list depends on the selected organisation. */
  get itemsNeedOrg(): boolean {
    return this.kind === 'program'
  }

  get selectedOrg(): NotificationOrg | undefined {
    const id = this.form.controls.orgId.value
    return this.organisations.find(o => o.id === id)
  }

  /** Text shown in the closed Position field. */
  get positionSummary(): string {
    const selected = this.form.controls.positions.value
    if (!selected.length) {
      return this.loadingPositions ? 'Loading...' : 'All positions'
    }
    // Long lists are cut off with an ellipsis by the field's CSS; the full list is in the tooltip.
    return selected.join(', ')
  }

  /** Count line shown at the top of the open Position panel. */
  get positionSelectionText(): string {
    const count = this.form.controls.positions.value.length
    return count ? `${count} selected` : 'None selected — sends to all positions'
  }

  get canSend(): boolean {
    return this.form.valid && !this.sending
  }

  toggleDropdown(key: SearchableDropdown): void {
    const needsOrg = key === 'position' || key === 'user' || (key === 'item' && this.itemsNeedOrg)
    if (needsOrg && !this.form.controls.orgId.value) {
      return
    }
    if (this.openDropdown === key) {
      this.closeDropdown()
      return
    }
    this.openDropdown = key
    this.onSearch(key, '')
    setTimeout(() => (document.getElementById(SEARCH_INPUT_IDS[key]) as HTMLInputElement | null)?.focus(),
      NOTIFICATION_LIMITS.SEARCH_FOCUS_DELAY_MS)
  }

  closeDropdown(): void {
    this.openDropdown = null
  }

  onSearch(key: SearchableDropdown, term: string): void {
    const query = term.trim().toLowerCase()
    if (key === 'org') {
      this.orgSearch = term
      this.filteredOrganisations = this.organisations
        .filter(o => o.name.toLowerCase().includes(query) || o.id.toLowerCase().includes(query))
    } else if (key === 'item') {
      this.itemSearch = term
      this.filteredItems = this.items
        .filter(i => i.name.toLowerCase().includes(query) || i.identifier.toLowerCase().includes(query))
    } else if (key === 'position') {
      this.positionSearch = term
      this.filteredPositions = this.positions.filter(p => p.toLowerCase().includes(query))
    } else {
      this.userSearch = term
      this.filteredUsers = this.users.filter(u => [u.name, u.contact, u.id].some(v => v.toLowerCase().includes(query)))
    }
  }

  selectOrg(id: string): void {
    this.form.controls.orgId.setValue(id)
    this.form.controls.orgId.markAsTouched()
    this.closeDropdown()
  }

  selectItem(id: string): void {
    this.form.controls.itemId.setValue(id)
    this.form.controls.itemId.markAsTouched()
    this.closeDropdown()
  }

  isPositionSelected(position: string): boolean {
    return this.form.controls.positions.value.includes(position)
  }

  /** Ticks or unticks a position; the panel stays open so several can be picked. */
  togglePosition(position: string): void {
    const selected = this.form.controls.positions.value
    this.form.controls.positions.setValue(
      selected.includes(position) ? selected.filter(p => p !== position) : [...selected, position],
    )
  }

  clearPositions(): void {
    this.form.controls.positions.setValue([])
  }

  isUserSelected(userId: string): boolean {
    return this.form.controls.userIds.value.includes(userId)
  }

  /** Ticks or unticks a user; the panel stays open so several can be picked. */
  toggleUser(userId: string): void {
    const selected = this.form.controls.userIds.value
    this.form.controls.userIds.setValue(
      selected.includes(userId) ? selected.filter(id => id !== userId) : [...selected, userId],
    )
    this.form.controls.userIds.markAsTouched()
  }

  /** Ticks every user currently shown by the search, keeping earlier picks. */
  selectShownUsers(): void {
    const selected = new Set(this.form.controls.userIds.value)
    this.filteredUsers.forEach(user => selected.add(user.id))
    this.form.controls.userIds.setValue(Array.from(selected))
  }

  clearUsers(): void {
    this.form.controls.userIds.setValue([])
  }

  back(): void {
    this.router.navigateByUrl(NOTIFICATION_ROUTES.DASHBOARD)
  }

  send(): void {
    const item = this.selectedItem
    const org = this.selectedOrg
    if (!this.canSend || !item || !org) {
      return
    }
    this.sending = true
    const { positions, userIds, title, body, imageUrl } = this.form.getRawValue()
    if (this.isCertificate) {
      this.sendCertificate(item, userIds, title.trim(), body.trim(), imageUrl.trim())
      return
    }
    this.notificationApi.sendNotification(this.kind, {
      orgId: org.id,
      item,
      title: title.trim(),
      body: body.trim(),
      positions,
      ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
    }).pipe(
      finalize(() => { this.sending = false }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: results => this.reportSendResults(results),
      error: () => {
        this.snackBar.open('Failed to send notification. Please try again.', 'Close', {
          duration: NOTIFICATION_LIMITS.SNACKBAR_DURATION_MS,
        })
      },
    })
  }

  private sendCertificate(item: NotificationItem, userIds: string[], title: string, body: string, imageUrl: string): void {
    const duration = NOTIFICATION_LIMITS.SNACKBAR_DURATION_MS
    this.notificationApi.sendCertificateNotification({
      item,
      userIds,
      title,
      body,
      ...(imageUrl ? { imageUrl } : {}),
    }).pipe(
      finalize(() => { this.sending = false }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: () => {
        const target = userIds.length === 1 ? '1 user' : `${userIds.length} users`
        this.snackBar.open(`Notification sent to ${target}`, 'Close', { duration })
        this.resetForm()
      },
      error: () => {
        this.snackBar.open('Failed to send notification. Please try again.', 'Close', { duration })
      },
    })
  }

  /** All sent: confirm and clear the form. Some failed: say which, and keep the form so they can be retried. */
  private reportSendResults(results: TopicSendResult[]): void {
    const failed = results.filter(r => !r.success)
    const duration = NOTIFICATION_LIMITS.SNACKBAR_DURATION_MS
    if (!failed.length) {
      const target = results.length > 1 ? ` to ${results.length} positions` : ''
      this.snackBar.open(`Notification sent${target}`, 'Close', { duration })
      this.resetForm()
      return
    }
    if (failed.length === results.length) {
      this.snackBar.open('Failed to send notification. Please try again.', 'Close', { duration })
      return
    }
    const failedNames = failed.map(r => r.position || r.topic).join(', ')
    this.snackBar.open(`Sent to ${results.length - failed.length} of ${results.length} positions. Failed: ${failedNames}`,
      'Close', { duration: duration * 2 })
    // Keep only the failed positions ticked, so pressing Send again retries just those.
    this.form.controls.positions.setValue(failed.map(r => r.position).filter((p): p is string => !!p))
  }

  /** Restores the default message for this kind. Used on load, after a send, and by "Reset message". */
  resetMessage(): void {
    this.form.patchValue({
      title: this.config.defaultTitle,
      body: this.config.defaultBody,
      imageUrl: this.selectedItem?.image || '',
    })
  }

  private resetForm(): void {
    this.form.reset({ orgId: '', itemId: '', positions: [], userIds: [] })
    this.resetMessage()
  }

  private loadOrganisations(): void {
    this.loadingOrganisations = true
    this.notificationApi.getOrganisations().pipe(
      finalize(() => { this.loadingOrganisations = false }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: organisations => {
        this.organisations = organisations
        this.onSearch('org', this.orgSearch)
      },
      error: () => {
        this.organisations = []
        this.filteredOrganisations = []
      },
    })
  }

  /** Reloads the Program list each time the organisation changes. */
  private watchOrgForPrograms(): void {
    this.reloadOnOrgChange(
      () => {
        this.form.controls.itemId.setValue('')
        this.items = []
        this.filteredItems = []
        this.itemSearch = ''
      },
      orgId => this.notificationApi.getPrograms(orgId),
      loading => { this.loadingItems = loading },
      items => {
        this.items = items
        this.onSearch('item', this.itemSearch)
      },
    )
  }

  private loadItems(): void {
    const sources: Record<Exclude<NotificationKind, 'program'>, () => Observable<NotificationItem[]>> = {
      course: () => this.notificationApi.getCourses(),
      competency: () => this.notificationApi.getCompetencies(),
      // A certificate is for a competency, so the Certificate page lists competencies.
      certificate: () => this.notificationApi.getCompetencies(),
    }
    const items$ = sources[this.kind as Exclude<NotificationKind, 'program'>]()
    this.loadingItems = true
    items$.pipe(
      finalize(() => { this.loadingItems = false }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: items => {
        this.items = items
        this.onSearch('item', this.itemSearch)
      },
      error: () => {
        this.items = []
        this.filteredItems = []
      },
    })
  }

  /** Reloads the Position list each time the organisation changes. */
  private watchOrgForPositions(): void {
    this.reloadOnOrgChange(
      () => {
        this.form.controls.positions.setValue([])
        this.positions = []
        this.filteredPositions = []
        this.positionSearch = ''
      },
      orgId => this.notificationApi.getPositions(orgId),
      loading => { this.loadingPositions = loading },
      positions => {
        this.positions = positions
        this.onSearch('position', this.positionSearch)
      },
    )
  }

  /** Certificate only: reloads the Users list each time the organisation changes. */
  private watchOrgForUsers(): void {
    this.reloadOnOrgChange(
      () => {
        this.form.controls.userIds.setValue([])
        this.users = []
        this.filteredUsers = []
        this.userSearch = ''
      },
      orgId => this.notificationApi.getOrgUsers(orgId),
      loading => { this.loadingUsers = loading },
      users => {
        this.users = users
        this.onSearch('user', this.userSearch)
      },
    )
  }

  /**
   * Shared wiring for lists that depend on the organisation: clear on every change, then load for the new one.
   * switchMap means a newer selection cancels the older load; a failed load leaves the list empty.
   */
  private reloadOnOrgChange<T>(
    clear: () => void,
    load: (orgId: string) => Observable<T>,
    setLoading: (loading: boolean) => void,
    apply: (result: T) => void,
  ): void {
    this.form.controls.orgId.valueChanges.pipe(
      distinctUntilChanged(),
      tap(() => clear()),
      switchMap(orgId => {
        if (!orgId) {
          setLoading(false)
          return EMPTY
        }
        setLoading(true)
        return load(orgId).pipe(
          catchError(() => {
            setLoading(false)
            return EMPTY
          }),
        )
      }),
      takeUntil(this.destroy$),
    ).subscribe(result => {
      apply(result)
      setLoading(false)
    })
  }
}
