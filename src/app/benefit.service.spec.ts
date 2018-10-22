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


  //testing CountCoupleBenefitMonths()
  it('should determine correct number of retirement and spousal benefit months (including appropriate types) for both spouses (no suspension scenario) in year in which A files and reaches FRA. B reaches FRA but has not filed', inject([BenefitService], (service: BenefitService) => {
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new MonthYearDate(2019, 0, 1) //Jan 1, 2019 (year in which both reach FRA)
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.SSbirthDate = new MonthYearDate(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate) //May 2019 survivorFRA
    personA.retirementBenefitDate = new MonthYearDate(2019, 1, 1) //Feb 1, 2019 retirementBenefit date
    personA.spousalBenefitDate = new MonthYearDate(2021, 7, 1) //August 1, 2021 spousalBenefit date
    let personB:Person = new Person("B")
    personB.SSbirthDate = new MonthYearDate(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate) //May 2019 survivorFRA
    personB.retirementBenefitDate = new MonthYearDate(2021, 7, 1) //August 1, 2021 retirementBenefit date
    personB.spousalBenefitDate = new MonthYearDate(2021, 7, 1) //August 1, 2021 spousalBenefit date
    let countCoupleBenefitMonthsResult:any[] = service.CountCoupleBenefitMonths(scenario, calcYear, personA, personB)
    calcYear = countCoupleBenefitMonthsResult[0]
    personA = countCoupleBenefitMonthsResult[1]
    personB = countCoupleBenefitMonthsResult[2]
    expect(calcYear.monthsOfPersonAretirementPreARF)
        .toEqual(3)//pre-ARF retirement benefit in Feb, March, April (3 months)
    expect(calcYear.monthsOfPersonAretirementPostARF)
        .toEqual(8)//post-ARF retirement benefit May-Dec (8 months)
    expect(calcYear.monthsOfPersonAspousalWithoutRetirement)
        .toEqual(0)//no spousal for A because B hasn't filed
    expect(calcYear.monthsOfPersonAspousalWithRetirementPreARF)
        .toEqual(0)//no spousal for A because B hasn't filed
    expect(calcYear.monthsOfPersonAspousalWithRetirementPostARF)
        .toEqual(0)//no spousal for A because B hasn't filed
    expect(calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs)
        .toEqual(0)//no spousal for A because B hasn't filed
    expect(calcYear.monthsOfPersonAsurvivorWithoutRetirement)
        .toEqual(0)//filing for retirement before survivorFRA, so this is zero.
    expect(calcYear.monthsOfPersonAsurvivorWithRetirementPostARF)
        .toEqual(8)//hits survivorFRA in May, and has already filed for retirement. So 8 months of "survivorWithRetirementPostARF"
    expect(calcYear.monthsOfPersonBretirementPreARF)
        .toEqual(0)//B hasn't yet filed
    expect(calcYear.monthsOfPersonBretirementPostARF)
        .toEqual(0)//B hasn't yet filed
    expect(calcYear.monthsOfPersonBspousalWithoutRetirement)
        .toEqual(0)//B hasn't yet filed
    expect(calcYear.monthsOfPersonBspousalWithRetirementPreARF)
        .toEqual(0)//B hasn't yet filed
    expect(calcYear.monthsOfPersonBspousalWithRetirementPostARF)
        .toEqual(0)//B hasn't yet filed
    expect(calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs)
        .toEqual(0)//B hasn't yet filed
    expect(calcYear.monthsOfPersonBsurvivorWithoutRetirement)
        .toEqual(8)//8 survivorBenefitMonths (without retirement, because hasn't yet filed) because hits FRA in May.
    expect(calcYear.monthsOfPersonBsurvivorWithRetirementPostARF)
        .toEqual(0)//no "withRetirement" months because hasn't yet filed
  }))

  it('should determine correct number of retirement and spousal benefit months (including appropriate types) for both spouses (no suspension scenario) in year in which B files, if A filed in previous year. Both hit FRA this year', inject([BenefitService], (service: BenefitService) => {
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new MonthYearDate(2019, 0, 1) //Jan 1, 2019 (year in which both reach FRA)
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.SSbirthDate = new MonthYearDate(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate) //May 2019 survivorFRA
    personA.retirementBenefitDate = new MonthYearDate(2017, 1, 1) //personA filed in previous year
    personA.spousalBenefitDate = new MonthYearDate(2019, 2, 1) //file for spousal March 2019 (later of two retirement dates)
    let personB:Person = new Person("B")
    personB.SSbirthDate = new MonthYearDate(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate) //May 2019 survivorFRA
    personB.retirementBenefitDate = new MonthYearDate(2019, 2, 1) //personB files for retirement in March 2019
    personB.spousalBenefitDate = new MonthYearDate(2019, 2, 1) //file for spousal March 2019 (later of two retirement dates)
    let countCoupleBenefitMonthsResult:any[] = service.CountCoupleBenefitMonths(scenario, calcYear, personA, personB)
    calcYear = countCoupleBenefitMonthsResult[0]
    personA = countCoupleBenefitMonthsResult[1]
    personB = countCoupleBenefitMonthsResult[2]
    expect(calcYear.monthsOfPersonAretirementPreARF)
        .toEqual(4)//filed in previous year. Reaches FRA in May
    expect(calcYear.monthsOfPersonAretirementPostARF)
        .toEqual(8)//filed in previous year. Reaches FRA in May
    expect(calcYear.monthsOfPersonAspousalWithoutRetirement)
        .toEqual(0)//not a restricted app scenario
    expect(calcYear.monthsOfPersonAspousalWithRetirementPreARF)
        .toEqual(2)//March and April
    expect(calcYear.monthsOfPersonAspousalWithRetirementPostARF)
        .toEqual(8)//May-Dec
    expect(calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs)
        .toEqual(0)//not a suspension scenario
    expect(calcYear.monthsOfPersonAsurvivorWithoutRetirement)
        .toEqual(0)//already filed for retirement by time reaches survivorFRA
    expect(calcYear.monthsOfPersonAsurvivorWithRetirementPostARF)
        .toEqual(8)//reaches survivorFRA in May, has already filed for retirement benefits. So 8 months.
    expect(calcYear.monthsOfPersonBretirementPreARF)
        .toEqual(2)//March and April
    expect(calcYear.monthsOfPersonBretirementPostARF)
        .toEqual(8)//May-Dec
    expect(calcYear.monthsOfPersonBspousalWithoutRetirement)
        .toEqual(0)//not a restricted app scenario
    expect(calcYear.monthsOfPersonBspousalWithRetirementPreARF)
        .toEqual(2)//March, April
    expect(calcYear.monthsOfPersonBspousalWithRetirementPostARF)
        .toEqual(8)//May-Dec
    expect(calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs)
        .toEqual(0)//not a suspension scenario
    expect(calcYear.monthsOfPersonBsurvivorWithoutRetirement)
        .toEqual(0)//already filed for retirement by time reaches survivorFRA
    expect(calcYear.monthsOfPersonBsurvivorWithRetirementPostARF)
        .toEqual(8)//reaches survivorFRA in May, has already filed for retirement benefits. So 8 months.
  }))

  it('should count spousal benefit months appropriately (including type of spousalbenefitmonth) for person A when person B is suspended part of year', inject([BenefitService], (service: BenefitService) => {
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new MonthYearDate(2020, 0, 1) //Jan 1, 2020
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.SSbirthDate = new MonthYearDate(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personA.retirementBenefitDate = new MonthYearDate(2018, 7, 1) //August 1, 2018 retirementBenefit date
    personA.spousalBenefitDate = new MonthYearDate(2018, 7, 1) //August 1, 2018 spousalBenefit date
    let personB:Person = new Person("B")
    personB.hasFiled = true //So it knows this is a "personB might have suspension" scenario
    personB.SSbirthDate = new MonthYearDate(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personB.retirementBenefitDate = new MonthYearDate(2018, 7, 1) //August 1, 2018 retirementBenefit date (not relevant to calculation of the "expected" value, but it's necessary for CountCoupleBenefitMonths to run)
    personB.spousalBenefitDate = new MonthYearDate(2018, 7, 1) //August 1, 2018 spousalBenefit date (not relevant to calculation of the "expected" value, but it's necessary for CountCoupleBenefitMonths to run)
    personB.beginSuspensionDate = new MonthYearDate (2019, 6, 1) //suspending beginning in July 2019
    personB.endSuspensionDate = new MonthYearDate (2020, 7, 1) //Aug 2020 is first month of unsuspension
    let countCoupleBenefitMonthsResult:any[] = service.CountCoupleBenefitMonths(scenario, calcYear, personA, personB)
    calcYear = countCoupleBenefitMonthsResult[0]
    personA = countCoupleBenefitMonthsResult[1]
    personB = countCoupleBenefitMonthsResult[2]
    expect(calcYear.monthsOfPersonAspousalWithoutRetirement)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAspousalWithRetirementPreARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAspousalWithRetirementPostARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs)
        .toEqual(5)
        //Should get benefits in Aug, Sept, Oct, Nov, Dec. And they are considered "after suspension" because 2020 is after FRA and because personA never suspended.
  }))

  it('should count spousal benefit months appropriately (including type of spousalbenefitmonth) for person A when person A is suspended part of year', inject([BenefitService], (service: BenefitService) => {
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new MonthYearDate(2020, 0, 1) //Jan 1, 2020
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.hasFiled = true //So it knows this is a "personB might have suspension" scenario
    personA.SSbirthDate = new MonthYearDate(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.retirementBenefitDate = new MonthYearDate(2018, 7, 1) //August 1, 2018 retirementBenefit date
    personA.spousalBenefitDate = new MonthYearDate(2018, 7, 1) //August 1, 2018 spousalBenefit date
    let personB:Person = new Person("B")
    personB.SSbirthDate = new MonthYearDate(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personA.beginSuspensionDate = new MonthYearDate (2020, 4, 1) //suspending beginning in May 2020
    personA.endSuspensionDate = new MonthYearDate (2022, 7, 1) //Aug 2022 is first month of unsuspension
    let countCoupleBenefitMonthsResult:any[] = service.CountCoupleBenefitMonths(scenario, calcYear, personA, personB)
    calcYear = countCoupleBenefitMonthsResult[0]
    personA = countCoupleBenefitMonthsResult[1]
    personB = countCoupleBenefitMonthsResult[2]
    expect(calcYear.monthsOfPersonAspousalWithoutRetirement)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAspousalWithRetirementPreARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAspousalWithRetirementPostARF)
        .toEqual(4)
    expect(calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs)
        .toEqual(0)
        //Should get benefits in Jan, Feb, March, April. They are post-ARF but before suspensionDRCs
  }))


  //Testing calculatePIAfromAIME()
  it('should calculate PIA appropriately from AIME with PIA below first bend point', inject([BenefitService], (service: BenefitService) => {
    expect(service.calculatePIAfromAIME(700, 2015))
        .toEqual(630)
    //First bend point is 826 in 2015. 700 * 0.9 = 630
  }))

  it('should calculate PIA appropriately from AIME with PIA between first and second bend points', inject([BenefitService], (service: BenefitService) => {
    expect(service.calculatePIAfromAIME(3000, 2013))
        .toEqual(1418.78)
    //Bend points in 2013 are 791 and 4768. 791 * 0.9 + (3000 - 791) * 0.32 = 1418.78
  }))

  it('should calculate PIA appropriately from AIME with PIA above second bend point', inject([BenefitService], (service: BenefitService) => {
    expect(service.calculatePIAfromAIME(6000, 2018))
        .toEqual(2336.59)
    //Bend points in 2018 are 895 and 5397. 0.9 * 895 + 0.32 * (5397-895) + 0.15 * (6000-5397) = 2336.59
  }))

  //Testing calculateFamilyMaximum()
  it('calculateFamilyMaximum() should calculate AIME appropriately in scenario with PIA below first bend point', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.isOnDisability = true
    person.fixedRetirementBenefitDate = new MonthYearDate(2015, 5, 13)
    person.PIA = 700
    expect(service.calculateFamilyMaximum(person).AIME)
        .toBeCloseTo(760.25, 1)
    //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0.
    //700 / 1.02 / 1.003 / 1 = 684.22 <- PIAbeforeCOLAs
    //In 2015, PIA bend points were $826 and $4980
    //684.22 / 0.9 = $760.25
  }))

  it('calculateFamilyMaximum() should calculate AIME appropriately in disability scenario with PIA between first and second bend points', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.isOnDisability = true
    person.fixedRetirementBenefitDate = new MonthYearDate(2015, 5, 13)
    person.PIA = 1000
    expect(service.calculateFamilyMaximum(person).AIME)
        .toBeCloseTo(1557.44, 1)
    //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0.
    //1000 / 1.02 / 1.003 / 1 = 977.46 <- PIAbeforeCOLAs
    //In 2015, PIA bend points were $826 and $4980
    //AIME = 977.46/0.32 - 1.8125 * 826 = 1557.44
    //reverse check: AIME of 1557.44 -> 0.9 x 826 + 0.32 x (1557.44 - 826) = $977.46 Good!
  }))

  it('calculateFamilyMaximum() should calculate AIME appropriately in disability scenario with PIA beyond second bend point', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.isOnDisability = true
    person.fixedRetirementBenefitDate = new MonthYearDate(2013, 5, 13)
    person.PIA = 2400
    expect(service.calculateFamilyMaximum(person).AIME)
        .toBeCloseTo(6688.4, 1)
    //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0. 2014 COLA = 1.7%. 2013 COLA = 1.5%.
    //2400 / 1.02 / 1.003 / 1 / 1.017 / 1.015 = 2272.60 <- PIAbeforeCOLAs
    //In 2013, PIA bend points were $791 and $4768
    //AIME = (2272.60 - 0.58*791 - 0.17*4768) / 0.15 = $6688.4
    //reverse check: AIME of 6688.4 -> 0.9*791 + 0.32*(4768-791) + 0.15*(6688.4-4768) = 2272.6 Good!
  }))

  it('calculateFamilyMaximum() should calculate family maximum appropriately for person on disability', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.isOnDisability = true
    person.fixedRetirementBenefitDate = new MonthYearDate(2015, 5, 13)
    person.PIA = 2000
    expect(service.calculateFamilyMaximum(person).familyMaximum)
        .toBeCloseTo(2977.46, 1)
    //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0.
    //2000 / 1.02 / 1.003 / 1  = 1954.92 <- PIAbeforeCOLAs
    //In 2015, PIA bend points were $826 and $4980
    //AIME = 1954.92/0.32 - 1.8125 * 826 = 4612
    //85% of AIME = 3920.2
    //family max (before COLAs) is lesser of 85% of AIME (3920.2) or 150% of PIAbeforeCOLA (2932.38) = 2932.38
    //Now we add back COLAs (2000 - 1954.92 = 45.08)
    //2932.38 + 45.08 = 2977.46
  }))

  it('calculateFamilyMaximum() should calculate family maximum appropriately based on normal retirement benefit', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.SSbirthDate = new MonthYearDate(1952, 4, 1)//Person born in May 1952.
    person.PIA = 2000
    expect(service.calculateFamilyMaximum(person).familyMaximum)
        .toBeCloseTo(3501.24, 1)
    //person reaches 62 in 2014
    //Family max bend points in 2014: 1042,	1505, 1962
    //manual calc: 1.5 * 1042 + 2.72 * (1505 - 1042) + 1.34 * (1962 - 1505) + 1.75 * (2000 - 1962) = 3501.24
  }))


  //testing calculateCombinedFamilyMaximum()
  it('should calculate combined family maximum appropriately in scenario where it is just sum of two maximums', inject([BenefitService], (service: BenefitService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    personA.familyMaximum = 1000
    personB.familyMaximum = 1500
    expect(service.calculateCombinedFamilyMaximum(personA, personB, 2016))
        .toEqual(2500)
    //Limit for combinedFamilyMax in 2016 was 4995.20, per POMS RS 00615.770. So we just combine the two
  }))

  it('should calculate combined family maximum appropriately in scenario where it is just sum of two maximums', inject([BenefitService], (service: BenefitService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    personA.familyMaximum = 2500
    personB.familyMaximum = 2500
    expect(service.calculateCombinedFamilyMaximum(personA, personB, 2013))
        .toBeCloseTo(4708, 0)
    //Limit for combinedFamilyMax in 2013 was 4708.30, per POMS RS 00615.770. So we use that limit in this case.
  }))

    //testing applyFamilyMaximumSingle()
    it('should apply family maximum appropriately when there are multiple kids', inject([BenefitService], (service: BenefitService) => {
        let person:Person = new Person("A")
        let child1:Person = new Person("1")
        let child2:Person = new Person("2")
        child1.age = 10
        child2.age = 10
        child1.monthlyChildPayment = 500 //Considering a still-alive scenario here
        child2.monthlyChildPayment = 500
        let scenario:CalculationScenario = new CalculationScenario()
        scenario.children = [child1, child2]
        person.PIA = 1000
        person.SSbirthDate = new MonthYearDate(1984, 5)
        person = service.calculateFamilyMaximum(person)
        let amountLeftForRestOfFamily = person.familyMaximum - person.PIA
        scenario = service.applyFamilyMaximumSingle(scenario, amountLeftForRestOfFamily)
        expect(scenario.children[0].monthlyChildPayment)
            .toEqual(250)
        //Family max is 1500. 500 will be split among 2 kids
        }))
})