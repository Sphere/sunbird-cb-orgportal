import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EMPTY, Observable, Subject, merge, of } from 'rxjs'
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators'
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
  PartialList,
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
  /** The first OPTION_RENDER_LIMIT of the filtered list — what the panel actually draws. */
  visiblePositions: string[] = []
  userSearch = ''
  /** Certificate only: users of the selected organisation — reloaded whenever the organisation changes. */
  users: NotificationUser[] = []
  filteredUsers: NotificationUser[] = []
  visibleUsers: NotificationUser[] = []
  loadingUsers = false
  loadingOrganisations = false
  loadingItems = false
  loadingPositions = false
  sending = false
  imageFailed = false

  /** Load failures, shown with a "Try again" link instead of a misleading "none found". */
  itemsError = false
  positionsError = false
  usersError = false
  /** How much of each list was loaded. `*Total` is the server's count: matching courses, or the organisation's users. */
  itemsTotal = 0
  itemsTruncated = false
  orgUsersTotal = 0
  positionsTruncated = false
  usersTruncated = false

  /** Selections as Sets — the panels check every row on each change, so lookups must be constant time. */
  selectedPositions = new Set<string>()
  selectedUserIds = new Set<string>()

  readonly renderLimit = NOTIFICATION_LIMITS.OPTION_RENDER_LIMIT
  readonly positionsScanLimit = NOTIFICATION_LIMITS.POSITION_SCAN_MAX_USERS

  private userNameById = new Map<string, string>()
  /** The chosen item, kept so it stays selected when a new course search replaces the list. */
  private pickedItem?: NotificationItem
  private readonly courseSearch$ = new Subject<string>()
  private readonly retryItems$ = new Subject<void>()
  private readonly retryPositions$ = new Subject<void>()
  private readonly retryUsers$ = new Subject<void>()
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
    // composedPath() is captured when the click happens, so it still includes a button that the click itself
    // removed (e.g. "Clear" hides itself) — event.target would already be detached and look like an outside click.
    if (wrapper && !event.composedPath().includes(wrapper)) {
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
    this.form.controls.positions.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      this.selectedPositions = new Set(values)
    })
    this.form.controls.userIds.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      this.selectedUserIds = new Set(values)
    })
    this.resetForm()
    this.loadOrganisations()
    // Programs belong to an organisation, so they load when one is picked. Courses are searched on the server
    // as the admin types; competencies are one short list loaded now.
    if (this.itemsNeedOrg) {
      this.watchOrgForPrograms()
    } else if (this.searchesOnServer) {
      this.watchCourseSearch()
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
    if (!id) {
      return undefined
    }
    return this.items.find(i => i.identifier === id) || (this.pickedItem?.identifier === id ? this.pickedItem : undefined)
  }

  /** Courses are too many to load at once, so the Course list is searched on the server. */
  get searchesOnServer(): boolean {
    return this.kind === 'course'
  }

  /** Text in the closed Course / Competency / Program field when nothing is selected. */
  get itemPlaceholderText(): string {
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
    // Long lists are cut off with an ellipsis by the field's CSS; the full list is in the tooltip.
    return selected.map(id => this.userNameById.get(id) || id).join(', ')
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
      if (this.searchesOnServer) {
        // The server filters courses; the results replace the list when they arrive.
        this.courseSearch$.next(term)
        return
      }
      this.filteredItems = this.items
        .filter(i => i.name.toLowerCase().includes(query) || i.identifier.toLowerCase().includes(query))
    } else if (key === 'position') {
      this.positionSearch = term
      this.filteredPositions = this.positions.filter(p => p.toLowerCase().includes(query))
      this.visiblePositions = this.filteredPositions.slice(0, this.renderLimit)
    } else {
      this.userSearch = term
      this.filteredUsers = this.users.filter(u => [u.name, u.contact, u.id].some(v => v.toLowerCase().includes(query)))
      this.visibleUsers = this.filteredUsers.slice(0, this.renderLimit)
    }
  }

  selectOrg(id: string): void {
    this.form.controls.orgId.setValue(id)
    this.form.controls.orgId.markAsTouched()
    this.closeDropdown()
  }

  selectItem(id: string): void {
    this.pickedItem = this.items.find(i => i.identifier === id)
    this.form.controls.itemId.setValue(id)
    this.form.controls.itemId.markAsTouched()
    this.closeDropdown()
  }

  isPositionSelected(position: string): boolean {
    return this.selectedPositions.has(position)
  }

  /** Ticks or unticks a position; the panel stays open so several can be picked. */
  togglePosition(position: string): void {
    const selected = this.form.controls.positions.value
    this.form.controls.positions.setValue(
      this.selectedPositions.has(position) ? selected.filter(p => p !== position) : [...selected, position],
    )
  }

  clearPositions(): void {
    this.form.controls.positions.setValue([])
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId)
  }

  /** Ticks or unticks a user; the panel stays open so several can be picked. */
  toggleUser(userId: string): void {
    const selected = this.form.controls.userIds.value
    this.form.controls.userIds.setValue(
      this.selectedUserIds.has(userId) ? selected.filter(id => id !== userId) : [...selected, userId],
    )
    this.form.controls.userIds.markAsTouched()
  }

  trackByUser(_index: number, user: NotificationUser): string {
    return user.id
  }

  trackByValue(_index: number, value: string): string {
    return value
  }

  /** Re-runs a list load that failed. */
  retry(list: 'item' | 'position' | 'user'): void {
    if (list === 'position') {
      this.retryPositions$.next()
    } else if (list === 'user') {
      this.retryUsers$.next()
    } else if (this.searchesOnServer || this.itemsNeedOrg) {
      this.retryItems$.next()
    } else {
      this.loadItems()
    }
  }

  /** Ticks every user matching the search (not only the rows drawn), keeping earlier picks. */
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
    this.reloadOnOrgChange({
      clear: () => {
        this.form.controls.itemId.setValue('')
        this.items = []
        this.filteredItems = []
        this.itemSearch = ''
      },
      load: orgId => this.notificationApi.getPrograms(orgId),
      apply: items => {
        this.items = items
        this.onSearch('item', this.itemSearch)
      },
      setLoading: loading => { this.loadingItems = loading },
      setError: error => { this.itemsError = error },
      retry$: this.retryItems$,
    })
  }

  /**
   * Course list: searched on the server as the admin types (debounced), so every live course is reachable,
   * not just the first CONTENT_LIST_LIMIT. A newer search cancels an older one.
   */
  private watchCourseSearch(): void {
    merge(
      this.courseSearch$.pipe(
        debounceTime(NOTIFICATION_LIMITS.SEARCH_DEBOUNCE_MS),
        map(term => term.trim()),
        distinctUntilChanged(),
      ),
      this.retryItems$.pipe(map(() => this.itemSearch.trim())),
    ).pipe(
      tap(() => {
        this.loadingItems = true
        this.itemsError = false
      }),
      switchMap(term => this.notificationApi.getCourses(term).pipe(
        catchError(() => of<PartialList<NotificationItem> | null>(null)),
      )),
      takeUntil(this.destroy$),
    ).subscribe(list => {
      this.loadingItems = false
      this.itemsError = !list
      this.items = list?.items || []
      this.filteredItems = this.items
      this.itemsTotal = list?.total || 0
      this.itemsTruncated = !!list?.truncated
    })
    this.courseSearch$.next('')
  }

  private loadItems(): void {
    const sources: Record<Exclude<NotificationKind, 'program'>, () => Observable<NotificationItem[]>> = {
      course: () => this.notificationApi.getCourses().pipe(map(list => list.items)),
      competency: () => this.notificationApi.getCompetencies(),
      // A certificate is for a competency, so the Certificate page lists competencies.
      certificate: () => this.notificationApi.getCompetencies(),
    }
    const items$ = sources[this.kind as Exclude<NotificationKind, 'program'>]()
    this.loadingItems = true
    this.itemsError = false
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
        this.itemsError = true
      },
    })
  }

  /** Reloads the Position list each time the organisation changes. */
  private watchOrgForPositions(): void {
    this.reloadOnOrgChange({
      clear: () => {
        this.form.controls.positions.setValue([])
        this.positions = []
        this.filteredPositions = []
        this.visiblePositions = []
        this.positionSearch = ''
        this.positionsTruncated = false
      },
      load: orgId => this.notificationApi.getPositions(orgId),
      apply: list => {
        this.positions = list.items
        this.orgUsersTotal = list.total
        this.positionsTruncated = list.truncated
        this.onSearch('position', this.positionSearch)
      },
      setLoading: loading => { this.loadingPositions = loading },
      setError: error => { this.positionsError = error },
      retry$: this.retryPositions$,
    })
  }

  /** Certificate only: reloads the Users list each time the organisation changes. */
  private watchOrgForUsers(): void {
    this.reloadOnOrgChange({
      clear: () => {
        this.form.controls.userIds.setValue([])
        this.users = []
        this.filteredUsers = []
        this.visibleUsers = []
        this.userNameById = new Map()
        this.userSearch = ''
        this.usersTruncated = false
      },
      load: orgId => this.notificationApi.getOrgUsers(orgId),
      apply: list => {
        this.users = list.items
        this.userNameById = new Map(list.items.map(user => [user.id, user.name]))
        this.orgUsersTotal = list.total
        this.usersTruncated = list.truncated
        this.onSearch('user', this.userSearch)
      },
      setLoading: loading => { this.loadingUsers = loading },
      setError: error => { this.usersError = error },
      retry$: this.retryUsers$,
    })
  }

  /**
   * Shared wiring for lists that depend on the organisation: clear on every change, then load for the new one;
   * `retry$` reloads for the current organisation. switchMap means a newer selection cancels the older load.
   * A failed load sets the error flag, so the page offers "Try again" rather than claiming the list is empty.
   */
  private reloadOnOrgChange<T>(opts: {
    clear: () => void
    load: (orgId: string) => Observable<T>
    apply: (result: T) => void
    setLoading: (loading: boolean) => void
    setError: (error: boolean) => void
    retry$: Observable<void>
  }): void {
    merge(
      this.form.controls.orgId.valueChanges.pipe(distinctUntilChanged(), tap(() => opts.clear())),
      opts.retry$.pipe(map(() => this.form.controls.orgId.value)),
    ).pipe(
      tap(() => opts.setError(false)),
      switchMap(orgId => {
        if (!orgId) {
          opts.setLoading(false)
          return EMPTY
        }
        opts.setLoading(true)
        return opts.load(orgId).pipe(
          catchError(() => {
            opts.setLoading(false)
            opts.setError(true)
            return EMPTY
          }),
        )
      }),
      takeUntil(this.destroy$),
    ).subscribe(result => {
      opts.apply(result)
      opts.setLoading(false)
    })
  }
}
