import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { TncAppResolverService } from '../../services/tnc-app-resolver.service'
import { TncPublicResolverService } from '../../services/tnc-public-resolver.service'

import { TncComponent } from './tnc.component'

describe('TncComponent', () => {
  let component: TncComponent
  let fixture: ComponentFixture<TncComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TncComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        TncAppResolverService,
        TncPublicResolverService,
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        {
          provide: ActivatedRoute,
          useValue: { data: of({ tnc: { data: null }, isPublic: false }) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
