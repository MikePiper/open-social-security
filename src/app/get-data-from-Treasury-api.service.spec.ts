import { TestBed } from '@angular/core/testing';

import { GetDataFromTreasuryAPIService } from './get-data-from-Treasury-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing'

describe('GetDataFromTreasuryAPIService', () => {
  let service: GetDataFromTreasuryAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(GetDataFromTreasuryAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
