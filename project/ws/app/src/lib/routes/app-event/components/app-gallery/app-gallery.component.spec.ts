import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { AppGalleryComponent } from './app-gallery.component'

describe('AppGalleryComponent', () => {
  let component: AppGalleryComponent
  let fixture: ComponentFixture<AppGalleryComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppGalleryComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ eventdata: { data: { Home: {}, Gallery: [] } } }) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppGalleryComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
