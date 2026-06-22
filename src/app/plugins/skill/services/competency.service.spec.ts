import { TestBed } from '@angular/core/testing'

import { CompetencyService } from './competency.service'

describe('CompetencyService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  xit('should be created', () => {
    const service: CompetencyService = TestBed.inject(CompetencyService)
    expect(service).toBeTruthy()
  })
})
