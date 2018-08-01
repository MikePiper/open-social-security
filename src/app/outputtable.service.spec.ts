import { TestBed, inject } from '@angular/core/testing';

import { OutputTableService } from './outputtable.service';

describe('OutputTableService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OutputTableService]
    });
  });

  it('should be created', inject([OutputTableService], (service: OutputTableService) => {
    expect(service).toBeTruthy();
  }));
});
