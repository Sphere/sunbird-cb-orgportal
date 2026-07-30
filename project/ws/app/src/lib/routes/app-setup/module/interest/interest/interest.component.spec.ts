import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { BtnPlaylistService } from '@sunbird-cb/collection'
import { HorizontalScrollerModule } from '@sunbird-cb/utils'
import { InterestComponent } from './interest.component'

describe('InterestComponent', () => {
  let component: InterestComponent
  let fixture: ComponentFixture<InterestComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InterestComponent],
    imports: [HttpClientTestingModule, HorizontalScrollerModule],
    providers: [
        { provide: MatSnackBar, useValue: createSpyObj('MatSnackBar', ['open']) },
        {
          provide: BtnPlaylistService,
          useValue: {
            ...createSpyObj('BtnPlaylistService', ['deletePlaylistContent', 'addPlaylistContent']),
            getAllPlaylists: () => of([]),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: { topic: [] } }, eventdata: { data: {} } }),
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
    fixture = TestBed.createComponent(InterestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
