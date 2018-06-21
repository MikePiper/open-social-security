import { TestBed, inject } from '@angular/core/testing'
import { BenefitService } from './benefit.service'


describe('BenefitService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BenefitService]
    })
  })



  it('should be created', inject([BenefitService], (service: BenefitService) => {
    expect(service).toBeTruthy()
  }))


})