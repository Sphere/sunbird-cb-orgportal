import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { WidgetContentService } from './widget-content.service'

describe('WidgetContentService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
  }))

  it('should be created', () => {
    const service: WidgetContentService = TestBed.inject(WidgetContentService)
    expect(service).toBeTruthy()
  })
})
