import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { ItemTileComponent } from './item-tile.component'

@Pipe({ name: 'pipeLimitTo', standalone: false })
class MockPipeLimitTo implements PipeTransform {
  transform(value: any, limit: number): any {
    if (!value) { return value }
    return Array.isArray(value) ? value.slice(0, limit) : value
  }
}

describe('ItemTileComponent', () => {
  let component: ItemTileComponent
  let fixture: ComponentFixture<ItemTileComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ItemTileComponent, MockPipeLimitTo],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            parent: null,
          },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() },
        },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemTileComponent)
    component = fixture.componentInstance
    component.data = { itemType: '', title: '', description: '', category: '', itemId: '', source: '' }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
