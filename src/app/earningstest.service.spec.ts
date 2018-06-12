import { TestBed, inject } from '@angular/core/testing';

import { EarningstestService } from './earningstest.service';

describe('EarningstestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EarningstestService]
    });
  });

  it('should be created', inject([EarningstestService], (service: EarningstestService) => {
    expect(service).toBeTruthy();
  }));
});
