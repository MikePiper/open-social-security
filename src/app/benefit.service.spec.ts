import {TestBed, inject} from '@angular/core/testing'
import {BenefitService} from './benefit.service'
import {BirthdayService} from './birthday.service'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"


describe('BenefitService', () => {
  let birthdayService:BirthdayService
  let service:BenefitService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BenefitService, BirthdayService]
    })
    service = TestBed.get(BenefitService)
    birthdayService = TestBed.get(BirthdayService)
  })

  it('should be created', inject([BenefitService], (service: BenefitService) => {
    expect(service).toBeTruthy()
  }))

  //Testing calculateRetirementBenefit
  it('should calculate retirement benefit 60 months early as 70% of PIA', () => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2025, 7 , 1) //Benefit date 5 years prior to FRA
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(700)
  })

  it('should calculate retirement benefit 24 months early as 86.67% of PIA', () => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2028, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(866.67, 1)
  })

  it('should calculate retirement benefit 12 months after FRA as 108% of PIA', () => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2031, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1080)
  })

  it('should calculate retirement benefit 48 months after FRA as 132% of PIA', () => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2034, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1320)
  })

  it('should calculate retirement benefit properly using DRCs from suspension in an early entitlement scenario', () => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2030
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2027, 7 , 1) //36 months early
    person.DRCsViaSuspension = 16 //then suspended for 16 months
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(885.33, 1)
    //calc by hand: 1000 * 0.8 + (1000 * 0.8) * (2/3/100) * 16 = 885.33
  })

  it('should calculate retirement benefit properly using DRCs from suspension in an entitlement-after-FRA scenario', () => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2030
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2031, 7 , 1) //12 months after FRA
    person.DRCsViaSuspension = 16 //then suspended for 16 months
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(1186.67, 1)
    //calc by hand: 1000 * 1.08 + 1000 * (2/3/100) * 16 = 1186.67
  })

    //testing determineChildBenefitDate()
    it('should return correct childBenefitDate in single scenario if child has filed', () => {
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        let personA:Person = new Person("A")
        let child:Person = new Person("1")
        personA.retirementBenefitDate = new MonthYearDate(2018, 5)//Filed June 2018
        child.SSbirthDate = new MonthYearDate(2016, 7) //child born August 2016
        child.hasFiled = true
        expect(service.determineChildBenefitDate(scenario, child, personA))
            .toEqual(personA.retirementBenefitDate)
      })

      it('should return correct childBenefitDate in single scenario if child has filed and SSbirthDate is limiting factor', () => {
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        let personA:Person = new Person("A")
        let child:Person = new Person("1")
        child.hasFiled = true
        personA.retirementBenefitDate = new MonthYearDate(2018, 4)//Filed May 2018
        child.SSbirthDate = new MonthYearDate(2018, 7) //child born August 2018
        expect(service.determineChildBenefitDate(scenario, child, personA))
            .toEqual(child.SSbirthDate)
      })

      it('should return correct childBenefitDate in married scenario if child has filed', () => {
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "married"
        let personA:Person = new Person("A")
        let personB:Person = new Person("B")
        let child:Person = new Person("1")
        personA.retirementBenefitDate = new MonthYearDate(2018, 5)//Filed June 2018
        personB.retirementBenefitDate = new MonthYearDate(2018, 1)//Filed Feb 2018
        child.SSbirthDate = new MonthYearDate(2016, 7) //child born August 2016
        child.hasFiled = true
        expect(service.determineChildBenefitDate(scenario, child, personA, personB))
            .toEqual(personB.retirementBenefitDate)
      })

      it('should return correct childBenefitDate (date of death) in survivor scenario if child has filed', () => {
        service.today = new MonthYearDate(2020, 7)//Aug 2020
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "survivor"
        let personA:Person = new Person("A")
        let personB:Person = new Person("B")
        let child:Person = new Person("1")
        child.SSbirthDate = new MonthYearDate(2016, 7) //child born August 2016
        personA.retirementBenefitDate = new MonthYearDate(2026, 5)//Some date in future -- personA hasn't yet filed
        personB.retirementBenefitDate = new MonthYearDate(2026, 8)//Some date in future -- personB hasn't yet filed
        personB.dateOfDeath = new MonthYearDate(2019, 7)//personB died one year ago
        child.hasFiled = true
        expect(service.determineChildBenefitDate(scenario, child, personA, personB))
            .toEqual(new MonthYearDate(2019, 7))
      })

      it('should return correct childBenefitDate (6 months ago) in survivor scenario if child has not filed', () => {
        service.today = new MonthYearDate(2020, 7)//Aug 2020
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "survivor"
        let personA:Person = new Person("A")
        let personB:Person = new Person("B")
        let child:Person = new Person("1")
        child.SSbirthDate = new MonthYearDate(2016, 7) //child born August 2016
        personA.retirementBenefitDate = new MonthYearDate(2026, 5)//Some date in future -- personA hasn't yet filed
        personB.retirementBenefitDate = new MonthYearDate(2026, 8)//Some date in future -- personB hasn't yet filed
        personB.dateOfDeath = new MonthYearDate(2019, 7)//personB died one year ago
        expect(service.determineChildBenefitDate(scenario, child, personA, personB))
            .toEqual(new MonthYearDate(2020, 1))
      })

      it('should return correct childBenefitDate (date of death) in survivor scenario if child has not filed', () => {
        service.today = new MonthYearDate(2020, 7)//Aug 2020
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "survivor"
        let personA:Person = new Person("A")
        let personB:Person = new Person("B")
        let child:Person = new Person("1")
        child.SSbirthDate = new MonthYearDate(2016, 7) //child born August 2016
        personA.retirementBenefitDate = new MonthYearDate(2026, 5)//Some date in future -- personA hasn't yet filed
        personB.retirementBenefitDate = new MonthYearDate(2026, 8)//Some date in future -- personB hasn't yet filed
        personB.dateOfDeath = new MonthYearDate(2020, 5)//personB died two months ago
        expect(service.determineChildBenefitDate(scenario, child, personA, personB))
            .toEqual(new MonthYearDate(2020, 5))
      })

      it('should return correct childBenefitDate (personA.retirementBenefitDate). Survivor scenario. Child has not filed. personA.retirementBenefitDate is earliest retroactive date.', () => {
        service.today = new MonthYearDate(2020, 7)//Aug 2020
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "survivor"
        let personA:Person = new Person("A")
        let personB:Person = new Person("B")
        let child:Person = new Person("1")
        child.SSbirthDate = new MonthYearDate(2016, 7) //child born August 2016
        personA.retirementBenefitDate = new MonthYearDate(2020, 3)//personA filed 4 months ago
        personB.retirementBenefitDate = new MonthYearDate(2026, 8)//Some date in future -- personB hasn't yet filed
        personB.dateOfDeath = new MonthYearDate(2020, 5)//personB died two months ago
        expect(service.determineChildBenefitDate(scenario, child, personA, personB))
            .toEqual(new MonthYearDate(2020, 3))
      })

      it('should reduce survivor benefit for age appropriately.', () => {
        let person:Person = new Person("A")
        person.SSbirthDate = new MonthYearDate(1957, 9) //born October 1957
        person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate) //66 and 2 months given 1957 DoB, so Dec 1959
        person.monthlySurvivorPayment = 1000
        person.survivorBenefitDate = new MonthYearDate(2017, 9)//person filed exactly at age 60
        expect(service.adjustSurvivorBenefitsForAge(person).monthlySurvivorPayment)
            .toBeCloseTo(715, 0) //1000 x .715
      })

      it('should reduce survivor benefit for age appropriately.', () => {
        let person:Person = new Person("A")
        person.SSbirthDate = new MonthYearDate(1957, 3) //born April 1957
        person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate) //66 and 2 months given 1957 DoB, so June 1959
        person.monthlySurvivorPayment = 1000
        person.survivorBenefitDate = new MonthYearDate(2021, 5)//person filed at age 64 and 2 months (24 months early)
        expect(service.adjustSurvivorBenefitsForAge(person).monthlySurvivorPayment)
            .toBeCloseTo(908, 0) //1000 - 1000 * (24/74) x (0.285)
      })

      it('should not reduce survivor benefit when claimed at or after FRA.', () => {
        let person:Person = new Person("A")
        person.SSbirthDate = new MonthYearDate(1957, 9) //born October 1957
        person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate) //66 and 2 months given 1957 DoB, so Dec 1959
        person.monthlySurvivorPayment = 1000
        person.survivorBenefitDate = new MonthYearDate(2023, 11)//person filed exactly at FRA
        expect(service.adjustSurvivorBenefitsForAge(person).monthlySurvivorPayment)
            .toBeCloseTo(1000, 0)
      })
})
