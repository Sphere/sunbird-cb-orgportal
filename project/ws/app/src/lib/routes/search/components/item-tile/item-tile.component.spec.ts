import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { PipeLimitToPipe } from '@sunbird-cb/utils'
import { ItemTileComponent } from './item-tile.component'

describe('ItemTileComponent', () => {
  let component: ItemTileComponent
  let fixture: ComponentFixture<ItemTileComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ItemTileComponent, PipeLimitToPipe],
    imports: [HttpClientTestingModule],
    providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemTileComponent)
    component = fixture.componentInstance
    component.data = { color: '', itemType: '' }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
