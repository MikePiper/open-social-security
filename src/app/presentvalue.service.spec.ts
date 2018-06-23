import { TestBed, inject } from '@angular/core/testing'
import { PresentValueService } from './presentvalue.service'
import {BenefitService} from './benefit.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {MortalityService} from './mortality.service'


describe('PresentValueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService]
    })
  })

  it('should be created', inject([PresentValueService], (service: PresentValueService) => {
    expect(service).toBeTruthy()
  }))

  //Test calculateSinglePersonPV()
  it('should return appropriate PV for single person, no complicating factors', inject([PresentValueService], (service: PresentValueService) => { 
    let SSbirthDate: Date = new Date(1960, 3, 1) //Person born April 1960
    let FRA: Date = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    let initialAge: number = 58 //younger than 62 when fillling out form
    let PIA: number = 1000
    let inputBenefitDate: Date = new Date(2030, 3, 1) //filing at age 70
    let quitWorkDate:Date = new Date (2026, 3, 1) //quitting work prior to filing date, earnings test not relevant
    let monthlyEarnings:number = 4500 //Doesn't matter really, given date inputs
    let discountRate: number = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    let mortalityTable:number[] = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, inputBenefitDate, quitWorkDate, monthlyEarnings, mortalityTable, discountRate))
      .toBeCloseTo(151765, 0)
  }))

  it('should return appropriate PV for single person, but with "still working" inputs and a different mortality table', inject([PresentValueService], (service: PresentValueService) => { 
    let SSbirthDate: Date = new Date(1960, 3, 1) //Person born April 1960
    let FRA: Date = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    let initialAge: number = 58 //younger than 62 when fillling out form
    let PIA: number = 1000
    let inputBenefitDate: Date = new Date(2024, 3, 1) //filing at age 64
    let quitWorkDate:Date = new Date (2026, 3, 1) //quitting work after filing date but before FRA, earnings test IS relevant
    let monthlyEarnings:number = 4500 //Just picking something here...
    let discountRate: number = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    let mortalityTable:number[] = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    expect(service.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, inputBenefitDate, quitWorkDate, monthlyEarnings, mortalityTable, discountRate))
      .toBeCloseTo(201310, 0)
  }))
  
  //Test PV calc for married couple, nothing unusual
  //Check same, including GPO

  //Test PV calc for "one has filed" function, married
  //Test PV calc for "one has filed" function, divorced

  //Ways to test maximize functions??
})