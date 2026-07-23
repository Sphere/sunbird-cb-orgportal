import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute } from '@angular/router'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { of } from 'rxjs'

import { UsersUploadComponent } from './users-upload.component'
import { FileService } from '../../services/upload.service'

describe('UsersUploadComponent', () => {
  let component: UsersUploadComponent
  let fixture: ComponentFixture<UsersUploadComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UsersUploadComponent],
      imports: [ReactiveFormsModule, MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FileService,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({}),
            snapshot: {
              params: {},
              queryParams: {},
              data: {},
              parent: null,
            },
            data: of({}),
          },
        },
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
