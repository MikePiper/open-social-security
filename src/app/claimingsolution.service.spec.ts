import { TestBed, inject } from '@angular/core/testing';

import { ClaimingSolutionService } from './claimingsolution.service';

describe('ClaimingsolutionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClaimingSolutionService]
    });
  });

  it('should be created', inject([ClaimingSolutionService], (service: ClaimingSolutionService) => {
    expect(service).toBeTruthy();
  }));
});
