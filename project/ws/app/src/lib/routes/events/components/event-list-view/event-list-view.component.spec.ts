import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'

import { EventListViewComponent } from './event-list-view.component'

describe('EventListViewComponent', () => {
  let component: EventListViewComponent
  let fixture: ComponentFixture<EventListViewComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EventListViewComponent],
      providers: [
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: [] } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EventListViewComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
