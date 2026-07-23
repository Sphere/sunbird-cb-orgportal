import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of } from 'rxjs'
import { BtnPlaylistService } from '@sunbird-cb/collection'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { NotificationComponent } from './notification.component'

describe('NotificationComponent', () => {
  let component: NotificationComponent
  let fixture: ComponentFixture<NotificationComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NotificationComponent],
      providers: [
        {
          provide: BtnPlaylistService,
          useValue: {
            getPlaylists: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: { pageNavBar: {} },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
