import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { SwUpdate } from '@angular/service-worker'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { RootComponent } from './root.component'

describe('RootComponent', () => {
  let component: RootComponent
  let fixture: ComponentFixture<RootComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RootComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        { provide: 'environment', useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(RootComponent, {
        set: {
          providers: [
            { provide: SwUpdate, useValue: createSpyObj('SwUpdate', ['checkForUpdate']) },
          ],
        },
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(RootComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
