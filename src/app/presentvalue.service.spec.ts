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



describe('test calculateSinglePersonPV', () => {
  let service:PresentValueService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.get(PresentValueService)
  })

  it('should be created', inject([PresentValueService], (service: PresentValueService) => {
    expect(service).toBeTruthy()
  }))

      //Test calculateSinglePersonPV()
      it('should return appropriate PV for single person, no complicating factors', () => {
        let person:Person = new Person("A")
        let scenario:CalculationScenario = new CalculationScenario
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
        person.initialAgeRounded = 58 //younger than 62 when fillling out form
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        let mortalityService:MortalityService = new MortalityService()
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(151765, 0)
      })
  
      it('should return appropriate PV for single person who files retroactive application as of their FRA', () => {
        let person:Person = new Person("A")
        let birthdayService:BirthdayService = new BirthdayService
        person.SSbirthDate = new MonthYearDate(1952, 3, 1) //Person born April 1952
        person.initialAgeRounded = 67
        person.FRA = birthdayService.findFRA(person.SSbirthDate) //FRA is age 66, so April 2018
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(person.FRA) //filing at FRA, which is retroactive
        let mortalityService:MortalityService = new MortalityService()
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        let scenario:CalculationScenario = new CalculationScenario
        scenario.discountRate = 1 //1% discount rate
        console.log(person)
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(175977, 0)
      })
    
      it('should return appropriate PV for single person, but with "still working" inputs and a different mortality table', () => { 
        let person:Person = new Person("A")
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.initialAgeRounded = 58
        person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2024, 3, 1) //filing at age 64
        person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work after filing date but before FRA, earnings test IS relevant
        person.monthlyEarnings = 4500 //Just picking something here...
        scenario.discountRate = 1 //1% discount rate
        let mortalityService:MortalityService = new MortalityService()
        person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(201310, 0)
      })
    
      it('should return appropriate PV for a single person who files at FRA but suspends immediately until 70', () => { 
        let person:Person = new Person("A")
        let scenario:CalculationScenario = new CalculationScenario()
        let birthdayService:BirthdayService = new BirthdayService()
        let mortalityService:MortalityService = new MortalityService()
        scenario.maritalStatus = "single"
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        person.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse A born in Sept 1970 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
        person.FRA = birthdayService.findFRA(person.SSbirthDate)
        person.PIA = 1000
        person.initialAgeRounded = 48
        person.retirementBenefitDate = new MonthYearDate (person.FRA) //Filing exactly at FRA of 67
        person.beginSuspensionDate = new MonthYearDate(person.FRA)
        person.endSuspensionDate = new MonthYearDate(2040, 8, 1)//Age 70
        scenario.discountRate = 1
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(151776, 0)//Point being, this is same PV as when somebody just waits until 70.
      })
  
      it('should return appropriate PV for single person, a newborn child, no other complicating factors', () => {
        let person:Person = new Person("A")
        let child1:Person = new Person("1")
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.initialAge = 59
        person.initialAgeRounded = 59
        child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins
        person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        let mortalityService:MortalityService = new MortalityService()
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        let benefitService:BenefitService = new BenefitService()
        person = benefitService.calculateFamilyMaximum(person)
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(265512, 0)
      })
  
      it('should return appropriate PV for single person, two newborn twins, no other complicating factors (confirming family max is being applied correctly)', () => {
        let person:Person = new Person("A")
        let child1:Person = new Person("1")
        let child2:Person = new Person("2")
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        scenario.children = [child1, child2]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.initialAge = 59
        person.initialAgeRounded = 59
        child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins (April 2030)
        child2.SSbirthDate = new MonthYearDate(2030, 3, 1) //child2 born in same month
        person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        let mortalityService:MortalityService = new MortalityService()
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        let benefitService:BenefitService = new BenefitService()
        person = benefitService.calculateFamilyMaximum(person)
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(323555, 0)
      })
  
      it('should return appropriate PV for single person, newborn triplets, no other complicating factors (family max should give it same PV as prior test)', () => {
        let person:Person = new Person("A")
        let child1:Person = new Person("1")
        let child2:Person = new Person("2")
        let child3:Person = new Person("3")
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        scenario.children = [child1, child2, child3]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.initialAge = 59
        person.initialAgeRounded = 59
        child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins (April 2030)
        child2.SSbirthDate = new MonthYearDate(2030, 3, 1) //child2 born in same month
        child3.SSbirthDate = new MonthYearDate(2030, 3, 1) //child3 born in same month
        person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        let mortalityService:MortalityService = new MortalityService()
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        let benefitService:BenefitService = new BenefitService()
        person = benefitService.calculateFamilyMaximum(person)
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(323555, 0)
      })
  
      it('should return appropriate PV for single person, adult disabled child, earnings test applicable, future benefit cut assumption', () => {
        let scenario:CalculationScenario = new CalculationScenario
        scenario.maritalStatus = "single"
        scenario.benefitCutAssumption = true
        scenario.benefitCutYear = 2034
        scenario.benefitCutPercentage = 23
        let person:Person = new Person("A")
        let child1:Person = new Person("1")
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.initialAge = 59
        person.initialAgeRounded = 59
        child1.SSbirthDate = new MonthYearDate(2000, 3, 1) //child1 born April 2000
        child1.isOnDisability = true
        let birthdayService:BirthdayService = new BirthdayService()
        person.FRA = birthdayService.findFRA(person.SSbirthDate)
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2023, 3, 1) //filing at age 63
        person.quitWorkDate = new MonthYearDate (2028, 3, 1) //Working until beyond FRA. Earnings test is relevant.
        person.monthlyEarnings = 3000
        scenario.discountRate = 1 //1% discount rate
        let mortalityService:MortalityService = new MortalityService()
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        let benefitService:BenefitService = new BenefitService()
        person = benefitService.calculateFamilyMaximum(person)
        expect(service.calculateSinglePersonPV(person, scenario, false))
          .toBeCloseTo(376859, 0)
      })
  
      //Integration testing -- not actually testing the calculated PV itself
      it('should show zero retirement benefit in table when a single person files before FRA and has high enough earnings', () => {
        let scenario:CalculationScenario = new CalculationScenario
        let birthdayService:BirthdayService = new BirthdayService()
        let personA: Person = new Person("A")
        let mortalityService:MortalityService = new MortalityService()
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personA.SSbirthDate = new MonthYearDate(1956, 6)//Born July 1956
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        personA.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        personA.monthlyEarnings = 10000
        personA.PIA = 1000
        personA.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 750 before ARF)
        service.calculateSinglePersonPV(personA, scenario, true)
        expect(scenario.outputTable[0][0])
            .toEqual(2018)
        expect(scenario.outputTable[0][1])
            .toEqual("$0")//First row in table should be "2018, 0"
      })
  
      it('should show appropriate retirement benefit in table when a single person files before FRA and has earnings to cause some but not complete withholding', () => {
        let scenario:CalculationScenario = new CalculationScenario
        let birthdayService:BirthdayService = new BirthdayService()
        let personA: Person = new Person("A")
        let mortalityService:MortalityService = new MortalityService()
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personA.SSbirthDate = new MonthYearDate(1956, 5)//Born June 1956
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        personA.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        personA.monthlyEarnings = 1500
        personA.PIA = 1000
        personA.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 750 before ARF)
        service.calculateSinglePersonPV(personA, scenario, true)
        expect(scenario.outputTable[0][0])
            .toEqual(2018)
        expect(scenario.outputTable[0][1])
            .toEqual("$1,770")//First row in table should be "2018, 1770"
        //annual earnings is 18000. (18000 - 17040)/2 = 480 annual withholding. $750 monthly benefit means 1 months withheld, 2 months received. $270 overwithholding added back.
      })
  
      it('should show appropriate adjustedRetirementBenefitDate, when a single person files before FRA and has earnings to cause some but not complete withholding', () => {
        let scenario:CalculationScenario = new CalculationScenario
        let birthdayService:BirthdayService = new BirthdayService()
        let personA: Person = new Person("A")
        let mortalityService:MortalityService = new MortalityService()
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personA.SSbirthDate = new MonthYearDate(1956, 5)//Born June 1956
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        personA.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        personA.monthlyEarnings = 1500
        personA.PIA = 1000
        personA.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 750 before ARF)
        service.calculateSinglePersonPV(personA, scenario, false)
        let expectedDate:MonthYearDate = new MonthYearDate(2019, 1)
        expect(personA.adjustedRetirementBenefitDate)
            .toEqual(expectedDate)
        //Filed Oct 2018. Needs 1 month withheld each of 2018, 2019, 2020, 2021. No withholding in 2022 due to higher threshold. So adjusted date should be 4 months later. (Feb 2019)
      })
})


describe('test maximizeSinglePersonPV', () => {
  let service:PresentValueService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.get(PresentValueService)
  })

  it('should tell a single person to file ASAP with very high discount rate', () => {
    let person:Person = new Person("A")
    let scenario:CalculationScenario = new CalculationScenario
    scenario.maritalStatus = "single"
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAge = 58
    person.PIA = 1000
    scenario.discountRate = 9 //9% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2022, 4, 1))
  })

  it('should tell a single person slightly past FRA to file retroactively at FRA with very high discount rate', () => {
    //This test is important, but unfortunately every 6 months it'll fail because the "no more than 6 months retroactive window" will have moved
    let person:Person = new Person("A")
    person.actualBirthDate = new Date(1952, 8, 15)
    person.SSbirthDate = new MonthYearDate(1952, 8) //SSBirthdate Sept 1952
    let birthdayService:BirthdayService = new BirthdayService
    person.FRA = birthdayService.findFRA(person.SSbirthDate) //FRA age 66 -> Sept 2018
    person.PIA = 1000
    let scenario:CalculationScenario = new CalculationScenario
    scenario.maritalStatus = "single"
    scenario.discountRate = 9 //9% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2018, 8))
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("retroactiveRetirement")
  })

  it('should tell a single person to suspend until 70 if filed early, long life expectancy, and zero discount rate', () => {
    let person:Person = new Person("A")
    let scenario:CalculationScenario = new CalculationScenario
    let birthdayService:BirthdayService = new BirthdayService()
    let mortalityService:MortalityService = new MortalityService()
    scenario.maritalStatus = "single"
    person.hasFiled = true
    person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    person.actualBirthDate = new Date(1953, 3, 15) //Person born April 16 1953
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
  })

  it('should tell a single person to file ASAP with disabled child, 1% discount rate and SSA life expectancy', () => {
    let person:Person = new Person("A")
    let child:Person = new Person("1")
    let scenario:CalculationScenario = new CalculationScenario
    scenario.maritalStatus = "single"
    scenario.children = [child]
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
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
  })

  it('should tell a single person who has already filed and who has disabled child not to do anything (no suspension)', () => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1954, 3, 1)
    person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
    person.PIA = 1000
    person.hasFiled = true
    person.retirementBenefitDate = new MonthYearDate(2017, 4) //Filed May 2017
    let child:Person = new Person("1")
    child.SSbirthDate = new MonthYearDate(1990, 7)
    child.isOnDisability = true
    child.hasFiled = true
    let scenario:CalculationScenario = new CalculationScenario
    scenario.maritalStatus = "single"
    scenario.children = [child]
    scenario.discountRate = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("doNothing")
  })

  it('When child is eligible for benefit now but has not yet filed, should tell child to file immediately', () => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1954, 3, 1)
    person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
    person.PIA = 1000
    person.hasFiled = true
    person.retirementBenefitDate = new MonthYearDate(2017, 4) //Filed May 2017
    let child:Person = new Person("1")
    child.SSbirthDate = new MonthYearDate(1990, 7)
    child.isOnDisability = true
    let scenario:CalculationScenario = new CalculationScenario
    scenario.maritalStatus = "single"
    scenario.children = [child]
    scenario.discountRate = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    let today:MonthYearDate = new MonthYearDate()
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("child")
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(today)
  })
  
})

fdescribe('tests calculateCouplePV', () => {
  let service:PresentValueService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.get(PresentValueService)
  })

    //Test the actual present value calculated
    it('should return appropriate PV for married couple, basic inputs', () => { 
      let personA:Person = new Person("A")
      let personB:Person = new Person("B")
      let scenario:CalculationScenario = new CalculationScenario()
      scenario.maritalStatus = "married"
      let mortalityService:MortalityService = new MortalityService()
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      personA.initialAgeRounded = 54
      personB.initialAgeRounded = 55
      let birthdayService:BirthdayService = new BirthdayService()
      personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //Sept 2031
      personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //July 2030
      personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
      personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
      personA.PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
      personB.retirementBenefitDate = new MonthYearDate (2029, 8, 1) //At age 66 and 2 months
      personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false))
        .toBeCloseTo(578594, 0)
    })
  
    it('should return appropriate PV for married couple, basic inputs, one filing early one late', () => { 
      let personA:Person = new Person("A")
      let personB:Person = new Person("B")
      let scenario:CalculationScenario = new CalculationScenario()
      scenario.maritalStatus = "married"
      let mortalityService:MortalityService = new MortalityService()
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) //Using male nonsmoker2 mortality table
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1960, 3, 1) //Spouse A born in April 1960
      personB.SSbirthDate = new MonthYearDate(1960, 3, 1) //Spouse B born in April 1960
      personA.initialAgeRounded = 59
      personB.initialAgeRounded = 59
      let birthdayService:BirthdayService = new BirthdayService()
      personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //April 2027
      personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //April 2027
      personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
      personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
      personA.PIA = 1000
      personB.PIA = 1000
      personA.retirementBenefitDate = new MonthYearDate (2030, 3) //At age 70
      personB.retirementBenefitDate = new MonthYearDate (2022, 5) //At age 62 and 2 months
      personA.spousalBenefitDate = new MonthYearDate (2030, 3) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2030, 3) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false))
        .toBeCloseTo(353854, 0)//$353,854 is PV for those dates from current live version of site
    })
  
  
    it('should return appropriate PV for married couple, still working', () => { 
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
    })
  
    it('should return appropriate PV for married couple, still working, filing early with partial withholding and overwithholding', () => { 
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
      personA.PIA = 1200
      personB.PIA = 1500
      personA.retirementBenefitDate = new MonthYearDate (2027, 8, 1) //At age 63
      personB.retirementBenefitDate = new MonthYearDate (2027, 8, 1) //At age 64 and 2 months
      personA.spousalBenefitDate = new MonthYearDate (2027, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2027, 8, 1) //Later of two retirement benefit dates
      personA.quitWorkDate = new MonthYearDate(2034, 8) //planning to quit work at age 70
      personB.quitWorkDate = new MonthYearDate(2033, 8) //planning to quit work at at 70
      personA.monthlyEarnings = 2000
      personB.monthlyEarnings = 2000
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false))
        .toBeCloseTo(510675, 0)
    })
  
    it ('should return appropriate PV for married couple, including GPO', () => {
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
    })

    it ('should return appropriate PV for basic divorce scenario', () => {
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
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are zero), both file at FRA but suspend immediately until 70', () => { 
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
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are relevant), both file at FRA and suspend immediately until 70', () => { 
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
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are relevant). PersonB is disabled prior to 62. He suspends FRA to 70. Person A files at 70 for retirement and spousal.', () => { 
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
      personA.initialAgeRounded = 49
      personB.initialAgeRounded = 49
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
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, true))
        .toBeCloseTo(712879, 0)//Went year-by-year checking benefit amounts. They're good. There is a question of how to calculate PV though (i.e., to what point do we discount everything. See todo.txt)
    })
  
      //tests for calculateCouplePV() that don't focus on ending PV
      it('should appropriately reflect personB spousal benefit being partially withheld based on personA excess earnings', () => {
        let birthdayService:BirthdayService = new BirthdayService()
        let personA: Person = new Person("A")
        personA.actualBirthDate = new Date(1956, 5, 10) //born June 1956
        personA.SSbirthDate = birthdayService.findSSbirthdate(6, 10, 1956)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personA.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        personA.monthlyEarnings = 1900
        personA.PIA = 1800
        personA.retirementBenefitDate = new MonthYearDate(2019, 9, 1) //Applying for retirement benefit October 2019 (36 months prior to FRA -> monthly benefit is 80% of PIA)
        personA.spousalBenefitDate = new MonthYearDate(2019, 9, 1) //later of two retirementBenefitDates
        let personB: Person = new Person("B")
        personB.actualBirthDate = new Date(1956, 5, 10) //born June 1956
        personB.SSbirthDate = birthdayService.findSSbirthdate(6, 10, 1956)
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personB.PIA = 500
        personB.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 75% of PIA)
        personB.spousalBenefitDate = new MonthYearDate(2019, 9, 1) //later of two retirement benefit dates
        let scenario:CalculationScenario = new CalculationScenario()
        scenario.maritalStatus = "married"
        let mortalityService:MortalityService = new MortalityService()
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        service.calculateCouplePV(personA, personB, scenario, true)
        /*calc by hand for 2019...
        personA's retirement benefit is $1440 (80% of PIA)
        personA's spousal benefit is $0
        personB's retirement benefit is $375 (75% of PIA)
        personB's spousal benefit (36 months early) = 0.75 x (1800/2 - 500) = $300
        PersonA has 22800 annual earnings -> (22800 - 17040)/2 = 2880 annual withholding
        monthly amount available for withholding = 1440 + 300 = 1740
        2 months of retirement withheld from A and 2 months of spousal withheld from B, and some overwithholding
        personB should actually *get* one month of spousal benefit (personA filed in October, 2 months withheld)
        */
        expect(scenario.outputTable[1][5]).toEqual("$300")//First row is 2018. We want 2019, so second row. Spousal benefit for personB is 6th column.
      })

      it('Should calculate total annual retirement benefit and spousal benefits appropriately when personA is suspended for part of year, affecting their own retirement as well as spousal benefit of personB', () => {
        let birthdayService:BirthdayService = new BirthdayService()
        let mortalityService:MortalityService = new MortalityService()
        let personA: Person = new Person("A")
        let personB: Person = new Person("B")
        let scenario:CalculationScenario = new CalculationScenario()
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        personA.PIA = 2300
        personB.PIA = 600
        personA.actualBirthDate = new Date (1974, 9, 13) //October 1974
        personB.actualBirthDate = new Date (1975, 11, 27) //December 1975
        personA.SSbirthDate = new MonthYearDate(1974, 9)
        personB.SSbirthDate = new MonthYearDate(1975, 11)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        let today:MonthYearDate = new MonthYearDate()
        personA.initialAge =  ( today.getMonth() - personA.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personA.SSbirthDate.getFullYear()) )/12
        personA.initialAgeRounded = Math.round(personA.initialAge)
        personB.initialAge =  ( today.getMonth() - personB.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personB.SSbirthDate.getFullYear()) )/12
        personB.initialAgeRounded = Math.round(personB.initialAge)
        personA.retirementBenefitDate = new MonthYearDate(2038, 9) //files at 64
        personB.retirementBenefitDate = new MonthYearDate(2038, 1) //files at 62 and 2 months
        personA.spousalBenefitDate = new MonthYearDate(2038, 9) //later of two retirement benefit dates
        personB.spousalBenefitDate = new MonthYearDate(2038, 9) //later of two retirement benefit dates
        personA.beginSuspensionDate = new MonthYearDate(2041, 9) //suspends at FRA of 67
        personA.endSuspensionDate = new MonthYearDate(2042, 3) //ends suspension in following year
        expect(service.calculateCouplePV(personA, personB, scenario, true)).toBeCloseTo(599791, 0)
        //manual calculation
          //personA retirement benefit = 1840 (80% of PIA, due to 36 months early)
          //personB retirement benefit = 425 (70.83333% of PIA due to 58 months early)
          //personB spousal benefit = 380.41 (69.166666% due to 50 months early) x [2300/2 - 600]
          //in 2041, suspension happens in October, so personA gets 9 months of retirement. personB gets 12 months of retirement and 9 months of spousal
          //2038 is first row of table, so 2041 is row [3]
        expect(scenario.outputTable[3][1]).toEqual("$16,560") //personA retirement amount should be 1840 x 9 = 16,560
        expect(scenario.outputTable[3][4]).toEqual("$5,100") //personB retirement amount should be 425 x 12 = 5,100
        expect(scenario.outputTable[3][5]).toEqual("$3,424") //personB spousal amount should be $380.41 x 9 = $3,423.69
      })

      it('Should calculate annual retirement and spousal benefits appropriately in year in which personB hits FRA, triggering ARF from withholding in some prior year', () => {
        let birthdayService:BirthdayService = new BirthdayService()
        let mortalityService:MortalityService = new MortalityService()
        let personA: Person = new Person("A")
        let personB: Person = new Person("B")
        let scenario:CalculationScenario = new CalculationScenario()
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        personA.PIA = 800
        personB.PIA = 2000
        personA.actualBirthDate = new Date (1980, 2, 5) //March 1980
        personB.actualBirthDate = new Date (1982, 6, 21) //July 1982
        personA.SSbirthDate = new MonthYearDate(1980, 2)
        personB.SSbirthDate = new MonthYearDate(1982, 6)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2047
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //July 2049
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.retirementBenefitDate = new MonthYearDate(2043, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2047, 6) //files at 65
        personA.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates
        personB.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates
        personB.quitWorkDate = new MonthYearDate(2048, 0) //Working until Jan 2048
        personB.monthlyEarnings = 3000
        let today:MonthYearDate = new MonthYearDate()
        personA.initialAge =  ( today.getMonth() - personA.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personA.SSbirthDate.getFullYear()) )/12
        personA.initialAgeRounded = Math.round(personA.initialAge)
        personB.initialAge =  ( today.getMonth() - personB.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personB.SSbirthDate.getFullYear()) )/12
        personB.initialAgeRounded = Math.round(personB.initialAge)
        expect(service.calculateCouplePV(personA, personB, scenario, true)).toBeCloseTo(519114, 0)
        //manual calculation
          //personA retirement benefit = 600 (75% due to filing 48 months early)
          //personB retirement benefit = 1733.3333 (86.666% of PIA due to filing 24 months early)
          //personA spousal benefit = 200 (2000/2 - 800). No need for reduction because isn't claimed until after FRA
          //in 2047, personB has earnings of 36k: withholding of (36000 - 17040)/2 = 9480
          //available for withholding per month on personB's work record: 1933.33 -> 5 months of withholding necessary
          //at FRA (July 2049) personB has benefit adjusted as if only filed 19 months early. New monthly benefit should be 1788.888888
          //2043 is first row of table, so 2049 is row [6]
          expect(scenario.outputTable[6][4]).toEqual("$21,133") //personB retirement amount should be 1733.333 x 6 + 1788.8888 x 6 = $21,133.33
          //personA doesn't file for spousal benefit until after FRA, so never gets an ARF
          expect(scenario.outputTable[6][2]).toEqual("$2,400") //personA gets $200 spousal benefit every month once it begins (except in 2047 when 5 months is withheld)
          expect(scenario.outputTable[6][1]).toEqual("$7,200") //personA gets $600 retirement benefit every month
      })

      fit('Should calculate annual retirement and spousal benefits appropriately in year in which personA hits FRA, triggering ARF for spousal benefit due to withholding from other personB earnings in prior year', () => {
        let birthdayService:BirthdayService = new BirthdayService()
        let mortalityService:MortalityService = new MortalityService()
        let personA: Person = new Person("A")
        let personB: Person = new Person("B")
        let scenario:CalculationScenario = new CalculationScenario()
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        personA.PIA = 800
        personB.PIA = 2000
        personA.actualBirthDate = new Date (1982, 2, 5) //March 1982
        personB.actualBirthDate = new Date (1982, 6, 21) //July 1982
        personA.SSbirthDate = new MonthYearDate(1982, 2)
        personB.SSbirthDate = new MonthYearDate(1982, 6)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2049
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //July 2049
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.retirementBenefitDate = new MonthYearDate(2045, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2047, 6) //files at 65
        personA.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates (65 and 4 months)
        personB.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates (age 65, not that it's relevant)
        personB.quitWorkDate = new MonthYearDate(2048, 0) //Working until Jan 2048
        personB.monthlyEarnings = 2800
        let today:MonthYearDate = new MonthYearDate()
        personA.initialAge =  ( today.getMonth() - personA.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personA.SSbirthDate.getFullYear()) )/12
        personA.initialAgeRounded = Math.round(personA.initialAge)
        personB.initialAge =  ( today.getMonth() - personB.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personB.SSbirthDate.getFullYear()) )/12
        personB.initialAgeRounded = Math.round(personB.initialAge)
        expect(service.calculateCouplePV(personA, personB, scenario, true)).toBeCloseTo(535159, 0)
        console.log(scenario.outputTable)
        //manual calculation
          //personA retirement benefit = 600 (75% due to filing 48 months early) 
          //personA spousal benefit (20 months early) = 86.111% * (2000/2 - 800) = $172.2222
          //personB retirement benefit = 1733.3333 (86.666% of PIA due to filing 24 months early)
          //in 2047, personB has earnings of 33,600: withholding of (33600 - 17040)/2 = 8280
          //available for withholding per month on personB's work record: $1,905.55 -> 5 months of withholding necessary
          //in March 2049, personA gets ARF, and spousal benefit is adjusted as if filed 15 months early instead of 20
          //new spousal benefit should be 0.895833 * (2000/2 - 800) = $179.1666
          //table begins in 2045, so 2049 is row [4]
          expect(scenario.outputTable[4][2]).toEqual("$2,136") //2 months at $172.222 and 10 months at $179.1666 = $2,136.11
          expect(scenario.outputTable[4][1]).toEqual("$7,200") //personA gets $600 retirement benefit every month (never had any withholding of retirement benefit, so should be no ARF for it)
      })

})

  describe('Tests for maximizeCouplePViterateBothPeople', () => {
    let service:PresentValueService
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
      })
      service = TestBed.get(PresentValueService)
    })

    it ('should tell a high-PIA spouse to wait until 70, with low discount rate and long lifespans', () => {
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
    })
  
    it ('should tell a high-PIA spouse to file a restricted app when possible', () => {
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
    })
  
    it ('should tell personA to wait until 70, even with slightly lower PIA, if personB filed early at 62, given low discount rate and long life expectancies', () => {
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
    })
  
    it ('should tell personA to file ASAP, even if personB filed early at 62, if personA has lower PIA (such that even delaying wouldnnt result in higher last-to-die benefit', () => {
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
    })
  
    it ('should tell personA to suspend until 70, if personA filed early at 62 and has the much higher PIA', () => {
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
    })
  
    it ('should tell personA not to suspend, if personA filed early at 64, has lower PIA, personB hasnt filed, and both have short life expectancy, high-ish discount rate', () => {
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
    })
  
    it ('should tell personA to file at 68, if they have higher PIA, personB has normal life expectancy, and they are using A-dies-at-68 assumption', () => {
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
    })
  
    it ('should tell personA to suspend from FRA to 70, if personA is disabled, personA has higher PIA, both have normal life expectancies', () => {
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
    })
  
    it ('should tell personB to file for spousal benefits ASAP (even though personA is younger than 62 at the time), if personA is disabled, personA has much higher PIA, one has a short life expectancy, and high-ish discount rate. Should also tell personA to suspend at FRA', () => {
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
    })

  })

  describe('Tests for maximizeCouplePViterateOnePerson', () => {
    let service:PresentValueService
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
      })
      service = TestBed.get(PresentValueService)
    })

  it ('should tell a divorced user with significantly lower PIA to file ASAP', () => {
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
  })
  
  it ('should tell a divorced user with higher PIA and an ex who filed early (so essentially a single person) to file at 70 given long life expectancy and low discount rate', () => {
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
  })

  it ('should tell personB to wait until 70 if personA is over 70 and filed early, personB has the much higher PIA, both have long life expectancies, and low discount rate', () => {
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
    let today:MonthYearDate = new MonthYearDate()
    personA.initialAge =  ( today.getMonth() - personA.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personA.SSbirthDate.getFullYear()) )/12
    personA.initialAgeRounded = Math.round(personA.initialAge)
    personB.initialAge =  ( today.getMonth() - personB.SSbirthDate.getMonth() + 12 * (today.getFullYear() - personB.SSbirthDate.getFullYear()) )/12
    personB.initialAgeRounded = Math.round(personB.initialAge)
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
  })

  it ('should tell personA to file ASAP if they have lower PIA and personB is much older (over 70), highish discount rate', () => {
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
  })

  it ('should tell personB to suspend until 70 if they already filed at FRA, personA is over 70 and filed early, personB has much higher PIA, both have long life expectancies, and low discount rate', () => {
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
  })

  it ('should tell personB not to suspend, if personB filed early at 64, has lower PIA, personA is over 70, and both have short life expectancy, high-ish discount rate', () => {
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
    expect(service.maximizeCouplePViterateOnePerson(scenario, personB, personA).solutionsArray[0].benefitType)
    .toEqual("doNothing")
    //Both people have already filed for retirement. B isn't going to suspend. A can't anymore since over 70. No spousal solution for A because PIA too high. No spousal solution for B because already filed for it. "doNothing" solution.
  })

  it ('should tell personA to suspend from FRA to 70 in divorce scenario, if filed early, zero discount rate, very long life expectancy, and no spousal or survivor to be had from ex-spouse', ( )=> {
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
  })

})