import {TestBed, inject} from '@angular/core/testing'
import {BenefitService} from './benefit.service'
import {BirthdayService} from './birthday.service'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"


describe('BenefitService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BenefitService, BirthdayService]
    })
  })

  it('should be created', inject([BenefitService], (service: BenefitService) => {
    expect(service).toBeTruthy()
  }))

  //Testing calculateRetirementBenefit
  it('should calculate retirement benefit 60 months early as 70% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2025, 7 , 1) //Benefit date 5 years prior to FRA
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(700)
  }))

  it('should calculate retirement benefit 24 months early as 86.67% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2028, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(866.67, 1)
  }))

  it('should calculate retirement benefit 12 months after FRA as 108% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2031, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1080)
  }))

  it('should calculate retirement benefit 48 months after FRA as 132% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2034, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1320)
  }))

  it('should calculate retirement benefit properly using DRCs from suspension in an early entitlement scenario', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2030
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2027, 7 , 1) //36 months early
    person.DRCsViaSuspension = 16 //then suspended for 16 months
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(885.33, 1)
    //calc by hand: 1000 * 0.8 + (1000 * 0.8) * (2/3/100) * 16 = 885.33
  }))

  it('should calculate retirement benefit properly using DRCs from suspension in an entitlement-after-FRA scenario', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2030
    person.PIA = 1000
    let benefitDate = new MonthYearDate (2031, 7 , 1) //12 months after FRA
    person.DRCsViaSuspension = 16 //then suspended for 16 months
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(1186.67, 1)
    //calc by hand: 1000 * 1.08 + 1000 * (2/3/100) * 16 = 1186.67
  }))


  //Testing calculateSpousalBenefit
  it('should calculate spousal benefit as zero when own PIA is too high', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.PIA = 1000
    otherPerson.PIA = 1500
    person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
    let retirementBenefit: number = 800
    let spousalStartDate = new MonthYearDate (2027, 7 , 1)
    person.governmentPension = 0
    expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
        .toEqual(0)
  }))

    it('should calculate spousal benefit appropriately prior to FRA', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new MonthYearDate (2027, 7 , 1)
      person.governmentPension = 0
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(187.5) //50% of 1500, minus 500 all times 75% for being 3 years early
    }))

    it('should calculate spousal benefit appropriately prior to FRA, when reduced by GPO', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new MonthYearDate (2027, 7 , 1)
      person.governmentPension = 150
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(87.5) //same as prior, minus 2/3 of $150 monthly gov pension
    }))

    it('should calculate spousal benefit appropriately prior to FRA, when reduced to zero by GPO', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new MonthYearDate (2027, 7 , 1)
      person.governmentPension = 1000
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(0)
    }))

    it('should calculate spousal benefit appropriately after FRA', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 800
      otherPerson.PIA = 2000
      person.FRA = new MonthYearDate (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 864
      let spousalStartDate = new MonthYearDate (2031, 7 , 1)
      person.governmentPension = 0
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(136) //50% of 2000, minus 864
    }))

    //testing determineChildBenefitDate()
    it('should return correct childBenefitDate in single scenario if child has filed', inject([BenefitService], (service: BenefitService) => {
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        let personA:Person = new Person("A")
        let child:Person = new Person("1")
        personA.retirementBenefitDate = new MonthYearDate(2018, 5)//Filed June 2018
        child.SSbirthDate = new MonthYearDate(2016, 7) //child born August 2016
        child.hasFiled = true
        expect(service.determineChildBenefitDate(scenario, child, personA))
            .toEqual(personA.retirementBenefitDate)
      }))

      it('should return correct childBenefitDate in single scenario if child has filed and SSbirthDate is limiting factor', inject([BenefitService], (service: BenefitService) => {
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        let personA:Person = new Person("A")
        let child:Person = new Person("1")
        child.hasFiled = true
        personA.retirementBenefitDate = new MonthYearDate(2018, 4)//Filed May 2018
        child.SSbirthDate = new MonthYearDate(2018, 7) //child born August 2018
        expect(service.determineChildBenefitDate(scenario, child, personA))
            .toEqual(child.SSbirthDate)
      }))

      it('should return correct childBenefitDate in married scenario if child has filed', inject([BenefitService], (service: BenefitService) => {
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
      }))

    //Previously wrote several tests in "child has not filed" scenarios to find earliest retroactive date. They all passed, but eventually deleted them because they fail every time today's month changes.

  
})