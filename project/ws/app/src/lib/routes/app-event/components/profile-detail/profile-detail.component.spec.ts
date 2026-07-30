import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { of } from 'rxjs'

import { ProfileDetailComponent } from './profile-detail.component'
import { EventService } from '../../services/event.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('ProfileDetailComponent', () => {
  let component: ProfileDetailComponent
  let fixture: ComponentFixture<ProfileDetailComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ProfileDetailComponent],
      providers: [
        EventService,
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        {
          provide: Router,
          useValue: { getCurrentNavigation: () => null },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { data: of({}) },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileDetailComponent)
    component = fixture.componentInstance
    component.data = { SessionImage: '', SessionDescription: { Content3: {}, Content4: {} } }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
