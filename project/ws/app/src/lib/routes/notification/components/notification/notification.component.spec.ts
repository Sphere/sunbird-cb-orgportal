import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { BtnPlaylistService } from '@sunbird-cb/collection'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { NotificationComponent } from './notification.component'

describe('NotificationComponent', () => {
  let component: NotificationComponent
  let fixture: ComponentFixture<NotificationComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NotificationComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: BtnPlaylistService,
          useValue: {
            ...createSpyObj('BtnPlaylistService', ['deletePlaylistContent', 'addPlaylistContent']),
            getAllPlaylists: () => of([]),
            getPlaylists: () => of([]),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationComponent)
    component = fixture.componentInstance
    // Template references `sharedGoals`, but it's commented out on the
    // component class; the property still needs a value at runtime since
    // Angular property lookups aren't checked against the TS declaration.
    const componentAny: any = component
    componentAny.sharedGoals = []
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
