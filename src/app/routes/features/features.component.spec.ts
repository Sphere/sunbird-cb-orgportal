import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { FeaturesComponent } from './features.component'

describe('FeaturesComponent', () => {
  let component: FeaturesComponent
  let fixture: ComponentFixture<FeaturesComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeaturesComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        { provide: 'environment', useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
