import { TestBed, inject } from '@angular/core/testing'
import { PresentValueService } from './presentvalue.service'
import {BenefitService} from './benefit.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {MortalityService} from './mortality.service'
import { BirthdayService } from './birthday.service';


describe('PresentValueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
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
  
  //Test calculateCouplePV
  it('should return appropriate PV for married couple, basic inputs', inject([PresentValueService], (service: PresentValueService) => { 
    let maritalStatus:string = "married"
    let mortalityService:MortalityService = new MortalityService()
    let spouseAmortalityTable:number[] = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    let spouseBmortalityTable:number[] = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    let spouseASSbirthDate: Date = new Date(1964, 8, 1) //Spouse A born in Sept 1959 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    let spouseBSSbirthDate: Date = new Date(1963, 6, 1) //Spouse A born in July 1958
    let spouseAinitialAgeRounded:number = 61
    let spouseBinitialAgeRounded:number = 61
    let birthdayService:BirthdayService = new BirthdayService()
    let spouseAFRA: Date = birthdayService.findFRA(spouseASSbirthDate)
    let spouseBFRA: Date = birthdayService.findFRA(spouseBSSbirthDate)
    let spouseAsurvivorFRA:Date = birthdayService.findSurvivorFRA(spouseASSbirthDate)
    let spouseBsurvivorFRA:Date = birthdayService.findSurvivorFRA(spouseBSSbirthDate)
    let spouseAPIA: number = 700
    let spouseBPIA: number = 1900
    let spouseAretirementBenefitDate: Date = new Date (2032, 8, 1) //At age 68
    let spouseBretirementBenefitDate: Date = new Date (2029, 8, 1) //At age 66 and 2 months
    let spouseAspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseBspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseAquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseBquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseAmonthlyEarnings: number = 0
    let spouseBmonthlyEarnings: number = 0
    let spouseAgovernmentPension: number = 0
    let spouseBgovernmentPension:number = 0
    let discountRate:number = 1
    expect(service.calculateCouplePV(maritalStatus, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, spouseAinitialAgeRounded, spouseBinitialAgeRounded,
    spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, spouseAPIA, spouseBPIA, spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, spouseAgovernmentPension, spouseBgovernmentPension, discountRate))
      .toBeCloseTo(578594, 0)
  }))

  /*
  it ('should return appropriate PV for married couple, including GPO', inject([PresentValueService], (service: PresentValueService) => {
    //params
    expect(service.calculateCouplePV(maritalStatus, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, spouseAinitialAgeRounded, spouseBinitialAgeRounded,
    spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, spouseAPIA, spouseBPIA, spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, spouseAgovernmentPension, spouseBgovernmentPension, discountRate))
      .toBeCloseTo(99999, 0)
  }))

  it ('should return appropriate PV for married couple, one has already filed', inject([PresentValueService], (service: PresentValueService) => {
    //params
    expect(service.calculateCouplePV(maritalStatus, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, spouseAinitialAgeRounded, spouseBinitialAgeRounded,
    spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, spouseAPIA, spouseBPIA, spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, spouseAgovernmentPension, spouseBgovernmentPension, discountRate))
      .toBeCloseTo(99999, 0)
  }))

  it ('should return appropriate PV for married couple, one has already filed (same as above, except A and B are swapped)', inject([PresentValueService], (service: PresentValueService) => {
    //params
    expect(service.calculateCouplePV(maritalStatus, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, spouseAinitialAgeRounded, spouseBinitialAgeRounded,
    spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, spouseAPIA, spouseBPIA, spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, spouseAgovernmentPension, spouseBgovernmentPension, discountRate))
      .toBeCloseTo(99999, 0)
  }))

  it ('should return appropriate PV for divorcee scenario', inject([PresentValueService], (service: PresentValueService) => {
    //params
    expect(service.calculateCouplePV(maritalStatus, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, spouseAinitialAgeRounded, spouseBinitialAgeRounded,
    spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, spouseAPIA, spouseBPIA, spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, spouseAgovernmentPension, spouseBgovernmentPension, discountRate))
      .toBeCloseTo(99999, 0)
  }))
  */

  //Test maximize functions
})