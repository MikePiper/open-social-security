import {TestBed, inject} from '@angular/core/testing'
import {BenefitService} from './benefit.service'
import {BirthdayService} from './birthday.service'
import {Person} from './data model classes/person'
import {CalculationYear} from './data model classes/calculationyear'
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



  //Testing calculateSurvivorBenefit
    it('should calculate survivor benefit appropriately after FRA, with own smaller retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new MonthYearDate (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 700
      let survivorSurvivorBenefitDate: MonthYearDate = new MonthYearDate (2040, 7 , 1) //filing for survivor benefit after FRA
      deceasedPerson.FRA = new MonthYearDate (2030, 2, 1) //deceased FRA March 1, 2030
      let dateOfDeath: MonthYearDate = new MonthYearDate (2034, 2, 1) //deceased died at 71
      deceasedPerson.PIA = 1000
      let deceasedClaimingDate: MonthYearDate = new MonthYearDate (2033, 2, 1) //deceased filed 3 years after FRA
      survivingPerson.governmentPension = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate))
          .toEqual(540) //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 700 retirement benefit, gives 540 survivor benefit
    }))

    it('should calculate survivor benefit appropriately as zero with own larger retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new MonthYearDate (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 1500
      let survivorSurvivorBenefitDate: MonthYearDate = new MonthYearDate (2040, 7 , 1) //filing for survivor benefit after FRA
      deceasedPerson.FRA = new MonthYearDate (2030, 2, 1) //deceased FRA March 1, 2030
      let deceasedClaimingDate: MonthYearDate = new MonthYearDate (2033, 2, 1) //deceased filed 3 years after FRA
      let dateOfDeath: MonthYearDate = new MonthYearDate (2034, 2, 1) //deceased died at 71
      deceasedPerson.PIA = 1000
      survivingPerson.governmentPension = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate))
          .toEqual(0) //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 1500 retirement benefit, gives zero survivor benefit
    }))

    it('should calculate survivor benefit appropriately before FRA, with own smaller retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new MonthYearDate (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //survivorFRA Aug 1, 2030
      let survivorRetirementBenefit: number = 700
      let survivorSurvivorBenefitDate: MonthYearDate = new MonthYearDate (2029, 7 , 1) //filing for survivor benefit 12 months prior to FRA
      deceasedPerson.FRA = new MonthYearDate (2020, 11, 1) //deceased FRA December 1, 2020 (was born in Dec 1954 and has FRA of 66)
      let deceasedClaimingDate: MonthYearDate = new MonthYearDate (2024, 11, 1) //deceased filed 4 years after FRA (age 70)
      let dateOfDeath: MonthYearDate = new MonthYearDate (2025, 2, 1) //deceased died after age 70
      deceasedPerson.PIA = 1000
      survivingPerson.governmentPension = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate))
          .toBeCloseTo(566.28, 1) //deceased filed at 70 with FRA of 66. Benefit would have been 1320. But survivor benefit is being claimed 12 months prior to FRA.
            //That's 12 months early out of 84 possible months early (given FRA of 67), so we have 14.2857% of the reduction. Full reduction is 28.5%. So reduction is 4.07%. $1320 x .9593 = 1266.28. Minus own 700 retirement is 566.28
    }))

    it('should calculate survivor benefit appropriately before FRA, with own smaller retirement benefit. Deceased filed at age 64, died after 70 (RIBLIM calculation)', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new MonthYearDate (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 500
      let survivorSurvivorBenefitDate: MonthYearDate = new MonthYearDate (2029, 7 , 1) //filing for survivor benefit prior to FRA
      deceasedPerson.FRA = new MonthYearDate (2020, 11, 1) //deceased FRA December 1, 2020 (was born in Dec 1954 and has FRA of 66)
      let deceasedClaimingDate: MonthYearDate = new MonthYearDate (2017, 11, 1) //deceased filed 3 years before FRA (age 63)
      let dateOfDeath: MonthYearDate = new MonthYearDate (2025, 2, 1) //deceased died after age 70
      deceasedPerson.PIA = 1000
      survivingPerson.governmentPension = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate))
          .toEqual(325) //deceased filed at 63 with FRA of 66. Benefit would have been 800. Survivor benefit also being claimed early (12 months early). So we have 'RIBLIM' situation.
            //Now we start with deceased's PIA (1000) rather than actual retirement benefit. And apply reduction from there.
            //Widow benefit 12 months early out of 84 possible months early (given FRA of 67), so we have 14.2857% of the reduction. Full reduction is 28.5%. So reduction is 4.07%.
            //$1000 x .9593 = 959.30, which gets limited to greater of:
                //82.5% of deceased's PIA (so, $825), or
                //Amount deceased was receiving at death (so, $800)
                //So 959.3 is limited to $825.
                //825 is then reduced by own retirement benefit of $500, for a survivor benefit of $325
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