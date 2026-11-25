import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { NotificationsModule } from './notifications.module'
import { NotificationsRoutingModule } from './notifications-routing.module'

describe('NotificationsModule', () => {
  it('should create the module and its routing module', () => {
    TestBed.configureTestingModule({
      imports: [NotificationsModule],
      providers: [provideRouter([])],
    })
    expect(TestBed.inject(NotificationsModule)).toBeTruthy()
    expect(TestBed.inject(NotificationsRoutingModule)).toBeTruthy()
  })
})
