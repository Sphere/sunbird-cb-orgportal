import { TestBed } from '@angular/core/testing'
import { APP_BASE_HREF } from '@angular/common'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { WidgetResolverService } from '@sunbird-cb/resolver'

import { InitService } from './init.service'

describe('InitService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      { provide: APP_BASE_HREF, useValue: '/' },
      { provide: WidgetResolverService, useValue: {} },
    ],
  }))

  it('should be created', () => {
    const service: InitService = TestBed.inject(InitService)
    expect(service).toBeTruthy()
  })
})
