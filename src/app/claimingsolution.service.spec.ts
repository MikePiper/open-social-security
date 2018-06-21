import { TestBed, inject } from '@angular/core/testing'
import { ClaimingSolutionService } from './claimingsolution.service'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './solutionset'
import {claimingSolution} from './claimingsolution'


describe('ClaimingsolutionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClaimingSolutionService, BenefitService, SolutionSet]
    })
  })

  it('should be created', inject([ClaimingSolutionService], (service: ClaimingSolutionService) => {
    expect(service).toBeTruthy()
  }))

//Test generateSingleSolutionSet
  it('should output a solutionSet object', inject([ClaimingSolutionService], (service: ClaimingSolutionService) => { 
    let maritalStatus: string = "single"
    let SSbirthDate:Date = new Date(1960, 3, 1) //April 1, 1960
    let FRA:Date = new Date(2027, 3, 1) //FRA April 1, 2027
    let PIA:number = 2000
    let savedPV:number = 180000 //Just completely making this PV up
    let savedClaimingDate:Date = new Date(2029, 5, 1) //2 years and 2 months after FRA, for no particular reason
    expect(service.generateSingleSolutionSet(maritalStatus, SSbirthDate, FRA, PIA, savedPV, savedClaimingDate))
      .toEqual(jasmine.any(SolutionSet))
  }))
  
  //Test that the solution set actually includes a specific value in some way?

  //test generateCoupleSolutionSet

  //test generateCoupleOneHasFiledSolutionSet

})
