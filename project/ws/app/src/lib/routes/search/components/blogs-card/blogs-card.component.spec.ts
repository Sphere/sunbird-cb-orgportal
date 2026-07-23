import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'

import { BlogsCardComponent } from './blogs-card.component'

describe('BlogsCardComponent', () => {
  let component: BlogsCardComponent
  let fixture: ComponentFixture<BlogsCardComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BlogsCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogsCardComponent)
    component = fixture.componentInstance
    component.result = {
      name: 'Test Blog',
      id: 'test-id',
      source: 'test-source',
      postKind: 'Blog',
      postCreator: { name: 'Author', emailId: '', postCreatorId: '' },
      dtLastModified: '',
      body: '',
      abstract: '',
      status: 'Draft',
      upVoteCount: 0,
      downVoteCount: 0,
    } as any
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
