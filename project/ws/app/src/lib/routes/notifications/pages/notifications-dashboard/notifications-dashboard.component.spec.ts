import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { createSpyObj } from '../../../../../../../../../src/test-utils/create-spy-obj'
import { NOTIFICATION_CARDS, NOTIFICATION_ROUTES } from '../../constants/notifications.constants'
import { NotificationsDashboardComponent } from './notifications-dashboard.component'

describe('NotificationsDashboardComponent', () => {
  let component: NotificationsDashboardComponent
  let fixture: ComponentFixture<NotificationsDashboardComponent>
  let router: jest.Mocked<Router>

  beforeEach(async () => {
    router = createSpyObj<Router>('Router', ['navigateByUrl'])
    await TestBed.configureTestingModule({
      declarations: [NotificationsDashboardComponent],
      providers: [{ provide: Router, useValue: router }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(NotificationsDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create with the notification cards', () => {
    expect(component).toBeTruthy()
    expect(component.cards).toBe(NOTIFICATION_CARDS)
  })

  it('should navigate to the card link', () => {
    component.open(NOTIFICATION_CARDS[0])
    expect(router.navigateByUrl).toHaveBeenCalledWith(NOTIFICATION_ROUTES.COURSE)
  })

  it('should not navigate for a card without a link', () => {
    component.open({ title: 'Soon', description: '', icon: 'x', redirectLink: null })
    expect(router.navigateByUrl).not.toHaveBeenCalled()
  })
})
