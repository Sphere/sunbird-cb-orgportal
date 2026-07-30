import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { FaqHomeComponent } from './faq-home.component'

describe('FaqHomeComponent', () => {
  let component: FaqHomeComponent
  let fixture: ComponentFixture<FaqHomeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FaqHomeComponent],
    imports: [HttpClientTestingModule],
    providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            queryParamMap: of({ get: () => null }),
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
    fixture = TestBed.createComponent(FaqHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
