import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { WidgetUserService } from './widget-user.service'

describe('WidgetUserService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
  }))

  it('should be created', () => {
    const service: WidgetUserService = TestBed.inject(WidgetUserService)
    expect(service).toBeTruthy()
  })
})
