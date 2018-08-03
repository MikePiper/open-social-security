import {TestBed, inject} from '@angular/core/testing'
import {BenefitService} from './benefit.service'
import {BirthdayService} from './birthday.service'
import {Person} from './data model classes/person'
import {CalculationYear} from './data model classes/calculationyear'
import {ClaimingScenario} from './data model classes/claimingscenario'


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
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2025, 7 , 1) //Benefit date 5 years prior to FRA
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(700)
  }))


  it('should calculate retirement benefit 24 months early as 86.67% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2028, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(866.67, 1)
  }))


  it('should calculate retirement benefit 12 months after FRA as 108% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2031, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1080)
  }))

  it('should calculate retirement benefit 48 months after FRA as 132% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2034, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1320)
  }))


  it('should calculate retirement benefit properly using DRCs from suspension', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2030
    person.PIA = 1000
    let benefitDate = new Date (2027, 7 , 1) //36 months early
    person.DRCsViaSuspension = 16 //then suspended for 16 months
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(906.67, 1)
    //calc by hand: 1000 * 0.8 + 1000 * (2/3/100) * 16 = 906.67
  }))


  //Testing calculateSpousalBenefit
  it('should calculate spousal benefit as zero when own PIA is too high', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.PIA = 1000
    otherPerson.PIA = 1500
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    let retirementBenefit: number = 800
    let spousalStartDate = new Date (2027, 7 , 1)
    person.governmentPension = 0
    expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
        .toEqual(0)
  }))

    it('should calculate spousal benefit appropriately prior to FRA', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new Date (2027, 7 , 1)
      person.governmentPension = 0
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(187.5) //50% of 1500, minus 500 all times 75% for being 3 years early
    }))

    it('should calculate spousal benefit appropriately prior to FRA, when reduced by GPO', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new Date (2027, 7 , 1)
      person.governmentPension = 150
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(87.5) //same as prior, minus 2/3 of $150 monthly gov pension
    }))

    it('should calculate spousal benefit appropriately prior to FRA, when reduced to zero by GPO', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new Date (2027, 7 , 1)
      person.governmentPension = 1000
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(0)
    }))

    it('should calculate spousal benefit appropriately after FRA', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person("A")
      let otherPerson:Person = new Person("B")
      person.PIA = 800
      otherPerson.PIA = 2000
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 864
      let spousalStartDate = new Date (2031, 7 , 1)
      person.governmentPension = 0
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate))
          .toEqual(136) //50% of 2000, minus 864
    }))



  //Testing calculateSurvivorBenefit
    it('should calculate survivor benefit appropriately after FRA, with own smaller retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 700
      let survivorSurvivorBenefitDate: Date = new Date (2040, 7 , 1) //filing for survivor benefit after FRA
      deceasedPerson.FRA = new Date (2030, 2, 1) //deceased FRA March 1, 2030
      let dateOfDeath: Date = new Date (2034, 2, 1) //deceased died at 71
      deceasedPerson.PIA = 1000
      let deceasedClaimingDate: Date = new Date (2033, 2, 1) //deceased filed 3 years after FRA
      survivingPerson.governmentPension = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate))
          .toEqual(540) //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 700 retirement benefit, gives 540 survivor benefit
    }))

    it('should calculate survivor benefit appropriately as zero with own larger retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 1500
      let survivorSurvivorBenefitDate: Date = new Date (2040, 7 , 1) //filing for survivor benefit after FRA
      deceasedPerson.FRA = new Date (2030, 2, 1) //deceased FRA March 1, 2030
      let deceasedClaimingDate: Date = new Date (2033, 2, 1) //deceased filed 3 years after FRA
      let dateOfDeath: Date = new Date (2034, 2, 1) //deceased died at 71
      deceasedPerson.PIA = 1000
      survivingPerson.governmentPension = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate))
          .toEqual(0) //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 1500 retirement benefit, gives zero survivor benefit
    }))

    it('should calculate survivor benefit appropriately before FRA, with own smaller retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //survivorFRA Aug 1, 2030
      let survivorRetirementBenefit: number = 700
      let survivorSurvivorBenefitDate: Date = new Date (2029, 7 , 1) //filing for survivor benefit 12 months prior to FRA
      deceasedPerson.FRA = new Date (2020, 11, 1) //deceased FRA December 1, 2020 (was born in Dec 1954 and has FRA of 66)
      let deceasedClaimingDate: Date = new Date (2024, 11, 1) //deceased filed 4 years after FRA (age 70)
      let dateOfDeath: Date = new Date (2025, 2, 1) //deceased died after age 70
      deceasedPerson.PIA = 1000
      survivingPerson.governmentPension = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate))
          .toBeCloseTo(566.28, 1) //deceased filed at 70 with FRA of 66. Benefit would have been 1320. But survivor benefit is being claimed 12 months prior to FRA.
            //That's 12 months early out of 84 possible months early (given FRA of 67), so we have 14.2857% of the reduction. Full reduction is 28.5%. So reduction is 4.07%. $1320 x .9593 = 1266.28. Minus own 700 retirement is 566.28
    }))

    it('should calculate survivor benefit appropriately before FRA, with own smaller retirement benefit. Deceased filed at age 64, died after 70 (RIBLIM calculation)', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person("A")
      let survivingPerson:Person = new Person("B")
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 500
      let survivorSurvivorBenefitDate: Date = new Date (2029, 7 , 1) //filing for survivor benefit prior to FRA
      deceasedPerson.FRA = new Date (2020, 11, 1) //deceased FRA December 1, 2020 (was born in Dec 1954 and has FRA of 66)
      let deceasedClaimingDate: Date = new Date (2017, 11, 1) //deceased filed 3 years before FRA (age 63)
      let dateOfDeath: Date = new Date (2025, 2, 1) //deceased died after age 70
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


  //Testing CountSingleBenefitMonths()
  it('should CountSingleBenefitMonths() appropriately in filing year', inject([BenefitService], (service: BenefitService) => { 
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2018, 0, 1) //Jan 1, 2018
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let person:Person = new Person("A")
    person.retirementBenefitDate = new Date(2018, 7, 1) //August 1, 2018 filing date
    person.SSbirthDate = new Date(1956, 2, 1) //March 1956 SSbirthdate
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    calcYear = service.CountSingleBenefitMonths(calcYear, person)
    expect(calcYear.monthsOfPersonAretirementPreARF)
        .toEqual(5)
    expect(calcYear.monthsOfPersonAretirementPostARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAretirementWithSuspensionDRCs)
        .toEqual(0)
  }))

  it('should CountSingleBenefitMonths() appropriately in year prior to filing year', inject([BenefitService], (service: BenefitService) => { 
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2017, 0, 1) //Jan 1, 2017
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let person:Person = new Person("A")
    person.retirementBenefitDate = new Date(2018, 7, 1) //August 1, 2018 filing date
    person.SSbirthDate = new Date(1956, 2, 1) //March 1956 SSbirthdate
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    calcYear = service.CountSingleBenefitMonths(calcYear, person)
    expect(calcYear.monthsOfPersonAretirementPreARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAretirementPostARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAretirementWithSuspensionDRCs)
        .toEqual(0)
  }))

  it('should CountSingleBenefitMonths() appropriately in year after filing year', inject([BenefitService], (service: BenefitService) => { 
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2019, 0, 1) //Jan 1, 2019
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let person:Person = new Person("A")
    person.retirementBenefitDate =  new Date(2018, 7, 1) //August 1, 2018 filing date
    person.SSbirthDate = new Date(1953, 10, 1) //Nov 1953 SSbirthdate
    person.FRA = birthdayService.findFRA(person.SSbirthDate) //Nov 2019 FRA
    person.age = ( 12 * (calcYear.date.getFullYear() - person.SSbirthDate.getFullYear()) + (calcYear.date.getMonth()) - person.SSbirthDate.getMonth()  )/12
    calcYear = service.CountSingleBenefitMonths(calcYear, person)
    expect(calcYear.monthsOfPersonAretirementPreARF)
        .toEqual(10)
    expect(calcYear.monthsOfPersonAretirementPostARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAretirementWithSuspensionDRCs)
        .toEqual(2)
      //10 months before FRA. Then 2 months after suspension. (Didn't suspend, so all post-FRA months will be counted as after-suspension.)
  }))

  it('should CountSingleBenefitMonths() appropriately in year after filing when benefit is suspended for some months', inject([BenefitService], (service: BenefitService) => { 
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2019, 0, 1) //Jan 1, 2019
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let person:Person = new Person("A")
    person.SSbirthDate = new Date(1953, 4, 1) //May 1953 SSbirthdate
    person.FRA = birthdayService.findFRA(person.SSbirthDate) //May 2019 FRA
    person.retirementBenefitDate =  new Date(2018, 7, 1) //August 1, 2018 filing date
    person.beginSuspensionDate = new Date (2019, 6, 1) //suspending beginning in July 2019
    person.endSuspensionDate = new Date (2022, 7, 1) //suspended through remainder of year
    calcYear = service.CountSingleBenefitMonths(calcYear, person)
    expect(calcYear.monthsOfPersonAretirementPreARF)
        .toEqual(4)
    expect(calcYear.monthsOfPersonAretirementPostARF)
        .toEqual(2)
    expect(calcYear.monthsOfPersonAretirementWithSuspensionDRCs)
        .toEqual(0)
    //6 months of benefits (Jan-June). Jan, Feb, March, April are pre-ARF. May and June are post-ARF
  }))

  it('should CountSingleBenefitMonths() appropriately in year after filing when benefit is suspended for entire year', inject([BenefitService], (service: BenefitService) => { 
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2020, 0, 1) //Jan 1, 2020
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let person:Person = new Person("A")
    person.SSbirthDate = new Date(1953, 4, 1) //May 1953 SSbirthdate
    person.FRA = birthdayService.findFRA(person.SSbirthDate) //May 2019 FRA
    person.retirementBenefitDate =  new Date(2018, 7, 1) //August 1, 2018 filing date
    person.beginSuspensionDate = new Date (2019, 6, 1) //suspending beginning in July 2019
    person.endSuspensionDate = new Date (2022, 7, 1) //suspended until Aug 2022
    calcYear = service.CountSingleBenefitMonths(calcYear, person)
    expect(calcYear.monthsOfPersonAretirementPreARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAretirementPostARF)
        .toEqual(0)
    expect(calcYear.monthsOfPersonAretirementWithSuspensionDRCs)
        .toEqual(0)
  }))

  //testing CountCoupleBenefitMonths()
  it('should determine correct number of retirement and spousal benefit months (including appropriate types) for both spouses (no suspension scenario) in year in which A files and reaches FRA. B reaches FRA but has not filed', inject([BenefitService], (service: BenefitService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2019, 0, 1) //Jan 1, 2019 (year in which both reach FRA)
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.SSbirthDate = new Date(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate) //May 2019 survivorFRA
    personA.retirementBenefitDate = new Date(2019, 1, 1) //Feb 1, 2019 retirementBenefit date
    personA.spousalBenefitDate = new Date(2021, 7, 1) //August 1, 2021 spousalBenefit date
    let personB:Person = new Person("B")
    personB.SSbirthDate = new Date(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate) //May 2019 survivorFRA
    personB.retirementBenefitDate = new Date(2021, 7, 1) //August 1, 2021 retirementBenefit date
    personB.spousalBenefitDate = new Date(2021, 7, 1) //August 1, 2021 spousalBenefit date
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
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2019, 0, 1) //Jan 1, 2019 (year in which both reach FRA)
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.SSbirthDate = new Date(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate) //May 2019 survivorFRA
    personA.retirementBenefitDate = new Date(2017, 1, 1) //personA filed in previous year
    personA.spousalBenefitDate = new Date(2019, 2, 1) //file for spousal March 2019 (later of two retirement dates)
    let personB:Person = new Person("B")
    personB.SSbirthDate = new Date(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate) //May 2019 survivorFRA
    personB.retirementBenefitDate = new Date(2019, 2, 1) //personB files for retirement in March 2019
    personB.spousalBenefitDate = new Date(2019, 2, 1) //file for spousal March 2019 (later of two retirement dates)
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
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    scenario.personBhasFiled = true //So it knows this is a "personB might have suspension" scenario
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2020, 0, 1) //Jan 1, 2020
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.SSbirthDate = new Date(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personA.retirementBenefitDate = new Date(2018, 7, 1) //August 1, 2018 retirementBenefit date
    personA.spousalBenefitDate = new Date(2018, 7, 1) //August 1, 2018 spousalBenefit date
    let personB:Person = new Person("B")
    personB.SSbirthDate = new Date(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personB.retirementBenefitDate = new Date(2018, 7, 1) //August 1, 2018 retirementBenefit date (not relevant to calculation of the "expected" value, but it's necessary for CountCoupleBenefitMonths to run)
    personB.spousalBenefitDate = new Date(2018, 7, 1) //August 1, 2018 spousalBenefit date (not relevant to calculation of the "expected" value, but it's necessary for CountCoupleBenefitMonths to run)
    personB.beginSuspensionDate = new Date (2019, 6, 1) //suspending beginning in July 2019
    personB.endSuspensionDate = new Date (2020, 7, 1) //Aug 2020 is first month of unsuspension
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
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    scenario.personAhasFiled = true //So it knows this is a "personB might have suspension" scenario
    let birthdayService:BirthdayService = new BirthdayService()
    let beginningCalcDate = new Date(2020, 0, 1) //Jan 1, 2020
    let calcYear:CalculationYear = new CalculationYear(beginningCalcDate)
    let personA:Person = new Person("A")
    personA.SSbirthDate = new Date(1953, 4, 1) //personA May 1953 SSbirthdate
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //personA May 2019 FRA
    personA.retirementBenefitDate = new Date(2018, 7, 1) //August 1, 2018 retirementBenefit date
    personA.spousalBenefitDate = new Date(2018, 7, 1) //August 1, 2018 spousalBenefit date
    let personB:Person = new Person("B")
    personB.SSbirthDate = new Date(1953, 4, 1) //personB May 1953 SSbirthdate
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //personB May 2019 FRA
    personA.beginSuspensionDate = new Date (2020, 4, 1) //suspending beginning in May 2020
    personA.endSuspensionDate = new Date (2022, 7, 1) //Aug 2022 is first month of unsuspension
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
})