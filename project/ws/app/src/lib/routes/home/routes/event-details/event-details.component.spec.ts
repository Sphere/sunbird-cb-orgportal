import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { EventDetailsComponent } from './event-details.component'

describe('EventDetailsComponent', () => {
  let component: EventDetailsComponent
  let fixture: ComponentFixture<EventDetailsComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventDetailsComponent],
    imports: [HttpClientTestingModule],
    providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            url: of([]),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
