import { TestBed } from '@angular/core/testing';

import { FracApiService } from './frac-api.service';

describe('FracApiService', () => {
  let service: FracApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FracApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
