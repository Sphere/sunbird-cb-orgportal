import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { TncComponent } from './tnc.component'
import { Globals } from '../../globals'
import { TncAppResolverService } from '../../../../../../../../../src/app/services/tnc-app-resolver.service'
import { TncPublicResolverService } from '../../../../../../../../../src/app/services/tnc-public-resolver.service'

describe('TncComponent', () => {
  let component: TncComponent
  let fixture: ComponentFixture<TncComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [TncComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        Globals,
        TncAppResolverService,
        TncPublicResolverService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ tnc: { data: null } }),
            snapshot: { queryParamMap: { has: () => false, get: () => null } },
          },
        },
      ],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TncComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
