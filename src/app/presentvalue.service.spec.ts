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
import {FamilyMaximumService} from './familymaximum.service'
import { ClaimStrategy } from './data model classes/claimStrategy'

//Util used to replace certain things that would happen in real life application, but which need to be done in tests because getPrimaryFormInputs() never gets called
function mockGetPrimaryFormInputs(person:Person, today:MonthYearDate, birthdayService:BirthdayService, benefitService:BenefitService, mortalityService:MortalityService){
  person.FRA = birthdayService.findFRA(person.SSbirthDate)
  person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate)
  person.initialAge =  birthdayService.findAgeOnDate(person, today)
  person.initialAgeRounded = Math.round(person.initialAge)
  person.baseMortalityFactor = mortalityService.calculateBaseMortalityFactor(person)
  benefitService.checkWhichPIAtoUse(person, today)//checks whether person is *entitled* to gov pension (by checking eligible and pension beginning date) and sets PIA accordingly based on one of two PIA inputs
}

describe('test calculateSinglePersonPV', () => {
  let service:PresentValueService
  let birthdayService:BirthdayService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let familyMaximumService:FamilyMaximumService
  let earningsTestService:EarningsTestService
  let scenario:CalculationScenario
  let person:Person
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.get(PresentValueService)
    birthdayService = TestBed.get(BirthdayService)
    benefitService = TestBed.get(BenefitService)
    mortalityService = TestBed.get(MortalityService)
    familyMaximumService = TestBed.get(FamilyMaximumService)
    earningsTestService = TestBed.get(EarningsTestService)
    scenario = new CalculationScenario()
    person = new Person("A")
  })

  it('should be created', inject([PresentValueService], (service: PresentValueService) => {
    expect(service).toBeTruthy()
  }))

      //Test calculateSinglePersonPV()
      it('FAIL 4 should return appropriate PV for single person, no complicating factors', () => {
        service.today = new MonthYearDate(2019, 7)
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        // person.maxAge = mortalityService.determineMaxAge(person.mortalityTable)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(142644, 0)
      })
  
      it('FAIL 6 should return appropriate PV for single person who files retroactive application as of their FRA', () => {
        service.today = new MonthYearDate(2018, 9)
        person.SSbirthDate = new MonthYearDate(1952, 3, 1) //Person born April 1952
        person.PIA = 1000
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        // person.maxAge = mortalityService.determineMaxAge(person.mortalityTable)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person.retirementBenefitDate = new MonthYearDate(person.FRA) //filing at FRA, which is retroactive (note that this line has to come after mockGetPrimaryFormInputs, which sets the person's FRA)
        scenario.discountRate = 1 //1% discount rate
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(183581, 0)
      })
    
      it('FAIL 3 should return appropriate PV for single person, but with "still working" inputs and a different mortality table', () => { 
        service.today = new MonthYearDate(2019, 7)
        scenario.maritalStatus = "single"
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2024, 3, 1) //filing at age 64
        person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work after filing date but before FRA, earnings test IS relevant
        person.monthlyEarnings = 4500 //Just picking something here...
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable(person, "female", "NS1", 0) //Using female nonsmoker1 mortality table
        // person.maxAge = mortalityService.determineMaxAge(person.mortalityTable)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(194237, 0)
      })
    
      it('FAIL 2 should return appropriate PV for a single person who files at FRA but suspends immediately until 70', () => { 
        service.today = new MonthYearDate(2019, 7)
        scenario.maritalStatus = "single"
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        person.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse A born in Sept 1970
        person.PIA = 1000
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person.retirementBenefitDate = new MonthYearDate (person.FRA) //Filing exactly at FRA of 67
        person.beginSuspensionDate = new MonthYearDate(person.FRA)
        person.endSuspensionDate = new MonthYearDate(2040, 8, 1)//Age 70
        scenario.discountRate = 1
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(119860, 0)//Point being, this is same PV as when somebody just waits until 70.
      })
  
      it('FAIL 7 should return appropriate PV for single person, a newborn child, no other complicating factors', () => {
        service.today = new MonthYearDate(2019, 7)
        let child1:Person = new Person("1")
        scenario.maritalStatus = "single"
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(256458, 0)
      })
  
      it('FAIL 1 should return appropriate PV for single person, two newborn twins, no other complicating factors (confirming family max is being applied correctly)', () => {
        service.today = new MonthYearDate(2019, 0)
        let child1:Person = new Person("1")
        let child2:Person = new Person("2")
        scenario.maritalStatus = "single"
        scenario.children = [child1, child2]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins (April 2030)
        child2.SSbirthDate = new MonthYearDate(2030, 3, 1) //child2 born in same month
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(317915, 0)
      })
  
      it('FAIL 5 should return appropriate PV for single person, newborn triplets, no other complicating factors (family max should give it same PV as prior test)', () => {
        service.today = new MonthYearDate(2019, 0)
        let child1:Person = new Person("1")
        let child2:Person = new Person("2")
        let child3:Person = new Person("3")
        scenario.maritalStatus = "single"
        scenario.children = [child1, child2, child3]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins (April 2030)
        child2.SSbirthDate = new MonthYearDate(2030, 3, 1) //child2 born in same month
        child3.SSbirthDate = new MonthYearDate(2030, 3, 1) //child3 born in same month
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(317915, 0)
      })
  
      it('should return appropriate PV for single person, 18-year-old mortal disabled child, earnings test applicable, future benefit cut assumption', () => {
        console.log("18-year-old disabled mortal child, earnings test applicable")
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        scenario.maritalStatus = "single"
        scenario.benefitCutAssumption = true
        scenario.benefitCutYear = 2034
        scenario.benefitCutPercentage = 23
        let child1:Person = new Person("1")
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(2000, 3, 1) //child1 born April 2000
        child1.isOnDisability = true
        scenario.disabledChild = true
        scenario.disabledChildPerson = child1
        scenario.disabledChildPerson.initialAgeRounded = 19
        // assume child has a typical mortality table
        mortalityService.determineMortalityTable(scenario.disabledChildPerson, "male", "SSA", 0);
        scenario.disabledChildPerson.baseMortalityFactor = mortalityService.calculateBaseMortalityFactor(child1);
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2023, 3, 1) //filing at age 63
        person.quitWorkDate = new MonthYearDate (2028, 3, 1) //Working until beyond FRA. Earnings test is relevant.
        person.monthlyEarnings = 3000
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable (person, "male", "SSA", 0)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
        .toBeCloseTo(334155, 0)
      })
  
      it('should return appropriate PV for single person, 18-year-old immortal disabled child, earnings test applicable, future benefit cut assumption', () => {
        console.log("18-year-old disabled immortal child, earnings test applicable")
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        scenario.maritalStatus = "single"
        scenario.benefitCutAssumption = true
        scenario.benefitCutYear = 2034
        scenario.benefitCutPercentage = 23
        let child1:Person = new Person("1")
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(2000, 3, 1) //child1 born April 2000
        child1.isOnDisability = true
        scenario.disabledChild = true
        scenario.disabledChildPerson = child1
        scenario.disabledChildPerson.initialAgeRounded = 19
        // assume child doesn't die until age 200 (practically immortal)
        mortalityService.determineMortalityTable(scenario.disabledChildPerson, "male", "fixed", 200);
        scenario.disabledChildPerson.baseMortalityFactor = mortalityService.calculateBaseMortalityFactor(child1);
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2023, 3, 1) //filing at age 63
        person.quitWorkDate = new MonthYearDate (2028, 3, 1) //Working until beyond FRA. Earnings test is relevant.
        person.monthlyEarnings = 3000
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(357059, 0)
      })
  
      it('should return appropriate PV for single person, 38-year old mortal disabled child, earnings test applicable, future benefit cut assumption', () => {
        console.log("38-year old disabled mortal child, earnings test applicable")
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        scenario.maritalStatus = "single"
        scenario.benefitCutAssumption = true
        scenario.benefitCutYear = 2034
        scenario.benefitCutPercentage = 23
        let child1:Person = new Person("1")
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(1980, 3, 1) //child1 born April 1980
        child1.isOnDisability = true
        scenario.disabledChild = true
        scenario.disabledChildPerson = child1
        scenario.disabledChildPerson.initialAgeRounded = 39
        // assume child has a typical mortality table
        mortalityService.determineMortalityTable(scenario.disabledChildPerson, "male", "SSA", 0);
        scenario.disabledChildPerson.baseMortalityFactor = mortalityService.calculateBaseMortalityFactor(child1);
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2023, 3, 1) //filing at age 63
        person.quitWorkDate = new MonthYearDate (2028, 3, 1) //Working until beyond FRA. Earnings test is relevant.
        person.monthlyEarnings = 3000
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable (person, "male", "SSA", 0)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
        .toBeCloseTo(282680, 0)
      })
  
      it('should return appropriate PV for single person, 38-year old disabled mortal child and 4-year-old non-disabled non-disabled child, earnings test applicable, future benefit cut assumption', () => {
        console.log("38-year old disabled mortal child and 4-year-old non-disabled, earnings test applicable")
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        scenario.maritalStatus = "single"
        scenario.benefitCutAssumption = true
        scenario.benefitCutYear = 2034
        scenario.benefitCutPercentage = 23
        let child1:Person = new Person("1")
        let child2:Person = new Person("2")
        scenario.children = [child1, child2]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(1980, 3, 1) //child1 born April 1980
        child2.SSbirthDate = new MonthYearDate(2014, 3, 1) //child2 born April 2014
        child1.isOnDisability = true
        scenario.disabledChild = true
        scenario.disabledChildPerson = child1
        scenario.disabledChildPerson.initialAgeRounded = 19
        // assume child doesn't die until age 200 (practically immortal)
        mortalityService.determineMortalityTable(scenario.disabledChildPerson, "male", "SSA", 0);
        scenario.disabledChildPerson.baseMortalityFactor = mortalityService.calculateBaseMortalityFactor(child1);
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2022, 3, 1) //filing at age 62
        person.quitWorkDate = new MonthYearDate (2028, 3, 1) //Working until beyond FRA. Earnings test is relevant.
        person.monthlyEarnings = 3000
        scenario.discountRate = 1 //1% discount rate
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(288943, 0)
      })
  
      //Integration testing -- not actually testing the calculated PV itself
      it('should show zero retirement benefit in table when a single person files before FRA and has high enough earnings', () => {
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        person.SSbirthDate = new MonthYearDate(1956, 6)//Born July 1956
        person.FRA = birthdayService.findFRA(person.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        person.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        person.monthlyEarnings = 10000
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 750 before ARF)
        let claimStrategy:ClaimStrategy = service.calculateSinglePersonPV(person, scenario, true)
        expect(claimStrategy.outputTable[0][0])
            .toEqual(2018)
        expect(claimStrategy.outputTable[0][1])
            .toEqual("$0")//First row in table should be "2018, 0"
      })
  
      it('should show appropriate retirement benefit in table when a single person files before FRA and has earnings to cause some but not complete withholding', () => {
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        person.SSbirthDate = new MonthYearDate(1956, 5)//Born June 1956
        person.FRA = birthdayService.findFRA(person.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        person.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        person.monthlyEarnings = 1500
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 750 before ARF)
        let claimStrategy:ClaimStrategy = service.calculateSinglePersonPV(person, scenario, true)
        expect(claimStrategy.outputTable[0][0])
            .toEqual(2018)
        expect(claimStrategy.outputTable[0][1])
            .toEqual("$1,770")//First row in table should be "2018, 1770"
        //annual earnings is 18000. (18000 - 17040)/2 = 480 annual withholding. $750 monthly benefit means 1 months withheld, 2 months received. $270 overwithholding added back.
      })
  
      it('should show appropriate adjustedRetirementBenefitDate, when a single person files before FRA and has earnings to cause some but not complete withholding', () => {
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        mortalityService.determineMortalityTable(person, "male", "SSA", 0)
        person.SSbirthDate = new MonthYearDate(1956, 5)//Born June 1956
        person.FRA = birthdayService.findFRA(person.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        person.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        person.monthlyEarnings = 1500 //Annual earnings = $18,000
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 750 before ARF)
        service.calculateSinglePersonPV(person, scenario, false)
        let expectedDate:MonthYearDate = new MonthYearDate(2019, 1)
        expect(person.adjustedRetirementBenefitDate)
            .toEqual(expectedDate)
        //Filed Oct 2018. Needs 1 month withheld each of 2018, 2019, 2020, 2021. No withholding in 2022 due to higher threshold. So adjusted date should be 4 months later. (Feb 2019)
      })
})


describe('test maximizeSinglePersonPV', () => {
  let service:PresentValueService
  let benefitService:BenefitService
  let birthdayService:BirthdayService
  let mortalityService:MortalityService
  let scenario:CalculationScenario
  let person:Person

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.get(PresentValueService)
    benefitService = TestBed.get(BenefitService)
    birthdayService = TestBed.get(BirthdayService)
    mortalityService = TestBed.get(MortalityService)
    scenario = new CalculationScenario()
    person = new Person("A")
  })

  it('should tell a single person to file ASAP with very high discount rate', () => {
    service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
    scenario.maritalStatus = "single"
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.PIA = 1000
    scenario.discountRate = 9 //9% discount rate
    mortalityService.determineMortalityTable(person, "male", "SSA", 0)
    mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2022, 4, 1))
  })

  it('should tell a single person slightly past FRA to file retroactively at FRA with very high discount rate', () => {
    service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
    person.actualBirthDate = new Date(1952, 8, 15)
    person.SSbirthDate = new MonthYearDate(1952, 8) //SSBirthdate Sept 1952
    person.FRA = birthdayService.findFRA(person.SSbirthDate) //FRA age 66 -> Sept 2018
    person.PIA = 1000
    scenario.maritalStatus = "single"
    scenario.discountRate = 9 //9% discount rate
    mortalityService.determineMortalityTable(person, "male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2018, 8))
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("retroactiveRetirement")
  })

  it('should tell a single person to suspend until 70 if filed early, long life expectancy, and zero discount rate', () => {
    service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
    scenario.maritalStatus = "single"
    person.hasFiled = true
    mortalityService.determineMortalityTable(person, "female", "NS1", 0)
    person.actualBirthDate = new Date(1953, 3, 15) //Person born April 16 1953
    person.SSbirthDate = new MonthYearDate(1953, 3, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
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
    service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
    let child:Person = new Person("1")
    scenario.maritalStatus = "single"
    scenario.children = [child]
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.PIA = 1000
    child.SSbirthDate = new MonthYearDate(1990, 7)
    child.isOnDisability = true
    scenario.discountRate = 1 //1% discount rate
    mortalityService.determineMortalityTable(person, "male", "SSA", 0)
    mockGetPrimaryFormInputs(person, service.today, birthdayService, benefitService, mortalityService)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2022, 4, 1))
  })

  it('should tell a single person who has already filed and who has disabled child not to do anything (no suspension)', () => {
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
    person.PIA = 1000
    person.hasFiled = true
    person.retirementBenefitDate = new MonthYearDate(2017, 4) //Filed May 2017
    let child:Person = new Person("1")
    child.SSbirthDate = new MonthYearDate(1990, 7)
    child.isOnDisability = true
    child.hasFiled = true
    scenario.maritalStatus = "single"
    scenario.children = [child]
    scenario.discountRate = 1 //1% discount rate
    mortalityService.determineMortalityTable(person, "male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("doNothing")
  })

  it('When child is eligible for benefit now but has not yet filed, should tell child to file immediately', () => {
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.FRA = new MonthYearDate (2027, 3, 1) //FRA April 2027 (age 67)
    person.PIA = 1000
    person.hasFiled = true
    person.retirementBenefitDate = new MonthYearDate(2017, 4) //Filed May 2017
    let child:Person = new Person("1")
    child.SSbirthDate = new MonthYearDate(1990, 7)
    child.isOnDisability = true
    scenario.maritalStatus = "single"
    scenario.children = [child]
    scenario.discountRate = 1 //1% discount rate
    mortalityService.determineMortalityTable(person, "male", "SSA", 0)
    let today:MonthYearDate = new MonthYearDate()
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("child")
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(today)
  })
  
})

describe('tests calculateCouplePV', () => {
  let service:PresentValueService
  let birthdayService:BirthdayService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let familyMaximumService:FamilyMaximumService
  let earningsTestService:EarningsTestService
  let scenario:CalculationScenario
  let personA:Person
  let personB:Person

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.get(PresentValueService)
    birthdayService = TestBed.get(BirthdayService)
    benefitService = TestBed.get(BenefitService)
    mortalityService = TestBed.get(MortalityService)
    familyMaximumService = TestBed.get(FamilyMaximumService)
    earningsTestService = TestBed.get(EarningsTestService)
    scenario = new CalculationScenario()
    personA = new Person("A")
    personB = new Person("B")
  })

    //Test the actual present value calculated
    it('should return appropriate PV for married couple, basic inputs', () => {
      service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "NS2", 0) //Using male nonsmoker2 mortality table
      mortalityService.determineMortalityTable(personB, "female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
      personB.retirementBenefitDate = new MonthYearDate (2029, 8, 1) //At age 66 and 2 months
      personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(530272, 0)
    })
  
    it('should return appropriate PV for married couple, basic inputs, no spousal benefits, one filing early one late', () => {
      service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1960, 3, 1) //Spouse A born in April 1960
      personB.SSbirthDate = new MonthYearDate(1960, 3, 1) //Spouse B born in April 1960
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 1000
      personB.PIA = 1000
      personA.retirementBenefitDate = new MonthYearDate (2030, 3) //At age 70 ($1240 monthly)
      personB.retirementBenefitDate = new MonthYearDate (2022, 5) //At age 62 and 2 months (58 months early -> monthly benefit = $708.33)
      personA.spousalBenefitDate = new MonthYearDate (2030, 3) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2030, 3) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(334463, 0)
      //no spousal for anybody.
      //Survivor beginning at 66 and 8 months (Dec 2026)
      //for personA, it's 82.5% of personB's PIA ($825). After reduction for own entitlement, it'll be $0.
      //for personB, it'll be $531.67/month
    })
  
  
    it('should return appropriate PV for married couple, still working', () => {
      service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "NS2", 0) //Using male nonsmoker2 mortality table
      mortalityService.determineMortalityTable(personB, "female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68 (Sept 2032)
      personB.retirementBenefitDate = new MonthYearDate (2027, 8, 1) //At age 64 and 2 months (Sept 2027) -- Earnings test IS relevant
      personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personA.quitWorkDate = new MonthYearDate(2028,3,1) //planning to quit work at age 64 (April 2028)
      personB.quitWorkDate = new MonthYearDate(2030,3,1) //planning to quit work at at 67 (April 2030)
      personA.monthlyEarnings = 5000
      personB.monthlyEarnings = 9000
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(532288, 0)
    })
  
    it('should return appropriate PV for married couple, still working, filing early with partial withholding and overwithholding', () => {
      service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "NS2", 0) //Using male nonsmoker2 mortality table
      mortalityService.determineMortalityTable(personB, "female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(466389, 0)
    })
  
    it ('should return appropriate PV for married couple, including GPO', () => {
      service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "NS2", 0) //Using male nonsmoker2 mortality table
      mortalityService.determineMortalityTable(personB, "female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
      personB.retirementBenefitDate = new MonthYearDate (2029, 8, 1) //At age 66 and 2 months
      personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personA.nonCoveredPensionDate = new MonthYearDate(2030, 0) //Any date before personA's spousalBenefitDate, so that GPO applies
      personA.governmentPension = 900
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(486558, 0)
    })

    it ('should return appropriate PV for basic divorce scenario', () => {
      service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "divorced"
      mortalityService.determineMortalityTable(personA, "male", "NS2", 0) //Using male nonsmoker2 mortality table
      mortalityService.determineMortalityTable(personB, "female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1955, 3, 1) //Spouse B born in April 1955
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
      personB.retirementBenefitDate = new MonthYearDate (2017, 4, 1) //ASAP at 62 and 1 month
      personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personA.nonCoveredPensionDate = new MonthYearDate(2030, 0) //Any date before personA's spousalBenefitDate, so that GPO applies
      personA.governmentPension = 300
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(157996, 0)
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are zero), both file at FRA but suspend immediately until 70', () => {
      service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "male", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse A born in Sept 1970
      personB.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse B born in Sept 1970
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(236376, 0)//Figure here is just twice PV of a single person filing at 70.
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are relevant), both file at FRA and suspend immediately until 70', () => {
      service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse A born in Jan 1970
      personB.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse B born in Jan 1970
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(400045, 0)//See "present value service" spreadsheet for a calculation of this figure. (Update: the spreadsheet though was discounting to 62 instead of to "today")
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are relevant). PersonB is disabled prior to 62. He suspends FRA to 70. Person A files at 70 for retirement and spousal.', () => { 
      service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse A born in Jan 1970
      personB.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse B born in Jan 1970
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 500
      personB.PIA = 1500
          personB.isOnDisability = true
          personB.retirementBenefitDate = new MonthYearDate (2018, 0) //On disabillity as of age 48
          personB.fixedRetirementBenefitDate = new MonthYearDate (2018, 0) //On disabillity as of age 48
      personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
      personB.endSuspensionDate = new MonthYearDate(2040, 0)//Suspends FRA-70
      personA.retirementBenefitDate = new MonthYearDate (2040, 0) //Filing exactly at 70
      personA.spousalBenefitDate = new MonthYearDate (2040, 0) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2040, 0) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(623279, 0)//Went year-by-year checking benefit amounts. They're good.
    })

    it('should return appropriate PV for married couple, personB recently started retirement benefit, suspends 3 months from now until 70. personA filed two years ago.', () => { 
      service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1951, 8) //Sept 1951
      personB.SSbirthDate = new MonthYearDate(1952, 2)  //March 1952
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 500
      personB.PIA = 1500
      personA.hasFiled = true
      personB.hasFiled = true
      personA.retirementBenefitDate = new MonthYearDate (2016, 10) //Filed 2 years ago
      personB.retirementBenefitDate = new MonthYearDate (2018, 6) //Filed 4 months ago
      personB.beginSuspensionDate = new MonthYearDate(2019, 5) //personB suspending next year, until 70
      personB.endSuspensionDate = new MonthYearDate(2022, 2)
      personA.spousalBenefitDate = new MonthYearDate (2018, 6) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2018, 6) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(467770, 0)
    })

    it('should return appropriate PV for married couple, both currently age 63, filed already, not suspending, spousal benefit relevant.', () => { 
      service.today = new MonthYearDate(2018, 10) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1955, 10) //Nov 1955
      personB.SSbirthDate = new MonthYearDate(1955, 10)  //Nov 1955
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 700
      personB.PIA = 1500
      personA.hasFiled = true
      personB.hasFiled = true
      personA.retirementBenefitDate = new MonthYearDate (2017, 11) //Filed ASAP, 62 and 1 month
      personB.retirementBenefitDate = new MonthYearDate (2017, 11) //Filed ASAP, 62 and 1 month
      personA.spousalBenefitDate = new MonthYearDate (2017, 11) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2017, 11) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(392281, 0)
    })

      //tests for calculateCouplePV() that don't focus on ending PV
      it('should calculate personB spousal benefit as zero when own PIA is too high', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1000
        personB.PIA = 1500
        personA.retirementBenefitDate = new MonthYearDate(2033, 2) //March 2033, age 70
        personB.retirementBenefitDate = new MonthYearDate(2025, 7) //August 2025 (age 62, 5 years before FRA)
        personA.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[8][0]).toEqual(2033)
        expect(claimStrategy.outputTable[8][5]).toEqual("$0")
        expect(claimStrategy.outputTable[9][0]).toEqual("2034 and beyond")
        expect(claimStrategy.outputTable[9][5]).toEqual("$0")
      })
    
      it('should calculate spousal benefit appropriately prior to FRA', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1500
        personB.PIA = 500
        personA.retirementBenefitDate = new MonthYearDate(2026, 2) //March 2026
        personB.retirementBenefitDate = new MonthYearDate(2027, 7) //August 2027 (age 64, 3 years before FRA) Own retirement benefit will be $400
        personA.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[2][0]).toEqual(2028)
        expect(claimStrategy.outputTable[2][5]).toEqual("$2,250")
        //Original spousal benefit = 750. Reduced for own entitlement = 250. Multiplied by 0.75 for being 3 years early = 187.50. 187.5 x 12 = 2250
      })
    
      it('should calculate spousal benefit appropriately prior to FRA, when reduced by GPO', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1500
        personB.PIA = 500
        personA.retirementBenefitDate = new MonthYearDate(2026, 2) //March 2026
        personB.retirementBenefitDate = new MonthYearDate(2027, 7) //August 2027 (age 64, 3 years before FRA) Own retirement benefit will be $400
        personA.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.nonCoveredPensionDate = new MonthYearDate(2027, 0)//Just some date before personB's spousal benefit date, so GPO is applicable
        personB.governmentPension = 150
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[2][0]).toEqual(2028)
        expect(claimStrategy.outputTable[2][5]).toEqual("$1,050")
        //same as prior, minus 2/3 of $150 monthly gov pension = $87.50 spousal per month
      })
    
      it('should calculate spousal benefit appropriately prior to FRA, when reduced to zero by GPO', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1500
        personB.PIA = 500
        personA.retirementBenefitDate = new MonthYearDate(2026, 2) //March 2026
        personB.retirementBenefitDate = new MonthYearDate(2027, 7) //August 2027 (age 64, 3 years before FRA) Own retirement benefit will be $400
        personA.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.nonCoveredPensionDate = new MonthYearDate(2027, 0)//Just some date before personB's spousal benefit date, so GPO is applicable
        personB.governmentPension = 1000
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[2][0]).toEqual(2028)
        expect(claimStrategy.outputTable[2][5]).toEqual("$0")
      })
    
      it('should calculate spousal benefit appropriately after FRA', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 2000
        personB.PIA = 800
        personA.retirementBenefitDate = new MonthYearDate(2031, 7) //Aug 2031
        personB.retirementBenefitDate = new MonthYearDate(2031, 7) //Aug 2031 (one year after FRA, retirement benefit will be $864)
        personA.spousalBenefitDate = new MonthYearDate(2031, 7) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2031, 7) //later of two retirementBenefitDates
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[1][0]).toEqual(2032)
        expect(claimStrategy.outputTable[1][5]).toEqual("$1,632")
        //Original spousal benefit = 1000. Reduced by own entitlement (864) = 136. No reduction for age. 136 x 12 = 1632
      })


      it('should calculate personB survivor benefit appropriately, when claimed after FRA with own smaller retirement benefit. Deceased personA filed at age 70', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1000
        personB.PIA = 1000
        personA.retirementBenefitDate = new MonthYearDate(2033, 2) //March 2033, age 70
        personB.retirementBenefitDate = new MonthYearDate(2025, 7) //August 2025 (age 62, 5 years before FRA)
        personA.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[11][0]).toEqual("If your spouse outlives you")
        expect(claimStrategy.outputTable[11][6]).toEqual("$6,480") //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 700 retirement benefit, gives 540 survivor benefit. 12 x 540 = 6480
      })
  
      it('should calculate personB survivor benefit appropriately as zero with own larger retirement benefit. Deceased personA filed at age 70', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1000
        personB.PIA = 1500
        personA.retirementBenefitDate = new MonthYearDate(2033, 2) //March 2033, age 70
        personB.retirementBenefitDate = new MonthYearDate(personB.FRA) //Files at FRA of Aug 2030
        personA.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[6][0]).toEqual("If your spouse outlives you")
        expect(claimStrategy.outputTable[6][6]).toEqual("$0") //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 1500 retirement benefit, gives zero survivor benefit
      })

      //Testing calculation of retirement and survivor benefits in scenario where deceased was affected by Windfall Elimination Provision
        it('should calculate personA retirement benefit appropriately before and after WEP and personB survivor benefit appropriately after FRA -- using personA.nonWEP_PIA', () => {
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
          mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
          personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
          personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
          personA.SSbirthDate = new MonthYearDate(1963, 2)
          personB.SSbirthDate = new MonthYearDate (1963, 7)
          personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
          personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
          personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
          personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
          personA.WEP_PIA = 1000
          personB.PIA = 1000
          personA.eligibleForNonCoveredPension = true
          personA.nonCoveredPensionDate = new MonthYearDate(2035, 0)
          personA.nonWEP_PIA = 1200
          personA.retirementBenefitDate = new MonthYearDate(2033, 2) //March 2033, age 70
          personB.retirementBenefitDate = new MonthYearDate(2025, 7) //Files at 62 (5 years before FRA), so retirement benefit = 700
          personA.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
          personB.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.outputTable[9][0]).toEqual(2034)
          expect(claimStrategy.outputTable[9][1]).toEqual("$17,856")//personA annual retirement benefit before WEP kicks in: 124% of non WEP PIA = 1.24 * 1200 * 12 = 17856
          expect(claimStrategy.outputTable[10][0]).toEqual("2035 and beyond")
          expect(claimStrategy.outputTable[10][1]).toEqual("$14,880")//personA annual retirement benefit after WEP kicks in: 124% of WEP PIA = 1.24 * 1000 * 12 = 14880
          expect(claimStrategy.outputTable[12][0]).toEqual("If your spouse outlives you")
          expect(claimStrategy.outputTable[12][6]).toEqual("$9,456")
          //deceased filed at 70 with FRA of 67. Benefit would have been 1488, given nonWEP PIA of 1200.
          //Minus survivor's own 700 retirement benefit, gives 788 survivor benefit. 788 x 12 = 9456
        })

        it('should calculate WEP-affected survivor benefit appropriately as zero with own larger retirement benefit. Deceased filed at age 70', () => {
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
          mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
          personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
          personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
          personA.SSbirthDate = new MonthYearDate(1963, 2)
          personB.SSbirthDate = new MonthYearDate (1963, 7)
          personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
          personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
          personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
          personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
          personA.WEP_PIA = 1000
          personB.PIA = 1500
          personA.eligibleForNonCoveredPension = true
          personA.nonCoveredPensionDate = new MonthYearDate(2033, 0)//Before they file for any SS benefits
          personA.nonWEP_PIA = 1200
          personA.retirementBenefitDate = new MonthYearDate(2033, 2) //March 2033, age 70
          personB.retirementBenefitDate = new MonthYearDate(personB.FRA) //Files at FRA. retirement benefit = 1500
          personA.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
          personB.spousalBenefitDate = new MonthYearDate(2033, 2) //later of two retirementBenefitDates
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.outputTable[6][0]).toEqual("If your spouse outlives you")
          expect(claimStrategy.outputTable[6][6]).toEqual("$0")
            //deceased filed at 70 with FRA of 67. Benefit ignoring WEP would have been 1488, given nonWEP PIA of 1200. Minus survivor's own 1500 retirement benefit, gives zero survivor benefit
        })

      it('should appropriately reflect personB spousal benefit being partially withheld based on personA excess earnings', () => {
        service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        personA.actualBirthDate = new Date(1956, 5, 10) //born June 1956
        personA.SSbirthDate = birthdayService.findSSbirthdate(6, 10, 1956)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personA.quitWorkDate = new MonthYearDate (2028, 0, 1) //quitting work after FRA
        personA.monthlyEarnings = 1900
        personA.PIA = 1800
        personA.retirementBenefitDate = new MonthYearDate(2019, 9, 1) //Applying for retirement benefit October 2019 (36 months prior to FRA -> monthly benefit is 80% of PIA)
        personA.spousalBenefitDate = new MonthYearDate(2019, 9, 1) //later of two retirementBenefitDates
        personB.actualBirthDate = new Date(1956, 5, 10) //born June 1956
        personB.SSbirthDate = birthdayService.findSSbirthdate(6, 10, 1956)
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //FRA of October 2022  (66 and 4 months given 1956 DoB)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personB.PIA = 500
        personB.retirementBenefitDate = new MonthYearDate(2018, 9, 1) //Applying for retirement benefit October 2018 (48 months prior to FRA -> monthly benefit is 75% of PIA)
        personB.spousalBenefitDate = new MonthYearDate(2019, 9, 1) //later of two retirement benefit dates
        scenario.maritalStatus = "married"
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
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
        expect(claimStrategy.outputTable[1][5]).toEqual("$300")//First row is 2018. We want 2019, so second row. Spousal benefit for personB is 6th column.
      })

      it('Should calculate total annual retirement benefit and spousal benefits appropriately when personA is suspended for part of year, affecting their own retirement as well as spousal benefit of personB', () => {
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.PIA = 2300
        personB.PIA = 600
        personA.actualBirthDate = new Date (1974, 9, 13) //October 1974
        personB.actualBirthDate = new Date (1975, 11, 27) //December 1975
        personA.SSbirthDate = new MonthYearDate(1974, 9)
        personB.SSbirthDate = new MonthYearDate(1975, 11)
        mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
        personA.retirementBenefitDate = new MonthYearDate(2038, 9) //files at 64
        personB.retirementBenefitDate = new MonthYearDate(2038, 1) //files at 62 and 2 months
        personA.spousalBenefitDate = new MonthYearDate(2038, 9) //later of two retirement benefit dates
        personB.spousalBenefitDate = new MonthYearDate(2038, 9) //later of two retirement benefit dates
        personA.beginSuspensionDate = new MonthYearDate(2041, 9) //suspends at FRA of 67
        personA.endSuspensionDate = new MonthYearDate(2042, 3) //ends suspension in following year
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(460686, 0)
        //manual calculation
          //personA retirement benefit = 1840 (80% of PIA, due to 36 months early)
          //personB retirement benefit = 425 (70.83333% of PIA due to 58 months early)
          //personB spousal benefit = 380.41 (69.166666% due to 50 months early) x [2300/2 - 600]
          //in 2041, suspension happens in October, so personA gets 9 months of retirement. personB gets 12 months of retirement and 9 months of spousal
          //2038 is first row of table, so 2041 is row [3]
        expect(claimStrategy.outputTable[3][1]).toEqual("$16,560") //personA retirement amount should be 1840 x 9 = 16,560
        expect(claimStrategy.outputTable[3][4]).toEqual("$5,100") //personB retirement amount should be 425 x 12 = 5,100
        expect(claimStrategy.outputTable[3][5]).toEqual("$3,424") //personB spousal amount should be $380.41 x 9 = $3,423.69
      })

      it('Should calculate annual retirement and spousal benefits appropriately in year in which personB hits FRA, triggering ARF from withholding in some prior year', () => {
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.PIA = 800
        personB.PIA = 2000
        personA.actualBirthDate = new Date (1980, 2, 5) //March 1980
        personB.actualBirthDate = new Date (1982, 6, 21) //July 1982
        personA.SSbirthDate = new MonthYearDate(1980, 2)
        personB.SSbirthDate = new MonthYearDate(1982, 6)
        mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
        personA.retirementBenefitDate = new MonthYearDate(2043, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2047, 6) //files at 65
        personA.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates
        personB.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates
        personB.quitWorkDate = new MonthYearDate(2048, 0) //Working until Jan 2048
        personB.monthlyEarnings = 3000
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(377220, 0)
        //manual calculation
          //personA retirement benefit = 600 (75% due to filing 48 months early)
          //personB retirement benefit = 1733.3333 (86.666% of PIA due to filing 24 months early)
          //personA spousal benefit = 200 (2000/2 - 800). No need for reduction because isn't claimed until after FRA
          //in 2047, personB has earnings of 36k: withholding of (36000 - 17040)/2 = 9480
          //available for withholding per month on personB's work record: 1933.33 -> 5 months of withholding necessary
          //at FRA (July 2049) personB has benefit adjusted as if only filed 19 months early. New monthly benefit should be 1788.888888
          //2043 is first row of table, so 2049 is row [6]
          expect(claimStrategy.outputTable[6][4]).toEqual("$21,133") //personB retirement amount should be 1733.333 x 6 + 1788.8888 x 6 = $21,133.33
          //personA doesn't file for spousal benefit until after FRA, so never gets an ARF
          expect(claimStrategy.outputTable[6][2]).toEqual("$2,400") //personA gets $200 spousal benefit every month once it begins (except in 2047 when 5 months is withheld)
          expect(claimStrategy.outputTable[6][1]).toEqual("$7,200") //personA gets $600 retirement benefit every month
      })

      it('Should calculate annual retirement and spousal benefits appropriately in year in which personA hits FRA, triggering ARF for spousal benefit due to withholding from other personB earnings in prior year', () => {
        service.today = new MonthYearDate(2018, 11)//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        earningsTestService.today = new MonthYearDate(2018, 11) //Ditto
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.PIA = 800
        personB.PIA = 2000
        personA.actualBirthDate = new Date (1982, 2, 5) //March 1982
        personB.actualBirthDate = new Date (1982, 6, 21) //July 1982
        personA.SSbirthDate = new MonthYearDate(1982, 2)
        personB.SSbirthDate = new MonthYearDate(1982, 6)
        mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
        personA.retirementBenefitDate = new MonthYearDate(2045, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2047, 6) //files at 65
        personA.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates (65 and 4 months)
        personB.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates (age 65, not that it's relevant)
        personB.quitWorkDate = new MonthYearDate(2048, 0) //Working until Jan 2048
        personB.monthlyEarnings = 2800
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(380003, 0)
        //manual calculation
          //personA retirement benefit = 600 (75% due to filing 48 months early) 
          //personA spousal benefit (20 months early) = 86.111% * (2000/2 - 800) = $172.2222
          //personB retirement benefit = 1733.3333 (86.666% of PIA due to filing 24 months early)
          //in 2047, personB has earnings of 33,600: withholding of (33600 - 17040)/2 = 8280
          //available for withholding per month on personB's work record: $1,905.55 -> 5 months of withholding necessary
          //in March 2049, personA gets ARF, and spousal benefit is adjusted as if filed 15 months early instead of 20
          //new spousal benefit should be 0.895833 * (2000/2 - 800) = $179.1666
          //table begins in 2045, so 2049 is row [4]
          expect(claimStrategy.outputTable[4][2]).toEqual("$2,136") //2 months at $172.222 and 10 months at $179.1666 = $2,136.11
          expect(claimStrategy.outputTable[4][1]).toEqual("$7,200") //personA gets $600 retirement benefit every month (never had any withholding of retirement benefit, so should be no ARF for it)
      })

      it('Should calculate spousal benefits appropriately in scenario with child in care (during child in care, after 16, after 18, and after ARF)', () => {
        service.today = new MonthYearDate(2018, 11)
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        scenario.numberOfChildren = 1
        let child1:Person = new Person("1")
        child1.SSbirthDate = new MonthYearDate(2009, 2) //March 2009
        scenario.setChildrenArray([child1], service.today)
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.PIA = 1500
        personB.PIA = 600
        personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
        personB.actualBirthDate = new Date (1960, 2, 21) //March 1960
        personA.SSbirthDate = new MonthYearDate(1960, 2)
        personB.SSbirthDate = new MonthYearDate(1960, 2)
        mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
        personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
        personA.spousalBenefitDate = new MonthYearDate(2025, 2) //This date doesn't matter, given PIAs. But same reasoning as field for personB
        personB.spousalBenefitDate = new MonthYearDate(2025, 2)
        personB.childInCareSpousalBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
        //^^Spousal benefit begins March 2023 when personA starts retirement. But it's child in care spousal benefit until child turns 16 in March 2025. Here we are having them file Form SSA-25 immediately at that date.
        personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
        personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(406206, 0)
        //manual calculation
          //personA.familyMaximum = 2684.32 (150% up to $1144, 272% up to $1651)
          //personB.familyMaximum = 900
          //1500 + 750 + 750 (original benefits on personA's record) < combined family max, so family max isn't an issue here.
          //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
          //personA spousal benefit = 0
          //personB retirement benefit = 450 (75% of PIA due to 48 months early)
          //personB spousal benefit = 150 (1500/2 - 600) <- not reduced for age during time that child1 is under age 16
          //in March 2025 child1 turns 16. So now personB's spousal benefit will be reduced for age if they file form SSA-25 immediately, which we they are doing, given spousalBenefitDate above.
            //personB's new spousal benefit: $125 (Age 65 and 0 months. 24 months early = 83.33% full spousal benefit)
          //table begins in 2023
          //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
          expect(claimStrategy.outputTable[0][5]).toEqual("$1,500") //10 months at $150
          expect(claimStrategy.outputTable[1][5]).toEqual("$1,800") //12 months at $150
          expect(claimStrategy.outputTable[2][5]).toEqual("$1,550") //2 months at $150, 10 months at $125
          expect(claimStrategy.outputTable[3][5]).toEqual("$1,500") //12 months at $125
          expect(claimStrategy.outputTable[4][5]).toEqual("$1,500") //12 months at $125
          expect(claimStrategy.outputTable[0][7]).toEqual("$7,500") //2023 child gets 10 months of child benefits on personA
          expect(claimStrategy.outputTable[1][7]).toEqual("$9,000") //2024 child gets 12 months of child benefits on personA
          expect(claimStrategy.outputTable[2][7]).toEqual("$9,000") //2025 child gets 12 months of child benefits on personA
          expect(claimStrategy.outputTable[3][7]).toEqual("$9,000") //2026 child gets 12 months of child benefits on personA
          expect(claimStrategy.outputTable[4][7]).toEqual("$1,500") //2027 child gets 2 months of child benefits on personA (then turns 18)
      })

      //Same test as above, but with personB working through 2026. So basically should get ARF months up through 12/2026, but make sure there are no double-counted ARF months.
      it('Should calculate spousal benefits appropriately in ARF scenario with child in care and earnings test', () => {
        service.today = new MonthYearDate(2018, 11)
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        scenario.numberOfChildren = 1
        let child1:Person = new Person("1")
        child1.SSbirthDate = new MonthYearDate(2009, 2) //March 2009
        scenario.setChildrenArray([child1], service.today)
        mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
        mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
        personA.PIA = 1500
        personB.PIA = 600
        personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
        personB.actualBirthDate = new Date (1960, 2, 21) //March 1960
        personA.SSbirthDate = new MonthYearDate(1960, 2)
        personB.SSbirthDate = new MonthYearDate(1960, 2)
        personB.quitWorkDate = new MonthYearDate(2027, 0) //quitWorkDate January 2027, so it's the first month without work
        personB.monthlyEarnings = 10000
        personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
        personA.spousalBenefitDate = new MonthYearDate(2025, 2) //This date doesn't matter, given PIAs. But same reasoning as field for personB
        personB.spousalBenefitDate = new MonthYearDate(2025, 2)
        //^^Spousal benefit begins March 2023 when personA starts retirement. But it's child in care spousal benefit until child turns 16 in March 2025. Here we are having them file Form SSA-25 immediately at that date.
        mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
        personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
        personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(367887, 0)
        //manual calculation:
          //personA.familyMaximum = 2684.32 (150% up to $1144, 272% up to $1651)
          //personB.familyMaximum = 900
          //1500 + 750 + 750 (original benefits on personA's record) < combined family max, so family max isn't an issue here.
          //personA spousal benefit = 0
          //personB retirement benefit = 450 (75% of PIA due to 48 months early)
          //personB spousal benefit = 150 (1500/2 - 600) <- not reduced for age during time that child1 is under age 16
          //in March 2025 child1 turns 16. So now personB's spousal benefit will be reduced for age if they file form SSA-25 immediately, which we they are doing, given spousalBenefitDate above.
            //personB's new spousal benefit: $125 (Age 65 and 0 months. 24 months early = 83.33% full spousal benefit)
          //table begins in 2023
          //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
          //personB annual earnings: 120k -> (120000 - 17040)/2 = $51,480 withholding necessary in years prior to FRA (from personB's record)
          //Available to withhold per month: $150 spousal for personB and $750 child benefit = $900
            //^^Going with POMS RS 02501.140 here, even though it contradicts SSAct and CFR. (That is, we're making child benefit withholdable on personB's record, even though it's coming on personA's record.)
          expect(claimStrategy.outputTable[0][5]).toEqual("$0") //2023 personB spousal benefit fully withheld due to earnings test
          expect(claimStrategy.outputTable[1][5]).toEqual("$0") //2024 personB spousal benefit fully withheld due to earnings test
          //March 2025 child turns 16 and personB files SSA-25. So now spousal benefit would be normal spousal benefit (reduced to $125 due to being 24 months early). But it's withheld due to earnings. So we start counting spousal ARF credits
          expect(claimStrategy.outputTable[2][5]).toEqual("$0") //2025 personB spousal benefit fully withheld due to earnings test (10 months spousal ARF credits)
          expect(claimStrategy.outputTable[3][5]).toEqual("$0") //2026 personB spousal benefit fully withheld due to earnings test (12 months spousal ARF credits)
          expect(claimStrategy.outputTable[4][5]).toEqual("$1,729") //In 2027, no earnings so no withholding. Gets $125 benefit for 2 months, then ARF happens in March. Was 24 months early, but has 22 spousal ARF credits.
          //2 months early spousal reduction factor = 98.611111%. (1500/2 - 600) * 0.986111 = $147.91
          //$125 x 2 + $147.91 x 10 = $1729.17
          expect(claimStrategy.outputTable[0][7]).toEqual("$0") //2023 child would get 10 months of child benefits on personA, but it's withheld due to personB earnings
          expect(claimStrategy.outputTable[1][7]).toEqual("$0") //2024 child would get 12 months of child benefits on personA, but it's withheld due to personB earnings
          expect(claimStrategy.outputTable[2][7]).toEqual("$0") //2025 child would get 12 months of child benefits on personA, but it's withheld due to personB earnings
          expect(claimStrategy.outputTable[3][7]).toEqual("$0") //2026 child would get 12 months of child benefits on personA, but it's withheld due to personB earnings
          expect(claimStrategy.outputTable[4][7]).toEqual("$1,500") //2027 child gets 2 months of child benefits on personA, then turns 18. (personB has no earnings so no withholding.)
      })

        it('Should calculate retirement/spousal/child benefits appropriately for everybody in combined family max scenario', () => {
          service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
          familyMaximumService.today = new MonthYearDate(2018, 11) //Ditto
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          scenario.numberOfChildren = 3
          let child1:Person = new Person("1")
          let child2:Person = new Person("2")
          let child3:Person = new Person("3")
          child1.SSbirthDate = new MonthYearDate(2007, 0) //Jan 2007
          child2.SSbirthDate = new MonthYearDate(2009, 0) //Jan 2009
          child3.SSbirthDate = new MonthYearDate(2011, 0) //Jan 2011
          scenario.setChildrenArray([child1, child2, child3], service.today)
          mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
          mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
          personA.PIA = 1500
          personB.PIA = 600
          personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
          personB.actualBirthDate = new Date (1960, 2, 21) //March 1960
          personA.SSbirthDate = new MonthYearDate(1960, 2)
          personB.SSbirthDate = new MonthYearDate(1960, 2)
          personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
          personB.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
          personA.spousalBenefitDate = new MonthYearDate(2027, 0) //Doesn't matter but uses same logic as field for personB
          personB.spousalBenefitDate = new MonthYearDate(2027, 0) //child3 is under 16 until Jan 2027, so spousal benefit will be child-in-care spousal until then. Here we're having personB file Form SSA-26 immediately Jan 2027
          personB.childInCareSpousalBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
          mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.PV).toBeCloseTo(467825, 0)
          //manual calculation:
            //personA.familyMaximum = 2684.32 (150% up to $1144, 272% up to $1651)
            //personB.familyMaximum = 900
            //1500 + 750*4 (i.e., original benefits on personA's record) > combined family max, so family max IS an issue here.
            //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
            //personA spousal benefit = 0
            //personB retirement benefit = 450 (75% of PIA due to 48 months early)
            //Combined family max = 3584.32
            //Back out personA's PIA -> amount left for everybody else is 2084.32
            //That's $521.08 for personB and each of 3 children
            //Adjust personB's spousal for own entitlement: subtract $600. personB spousal is now $0
            //So now we have $2084.32 / 3 = $694.77 for each of 3 children
            //table begins in 2023
            //Events to consider: Child1 hits 18 in Jan 2025. Child2 hits 18 in Jan 2027, and Child3 hits 16 on same date. Child3 hits 18 in Jan 2029.
            //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
            expect(claimStrategy.outputTable[0]).toEqual([2023, "$11,250", "$0", "$0", "$4,500", "$0", "$0", "$20,843", "$36,593"])
            expect(claimStrategy.outputTable[1]).toEqual([2024, "$13,500", "$0", "$0", "$5,400", "$0", "$0", "$25,012", "$43,912"]) //Same as 2023, but 12 months instead of 10
            //For 2025, there are now only 2 children. So we divide $2084.32 by 3 people = $694.77 per child but also for personB as spousal original benefit.
            //Subtract 600 for own entitlement. personB spousal benefit = $94.77
            //2084.32 - $94.77 = $1989.55 left for two children, which is more than enough to give each one their full original benefit of $750
            expect(claimStrategy.outputTable[2]).toEqual([2025, "$13,500", "$0", "$0", "$5,400", "$1,137", "$0", "$18,000", "$38,037"])
            expect(claimStrategy.outputTable[3]).toEqual([2026, "$13,500", "$0", "$0", "$5,400", "$1,137", "$0", "$18,000", "$38,037"])
            //As of Jan 2027, there is only 1 child. $2084.32 / 2 = $1,042.16 available for child3 and for personB (in both-alive scenario)
            //personB can now get full $150 spousal (after adjusting for own entitlement). child3 gets $750
            //Also in Jan 2027, child3 reaches age 16, so personB spousal benefit is no longer child-in-care spousal. (We are having her file SSA-25 immediately, per spousalBenefitDate above.)
            //Spousal benefit is 2 months early. 2 months early spousal reduction factor = 98.611111%. (1500/2 - 600) * 0.986111 = $147.91
            //personA and personB reach FRA (and survivor FRA) in March 2027
              //So ARF happens, but there were no earnings test withholdings. So ARF not relevant.
              //Survivor benefit begins for personB: (1125 - 450 = $675 prior to considering family max), but that won't show up in the table.
            expect(claimStrategy.outputTable[4]).toEqual([2027, "$13,500", "$0", "$0", "$5,400", "$1,775", "$0", "$9,000", "$29,675"])
            expect(claimStrategy.outputTable[5]).toEqual([2028, "$13,500", "$0", "$0", "$5,400", "$1,775", "$0", "$9,000", "$29,675"])
            //As of 2029, no children under 18
            expect(claimStrategy.outputTable[6]).toEqual([2029, "$13,500", "$0", "$0", "$5,400", "$1,775", "$0", "$0", "$20,675"])
            expect(claimStrategy.outputTable[7]).toEqual([2030, "$13,500", "$0", "$0", "$5,400", "$1,775", "$0", "$0", "$20,675"])
            expect(claimStrategy.outputTable[8]).toEqual(["2031 and beyond", "$13,500", "$0", "$0", "$5,400", "$1,775", "$0", "$0", "$20,675"])
            expect(claimStrategy.outputTable[9]).toEqual(["If you outlive your spouse", "$13,500", "$0", "$0", "$0", "$0", "$0", "$0", "$13,500"])//if personA outlives personB, personA gets no survivor.
            expect(claimStrategy.outputTable[10]).toEqual(["If your spouse outlives you", "$0", "$0", "$0", "$5,400", "$0", "$9,450", "$0", "$14,850"])//if personB outlives personA, 82.5% of PIA rule kicks in 1500 x .825 = $1237.50
            expect(claimStrategy.outputTable[11]).toEqual(["After both you and your spouse are deceased", "$0", "$0", "$0", "$0", "$0", "$0", "$0", "$0"])//after both parents deceased
        })


        it("Should calculate everybody's benefits appropriately in pre-62 scenario with child in care (before child 16, after child 16)", () => {
          service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
          familyMaximumService.today = new MonthYearDate(2018, 11) //Ditto
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          scenario.numberOfChildren = 1
          let child1:Person = new Person("1")
          child1.SSbirthDate = new MonthYearDate(2010, 2) //March 2010
          scenario.setChildrenArray([child1], service.today)
          mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
          mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
          personA.PIA = 1500
          personB.PIA = 600
          personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
          personB.actualBirthDate = new Date (1970, 2, 21) //March 1970
          personA.SSbirthDate = new MonthYearDate(1960, 2)
          personB.SSbirthDate = new MonthYearDate(1970, 2)
          personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
          personB.retirementBenefitDate = new MonthYearDate(2034, 2) //files at 64
          personA.spousalBenefitDate = new MonthYearDate(2034, 2) //when personB's retirement starts (not that this date really matters)
          personB.spousalBenefitDate = new MonthYearDate(2034, 2)
          personB.childInCareSpousalBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
          //^^personB starts their spousal benefit when they start their retirement benefit. (They also get child-in-care spousal benefits earlier, but those end in March 2026 when child turns 16.)
          mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.PV).toBeCloseTo(429664, 0)
          //manual calculation
            //personA.familyMaximum = 2684.32 (150% up to $1144, 272% up to $1651)
            //personB.familyMaximum = 900
            //Combined family max isn't applicable though until personB is entitled to retirement.
            //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
            //personA spousal benefit = 0
            //personB retirement benefit (eventually) = $480 (80% of PIA due to 36 months early)
            //personB original spousal benefit = $750
            //family maximum application:
              //2684.32 - 1500 = 1184.32 left for everybody else
              //1184.32 / 2 = 592.16 each for child1 and personB
            //personB spousal benefit doesn't get reduced for own entitlement, because not yet entitled to retirement. Doesn't get reduced for age because of child in care.
            //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
            expect(claimStrategy.outputTable[0]).toEqual([2023, "$11,250", "$0", "$0", "$0", "$5,922", "$0", "$5,922", "$23,093"]) //10 months for everybody
            expect(claimStrategy.outputTable[1]).toEqual([2024, "$13,500", "$0", "$0", "$0", "$7,106", "$0", "$7,106", "$27,712"]) //12 months for everybody
            expect(claimStrategy.outputTable[2]).toEqual([2025, "$13,500", "$0", "$0", "$0", "$7,106", "$0", "$7,106", "$27,712"]) //same as 2024
            //in March 2026 child1 turns 16, so personB's spousal benefit stops. (Child1 can then get full original benefit.)
            expect(claimStrategy.outputTable[3]).toEqual([2026, "$13,500", "$0", "$0", "$0", "$1,184", "$0", "$8,684", "$23,369"]) //2 months spousal for personB. child gets 2x592.16 + 10x75
            //in March 2034 personB begins retirement benefit and spousal benefit. At this point there is no child under 18, so family max not a concern.
            //spousal benefit is 36 months early (75% reduction factor) = (1500/2 - 600) * .75 = 112.50
            expect(claimStrategy.outputTable[11]).toEqual([2034, "$13,500", "$0", "$0", "$4,800", "$1,125", "$0", "$0", "$19,425"])
            expect(claimStrategy.outputTable[12]).toEqual([2035, "$13,500", "$0", "$0", "$5,760", "$1,350", "$0", "$0", "$20,610"])
        })

        it("Should calculate everybody's benefits appropriately in pre-62 scenario with child in care (child turns 16 when person is 63. person files SSA-25 on that date, so spousal continues but is reduced for age.)", () => {
          service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
          familyMaximumService.today = new MonthYearDate(2018, 11) //Ditto
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          scenario.numberOfChildren = 1
          let child1:Person = new Person("1")
          child1.SSbirthDate = new MonthYearDate(2010, 2) //March 2010
          scenario.setChildrenArray([child1], service.today)
          mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
          mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
          personA.PIA = 1500
          personB.PIA = 600
          personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
          personB.actualBirthDate = new Date (1963, 2, 21) //March 1963
          personA.SSbirthDate = new MonthYearDate(1960, 2)
          personB.SSbirthDate = new MonthYearDate(1963, 2)
          personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
          personB.retirementBenefitDate = new MonthYearDate(2025, 3) //Files at 62 and 1 month
          personA.spousalBenefitDate = new MonthYearDate(2025, 3) //when personB's retirement starts (not that this date really matters)
          personB.spousalBenefitDate = new MonthYearDate(2026, 2) //child turns 16 in March 2026. personB files Form SSA-25 at that time.
          personB.childInCareSpousalBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
          mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.PV).toBeCloseTo(424414, 0)
          //manual calculation
            //personA.familyMaximum = 2684.32 (150% up to $1144, 272% up to $1651)
            //personB.familyMaximum = 900
            //Combined family max isn't applicable though until personB is entitled to retirement (April 2025).
            //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
            //personA spousal benefit = 0
            //personB retirement benefit = $422.50 (70.41666% of PIA due to 59 months early)
            //personB original spousal benefit = $750
            //family maximum application in 2023:
              //2684.32 - 1500 = 1184.32 left for everybody else
              //1184.32 / 2 = 592.16 each for child1 and personB
            //personB spousal benefit doesn't get reduced for own entitlement, because not yet entitled to retirement. Doesn't get reduced for age because of child in care.
            //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
            expect(claimStrategy.outputTable[0]).toEqual([2023, "$11,250", "$0", "$0", "$0", "$5,922", "$0", "$5,922", "$23,093"])
            expect(claimStrategy.outputTable[1]).toEqual([2024, "$13,500", "$0", "$0", "$0", "$7,106", "$0", "$7,106", "$27,712"])//same as 2023, but 12 months
            //April 2025: personB retirement begins -- changes personB's spousal benefit and family max application
            //now we have combined family max of 3584.32.
            //back out personA PIA of $1500. We have $2084.32 left for everybody else. More than enough for each person's "original benefit" amounts.
            //child benefit = $592.16 x 3 months + $750 x 9 months = 8526
            //personB retirement benefit (59 months early, 70.41666%) = 600 * 70.41666% = $422.50
            //personB spousal is now reduced for own entitlement beginning in April. Still not reduced for age yet due to child in care. ($750 - $600 = 150)
              //personB spousal for year = $592.16 x 3 months + $150 x 9 months
            expect(claimStrategy.outputTable[2]).toEqual([2025, "$13,500", "$0", "$0", "$3,803", "$3,126", "$0", "$8,526", "$28,955"])
            //March 2026: child turns 16 and personB files SSA-25, so spousal is now reduced for age. (Age 63 -- 48 months early.)
            //personB spousal is now (1500/2 - 600) * 0.70 = $105
            //personB annual spousal = 150 x 2 months + 105 x 10 months = 1350
            expect(claimStrategy.outputTable[3]).toEqual([2026, "$13,500", "$0", "$0", "$5,070", "$1,350", "$0", "$9,000", "$28,920"])
            //2027 nothing changes.
            //personB spousal = 105 x 12 = 1260
            expect(claimStrategy.outputTable[4]).toEqual([2027, "$13,500", "$0", "$0", "$5,070", "$1,260", "$0", "$9,000", "$28,830"])
            //March 2028: child turns 18. Child benefit ends.
            expect(claimStrategy.outputTable[5]).toEqual([2028, "$13,500", "$0", "$0", "$5,070", "$1,260", "$0", "$1,500", "$21,330"])
        })

        it('Should calculate survivor benefits appropriately in family max scenario with 2 disabled children', () => {
          service.today = new MonthYearDate(2019, 0)
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          scenario.numberOfChildren = 2
          let child1:Person = new Person("1")
          child1.SSbirthDate = new MonthYearDate(1998, 2) //March 1998
          child1.isOnDisability = true
          let child2:Person = new Person("1")
          child2.SSbirthDate = new MonthYearDate(2000, 2) //March 2000
          child2.isOnDisability = true
          scenario.setChildrenArray([child1, child2], service.today)
          mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
          mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
          personA.PIA = 1500
          personB.PIA = 600
          personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
          personB.actualBirthDate = new Date (1960, 2, 21) //March 1960
          personA.SSbirthDate = new MonthYearDate(1960, 2)
          personB.SSbirthDate = new MonthYearDate(1960, 2)
          personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2027
          personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //March 2027
          personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
          personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
          personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
          personB.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
          personA.spousalBenefitDate = new MonthYearDate(personA.FRA) //This date doesn't matter, given PIAs. But same reasoning as field for personB
          personB.spousalBenefitDate = new MonthYearDate(personB.FRA)
          //^^Spousal benefit begins March 2023 when personA starts retirement. But it's child in care spousal benefit at all ages, given disabled child.
          mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over.)
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          //manual calculation
            //personA.familyMaximum = 2684.32 (150% up to $1144, 272% up to $1651)
            //personB.familyMaximum = 900
            //combined family max = 3584.32
            //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
            //personB retirement benefit = 450 (75% of PIA due to 48 months early)
            //in personA deceased, personB alive scenario:
              //personB original benefit on personA's record = great of personA's PIA or retirement benefit = 1500
              //child1 and child2 original benefit on personA's record = 75% of personA PIA = 1125 each
              //1500 + 1125 + 1125 = 3750, which exceeds combined family max
              //3584.32/3750 = 0.955819
              //1500 x 0.955819 = $1433.73
              //1125 x 0.955819 = $1075.30
              //reduce personB original benefit by own retirement = 1433.73 - 450 = 983.73
              //new total of aux benefits = 983.73 + 1075.30 + 1075.30 = 3134.33
              //Additional "amount available" on personA's record = 3584.32 - 3134.33 = 449.99 = 450
              //divide $450 between two children = $225 each
              //1075.30 + 225 = 1300.30.
              //1300.30 will be limited to original benefit of 75% of personA PIA = $1125 for each child
              //Apply RIBLIM: limit sum of personB retirement and survivor benefit to greater of personA retirement benefit or 82.5% of personA PIA (in this case 82.5% of PIA)
              //1500 x 0.825 = 1237.50
              //1237.50 - 450 own retirement = 787.50 survivor benefit
            //table begins in 2023
            //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
            expect(claimStrategy.outputTable[10][0]).toEqual("If your spouse outlives you") //12 months of own $450 retirement benefit
            expect(claimStrategy.outputTable[10][4]).toEqual("$5,400") //12 months of own $450 retirement benefit
            expect(claimStrategy.outputTable[10][5]).toEqual("$0") //no spousal since personA deceased
            expect(claimStrategy.outputTable[10][6]).toEqual("$9,450") //12 months of $787.50 survivor benefit
            expect(claimStrategy.outputTable[10][7]).toEqual("$27,000") //12 months of each getting $1125
            expect(claimStrategy.outputTable[10][8]).toEqual("$41,850") //total of above amounts
        })

})

  describe('Tests for maximizeCouplePViterateBothPeople', () => {
    let service:PresentValueService
    let mortalityService:MortalityService
    let birthdayService:BirthdayService
    let benefitService:BenefitService
    let familyMaximumService:FamilyMaximumService
    let scenario:CalculationScenario
    let personA:Person
    let personB:Person


    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
      })
      service = TestBed.get(PresentValueService)
      mortalityService = TestBed.get(MortalityService)
      birthdayService = TestBed.get(BirthdayService)
      benefitService = TestBed.get(BenefitService)
      familyMaximumService = TestBed.get(FamilyMaximumService)
      scenario = new CalculationScenario()
      personA = new Person("A")
      personB = new Person("B")
    })

    it ('should tell a high-PIA spouse to wait until 70, with low discount rate and long lifespans', () => {
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "NS2", 0) //Using male nonsmoker2 mortality table
      mortalityService.determineMortalityTable(personB, "female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.actualBirthDate = new Date(1964, 8, 15) //Spouse A born in Sept 1964
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1)
      personB.actualBirthDate = new Date(1964, 9, 11) //Spouse B born in October 1964
      personB.SSbirthDate = new MonthYearDate(1964, 9, 1)
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0) 
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0) 
      personA.actualBirthDate = new Date(1953, 8, 15) //Spouse A born in Sept 1953
      personA.SSbirthDate = new MonthYearDate(1953, 8, 1)
      personB.actualBirthDate = new Date(1953, 9, 11) //Spouse B born in October 1953
      personB.SSbirthDate = new MonthYearDate(1953, 9, 1)
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      personB.hasFiled = true
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "female", "NS1", 0)
      mortalityService.determineMortalityTable(personB, "female", "NS1", 0)
      personA.actualBirthDate = new Date(1955, 9, 15) //personA born in October 1955
      personA.SSbirthDate = new MonthYearDate(1955, 9, 1)
      personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
      personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
      personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personB filed at 62 and 1 month
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 1000
      personB.PIA = 1150
      personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      scenario.discountRate = 0
      expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[2].date)
      .toEqual(new MonthYearDate(2025, 9, 1))
      //We're looking at item [0] in the array. This array should have 3 items in it: suspend for personB, unsuspend for personB, retirement date for personA
    })
  
    it('should tell personA to file ASAP, even if personB filed early at 62, if personA has lower PIA (such that even delaying wouldnnt result in higher last-to-die benefit', () => {
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      personB.hasFiled = true
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "male", "SSA", 0)
      personA.actualBirthDate = new Date(1960, 9, 15) //personA born in October 1960
      personA.SSbirthDate = new MonthYearDate(1960, 9, 1)
      personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
      personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
      personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personB filed at 62 and 1 month
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
  
    it('should tell personA to suspend until 70, if personA filed early at 62 and has the much higher PIA', () => {
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      personA.hasFiled = true
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "male", "SSA", 0)
      personA.actualBirthDate = new Date(1954, 9, 11) //personA born in October 1954
      personA.SSbirthDate = new MonthYearDate(1954, 9, 1)
      personB.actualBirthDate = new Date(1960, 9, 15) //personB born in October 1960
      personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
      personA.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personA filed at 62
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 2000
      personB.PIA = 1100
      personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      scenario.discountRate = 1
      expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[2].date)
      .toEqual(new MonthYearDate(2024, 9, 1))
      //We're looking at item [2] in the array. This array should have 3 items in it: suspend date for A (2020), retirement date for personB (2022), unsuspend date for A (2024)
    })
  
    it('should tell personA not to suspend, if personA filed early at 64, has lower PIA, personB hasnt filed, and both have short life expectancy, high-ish discount rate', () => {
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      personA.hasFiled = true
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SM2", 0)
      mortalityService.determineMortalityTable(personB, "female", "SM2", 0)
      personA.actualBirthDate = new Date(1954, 2, 11) //personA born in March 1954
      personA.SSbirthDate = new MonthYearDate(1954, 2, 1)
      personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
      personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
      personA.fixedRetirementBenefitDate = new MonthYearDate (2018, 3, 1) //personA filed at 64
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 600
      personB.PIA = 2100
      personA.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
      personB.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
      scenario.discountRate = 2
      expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray.length)
      .toEqual(2)
      //This array should have 2 items in it: retirementDate for personB, and (matching) spousalDate for personA.
      //If there *were* a suspension solution, it would have more than 2 items.
    })
  
    it('should tell personA to file at 68, if they have higher PIA, personB has normal life expectancy, and they are using A-dies-at-68 assumption', () => {
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "fixed", 68)
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
      personA.actualBirthDate = new Date(1960, 2, 11) //personA born in March 1960
      personA.SSbirthDate = new MonthYearDate(1960, 2, 1)
      personB.actualBirthDate = new Date(1960, 2, 15) //personB born in March 1960
      personB.SSbirthDate = new MonthYearDate(1960, 2, 1)
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
  
    it('should tell personA to suspend from FRA to 70, if personA is disabled, personA has higher PIA, both have normal life expectancies', () => {
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
      personA.actualBirthDate = new Date(1960, 2, 11) //personA born in March 1960
      personA.SSbirthDate = new MonthYearDate(1960, 2, 1)
      personB.actualBirthDate = new Date(1960, 2, 15) //personB born in March 1960
      personB.SSbirthDate = new MonthYearDate(1960, 2, 1)
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 2000
      personB.PIA = 1100
      personA.isOnDisability = true
      personA.fixedRetirementBenefitDate = new MonthYearDate(2016, 5, 1) //On disability since June 2016
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
  
    it('should tell personB to file for spousal benefits ASAP (even though personA is younger than 62 at the time), if personA is disabled, personA has much higher PIA, one has a short life expectancy, and high-ish discount rate. Should also tell personA to suspend at FRA', () => {
      service.today = new MonthYearDate(2018, 11) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SM2", 0) //originally SM2
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0) //originally SSA
      personA.actualBirthDate = new Date(1964, 3, 11) //personA born in April 1964
      personA.SSbirthDate = new MonthYearDate(1964, 3, 1)
      personB.actualBirthDate = new Date(1960, 3, 15) //personB born in April 1960
      personB.SSbirthDate = new MonthYearDate(1960, 3, 1)
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 2800
      personB.PIA = 1000
      personA.isOnDisability = true
      personA.fixedRetirementBenefitDate = new MonthYearDate(2018, 4, 1) //On disability since May 2018
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
      //This array should have 5 items in it: retirement date for personB, spousal date for personB, disabilityConversion for personA, begin suspension for personA, end suspension for personA
    })


    it('should tell a low-PIA spouse to file a retroactive application and high-PIA spouse to file retroactive restricted application if already past FRA with short life expectancies and high discount rate', () => {
      service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
      scenario.maritalStatus = "married"
      mortalityService.determineMortalityTable(personA, "male", "SM2", 0) 
      mortalityService.determineMortalityTable(personB, "female", "SM2", 0) 
      personA.actualBirthDate = new Date(1952, 8, 15) //Spouse A born in Sept 1952
      personA.SSbirthDate = new MonthYearDate(1952, 8)
      personB.actualBirthDate = new Date(1952, 9, 11) //Spouse B born in October 1952
      personB.SSbirthDate = new MonthYearDate(1952, 9)
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 1000
      personB.PIA = 1400
      scenario.discountRate = 3
      let results = service.maximizeCouplePViterateBothPeople(personA, personB, scenario)
      expect(results.solutionsArray[0].date).toEqual(new MonthYearDate(2018, 8))
      expect(results.solutionsArray[1].date).toEqual(new MonthYearDate(2018, 9))
      expect(results.solutionsArray[2].date).toEqual(new MonthYearDate(2022, 9))
      //This array should have 3 items in it, in this order:
        //personA retroactive retirement back to FRA of Sept 2018
        //personB retroactive restricted app back to FRA of Oct 2018
        //personB retirement at age 70
    })

    it('should tell a low-PIA spouse to file for child-in-care spousal benefits before age 62', () => {
      service.today = new MonthYearDate(2019, 0)//(date when creating this test, so that it doesn't fail in the future as "today" changes)
      familyMaximumService.today = new MonthYearDate(2019, 0) //Ditto
      scenario.maritalStatus = "married"
      scenario.discountRate = 1
      scenario.numberOfChildren = 1
      let child1:Person = new Person("1")
      child1.SSbirthDate = new MonthYearDate(2017, 3) //April 2017
      scenario.setChildrenArray([child1], service.today)
      mortalityService.determineMortalityTable(personA, "male", "SSA", 0) 
      mortalityService.determineMortalityTable(personB, "female", "SSA", 0) 
      personA.actualBirthDate = new Date(1960, 3, 15) //Spouse A born in April 1960
      personA.SSbirthDate = new MonthYearDate(1960, 3)
      personB.actualBirthDate = new Date(1970, 3, 11) //Spouse B born in April 1970
      personB.SSbirthDate = new MonthYearDate(1970, 3)
      personA.PIA = 2500
      personB.PIA = 400
      mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
      let results = service.maximizeCouplePViterateBothPeople(personA, personB, scenario)
      expect(results.solutionsArray[0].date).toEqual(new MonthYearDate(2022, 4))
      expect(results.solutionsArray[1].date).toEqual(new MonthYearDate(2022, 4))
      expect(results.solutionsArray[2].date).toEqual(new MonthYearDate(2022, 4))
      expect(results.solutionsArray[3].date).toEqual(new MonthYearDate(2033, 3))
      expect(results.solutionsArray[4].date).toEqual(new MonthYearDate(2033, 3))
      expect(results.solutionsArray[5].date).toEqual(new MonthYearDate(2033, 3))
      //This array should have 6 items in it, in this order:
        // personA retirement benefit to begin 5/2022, at age 62 and 1 months.
        // personB files for child-in-care spousal benefits to begin 5/2022, at age 52 and 1 months.
        // child files for benefits on personA's record 5/2022.
        // personB retirement benefit to begin 4/2033, at age 63 and 0 months. (Point being: personB wants the regular spousal benefit to begin immediately, once child-in-care spousal is suspended due to child reaching 16)
        // personB child-in-care spousal benefit is automatically suspended when child reaches age 16 (4/2033), when personB is age 63 and 0 months.
        // personB spousal benefit begins automatically when she files for retirement before FRA, in 4/2033 at 63 and 0 months.
    })

  })

  describe('Tests for maximizeCouplePViterateOnePerson', () => {
    let service:PresentValueService
    let benefitService:BenefitService
    let mortalityService:MortalityService
    let birthdayService:BirthdayService
    let scenario:CalculationScenario
    let personA:Person
    let personB:Person

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
      })
      service = TestBed.get(PresentValueService)
      benefitService = TestBed.get(BenefitService)
      mortalityService = TestBed.get(MortalityService)
      birthdayService = TestBed.get(BirthdayService)
      scenario = new CalculationScenario()
      personA = new Person("A")
      personB = new Person("B")
    })

  it ('should tell a divorced user with significantly lower PIA to file ASAP', () => {
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    scenario.maritalStatus = "divorced"
    mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
    mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
    personA.actualBirthDate = new Date(1964, 9, 15) //Spouse A born in October 1964
    personA.SSbirthDate = new MonthYearDate(1964, 9, 1)
    personB.actualBirthDate = new Date(1960, 9, 11) //Spouse B born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
    personB.fixedRetirementBenefitDate = new MonthYearDate (2028, 9, 1) //Filing at exactly age 68
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    scenario.maritalStatus = "divorced"
    mortalityService.determineMortalityTable(personA, "female", "NS1", 0)
    mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
    personA.actualBirthDate = new Date(1955, 9, 15) //Spouse A born in October 1955
    personA.SSbirthDate = new MonthYearDate(1955, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //Spouse B born in October 1954
    personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
    personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //Ex filing at 62
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    personA.hasFiled = true
    scenario.maritalStatus = "married"
    mortalityService.determineMortalityTable(personA, "male", "NS1", 0)
    mortalityService.determineMortalityTable(personB, "female", "NS1", 0)
    personA.actualBirthDate = new Date(1948, 3, 11) //personA born April 1948
    personA.SSbirthDate = new MonthYearDate(1948, 3, 1)
    personB.actualBirthDate = new Date(1960, 9, 15) //personB born October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
    personA.fixedRetirementBenefitDate = new MonthYearDate (2010, 4, 1) //personA filed at 62 and 1 month
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    mortalityService.determineMortalityTable(personA, "male", "SSA", 0)
    mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 9, 15) //personA born October 1960
    personA.SSbirthDate = new MonthYearDate(1960, 9, 1)
    personB.actualBirthDate = new Date(1948, 3, 11) //personB born April 1948
    personB.SSbirthDate = new MonthYearDate(1948, 3, 1)
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
    personB.fixedRetirementBenefitDate = new MonthYearDate (personB.FRA) //personB filed at FRA
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
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    personA.hasFiled = true
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    mortalityService.determineMortalityTable(personA, "male", "NS1", 0)
    mortalityService.determineMortalityTable(personB, "female", "NS1", 0)
    personA.actualBirthDate = new Date(1948, 3, 11) //personA born April 1948
    personA.SSbirthDate = new MonthYearDate(1948, 3, 1)
    personB.actualBirthDate = new Date(1952, 3, 15) //personB born April 1952
    personB.SSbirthDate = new MonthYearDate(1952, 3, 1)
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
    personA.fixedRetirementBenefitDate = new MonthYearDate (2010, 4, 1) //personA filed at 62 and 1 month
    personB.fixedRetirementBenefitDate = new MonthYearDate (personB.FRA) //personB filed at FRA
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
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    personA.hasFiled = true
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    mortalityService.determineMortalityTable(personA, "male", "SM2", 0)
    mortalityService.determineMortalityTable(personB, "female", "SM2", 0)
    personA.actualBirthDate = new Date(1947, 2, 11) //personA born in March 1947
    personA.SSbirthDate = new MonthYearDate(1947, 2, 1)
    personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
    personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
    personA.fixedRetirementBenefitDate = new MonthYearDate (2015, 2, 11) //personA filed at 68
    personB.fixedRetirementBenefitDate = new MonthYearDate (2018, 3, 1) //personB filed at 64
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    personA.hasFiled = true
    scenario.maritalStatus = "divorced"
    mortalityService.determineMortalityTable(personA, "female", "NS1", 0)
    mortalityService.determineMortalityTable(personB, "female", "SSA", 0)
    personA.actualBirthDate = new Date(1954, 2, 11) //personA born in March 1954
    personA.SSbirthDate = new MonthYearDate(1954, 2, 1)
    personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
    personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
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

  it('should suggest retroactive application for low-PIA spouse when possible, given highish discount rate and short life expectancies', () => {
    service.today = new MonthYearDate(2018, 10)//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    scenario.maritalStatus = "married"
    mortalityService.determineMortalityTable(personA, "male", "SM2", 0) 
    mortalityService.determineMortalityTable(personB, "female", "SM2", 0) 
    personA.actualBirthDate = new Date(1948, 8, 15) //Spouse A born in Sept 1948 (already age 70)
    personA.SSbirthDate = new MonthYearDate(1948, 8)
    personB.actualBirthDate = new Date(1952, 9, 11) //Spouse B born in October 1952
    personB.SSbirthDate = new MonthYearDate(1952, 9)
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
    personA.PIA = 1800
    personB.PIA = 1400
    scenario.discountRate = 8
    personA.fixedRetirementBenefitDate = new MonthYearDate(2018, 2) //filed March 2018, at 69 and 6 months
    let results = service.maximizeCouplePViterateOnePerson(scenario, personB, personA)
    expect(results.solutionsArray[0].date).toEqual(new MonthYearDate(2018, 9)) //retroactive back to personB's FRA
    //This array should have 1 item in it, personB's retirement date. No spousal for either person.

  })

  it('should tell a divorced user with lower PIA, two children already entitled on ex-spouse record, and an assumed age at death of 75 to file at 62 and 1 month for retirement and child-in-care spousal benefits', () => {
    service.today = new MonthYearDate(2020, 5)//June 2020 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    benefitService.today = new MonthYearDate(2020, 5)//Same idea, but for benefitService's "today" value as well
    scenario.maritalStatus = "divorced"
    mortalityService.determineMortalityTable(personA, "male", "fixed", 75) 
    mortalityService.determineMortalityTable(personB, "female", "SSA2016", 0)
    personA.actualBirthDate = new Date(1960, 8, 15) //Spouse A born in Sept 1960
    personA.SSbirthDate = new MonthYearDate(1960, 8)
    personB.actualBirthDate = new Date(1957, 3, 11) //Spouse B born in April 1957
    personB.SSbirthDate = new MonthYearDate(1957, 3)
    personB.hasFiled = true
    personB.fixedRetirementBenefitDate = new MonthYearDate (2019, 5) //ex-spouse filed in past, June 2019
    personA.PIA = 600
    personB.PIA = 2300
    scenario.discountRate = 0
    mockGetPrimaryFormInputs(personA, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService, benefitService, mortalityService)
    scenario.numberOfChildren = 2
    let child1:Person = new Person("1")
    let child2:Person = new Person("2")
    child1.SSbirthDate = new MonthYearDate(2015, 7) //child 1 born August 2015
    child2.SSbirthDate = new MonthYearDate(2016, 10) //child 2 born November 2016
    scenario.setChildrenArray([child1,child2], service.today)
    let results = service.maximizeCouplePViterateOnePerson(scenario, personA, personB)
    // console.log(results.solutionsArray)
    expect(results.solutionsArray[0].date).toEqual(new MonthYearDate(2019, 11))
    expect(results.solutionsArray[1].date).toEqual(new MonthYearDate(2022, 9))
    expect(results.solutionsArray[2].date).toEqual(new MonthYearDate(2022, 9))
    //This array should have 3 items in it, in this order:
      //children file retroactively on personB's record. Max retroactivity is back to 12/2019
      //personA files for retirement benefit October 2022, at age 62 and 1 months.
      //personA files for child-in-care spousal benefits October 2022, at age 62 and 1 months.
    let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
    expect(claimStrategy.outputTable[0][0]).toEqual(2022)
    expect(claimStrategy.outputTable[0][1]).toEqual("$1,268")//personA retirement benefit, times 3 months. (600 PIA, filing 59 months early, means he gets 70.41666% of PIA, or $422.50/month)
    expect(claimStrategy.outputTable[0][2]).toEqual("$1,650")//personA child-in-care spousal, times 3 months. 2300PIA/2 - 600 = $550 per month. Not reduced for early entitlement because there's a child in care.
    expect(claimStrategy.outputTable[0][4]).toEqual("$22,417")//total children benefit in 2022 is 9 months of $1,724.08 (i.e,. amount left on personB's family max),
      //plus 3 months of $2,300 (i.e., full 50% of personB PIA for each child, now that combined family max has kicked in)
  })

})

describe('test discountToPresentValue', () => {
  let service:PresentValueService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.get(PresentValueService)
  })

  it('should correctly calculate present value for cashflow 2 years in future', () => {
    let PV:number = service.discountToPresentValue(3, 1000, 2019, 2021) 
    expect(PV).toBeCloseTo(942.6, 1) //1000 / 1.03^2 = 942.60
  })

  it('should correctly calculate present value for cashflow from last year', () => {
    let PV:number = service.discountToPresentValue(3, 1000, 2019, 2018) 
    expect(PV).toBeCloseTo(1000, 1)
  })

  it('should correctly calculate present value for cashflow from this year', () => {
    let PV:number = service.discountToPresentValue(3, 1000, 2019, 2019) 
    expect(PV).toBeCloseTo(1000, 1)
  })
})