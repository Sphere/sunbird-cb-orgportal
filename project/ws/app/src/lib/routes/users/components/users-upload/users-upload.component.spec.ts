import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { FileService } from '../../services/upload.service'

import { UsersUploadComponent } from './users-upload.component'

describe('UsersUploadComponent', () => {
  let component: UsersUploadComponent
  let fixture: ComponentFixture<UsersUploadComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UsersUploadComponent],
      imports: [HttpClientTestingModule],
      providers: [
        FileService,
        { provide: MatSnackBar, useValue: createSpyObj('MatSnackBar', ['open']) },
        { provide: ActivatedRoute, useValue: { snapshot: { parent: null }, data: of({}) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
