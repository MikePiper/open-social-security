import { TestBed, inject } from '@angular/core/testing'

import { ClaimingSolutionService } from './claimingsolution.service'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './solutionset'


describe('ClaimingsolutionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClaimingSolutionService, BenefitService, SolutionSet]
    })
  })

  it('should be created', inject([ClaimingSolutionService], (service: ClaimingSolutionService) => {
    expect(service).toBeTruthy()
  }))


})
