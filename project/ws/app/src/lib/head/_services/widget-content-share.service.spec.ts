import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { WidgetContentShareService } from './widget-content-share.service'

const mockConfigurationsService = {
  sitePath: '',
  userProfile: null,
}

describe('WidgetContentShareService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ConfigurationsService, useValue: mockConfigurationsService },
    ],
  }))

  it('should be created', () => {
    const service: WidgetContentShareService = TestBed.inject(WidgetContentShareService)
    expect(service).toBeTruthy()
  })
})
