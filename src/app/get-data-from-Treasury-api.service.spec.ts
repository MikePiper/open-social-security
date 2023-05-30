import { TestBed } from '@angular/core/testing';

import { GetDataFromTreasuryAPIService } from './get-data-from-Treasury-api.service';

describe('GetDataFromAPIService', () => {
  let service: GetDataFromTreasuryAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetDataFromTreasuryAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
