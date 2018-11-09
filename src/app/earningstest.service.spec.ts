import {TestBed, inject} from '@angular/core/testing'

import {EarningsTestService} from './earningstest.service'
import {BenefitService} from './benefit.service'
import {Person} from './data model classes/person'
import {CalculationYear} from './data model classes/calculationyear'
import {BirthdayService} from './birthday.service'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"
import { PresentValueService } from './presentvalue.service';

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






});
