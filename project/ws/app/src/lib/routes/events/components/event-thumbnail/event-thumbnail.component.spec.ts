import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

import { EventThumbnailComponent } from './event-thumbnail.component'

describe('EventThumbnailComponent', () => {
  let component: EventThumbnailComponent
  let fixture: ComponentFixture<EventThumbnailComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EventThumbnailComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn(), afterClosed: () => [] } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EventThumbnailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
