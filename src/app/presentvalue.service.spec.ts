import {TestBed, inject} from '@angular/core/testing'
import {PresentValueService} from './presentvalue.service'
import {BenefitService} from './benefit.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {MortalityService} from './mortality.service'
import {BirthdayService} from './birthday.service'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"

describe('PresentValueService using monthly loops', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
  })

      
  it('should be created', inject([PresentValueService], (service: PresentValueService) => {
    expect(service).toBeTruthy()
  }))


    //Test calculateSinglePersonPVmonthlyLoop()
    it('should return appropriate PV for single person, no complicating factors', inject([PresentValueService], (service: PresentValueService) => {
      let person:Person = new Person("A")
      let scenario:CalculationScenario = new CalculationScenario
      person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
      person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
      person.initialAgeRounded = 58 //younger than 62 when fillling out form
      person.PIA = 1000
      person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
      person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work prior to filing date, earnings test not relevant
      scenario.discountRate = 1 //1% discount rate
      let mortalityService:MortalityService = new MortalityService()
      person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      let benefitService:BenefitService = new BenefitService()
      if (scenario.children.length > 0) {
        for (let child of scenario.children){//TODO: This should be in maximize rather than calculatePV, yeah? Only has to happen once
          child.childBenefitParentAlive = benefitService.calculateChildBenefitParentLiving(person)
          child.childBenefitParentDeceased = benefitService.calculateChildBenefitParentDeceased(person)
        }
      }
      person = benefitService.calculateFamilyMaximum(person)
      expect(service.calculateSinglePersonPVmonthlyloop(person, scenario, false))
        .toBeCloseTo(151765, 0)
    }))
  
    it('should return appropriate PV for single person, but with "still working" inputs and a different mortality table', inject([PresentValueService], (service: PresentValueService) => { 
      let person:Person = new Person("A")
      let scenario:CalculationScenario = new CalculationScenario
      person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
      person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
      person.initialAgeRounded = 58 //younger than 62 when fillling out form
      person.PIA = 1000
      person.retirementBenefitDate = new MonthYearDate(2024, 3, 1) //filing at age 64
      person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work after filing date but before FRA, earnings test IS relevant
      person.monthlyEarnings = 4500 //Just picking something here...
      scenario.discountRate = 1 //1% discount rate
      let mortalityService:MortalityService = new MortalityService()
      person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
      let benefitService:BenefitService = new BenefitService()
      if (scenario.children.length > 0) {
        for (let child of scenario.children){//TODO: This should be in maximize rather than calculatePV, yeah? Only has to happen once
          child.childBenefitParentAlive = benefitService.calculateChildBenefitParentLiving(person)
          child.childBenefitParentDeceased = benefitService.calculateChildBenefitParentDeceased(person)
        }
      }
      person = benefitService.calculateFamilyMaximum(person)
      expect(service.calculateSinglePersonPVmonthlyloop(person, scenario, false))
        .toBeCloseTo(201310, 0)
    }))
  
    it('should return appropriate PV for a single person who files at FRA but suspends immediately until 70', inject([PresentValueService], (service: PresentValueService) => { 
      let person:Person = new Person("A")
      let scenario:CalculationScenario = new CalculationScenario()
      let birthdayService:BirthdayService = new BirthdayService()
      let mortalityService:MortalityService = new MortalityService()
      scenario.maritalStatus = "single"
      person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      person.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse A born in Sept 1970 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
      person.initialAgeRounded = 61
      person.FRA = birthdayService.findFRA(person.SSbirthDate)
      person.PIA = 1000
      person.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      person.retirementBenefitDate = new MonthYearDate (person.FRA) //Filing exactly at FRA of 67
      person.beginSuspensionDate = new MonthYearDate(person.FRA)
      person.endSuspensionDate = new MonthYearDate(2040, 8, 1)//Age 70
      scenario.discountRate = 1
      let benefitService:BenefitService = new BenefitService()
      if (scenario.children.length > 0) {
        for (let child of scenario.children){//TODO: This should be in maximize rather than calculatePV, yeah? Only has to happen once
          child.childBenefitParentAlive = benefitService.calculateChildBenefitParentLiving(person)
          child.childBenefitParentDeceased = benefitService.calculateChildBenefitParentDeceased(person)
        }
      }
      person = benefitService.calculateFamilyMaximum(person)
      expect(service.calculateSinglePersonPVmonthlyloop(person, scenario, false))
        .toBeCloseTo(151776, 0)//Point being, this is same PV as when somebody just waits until 70.
    }))

    it('should return appropriate PV for single person, a newborn child, no other complicating factors', inject([PresentValueService], (service: PresentValueService) => {
      let person:Person = new Person("A")
      let child1:Person = new Person("1")
      let scenario:CalculationScenario = new CalculationScenario
      scenario.children = [child1]
      person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
      child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins
      person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
      person.initialAgeRounded = 58 //younger than 62 when fillling out form
      person.PIA = 1000
      person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
      person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work prior to filing date, earnings test not relevant
      scenario.discountRate = 1 //1% discount rate
      let mortalityService:MortalityService = new MortalityService()
      person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      let benefitService:BenefitService = new BenefitService()
      if (scenario.children.length > 0) {
        for (let child of scenario.children){//TODO: This should be in maximize rather than calculatePV, yeah? Only has to happen once
          child.childBenefitParentAlive = benefitService.calculateChildBenefitParentLiving(person)
          child.childBenefitParentDeceased = benefitService.calculateChildBenefitParentDeceased(person)
        }
      }
      person = benefitService.calculateFamilyMaximum(person)
      expect(service.calculateSinglePersonPVmonthlyloop(person, scenario, false))
        .toBeCloseTo(265512, 0)
    }))

    it('should return appropriate PV for single person, two newborn twins, no other complicating factors (confirming family max is being applied correctly)', inject([PresentValueService], (service: PresentValueService) => {
      let person:Person = new Person("A")
      let child1:Person = new Person("1")
      let child2:Person = new Person("2")
      let scenario:CalculationScenario = new CalculationScenario
      scenario.children = [child1, child2]
      person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
      child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins (April 2030)
      child2.SSbirthDate = new MonthYearDate(2030, 3, 1) //child2 born in same month
      person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
      person.initialAgeRounded = 58 //younger than 62 when fillling out form
      person.PIA = 1000
      person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
      person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work prior to filing date, earnings test not relevant
      scenario.discountRate = 1 //1% discount rate
      let mortalityService:MortalityService = new MortalityService()
      person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      let benefitService:BenefitService = new BenefitService()
      if (scenario.children.length > 0) {
        for (let child of scenario.children){//TODO: This should be in maximize rather than calculatePV, yeah? Only has to happen once
          child.childBenefitParentAlive = benefitService.calculateChildBenefitParentLiving(person)
          child.childBenefitParentDeceased = benefitService.calculateChildBenefitParentDeceased(person)
        }
      }
      person = benefitService.calculateFamilyMaximum(person)
      expect(service.calculateSinglePersonPVmonthlyloop(person, scenario, false))
        .toBeCloseTo(323555, 0)
    }))

    it('should return appropriate PV for single person, newborn triplets, no other complicating factors (family max should give it same PV as prior test)', inject([PresentValueService], (service: PresentValueService) => {
      let person:Person = new Person("A")
      let child1:Person = new Person("1")
      let child2:Person = new Person("2")
      let child3:Person = new Person("3")
      let scenario:CalculationScenario = new CalculationScenario
      scenario.children = [child1, child2, child3]
      person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
      child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins (April 2030)
      child2.SSbirthDate = new MonthYearDate(2030, 3, 1) //child2 born in same month
      child3.SSbirthDate = new MonthYearDate(2030, 3, 1) //child3 born in same month
      person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
      person.initialAgeRounded = 58 //younger than 62 when fillling out form
      person.PIA = 1000
      person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
      person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work prior to filing date, earnings test not relevant
      scenario.discountRate = 1 //1% discount rate
      let mortalityService:MortalityService = new MortalityService()
      person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      let benefitService:BenefitService = new BenefitService()
      if (scenario.children.length > 0) {
        for (let child of scenario.children){//TODO: This should be in maximize rather than calculatePV, yeah? Only has to happen once
          child.childBenefitParentAlive = benefitService.calculateChildBenefitParentLiving(person)
          child.childBenefitParentDeceased = benefitService.calculateChildBenefitParentDeceased(person)
        }
      }
      person = benefitService.calculateFamilyMaximum(person)
      expect(service.calculateSinglePersonPVmonthlyloop(person, scenario, false))
        .toBeCloseTo(323555, 0)
    }))


  
  //Test calculateCouplePV
  it('should return appropriate PV for married couple, basic inputs', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
    personB.retirementBenefitDate = new MonthYearDate (2029, 8, 1) //At age 66 and 2 months
    personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario, false))
      .toBeCloseTo(578594, 0)
  }))

  it('should return appropriate PV for married couple, still working', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68 (Sept 2032)
    personB.retirementBenefitDate = new MonthYearDate (2027, 8, 1) //At age 64 and 2 months (Sept 2029) -- Earnings test IS relevant
    personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new MonthYearDate(2028,3,1) //planning to quit work at age 64 (April 2028)
    personB.quitWorkDate = new MonthYearDate(2030,3,1) //planning to quit work at at 67 (April 2030)
    personA.monthlyEarnings = 5000
    personB.monthlyEarnings = 9000
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario, false))
      .toBeCloseTo(570824, 0)
  }))

  it ('should return appropriate PV for married couple, including GPO', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
    personB.retirementBenefitDate = new MonthYearDate (2029, 8, 1) //At age 66 and 2 months
    personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personA.governmentPension = 900
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario, false))
      .toBeCloseTo(531263, 0)
  }))


  it ('should return appropriate PV for basic divorce scenario', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "divorced"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new MonthYearDate(1955, 3, 1) //Spouse B born in April 1955
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which user (personA) reaches ages 62
    personA.initialAgeRounded = 53
    personB.initialAgeRounded = 63
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
    personB.retirementBenefitDate = new MonthYearDate (2017, 4, 1) //ASAP at 62 and 1 month
    personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personA.governmentPension = 300
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario, false))
      .toBeCloseTo(161095, 0)
  }))

  it('should return appropriate PV for married couple (where spousal benefits are zero), both file at FRA but suspend immediately until 70', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    let birthdayService:BirthdayService = new BirthdayService()
    let mortalityService:MortalityService = new MortalityService()
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse A born in Sept 1970 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse B born in Sept 1970
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1000
    personB.PIA = 1000
    personA.retirementBenefitDate = new MonthYearDate (2037, 8, 1) //Filing exactly at FRA of 67
    personB.retirementBenefitDate = new MonthYearDate (2037, 8, 1) //Filing exactly at FRA of 67
    personA.spousalBenefitDate = new MonthYearDate (2037, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new MonthYearDate (2037, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personA.beginSuspensionDate = new MonthYearDate(personA.FRA)
    personA.endSuspensionDate = new MonthYearDate(2040, 8, 1)//Age 70
    personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
    personB.endSuspensionDate = new MonthYearDate(2040, 8, 1)//Age 70
    scenario.discountRate = 1
    personA.hasFiled = true //Doing this just so that it triggers the monthly "count benefit" loop
    expect(service.calculateCouplePV(personA, personB, scenario, false))
      .toBeCloseTo(303551, 0)//151775.60 is PV for a single person just filing at 70. Figure here is twice that
  }))

  it('should return appropriate PV for married couple (where spousal benefits are relevant), both file at FRA and suspend immediately until 70', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    let birthdayService:BirthdayService = new BirthdayService()
    let mortalityService:MortalityService = new MortalityService()
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse A born in Jan 1970 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse B born in Jan 1970
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1800
    personB.PIA = 500
    personA.retirementBenefitDate = new MonthYearDate (personA.FRA) //Filing exactly at FRA of 67
    personB.retirementBenefitDate = new MonthYearDate (personB.FRA) //Filing exactly at FRA of 67
    personA.spousalBenefitDate = new MonthYearDate (personA.FRA) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new MonthYearDate (personA.FRA) //Later of two retirement benefit dates
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personA.beginSuspensionDate = new MonthYearDate(personA.FRA)
    personA.endSuspensionDate = new MonthYearDate(2040, 0, 1)//Age 70
    personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
    personB.endSuspensionDate = new MonthYearDate(2040, 0, 1)//Age 70
    scenario.discountRate = 1
    personA.hasFiled = true //Doing this just so that it triggers the monthly "count benefit" loop
    expect(service.calculateCouplePV(personA, personB, scenario, false))
      .toBeCloseTo(487328, 0)//See "present value service" spreadsheet for a calculation of this figure
  }))

  it('should return appropriate PV for married couple (where spousal benefits are relevant). PersonB is disabled prior to 62. He suspends FRA to 70. Person A files at 70 for retirement and spousal.', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    let birthdayService:BirthdayService = new BirthdayService()
    let mortalityService:MortalityService = new MortalityService()
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse A born in Jan 1970 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse B born in Jan 1970
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 500
    personB.PIA = 1500
        personB.isOnDisability = true
        personB.retirementBenefitDate = new MonthYearDate (2018, 0, 1) //On disabillity as of age 48
        personB.fixedRetirementBenefitDate = new MonthYearDate (2018, 0, 1) //On disabillity as of age 48
    personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
    personB.endSuspensionDate = new MonthYearDate(2040, 0, 1)//Suspends FRA-70
    personA.retirementBenefitDate = new MonthYearDate (2040, 0, 1) //Filing exactly at 70
    personA.spousalBenefitDate = new MonthYearDate (2040, 0, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new MonthYearDate (2040, 0, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario, false))
      .toBeCloseTo(494744.55, 0)//See "present value service" spreadsheet for a calculation of this figure
  }))


  //Test maximizeSinglePersonPV()
  it('should tell a single person to file ASAP with very high discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let person:Person = new Person("A")
    let scenario:CalculationScenario = new CalculationScenario
    scenario.maritalStatus = "single"
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 15 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAge = 58
    person.PIA = 1000
    scenario.discountRate = 9 //9% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2022, 4, 1))
  }))

  it('should tell a single person to suspend until 70 if filed early, long life expectancy, and zero discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let person:Person = new Person("A")
    let scenario:CalculationScenario = new CalculationScenario
    let birthdayService:BirthdayService = new BirthdayService()
    let mortalityService:MortalityService = new MortalityService()
    scenario.maritalStatus = "single"
    person.hasFiled = true
    person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    person.actualBirthDate = new Date(1953, 3, 15) //Person born April 15 1953
    person.SSbirthDate = new MonthYearDate(1953, 3, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.initialAge = 65
    person.initialAgeRounded = 65
    person.PIA = 1000
    person.fixedRetirementBenefitDate = new MonthYearDate (2017, 3, 1) //filed for retirement at age 64
    scenario.discountRate = 0
    let results = service.maximizeSinglePersonPV(person, scenario)
    expect(results.solutionsArray[0].date)
      .toEqual(new MonthYearDate(person.FRA))
    expect(results.solutionsArray[1].date)
      .toEqual(new MonthYearDate(2023, 3, 1))
    //solutionsArray should have two items: begin suspension date (at FRA), and end suspension date (age 70)
  }))

  it('should tell a single person to file ASAP with disabled child, 1% discount rate and SSA life expectancy', inject([PresentValueService], (service: PresentValueService) => {
    let person:Person = new Person("A")
    let child:Person = new Person("1")
    let scenario:CalculationScenario = new CalculationScenario
    scenario.maritalStatus = "single"
    scenario.children = [child]
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 15 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAge = 58
    person.PIA = 1000
    child.SSbirthDate = new MonthYearDate(1990, 7)
    child.isOnDisability = true
    scenario.discountRate = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2022, 4, 1))
  }))

  //Test maximizeCouplePViterateBothPeople()
  it ('should tell a high-PIA spouse to wait until 70, with low discount rate and long lifespans', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.actualBirthDate = new Date(1964, 8, 15) //Spouse A born in Sept 1964
    personA.SSbirthDate = new MonthYearDate(1964, 8, 1)
    personB.actualBirthDate = new Date(1964, 9, 11) //Spouse B born in October 1964
    personB.SSbirthDate = new MonthYearDate(1964, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAge = 60
    personB.initialAge = 60
    personA.initialAgeRounded = 60
    personB.initialAgeRounded = 60
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1200
    personB.PIA = 1900
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 1
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[1].date)
    .toEqual(new MonthYearDate(2034, 9, 1))
    //We're looking at item [1] in the array. This array should have 2 items in it: retirement benefit dates for each spouse
    //No spousal dates because neither spouse gets a spousal benefit. Since it's sorted in date order, first retirement date will be low earner, second is higher earner, which we want.
  }))

  it ('should tell a high-PIA spouse to file a restricted app when possible', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) 
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0) 
    personA.actualBirthDate = new Date(1953, 8, 15) //Spouse A born in Sept 1953
    personA.SSbirthDate = new MonthYearDate(1953, 8, 1)
    personB.actualBirthDate = new Date(1953, 9, 11) //Spouse B born in October 1953
    personB.SSbirthDate = new MonthYearDate(1953, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAge = 64
    personB.initialAge = 64
    personA.initialAgeRounded = 64
    personB.initialAgeRounded = 64
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2200
    personB.PIA = 1400
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 1
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[1].date)
    .toEqual(new MonthYearDate(2019, 8, 1))
    //We're looking at item [1] in the array. This array should have 3 items in it, in this order:
      //low PIA retirement claiming date
      //high PIA restricted app date
      //high PIA retirement date
  }))

  it ('should tell personA to wait until 70, even with slightly lower PIA, if personB filed early at 62, given low discount rate and long life expectancies', inject([PresentValueService], (service: PresentValueService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personA.actualBirthDate = new Date(1955, 9, 15) //personA born in October 1955
    personA.SSbirthDate = new MonthYearDate(1955, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
    personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personB filed at 62 and 1 month
    personA.initialAge = 62
    personB.initialAge = 63
    personA.initialAgeRounded = 62
    personB.initialAgeRounded = 63
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1000
    personB.PIA = 1150
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 0
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[2].date)
    .toEqual(new MonthYearDate(2025, 9, 1))
    //We're looking at item [0] in the array. This array should have 3 items in it: suspend for personB, unsuspend for personB, retirement date for personA
  }))

  it ('should tell personA to file ASAP, even if personB filed early at 62, if personA has lower PIA (such that even delaying wouldnnt result in higher last-to-die benefit', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 9, 15) //personA born in October 1960
    personA.SSbirthDate = new MonthYearDate(1960, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
    personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personB filed at 62 and 1 month
    personA.initialAge = 62
    personB.initialAge = 63
    personA.initialAgeRounded = 62
    personB.initialAgeRounded = 63
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1100
    personB.PIA = 2000
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 1
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[1].date)
    .toEqual(new MonthYearDate(2022, 10, 1))
    //We're looking at item [1] in the array. This array should have 3 items in it: suspend date for personB (in 2020), retirement date for personA (in 2022),
    //unsuspend date for person B (in 2024)
  }))


  it ('should tell personA to suspend until 70, if personA filed early at 62 and has the much higher PIA', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personA.hasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1954, 9, 11) //personA born in October 1954
    personA.SSbirthDate = new MonthYearDate(1954, 9, 1)
    personB.actualBirthDate = new Date(1960, 9, 15) //personB born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personA filed at 62
    personA.initialAge = 63
    personB.initialAge = 62
    personA.initialAgeRounded = 63
    personB.initialAgeRounded = 62
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2000
    personB.PIA = 1100
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 1
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[2].date)
    .toEqual(new MonthYearDate(2024, 9, 1))
    //We're looking at item [2] in the array. This array should have 3 items in it: suspend date for A (2020), retirement date for personB (2022), unsuspend date for A (2024)
  }))

  it ('should tell personA not to suspend, if personA filed early at 64, has lower PIA, personB hasnt filed, and both have short life expectancy, high-ish discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let mortalityService:MortalityService = new MortalityService()
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personA.hasFiled = true
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SM2", 0)
    personA.actualBirthDate = new Date(1954, 2, 11) //personA born in March 1954
    personA.SSbirthDate = new MonthYearDate(1954, 2, 1)
    personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
    personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.fixedRetirementBenefitDate = new MonthYearDate (2018, 3, 1) //personA filed at 64
    personA.initialAge = 64
    personB.initialAge = 64
    personA.initialAgeRounded = 64
    personB.initialAgeRounded = 64
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 600
    personB.PIA = 2100
    personA.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
    scenario.discountRate = 2
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[2])
    .toBeUndefined
    //We're looking at item [2] in the array. This array should have 2 items in it: retirementDate for personB, and (matching) spousalDate for personA.
    //If there *were* a suspension solution, it would have more than 2 items. So we're testing that 3rd is undefined
  }))

  it ('should tell personA to file at 68, if they have higher PIA, personB has normal life expectancy, and they are using A-dies-at-68 assumption', inject([PresentValueService], (service: PresentValueService) => {
    let mortalityService:MortalityService = new MortalityService()
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 68)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 2, 11) //personA born in March 1960
    personA.SSbirthDate = new MonthYearDate(1960, 2, 1)
    personB.actualBirthDate = new Date(1960, 2, 15) //personB born in March 1960
    personB.SSbirthDate = new MonthYearDate(1960, 2, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAge = 58
    personB.initialAge = 58
    personA.initialAgeRounded = 58
    personB.initialAgeRounded = 58
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2000
    personB.PIA = 1100
    personA.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
    scenario.discountRate = 0
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[1].date)
    .toEqual(new MonthYearDate(2028, 2, 1))
    //We're looking at item [1] in the array. This array should have 2 items in it: retirementDate for personA and retirement date for personB.
    //personBs should be somewhere early-ish, while personA should wait as long as possible (age 68)
  }))

  it ('should tell personA to suspend from FRA to 70, if personA is disabled, personA has higher PIA, both have normal life expectancies', inject([PresentValueService], (service: PresentValueService) => {
    let mortalityService:MortalityService = new MortalityService()
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 2, 11) //personA born in March 1960
    personA.SSbirthDate = new MonthYearDate(1960, 2, 1)
    personB.actualBirthDate = new Date(1960, 2, 15) //personB born in March 1960
    personB.SSbirthDate = new MonthYearDate(1960, 2, 1)
    personA.initialAge = 58
    personB.initialAge = 58
    personA.initialAgeRounded = 58
    personB.initialAgeRounded = 58
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2000
    personB.PIA = 1100
    personA.isOnDisability = true
    personA.fixedRetirementBenefitDate = new MonthYearDate(2016, 5, 1) //On disability since June 2016
    scenario.initialCalcDate = new MonthYearDate(personA.fixedRetirementBenefitDate)//start calculation on date of personA's disability entitlement
    personA.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
    scenario.discountRate = 1
    let results = service.maximizeCouplePViterateBothPeople(personA, personB, scenario)
    expect(results.solutionsArray[2].date)
    .toEqual(new MonthYearDate(personA.FRA))
    expect(results.solutionsArray[3].date)
    .toEqual(new MonthYearDate(2030, 2, 1))
    //We're looking at items [2,3] in the array. This array should have 4 items in it: conversiontoDisability for personA, begin suspension for personA, end suspension for personA, retirement for personB
    //personB retirement should be first (probably 2022-ish or soon thereafter), then other solution objects
  }))

  it ('should tell personB to file for spousal benefits ASAP (even though personA is younger than 62 at the time), if personA is disabled, personA has much higher PIA, one has a short life expectancy, and high-ish discount rate. Should also tell personA to suspend at FRA', inject([PresentValueService], (service: PresentValueService) => {
    let mortalityService:MortalityService = new MortalityService()
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1964, 3, 11) //personA born in April 1964
    personA.SSbirthDate = new MonthYearDate(1964, 3, 1)
    personB.actualBirthDate = new Date(1960, 3, 15) //personB born in April 1960
    personB.SSbirthDate = new MonthYearDate(1960, 3, 1)
    personA.initialAge = 54
    personB.initialAge = 58
    personA.initialAgeRounded = 54
    personB.initialAgeRounded = 58
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2800
    personB.PIA = 1000
    personA.isOnDisability = true
    personA.fixedRetirementBenefitDate = new MonthYearDate(2018, 4, 1) //On disability since May 2018
    scenario.initialCalcDate = new MonthYearDate(personA.fixedRetirementBenefitDate)//start calculation on date of personA's disability entitlement
    personA.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    scenario.discountRate = 2
    let results = service.maximizeCouplePViterateBothPeople(personA, personB, scenario)
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2022, 4, 1))//personB should file for retirement at 62 and 1 month
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2022, 4, 1))//personB should file for spousal at 62 and 1 month
    expect(results.solutionsArray[3].date)
    .toEqual(new MonthYearDate(personA.FRA))//personA should suspend at FRA
    //This array should have 5 items in it: retirement date for personB, spousal date for personB, conversiontoDisability for personA, begin suspension for personA, end suspension for personA
  }))



  //tests for maximizeCouplePViterateOnePerson
  it ('should tell a divorced user with significantly lower PIA to file ASAP', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "divorced"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1964, 9, 15) //Spouse A born in October 1964
    personA.SSbirthDate = new MonthYearDate(1964, 9, 1)
    personB.actualBirthDate = new Date(1960, 9, 11) //Spouse B born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which user (personA) reaches ages 62
    personB.fixedRetirementBenefitDate = new MonthYearDate (2028, 9, 1) //Filing at exactly age 68
    personA.initialAge = 54
    personB.initialAge = 58
    personA.initialAgeRounded = 54
    personB.initialAgeRounded = 58
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 1
    expect(service.maximizeCouplePViterateOnePerson(scenario, personA, personB).solutionsArray[0].date)
    .toEqual(new MonthYearDate(2026, 10, 1))
    //We're looking at item [0] in the array. This array should have 2 items in it: retirement benefit date and spousal benefit date for spouseA
    //Since it's sorted in date order, we want first date (or second date -- they should be the same)
  }))
  
  it ('should tell a divorced user with higher PIA and an ex who filed early (so essentially a single person) to file at 70 given long life expectancy and low discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "divorced"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1955, 9, 15) //Spouse A born in October 1955
    personA.SSbirthDate = new MonthYearDate(1955, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //Spouse B born in October 1954
    personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which user (personA) reaches ages 62
    personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //Ex filing at 62
    personA.initialAge = 62
    personB.initialAge = 63
    personA.initialAgeRounded = 62
    personB.initialAgeRounded = 63
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1200
    personB.PIA = 800
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 0
    expect(service.maximizeCouplePViterateOnePerson(scenario, personA, personB).solutionsArray[0].date)
    .toEqual(new MonthYearDate(2025, 9, 1))
    //We're looking at item [0] in the array. This array should have 1 item in it: retirement benefit date for spouseA.
  }))

  it ('should tell personB to wait until 70 if personA is over 70 and filed early, personB has the much higher PIA, both have long life expectancies, and low discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personA.hasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personA.actualBirthDate = new Date(1948, 3, 11) //personA born April 1948
    personA.SSbirthDate = new MonthYearDate(1948, 3, 1)
    personB.actualBirthDate = new Date(1960, 9, 15) //personB born October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.fixedRetirementBenefitDate = new MonthYearDate (2010, 4, 1) //personA filed at 62 and 1 month
    personA.initialAge = 70.5
    personB.initialAge = 58
    personA.initialAgeRounded = 70
    personB.initialAgeRounded = 58
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 400
    personB.PIA = 2000
    personA.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    scenario.discountRate = 0
    expect(service.maximizeCouplePViterateOnePerson(scenario, personB, personA).solutionsArray[0].date)
    .toEqual(new MonthYearDate(2030, 9, 1))
    //We're looking at item [0] in the array. This array should have 2 items in it: retirement date for personB, spousal date for personA
  }))

  it ('should tell personA to file ASAP if they have lower PIA and personB is much older (over 70), highish discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 9, 15) //personA born October 1960
    personA.SSbirthDate = new MonthYearDate(1960, 9, 1)
    personB.actualBirthDate = new Date(1948, 3, 11) //personB born April 1948
    personB.SSbirthDate = new MonthYearDate(1948, 3, 1)
    scenario.initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personB.fixedRetirementBenefitDate = new MonthYearDate (personB.FRA) //personB filed at FRA
    personA.initialAge = 58
    personB.initialAge = 70.5
    personA.initialAgeRounded = 58
    personB.initialAgeRounded = 70
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 400
    personB.PIA = 2000
    personA.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    scenario.discountRate = 2
    expect(service.maximizeCouplePViterateOnePerson(scenario, personA, personB).solutionsArray[0].date)
    .toEqual(new MonthYearDate(2022, 10, 1))
    //We're looking at item [0] in the array. This array should have 2 items in it: retirement date for personA, spousal date for personA
  }))

  it ('should tell personB to suspend until 70 if they already filed at FRA, personA is over 70 and filed early, personB has much higher PIA, both have long life expectancies, and low discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let mortalityService:MortalityService = new MortalityService()
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personA.hasFiled = true
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personA.actualBirthDate = new Date(1948, 3, 11) //personA born April 1948
    personA.SSbirthDate = new MonthYearDate(1948, 3, 1)
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.actualBirthDate = new Date(1952, 3, 15) //personB born April 1952
    personB.SSbirthDate = new MonthYearDate(1952, 3, 1)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.fixedRetirementBenefitDate = new MonthYearDate (2010, 4, 1) //personA filed at 62 and 1 month
    personB.fixedRetirementBenefitDate = new MonthYearDate (personB.FRA) //personB filed at FRA
    personA.initialAge = 70.5
    personB.initialAge = 66
    personA.initialAgeRounded = 70
    personB.initialAgeRounded = 66
    personA.PIA = 400
    personB.PIA = 2000
    personA.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    scenario.discountRate = 0
    expect(service.maximizeCouplePViterateOnePerson(scenario, personB, personA).solutionsArray[1].date)
    .toEqual(new MonthYearDate(2022, 3, 1))
    //We're looking at item [1] in the array. This array should have 3 items in it: personB beginSuspension date (today), personB endSuspension date (2022, age 70), personA spousal date (same as previous)
  }))

  it ('should tell personB not to suspend, if personB filed early at 64, has lower PIA, personA is over 70, and both have short life expectancy, high-ish discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let mortalityService:MortalityService = new MortalityService()
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personA.hasFiled = true
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SM2", 0)
    personA.actualBirthDate = new Date(1947, 2, 11) //personA born in March 1947
    personA.SSbirthDate = new MonthYearDate(1947, 2, 1)
    personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
    personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.fixedRetirementBenefitDate = new MonthYearDate (2015, 2, 11) //personA filed at 68
    personB.fixedRetirementBenefitDate = new MonthYearDate (2018, 3, 1) //personB filed at 64
    personA.initialAge = 71
    personB.initialAge = 64
    personA.initialAgeRounded = 71
    personB.initialAgeRounded = 64
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2000
    personB.PIA = 700
    personA.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    scenario.discountRate = 2
    let emptyArray: any[] = []
    expect(service.maximizeCouplePViterateOnePerson(scenario, personB, personA).solutionsArray)
    .toEqual(emptyArray)
    //Both people have already filed for retirement. B isn't going to suspend. A can't anymore since over 70. No spousal solution for A because PIA too high. No spousal solution for B because already filed for it. Array is empty.
  }))

  it ('should tell personA to suspend from FRA to 70 in divorce scenario, if filed early, zero discount rate, very long life expectancy, and no spousal or survivor to be had from ex-spouse', inject([PresentValueService], (service: PresentValueService) => {
    let mortalityService:MortalityService = new MortalityService()
    let birthdayService:BirthdayService = new BirthdayService()
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    personA.hasFiled = true
    scenario.maritalStatus = "divorced"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1954, 2, 11) //personA born in March 1954
    personA.SSbirthDate = new MonthYearDate(1954, 2, 1)
    personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
    personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
    scenario.initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0, 1)//initialCalcDate is year in which older reaches ages 62
    personA.initialAge = 64
    personB.initialAge = 64
    personA.initialAgeRounded = 64
    personB.initialAgeRounded = 64
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2000
    personB.PIA = 700
    personA.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2010,3,1) //already quit working
    personA.fixedRetirementBenefitDate = new MonthYearDate (2017, 2, 1) //personA filed at 63
    personB.fixedRetirementBenefitDate = new MonthYearDate (personB.FRA) //ex-spouse going to file at FRA
    scenario.discountRate = 0
    let results = service.maximizeCouplePViterateOnePerson(scenario, personA, personB)
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(personA.FRA))
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2024, 2, 1))
    //Should be 2 solution objects: begin suspension and end suspension date for personA. No spousal benefits for them. And it is divorce scenario, so no solution objects for personB.
  }))

})