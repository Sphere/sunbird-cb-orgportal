import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { AppEventComponent } from './app-event.component'
import { EventService } from '../../services/event.service'

describe('AppEventComponent', () => {
  let component: AppEventComponent
  let fixture: ComponentFixture<AppEventComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppEventComponent],
    imports: [HttpClientTestingModule],
    providers: [
        EventService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppEventComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
