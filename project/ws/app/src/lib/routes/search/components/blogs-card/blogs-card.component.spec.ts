import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'

import { BlogsCardComponent } from './blogs-card.component'

describe('BlogsCardComponent', () => {
  let component: BlogsCardComponent
  let fixture: ComponentFixture<BlogsCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BlogsCardComponent],
      imports: [RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogsCardComponent)
    component = fixture.componentInstance
    component.result = { postCreator: { name: 'Test User' } } as any
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
