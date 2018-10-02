import {TestBed, inject} from '@angular/core/testing'

import {EarningsTestService} from './earningstest.service'
import {BenefitService} from './benefit.service'
import {Person} from './data model classes/person'
import {CalculationYear} from './data model classes/calculationyear'
import {BirthdayService} from './birthday.service'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"

describe('EarningstestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EarningsTestService, BenefitService]
    });
  });

  it('should be created', inject([EarningsTestService], (service: EarningsTestService) => {
    expect(service).toBeTruthy();
  }));


  //Test calculateWithholding function (remember that Grace Year rule is implemented elsewhere. Not worried about it here.)
  it('should calculate withholding as zero when quit work date is in a prior year (FRA is in future)', inject([EarningsTestService], (service: EarningsTestService) => {
    let person:Person = new Person("A") 
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2019, 0, 1) //January 1, 2019
    person.quitWorkDate = new MonthYearDate (2018, 7, 1) //August 1, 2018
    person.FRA = new MonthYearDate (2020, 4, 1) //May 1, 2020
    person.monthlyEarnings = 10000
    expect(service.calculateWithholding(currentCalculationDate, person))
        .toEqual(0)
  }))

  it('should calculate withholding as zero when FRA is in a prior year (quiteWorkDate is in future)', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A") 
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2019, 0, 1) //January 1, 2019
    person.quitWorkDate = new MonthYearDate (2020, 7, 1) //August 1, 2020
    person.FRA = new MonthYearDate (2018, 4, 1) //May 1, 2018
    person.monthlyEarnings = 10000
    expect(service.calculateWithholding(currentCalculationDate, person))
        .toEqual(0)
  }))

  it('should calculate withholding properly when quitWorkDate is this year, FRA is in future year', inject([EarningsTestService], (service: EarningsTestService) => {
    let person:Person = new Person("A") 
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2019, 0, 1) //January 1, 2019
    person.quitWorkDate = new MonthYearDate (2019, 7, 1) //August 1, 2019
    person.FRA = new MonthYearDate (2020, 4, 1) //May 1, 2020
    person.monthlyEarnings = 10000
    expect(service.calculateWithholding(currentCalculationDate, person))
        .toEqual(26480) //7 months x $10,000 per month = 70k earnings. Minus 17,040 = 52,960. Divided by 2 is 26,480
  }))

  it('should calculate withholding properly when quitWorkDate is this year, FRA is later this year', inject([EarningsTestService], (service: EarningsTestService) => {
    let person:Person = new Person("A") 
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2019, 0, 1) //January 1, 2019
    person.quitWorkDate = new MonthYearDate (2019, 7, 1) //August 1, 2019
    person.FRA = new MonthYearDate (2019, 10, 1) //Nov 1, 2019
    person.monthlyEarnings = 10000
    expect(service.calculateWithholding(currentCalculationDate, person))
        .toBeCloseTo(8213.33, 1) //7 months x $10,000 per month = 70k earnings. Minus 45,360 = 24,640. Divided by 3 is 8213.33
  }))

  it('should calculate withholding properly when FRA is this year (only count earnings up to FRA) and quitWorkDate is in future', inject([EarningsTestService], (service: EarningsTestService) => {
    let person:Person = new Person("A") 
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2019, 0, 1) //January 1, 2019
    person.quitWorkDate = new MonthYearDate (2020, 7, 1) //August 1, 2020
    person.FRA = new MonthYearDate (2019, 9, 1) //Oct 1, 2019
    person.monthlyEarnings = 10000
    expect(service.calculateWithholding(currentCalculationDate, person))
        .toEqual(14880) //9 months x $10,000 per month = 90k earnings. Minus 45,360 = 44,640. Divided by 3 is 14,880
  }))

  //Test isGraceYear() for single person
  it('should return false for graceYear in year before quitWorkDate', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A") 
    person.hasHadGraceYear = false
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2024, 0, 1)
    person.retirementBenefitDate = new MonthYearDate (2022, 4, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(false)
  }))

  it('should return false for graceYear in year before retirementBenefitDate', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = false
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate(2026, 0, 1)
    person.retirementBenefitDate = new MonthYearDate(2027, 3, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(false)
  }))

  it('should return false for graceYear if hasHadGraceYear is true, even if it would otherwise be grace year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = true
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate(2026, 0, 1)
    person.retirementBenefitDate = new MonthYearDate(2025, 8, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(false)
  }))

  it('should return true for graceYear in a grace year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = false
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate(2025, 0, 1)
    person.retirementBenefitDate = new MonthYearDate(2025, 8, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(true)
  }))
  
  //Test isGraceYear() for use in a calculateCouplePV scenario
  it('should return false for graceYear in year before quitWorkDate', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = false
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2024, 0, 1)
    person.retirementBenefitDate = new MonthYearDate (2022, 4, 1)
    person.spousalBenefitDate = new MonthYearDate (2022, 4, 1)
    person.survivorFRA = new MonthYearDate (2022, 4, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(false)
  }))

  it('should return false for graceYear in year before any of benefitDates', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = false
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2025, 0, 1)
    person.retirementBenefitDate = new MonthYearDate (2026, 4, 1)
    person.spousalBenefitDate = new MonthYearDate (2026, 4, 1)
    person.survivorFRA = new MonthYearDate (2026, 4, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(false)
  }))

  it('should return false for graceYear if hasHadGraceYear is true, even if it would otherwise be grace year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = true
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2025, 0, 1)
    person.retirementBenefitDate = new MonthYearDate (2024, 4, 1)
    person.spousalBenefitDate = new MonthYearDate (2024, 4, 1)
    person.survivorFRA = new MonthYearDate (2026, 4, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(false)
  }))

  it('should return true for graceYear in a grace year, triggered by retirement benefit starting', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = false
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2025, 0, 1)
    person.retirementBenefitDate = new MonthYearDate (2024, 4, 1)
    person.spousalBenefitDate = new MonthYearDate (2028, 4, 1)
    person.survivorFRA = new MonthYearDate (2028, 4, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(true)
  }))

  it('should return true for graceYear in a grace year, triggered by spousal benefit starting', inject([EarningsTestService], (service: EarningsTestService) => { 
    let person:Person = new Person("A")
    person.hasHadGraceYear = false
    person.quitWorkDate = new MonthYearDate(2025, 4, 1)
    let currentCalculationDate:MonthYearDate = new MonthYearDate (2025, 0, 1)
    person.retirementBenefitDate = new MonthYearDate (2026, 4, 1)
    person.spousalBenefitDate = new MonthYearDate (2024, 4, 1)
    person.survivorFRA = new MonthYearDate (2028, 4, 1)
    expect(service.isGraceYear(person, currentCalculationDate))
        .toEqual(true)
  }))



  //tests for earningsTestCouple()
  it('should appropriately reflect personB spousal benefit being partially withheld based on personA excess earnings', inject([EarningsTestService], (service: EarningsTestService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let benefitService:BenefitService = new BenefitService()
    let personA: Person = new Person("A")
    personA.actualBirthDate = new Date(1956, 6, 10) //born July 10, 1956
    personA.SSbirthDate = birthdayService.findSSbirthdate(7, 10, 1956)
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personA.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
    personA.monthlyEarnings = 1900
    personA.PIA = 1800
    personA.retirementBenefitDate = new MonthYearDate(2019, 9, 1) //Applying for retirement benefit October 2019 (36 months prior to FRA -> monthly benefit is 80% of PIA)
    personA.spousalBenefitDate = new MonthYearDate(2019, 9, 1) //later of two retirementBenefitDates
    personA.adjustedRetirementBenefitDate = new MonthYearDate(personA.retirementBenefitDate) //set initial value for adjusted retirementBenefitDate
    personA.adjustedSpousalBenefitDate = new MonthYearDate(personA.spousalBenefitDate) //set initial value
    let personB: Person = new Person("B")
    personB.actualBirthDate = new Date(1956, 6, 10) //born July 10, 1956
    personB.SSbirthDate = birthdayService.findSSbirthdate(7, 10, 1956)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
    personB.survivorFRA = birthdayService.findFRA(personB.SSbirthDate)
    personB.quitWorkDate = new MonthYearDate (2016, 0, 1) //Already quit working
    personB.monthlyEarnings = 0
    personB.PIA = 500
    personB.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 75% of PIA)
    personB.spousalBenefitDate = new MonthYearDate(2019, 9, 1) //later of two retirement benefit dates
    personB.adjustedRetirementBenefitDate = new MonthYearDate(personB.retirementBenefitDate) //set initial value for adjusted retirementBenefitDate
    personB.adjustedSpousalBenefitDate = new MonthYearDate(personB.spousalBenefitDate) //set initial value
    personB.hasHadGraceYear = true //2018 would have been grace year, and we're looking at 2019
    //calculate benefit amounts
    personA.initialRetirementBenefit = benefitService.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
    personA.spousalBenefitWithRetirementPreARF = benefitService.calculateSpousalBenefit(personA, personB, personA.initialRetirementBenefit, personA.spousalBenefitDate)
    personA.spousalBenefitWithoutRetirement = benefitService.calculateSpousalBenefit(personA, personB, 0, personA.spousalBenefitDate)
    personB.initialRetirementBenefit = benefitService.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
    personB.spousalBenefitWithRetirementPreARF = benefitService.calculateSpousalBenefit(personB, personA, personB.initialRetirementBenefit, personB.spousalBenefitDate)
    personB.spousalBenefitWithoutRetirement = benefitService.calculateSpousalBenefit(personB, personA, 0, personB.spousalBenefitDate)
    let beginningCalcDate = new MonthYearDate(2019, 0, 1) //Jan 1, 2019
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    //calculate months of various benefits before application of earnings test
    let countCoupleBenefitMonthsResult:any[] = benefitService.CountCoupleBenefitMonths(scenario, calcYear, personA, personB)
    calcYear = countCoupleBenefitMonthsResult[0]
    personA = countCoupleBenefitMonthsResult[1]
    personB = countCoupleBenefitMonthsResult[2]
    let earningsTestResults = service.earningsTestCouple(calcYear, scenario, personA, personB)
    /*calc by hand...
    personA's retirement benefit is $1440 (80% of PIA)
    personA's spousal benefit is $0
    personB's retirement benefit is $375 (75% of PIA)
    personB's spousal benefit (36 months early) = 0.75 x (1800/2 - 500) = $300
    PersonA has 22800 annual earnings -> (22800 - 17040)/2 = 2880 annual withholding
    monthly amount available for withholding = 1440 + 300 = 1740
    2 months of retirement withheld from A and 2 months of spousal withheld from B, and some overwithholding
    personB should actually *get* one month of spousal benefit (and it will be with retirement benefit, because they filed for retirement in previous year)
    */
    expect(earningsTestResults[0].monthsOfPersonBspousalWithRetirementPreARF)
      .toEqual(1)
  }))


});
