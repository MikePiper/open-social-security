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

  //Testing calculateRetirementBenefit
    //needs PIA, FRA, benefitDate
    //file at FRA, benefit = PIA
    //file 48 months after PIA, benefit = 132% PIA
    //file 12 months after PIA, benefit = 108% PIA
    //file 36 months prior to FRA, benefit = 80% PIA
    //file 48 months prior to FRA, benefit = 75% PIA
    //file 60 months prior, benefit = 70%

  //Testing calculateSpousalBenefit


  //Testing calculateSurvivorBenefit


  //Testing countBenefitMonths
  it('should determine correct number of months in filing year', inject([BenefitService], (service: BenefitService) => { 
    let benefitFilingDate:Date =  new Date(2018, 7, 1) //August 1, 2018 filing date
    let currentCalculationDate:Date = new Date(2018, 0, 1) //Current calc year is 2018

    expect(service.countBenefitMonths(benefitFilingDate, currentCalculationDate)) //user inputs 3/25/1956
        .toEqual(5)
  }))

  it('should determine correct number of months in year prior to filing year', inject([BenefitService], (service: BenefitService) => { 
    let benefitFilingDate:Date =  new Date(2018, 7, 1) //August 1, 2018 filing date
    let currentCalculationDate:Date = new Date(2017, 0, 1) //Current calc year is 2018

    expect(service.countBenefitMonths(benefitFilingDate, currentCalculationDate)) //user inputs 3/25/1956
        .toEqual(0)
  }))

  it('should determine correct number of months in year after filing year', inject([BenefitService], (service: BenefitService) => { 
    let benefitFilingDate:Date =  new Date(2018, 7, 1) //August 1, 2018 filing date
    let currentCalculationDate:Date = new Date(2019, 0, 1) //Current calc year is 2018

    expect(service.countBenefitMonths(benefitFilingDate, currentCalculationDate)) //user inputs 3/25/1956
        .toEqual(12)
  }))


})