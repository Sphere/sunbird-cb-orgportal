import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ValueService } from '@sunbird-cb/utils'
import { Subject, of } from 'rxjs'

import { ProfileDetailComponent } from './profile-detail.component'
import { EventService } from '../../services/event.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('ProfileDetailComponent', () => {
  let component: ProfileDetailComponent
  let fixture: ComponentFixture<ProfileDetailComponent>
  let dialog: ReturnType<typeof createSpyObj>
  let isLtMedium$: Subject<boolean>
  let parentData$: Subject<any>

  const build = (navigation: any = null, parent: any = { data: of({}) }) => {
    dialog = createSpyObj('MatDialog', ['open'])
    isLtMedium$ = new Subject<boolean>()
    parentData$ = new Subject<any>()

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ProfileDetailComponent],
      providers: [
        EventService,
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: { getCurrentNavigation: () => navigation } },
        { provide: ValueService, useValue: { isLtMedium$: isLtMedium$.asObservable() } },
        {
          provide: ActivatedRoute,
          useValue: { parent: parent === 'reactive' ? { data: parentData$.asObservable() } : parent },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(ProfileDetailComponent)
    component = fixture.componentInstance
    component.data = { SessionImage: '', SessionDescription: { Content3: {}, Content4: {} } }
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create with no sessionID when there is no current navigation', () => {
    build()
    expect(component).toBeTruthy()
    expect(component.sessionID).toBe('')
  })

  it('should read sessionID from the current navigation state', () => {
    build({ extras: { state: { sessionID: 's1' } } })
    expect(component.sessionID).toBe('s1')
  })

  describe('ngOnInit isLtMedium$ handling', () => {
    it('should shrink cards for small screens', () => {
      build()
      isLtMedium$.next(true)
      expect(component.noOfCards).toBe(4)
      expect(component.width).toBe('80vw')
    })

    it('should use the default layout for larger screens', () => {
      build()
      isLtMedium$.next(false)
      expect(component.noOfCards).toBe(5)
      expect(component.width).toBe('35vw')
    })
  })

  it('should skip parent-data subscription entirely when there is no parent route', () => {
    expect(() => build(null, null)).not.toThrow()
  })

  it('should extract links/lines/urls from the session data when a sessionID is present', () => {
    build({ extras: { state: { sessionID: 's1' } } }, 'reactive')
    parentData$.next({
      eventdata: {
        data: {
          SessionCards: {
            Sessions: {
              s1: {
                SessionDescription: {
                  Content4: { Link1: 'http://a', Line1: 'some line', Other: 'skip' },
                  Content3: { Url1: 'http://b' },
                },
              },
            },
          },
        },
      },
    })
    expect(component.links).toEqual(['http://a'])
    expect(component.lines).toEqual(['some line'])
    expect(component.urls).toEqual(['http://b'])
  })

  it('should not process session data when there is no sessionID', () => {
    build(null, 'reactive')
    parentData$.next({ eventdata: { data: {} } })
    expect(component.links).toEqual([])
  })

  it('openDialog should open ViewUsersComponent with attendee data', () => {
    build()
    component.data = { AttendeesList: ['u1'], Attendees: 1 }
    component.openDialog()
    expect(dialog.open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      data: { userArray: ['u1'], noOfUser: 1 },
    }))
  })

  it('ngOnDestroy should unsubscribe the screen subscription when present', () => {
    build()
    const unsubSpy = jest.spyOn(component.screenSubscription as any, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
  })

  it('ngOnDestroy should not throw when there is no subscription', () => {
    build()
    component.screenSubscription = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })
})
