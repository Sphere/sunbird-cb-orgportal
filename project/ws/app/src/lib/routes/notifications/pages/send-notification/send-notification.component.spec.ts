import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Subject, of, throwError } from 'rxjs'
import { createSpyObj } from '../../../../../../../../../src/test-utils/create-spy-obj'
import {
  NOTIFICATION_KIND_CONFIG,
  NOTIFICATION_LIMITS,
  NOTIFICATION_ROUTES,
  NotificationKind,
} from '../../constants/notifications.constants'
import { NotificationApiService, NotificationItem, NotificationOrg, NotificationUser } from '../../services/notification-api.service'
import { SendNotificationComponent } from './send-notification.component'

describe('SendNotificationComponent', () => {
  let component: SendNotificationComponent
  let fixture: ComponentFixture<SendNotificationComponent>
  let api: jest.Mocked<NotificationApiService>
  let router: jest.Mocked<Router>
  let snackBar: jest.Mocked<MatSnackBar>

  const orgs: NotificationOrg[] = [{ id: 'org1', name: 'Alpha Org' }, { id: 'org2', name: 'Beta Org' }]
  const items: NotificationItem[] = [
    { identifier: 'do_1', name: 'Course One', image: 'https://img/1.png' },
    { identifier: 'do_2', name: 'Course Two', image: '' },
  ]
  const users: NotificationUser[] = [
    { id: 'u1', name: 'Amit', contact: 'a***@x.com' },
    { id: 'u2', name: 'Zara', contact: '' },
  ]

  const setup = (kind?: NotificationKind) => {
    api = createSpyObj<NotificationApiService>('NotificationApiService', [
      'getOrganisations', 'getCourses', 'getCompetencies', 'getPrograms', 'getPositions', 'getOrgUsers',
      'sendNotification', 'sendCertificateNotification',
    ])
    api.getOrganisations.mockReturnValue(of(orgs))
    api.getCourses.mockReturnValue(of(items))
    api.getCompetencies.mockReturnValue(of(items))
    api.getPrograms.mockReturnValue(of(items))
    api.getPositions.mockReturnValue(of(['ANM', 'GNM']))
    api.getOrgUsers.mockReturnValue(of(users))
    router = createSpyObj<Router>('Router', ['navigateByUrl'])
    snackBar = createSpyObj<MatSnackBar>('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      declarations: [SendNotificationComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: NotificationApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActivatedRoute, useValue: { snapshot: { data: kind ? { kind } : {} } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    // The template is not under test here; an empty one keeps the spec independent of its markup.
    TestBed.overrideTemplate(SendNotificationComponent, '<div data-dropdown="org"><span id="inside"></span></div>')
    fixture = TestBed.createComponent(SendNotificationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  const fillTopicForm = () => {
    component.selectOrg('org1')
    component.selectItem('do_1')
  }

  describe('course (default kind)', () => {
    beforeEach(() => setup('course'))

    it('should load organisations and courses, and prefill the default message', () => {
      expect(component.kind).toBe('course')
      expect(component.config).toBe(NOTIFICATION_KIND_CONFIG.course)
      expect(component.organisations).toEqual(orgs)
      expect(component.filteredOrganisations).toEqual(orgs)
      expect(component.items).toEqual(items)
      expect(component.form.controls.title.value).toBe(NOTIFICATION_KIND_CONFIG.course.defaultTitle)
      expect(component.form.controls.body.value).toBe(NOTIFICATION_KIND_CONFIG.course.defaultBody)
      expect(component.loadingOrganisations).toBe(false)
      expect(component.loadingItems).toBe(false)
    })

    it('should prefill the image from the selected item and reset imageFailed', () => {
      component.imageFailed = true
      component.selectItem('do_1')
      expect(component.form.controls.imageUrl.value).toBe('https://img/1.png')
      expect(component.imageFailed).toBe(false)
      component.selectItem('do_2')
      expect(component.form.controls.imageUrl.value).toBe('')
    })

    it('should load positions when an organisation is picked and clear them when it changes', () => {
      component.selectOrg('org1')
      expect(api.getPositions).toHaveBeenCalledWith('org1')
      expect(component.positions).toEqual(['ANM', 'GNM'])
      expect(component.loadingPositions).toBe(false)

      component.togglePosition('ANM')
      component.selectOrg('org2')
      expect(component.form.controls.positions.value).toEqual([])
    })

    it('should leave positions empty when loading them fails', () => {
      api.getPositions.mockReturnValue(throwError(() => new Error('x')))
      component.selectOrg('org1')
      expect(component.positions).toEqual([])
      expect(component.loadingPositions).toBe(false)
    })

    it('should not load positions when the organisation is cleared', () => {
      component.selectOrg('org1')
      api.getPositions.mockClear()
      component.selectOrg('')
      expect(api.getPositions).not.toHaveBeenCalled()
      expect(component.loadingPositions).toBe(false)
    })

    it('should expose selected org and item', () => {
      fillTopicForm()
      expect(component.selectedOrg).toEqual(orgs[0])
      expect(component.selectedItem).toEqual(items[0])
    })

    it('should show the item placeholder for course', () => {
      expect(component.itemPlaceholder).toBe('Select Course')
      component.loadingItems = true
      expect(component.itemPlaceholder).toBe('Loading...')
    })

    it('should summarise positions', () => {
      expect(component.positionSummary).toBe('All positions')
      expect(component.positionSelectionText).toBe('None selected — sends to all positions')
      component.loadingPositions = true
      expect(component.positionSummary).toBe('Loading...')
      component.togglePosition('ANM')
      component.togglePosition('GNM')
      expect(component.positionSummary).toBe('ANM, GNM')
      expect(component.positionSelectionText).toBe('2 selected')
      expect(component.isPositionSelected('ANM')).toBe(true)
      component.togglePosition('ANM')
      expect(component.isPositionSelected('ANM')).toBe(false)
      component.clearPositions()
      expect(component.form.controls.positions.value).toEqual([])
    })

    it.each([
      { key: 'org' as const, term: 'beta', field: 'filteredOrganisations' as const, expected: [orgs[1]] },
      { key: 'org' as const, term: 'ORG1', field: 'filteredOrganisations' as const, expected: [orgs[0]] },
      { key: 'item' as const, term: 'two', field: 'filteredItems' as const, expected: [items[1]] },
      { key: 'item' as const, term: 'do_1', field: 'filteredItems' as const, expected: [items[0]] },
    ])('onSearch($key, "$term") should filter $field', ({ key, term, field, expected }) => {
      component.onSearch(key, term)
      expect(component[field]).toEqual(expected)
    })

    it('onSearch should filter positions', () => {
      component.selectOrg('org1')
      component.onSearch('position', 'gn')
      expect(component.filteredPositions).toEqual(['GNM'])
      expect(component.positionSearch).toBe('gn')
    })

    describe('dropdowns', () => {
      it('should not open org-dependent dropdowns before an organisation is picked', () => {
        component.toggleDropdown('position')
        expect(component.openDropdown).toBeNull()
      })

      it('should open, focus the search box after a delay, and close on a second toggle', fakeAsync(() => {
        const input = document.createElement('input')
        input.id = 'notificationOrgSearch'
        document.body.appendChild(input)
        const focusSpy = jest.spyOn(input, 'focus')

        component.toggleDropdown('org')
        expect(component.openDropdown).toBe('org')
        tick(NOTIFICATION_LIMITS.SEARCH_FOCUS_DELAY_MS)
        expect(focusSpy).toHaveBeenCalled()

        component.toggleDropdown('org')
        expect(component.openDropdown).toBeNull()
        input.remove()
      }))

      it('should open the position dropdown once an organisation is picked', fakeAsync(() => {
        component.selectOrg('org1')
        component.toggleDropdown('position')
        expect(component.openDropdown).toBe('position')
        tick(NOTIFICATION_LIMITS.SEARCH_FOCUS_DELAY_MS)
      }))

      type Dropdown = SendNotificationComponent['openDropdown']
      it.each<{ scenario: string, open: Dropdown, inside: boolean, expected: Dropdown }>([
        { scenario: 'close the dropdown on an outside click', open: 'org', inside: false, expected: null },
        { scenario: 'keep the dropdown open on an inside click', open: 'org', inside: true, expected: 'org' },
        { scenario: 'do nothing when no dropdown is open', open: null, inside: false, expected: null },
        { scenario: 'do nothing when the open dropdown has no wrapper', open: 'item', inside: false, expected: 'item' },
      ])('onDocumentClick should $scenario', ({ open, inside, expected }) => {
        component.openDropdown = open
        const target = inside ? fixture.nativeElement.querySelector('#inside') : document.body
        component.onDocumentClick({ target } as unknown as MouseEvent)
        expect(component.openDropdown).toBe(expected)
      })
    })

    it('back should go to the dashboard', () => {
      component.back()
      expect(router.navigateByUrl).toHaveBeenCalledWith(NOTIFICATION_ROUTES.DASHBOARD)
    })

    it('resetMessage should restore defaults and the item image', () => {
      fillTopicForm()
      component.form.patchValue({ title: 'x', body: 'y', imageUrl: '' })
      component.resetMessage()
      expect(component.form.controls.title.value).toBe(NOTIFICATION_KIND_CONFIG.course.defaultTitle)
      expect(component.form.controls.imageUrl.value).toBe('https://img/1.png')
    })

    describe('send', () => {
      it('should do nothing when the form is invalid', () => {
        component.send()
        expect(api.sendNotification).not.toHaveBeenCalled()
        expect(component.canSend).toBe(false)
      })

      it('should send to the organisation, confirm and reset the form', () => {
        api.sendNotification.mockReturnValue(of([{ topic: 'org1', position: null, success: true }]))
        fillTopicForm()
        component.form.patchValue({ title: ' Title ', body: ' Body ', imageUrl: ' https://img/x.png ' })
        expect(component.canSend).toBe(true)

        component.send()

        expect(api.sendNotification).toHaveBeenCalledWith('course', {
          orgId: 'org1', item: items[0], title: 'Title', body: 'Body', positions: [], imageUrl: 'https://img/x.png',
        })
        expect(snackBar.open).toHaveBeenCalledWith('Notification sent', 'Close', expect.any(Object))
        expect(component.form.controls.orgId.value).toBe('')
        expect(component.sending).toBe(false)
      })

      it('should omit an empty image and report a multi-position success', () => {
        api.sendNotification.mockReturnValue(of([
          { topic: 'org1_ANM', position: 'ANM', success: true },
          { topic: 'org1_GNM', position: 'GNM', success: true },
        ]))
        fillTopicForm()
        component.togglePosition('ANM')
        component.togglePosition('GNM')
        component.form.controls.imageUrl.setValue('')

        component.send()

        expect('imageUrl' in api.sendNotification.mock.calls[0][1]).toBe(false)
        expect(snackBar.open).toHaveBeenCalledWith('Notification sent to 2 positions', 'Close', expect.any(Object))
      })

      it('should report a full failure and keep the form', () => {
        api.sendNotification.mockReturnValue(of([{ topic: 'org1', position: null, success: false }]))
        fillTopicForm()
        component.send()
        expect(snackBar.open).toHaveBeenCalledWith('Failed to send notification. Please try again.', 'Close', expect.any(Object))
        expect(component.form.controls.orgId.value).toBe('org1')
      })

      it('should report a partial failure and keep only the failed positions ticked', () => {
        api.sendNotification.mockReturnValue(of([
          { topic: 'org1_ANM', position: 'ANM', success: true },
          { topic: 'org1_GNM', position: 'GNM', success: false },
        ]))
        fillTopicForm()
        component.togglePosition('ANM')
        component.togglePosition('GNM')

        component.send()

        expect(snackBar.open).toHaveBeenCalledWith('Sent to 1 of 2 positions. Failed: GNM', 'Close',
          { duration: NOTIFICATION_LIMITS.SNACKBAR_DURATION_MS * 2 })
        expect(component.form.controls.positions.value).toEqual(['GNM'])
      })

      it('should show an error when the send call fails', () => {
        api.sendNotification.mockReturnValue(throwError(() => new Error('x')))
        fillTopicForm()
        component.send()
        expect(snackBar.open).toHaveBeenCalledWith('Failed to send notification. Please try again.', 'Close', expect.any(Object))
        expect(component.sending).toBe(false)
      })
    })

    it('should stop listening after destroy', () => {
      fixture.destroy()
      api.getPositions.mockClear()
      component.form.controls.orgId.setValue('org2')
      expect(api.getPositions).not.toHaveBeenCalled()
    })
  })

  describe('route kind', () => {
    it('should fall back to course when the route has no kind', () => {
      setup()
      expect(component.kind).toBe('course')
      expect(api.getCourses).toHaveBeenCalled()
    })

    it('should load competencies for the competency kind', () => {
      setup('competency')
      expect(component.config).toBe(NOTIFICATION_KIND_CONFIG.competency)
      expect(api.getCompetencies).toHaveBeenCalled()
    })
  })

  describe('load failures', () => {
    it('should clear organisations and items when their loads fail', () => {
      setup('course')
      api.getOrganisations.mockReturnValue(throwError(() => new Error('x')))
      api.getCourses.mockReturnValue(throwError(() => new Error('x')))
      component.ngOnInit()
      expect(component.organisations).toEqual([])
      expect(component.filteredOrganisations).toEqual([])
      expect(component.items).toEqual([])
      expect(component.filteredItems).toEqual([])
    })
  })

  describe('program kind', () => {
    beforeEach(() => setup('program'))

    it('should wait for an organisation before loading programs', () => {
      expect(api.getPrograms).not.toHaveBeenCalled()
      expect(component.itemsNeedOrg).toBe(true)
      expect(component.itemPlaceholder).toBe('Select an organisation first')
      component.toggleDropdown('item')
      expect(component.openDropdown).toBeNull()
    })

    it('should load programs for the picked organisation and clear the item on change', () => {
      component.selectOrg('org1')
      expect(api.getPrograms).toHaveBeenCalledWith('org1')
      expect(component.items).toEqual(items)
      expect(component.itemPlaceholder).toBe('Select Program')

      component.selectItem('do_1')
      component.selectOrg('org2')
      expect(component.form.controls.itemId.value).toBe('')
    })
  })

  describe('certificate kind', () => {
    beforeEach(() => setup('certificate'))

    it('should require users, load competencies and not load positions', () => {
      expect(component.isCertificate).toBe(true)
      expect(api.getCompetencies).toHaveBeenCalled()
      component.selectOrg('org1')
      expect(api.getPositions).not.toHaveBeenCalled()
      expect(api.getOrgUsers).toHaveBeenCalledWith('org1')
      expect(component.users).toEqual(users)
      component.selectItem('do_1')
      expect(component.form.valid).toBe(false)
    })

    it('should summarise and toggle users', () => {
      expect(component.userSummary).toBe('Select users')
      component.loadingUsers = true
      expect(component.userSummary).toBe('Loading...')
      component.loadingUsers = false

      component.selectOrg('org1')
      component.toggleUser('u1')
      component.form.controls.userIds.setValue([...component.form.controls.userIds.value, 'unknown'])
      expect(component.userSummary).toBe('Amit, unknown')
      expect(component.userSelectionText).toBe('2 of 2 selected')
      expect(component.isUserSelected('u1')).toBe(true)
      component.toggleUser('u1')
      expect(component.isUserSelected('u1')).toBe(false)
      component.clearUsers()
      expect(component.form.controls.userIds.value).toEqual([])
    })

    it('should search users by name, contact or id and select all shown', () => {
      component.selectOrg('org1')
      component.onSearch('user', 'x.com')
      expect(component.filteredUsers).toEqual([users[0]])
      component.toggleUser('u2')
      component.selectShownUsers()
      expect(component.form.controls.userIds.value.sort()).toEqual(['u1', 'u2'])
    })

    const fillCertificate = (userIds: string[]) => {
      component.selectOrg('org1')
      component.selectItem('do_1')
      userIds.forEach(id => component.toggleUser(id))
    }

    it.each([
      { userIds: ['u1'], message: 'Notification sent to 1 user' },
      { userIds: ['u1', 'u2'], message: 'Notification sent to 2 users' },
    ])('should send a certificate notification: $message', ({ userIds, message }) => {
      api.sendCertificateNotification.mockReturnValue(of({}))
      fillCertificate(userIds)

      component.send()

      expect(api.sendCertificateNotification).toHaveBeenCalledWith(expect.objectContaining({
        item: items[0], userIds, imageUrl: 'https://img/1.png',
      }))
      expect(api.sendNotification).not.toHaveBeenCalled()
      expect(snackBar.open).toHaveBeenCalledWith(message, 'Close', expect.any(Object))
      expect(component.form.controls.userIds.value).toEqual([])
    })

    it('should omit an empty image from a certificate notification', () => {
      api.sendCertificateNotification.mockReturnValue(of({}))
      fillCertificate(['u1'])
      component.form.controls.imageUrl.setValue('')
      component.send()
      expect('imageUrl' in api.sendCertificateNotification.mock.calls[0][0]).toBe(false)
    })

    it('should show an error when the certificate send fails', () => {
      api.sendCertificateNotification.mockReturnValue(throwError(() => new Error('x')))
      fillCertificate(['u1'])
      component.send()
      expect(snackBar.open).toHaveBeenCalledWith('Failed to send notification. Please try again.', 'Close', expect.any(Object))
      expect(component.sending).toBe(false)
    })

    it('should cancel an older users load when the organisation changes', () => {
      const slow = new Subject<NotificationUser[]>()
      api.getOrgUsers.mockReturnValueOnce(slow)
      component.selectOrg('org1')
      expect(component.loadingUsers).toBe(true)
      component.selectOrg('org2')
      slow.next([{ id: 'stale', name: 'Stale', contact: '' }])
      expect(component.users).toEqual(users)
    })
  })
})
