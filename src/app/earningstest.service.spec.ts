import { TestBed, inject } from '@angular/core/testing';

import { EarningsTestService } from './earningstest.service';

describe('EarningstestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EarningsTestService]
    });
  });

  it('should be created', inject([EarningsTestService], (service: EarningsTestService) => {
    expect(service).toBeTruthy();
  }));
});
