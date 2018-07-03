import {TestBed, inject} from '@angular/core/testing'
import {BenefitService} from './benefit.service'
import {BirthdayService} from './birthday.service';
import {Person} from './person';


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
    let person:Person = new Person()
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2025, 7 , 1) //Benefit date 5 years prior to FRA
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(700)
  }))

  it('should calculate retirement benefit 48 months early as 75% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person()
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2026, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(750)
  }))

  it('should calculate retirement benefit 24 months early as 86.67% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person()
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2028, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toBeCloseTo(866.67, 1)
  }))

  it('should calculate retirement benefit at FRA as PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person()
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2030, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1000)
  }))

  it('should calculate retirement benefit 12 months after FRA as 108% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person()
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2031, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1080)
  }))

  it('should calculate retirement benefit 48 months after FRA as 132% of PIA', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person()
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    person.PIA = 1000
    let benefitDate = new Date (2034, 7 , 1)
    expect(service.calculateRetirementBenefit(person, benefitDate))
        .toEqual(1320)
  }))



  //Testing calculateSpousalBenefit
  it('should calculate spousal benefit as zero when own PIA is too high', inject([BenefitService], (service: BenefitService) => {
    let person:Person = new Person()
    let otherPerson:Person = new Person()
    person.PIA = 1000
    otherPerson.PIA = 1500
    person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
    let retirementBenefit: number = 800
    let spousalStartDate = new Date (2027, 7 , 1)
    let governmentPension: number = 0
    expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate, governmentPension))
        .toEqual(0)
  }))

    it('should calculate spousal benefit appropriately prior to FRA', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person()
      let otherPerson:Person = new Person()
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new Date (2027, 7 , 1)
      let governmentPension: number = 0
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate, governmentPension))
          .toEqual(187.5) //50% of 1500, minus 500 all times 75% for being 3 years early
    }))

    it('should calculate spousal benefit appropriately prior to FRA, when reduced by GPO', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person()
      let otherPerson:Person = new Person()
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new Date (2027, 7 , 1)
      let governmentPension: number = 150
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate, governmentPension))
          .toEqual(87.5) //same as prior, minus 2/3 of $150 monthly gov pension
    }))

    it('should calculate spousal benefit appropriately prior to FRA, when reduced to zero by GPO', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person()
      let otherPerson:Person = new Person()
      person.PIA = 500
      otherPerson.PIA = 1500
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 400
      let spousalStartDate = new Date (2027, 7 , 1)
      let governmentPension: number = 1000
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate, governmentPension))
          .toEqual(0)
    }))

    it('should calculate spousal benefit appropriately after FRA', inject([BenefitService], (service: BenefitService) => {
      let person:Person = new Person()
      let otherPerson:Person = new Person()
      person.PIA = 800
      otherPerson.PIA = 2000
      person.FRA = new Date (2030, 7, 1) //FRA Aug 1, 2020
      let retirementBenefit: number = 864
      let spousalStartDate = new Date (2031, 7 , 1)
      let governmentPension: number = 0
      expect(service.calculateSpousalBenefit(person, otherPerson, retirementBenefit, spousalStartDate, governmentPension))
          .toEqual(136) //50% of 2000, minus 864
    }))



  //Testing calculateSurvivorBenefit
    it('should calculate survivor benefit appropriately after FRA, with own smaller retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person()
      let survivingPerson:Person = new Person()
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 700
      let survivorSurvivorBenefitDate: Date = new Date (2040, 7 , 1) //filing for survivor benefit after FRA
      deceasedPerson.FRA = new Date (2030, 2, 1) //deceased FRA March 1, 2030
      let dateOfDeath: Date = new Date (2034, 2, 1) //deceased died at 71
      deceasedPerson.PIA = 1000
      let deceasedClaimingDate: Date = new Date (2033, 2, 1) //deceased filed 3 years after FRA
      let governmentPension: number = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate, governmentPension))
          .toEqual(540) //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 700 retirement benefit, gives 540 survivor benefit
    }))

    it('should calculate survivor benefit appropriately as zero with own larger retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person()
      let survivingPerson:Person = new Person()
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 1500
      let survivorSurvivorBenefitDate: Date = new Date (2040, 7 , 1) //filing for survivor benefit after FRA
      deceasedPerson.FRA = new Date (2030, 2, 1) //deceased FRA March 1, 2030
      let deceasedClaimingDate: Date = new Date (2033, 2, 1) //deceased filed 3 years after FRA
      let dateOfDeath: Date = new Date (2034, 2, 1) //deceased died at 71
      deceasedPerson.PIA = 1000
      let governmentPension: number = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate, governmentPension))
          .toEqual(0) //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 1500 retirement benefit, gives zero survivor benefit
    }))

    it('should calculate survivor benefit appropriately before FRA, with own smaller retirement benefit. Deceased filed at age 70, died at 71', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person()
      let survivingPerson:Person = new Person()
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //survivorFRA Aug 1, 2030
      let survivorRetirementBenefit: number = 700
      let survivorSurvivorBenefitDate: Date = new Date (2029, 7 , 1) //filing for survivor benefit 12 months prior to FRA
      deceasedPerson.FRA = new Date (2020, 11, 1) //deceased FRA December 1, 2020 (was born in Dec 1954 and has FRA of 66)
      let deceasedClaimingDate: Date = new Date (2024, 11, 1) //deceased filed 4 years after FRA (age 70)
      let dateOfDeath: Date = new Date (2025, 2, 1) //deceased died after age 70
      deceasedPerson.PIA = 1000
      let governmentPension: number = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate, governmentPension))
          .toBeCloseTo(566.28, 1) //deceased filed at 70 with FRA of 66. Benefit would have been 1320. But survivor benefit is being claimed 12 months prior to FRA.
            //That's 12 months early out of 84 possible months early (given FRA of 67), so we have 14.2857% of the reduction. Full reduction is 28.5%. So reduction is 4.07%. $1320 x .9593 = 1266.28. Minus own 700 retirement is 566.28
    }))

    it('should calculate survivor benefit appropriately before FRA, with own smaller retirement benefit. Deceased filed at age 64, died after 70 (RIBLIM calculation)', inject([BenefitService], (service: BenefitService) => {
      let deceasedPerson:Person = new Person()
      let survivingPerson:Person = new Person()
      survivingPerson.SSbirthDate = new Date (1963, 7, 1) //SSbirthday Aug 1, 1963
      let birthdayService:BirthdayService = new BirthdayService()
      survivingPerson.survivorFRA = birthdayService.findSurvivorFRA(survivingPerson.SSbirthDate) //FRA Aug 1, 2030
      let survivorRetirementBenefit: number = 500
      let survivorSurvivorBenefitDate: Date = new Date (2029, 7 , 1) //filing for survivor benefit prior to FRA
      deceasedPerson.FRA = new Date (2020, 11, 1) //deceased FRA December 1, 2020 (was born in Dec 1954 and has FRA of 66)
      let deceasedClaimingDate: Date = new Date (2017, 11, 1) //deceased filed 3 years before FRA (age 63)
      let dateOfDeath: Date = new Date (2025, 2, 1) //deceased died after age 70
      deceasedPerson.PIA = 1000
      let governmentPension: number = 0
      expect(service.calculateSurvivorBenefit(survivingPerson, survivorRetirementBenefit, survivorSurvivorBenefitDate, deceasedPerson, dateOfDeath, deceasedClaimingDate, governmentPension))
          .toEqual(325) //deceased filed at 63 with FRA of 66. Benefit would have been 800. Survivor benefit also being claimed early (12 months early). So we have 'RIBLIM' situation.
            //Now we start with deceased's PIA (1000) rather than actual retirement benefit. And apply reduction from there.
            //Widow benefit 12 months early out of 84 possible months early (given FRA of 67), so we have 14.2857% of the reduction. Full reduction is 28.5%. So reduction is 4.07%.
            //$1000 x .9593 = 959.30, which gets limited to greater of:
                //82.5% of deceased's PIA (so, $825), or
                //Amount deceased was receiving at death (so, $800)
                //So 959.3 is limited to $825.
                //825 is then reduced by own retirement benefit of $500, for a survivor benefit of $325
    }))


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