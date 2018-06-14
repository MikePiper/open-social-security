import { TestBed, inject } from '@angular/core/testing';

import { MortalityService } from './mortality.service';

describe('MortalityService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MortalityService]
    });
  });

  it('should be created', inject([MortalityService], (service: MortalityService) => {
    expect(service).toBeTruthy();
  }));
});
