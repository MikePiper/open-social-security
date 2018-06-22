import { TestBed, inject } from '@angular/core/testing'
import { PresentValueService } from './presentvalue.service'
import {BenefitService} from './benefit.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'

describe('PresentValueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService]
    })
  })



  it('should be created', inject([PresentValueService], (service: PresentValueService) => {
    expect(service).toBeTruthy()
  }))


})