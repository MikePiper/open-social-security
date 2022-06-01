import {TestBed, inject} from '@angular/core/testing'
import {CalculatePvService} from './calculate-PV.service'
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
function mockGetPrimaryFormInputs(person:Person, scenario:CalculationScenario, today:MonthYearDate, birthdayService:BirthdayService, benefitService:BenefitService, mortalityService:MortalityService){
  person.FRA = birthdayService.findFRA(person.SSbirthDate)
  person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate)
  if (scenario.maritalStatus !== "survivor"){
    person.survivorBenefitDate = new MonthYearDate(person.survivorFRA)
  }
  person.initialAge =  birthdayService.findAgeOnDate(person, today)
  person.initialAgeRounded = Math.round(person.initialAge)
  person.baseMortalityFactor = mortalityService.calculateBaseMortalityFactor(person)
  benefitService.checkWhichPIAtoUse(person, today)//checks whether person is *entitled* to gov pension (by checking eligible and pension beginning date) and sets PIA accordingly based on one of two PIA inputs
}

describe('test calculateSinglePersonPV', () => {
  let service:CalculatePvService
  let birthdayService:BirthdayService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let familyMaximumService:FamilyMaximumService
  let earningsTestService:EarningsTestService
  let scenario:CalculationScenario
  let person:Person
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(CalculatePvService)
    birthdayService = TestBed.inject(BirthdayService)
    benefitService = TestBed.inject(BenefitService)
    mortalityService = TestBed.inject(MortalityService)
    familyMaximumService = TestBed.inject(FamilyMaximumService)
    earningsTestService = TestBed.inject(EarningsTestService)
    scenario = new CalculationScenario()
    person = new Person("A")
  })

  it('should be created', inject([CalculatePvService], (service: CalculatePvService) => {
    expect(service).toBeTruthy()
  }))

      //Test calculateSinglePersonPV()
      it('should return appropriate PV for single person, no complicating factors', () => {
        service.setToday(new MonthYearDate(2019, 7))
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(142644, 0)
      })
  
      it('should return appropriate PV for single person who files retroactive application as of their FRA', () => {
        service.setToday(new MonthYearDate(2018, 9))
        person.SSbirthDate = new MonthYearDate(1952, 3, 1) //Person born April 1952
        person.PIA = 1000
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        person.retirementBenefitDate = new MonthYearDate(person.FRA) //filing at FRA, which is retroactive (note that this line has to come after mockGetPrimaryFormInputs, which sets the person's FRA)
        scenario.discountRate = 1 //1% discount rate
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(180441, 0)
      })
    
      it('should return appropriate PV for single person, but with "still working" inputs and a different mortality table', () => { 
        service.setToday(new MonthYearDate(2019, 7))
        scenario.maritalStatus = "single"
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2024, 3, 1) //filing at age 64
        person.quitWorkDate = new MonthYearDate (2026, 3, 1) //quitting work after filing date but before FRA, earnings test IS relevant
        person.monthlyEarnings = 4500 //Just picking something here...
        scenario.discountRate = 1 //1% discount rate
        person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(194237, 0)
      })
    
      it('should return appropriate PV for a single person who files at FRA but suspends immediately until 70', () => { 
        service.setToday(new MonthYearDate(2019, 7))
        scenario.maritalStatus = "single"
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        person.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse A born in Sept 1970
        person.PIA = 1000
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        person.retirementBenefitDate = new MonthYearDate (person.FRA) //Filing exactly at FRA of 67
        person.beginSuspensionDate = new MonthYearDate(person.FRA)
        person.endSuspensionDate = new MonthYearDate(2040, 8, 1)//Age 70
        scenario.discountRate = 1
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(119370, 0)//Point being, this is same PV as when somebody just waits until 70.
      })
  
      it('should return appropriate PV for single person, a newborn child, no other complicating factors', () => {
        service.setToday(new MonthYearDate(2019, 7))
        let child1:Person = new Person("1")
        scenario.maritalStatus = "single"
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(2030, 3, 1) //child1 born in month in which retirement benefit begins
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2030, 3, 1) //filing at age 70
        scenario.discountRate = 1 //1% discount rate
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(256458, 0)
      })
  
      it('should return appropriate PV for single person, two newborn twins, no other complicating factors (confirming family max is being applied correctly)', () => {
        service.setToday(new MonthYearDate(2019, 0))
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
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(318780, 0)
      })
  
      it('should return appropriate PV for single person, newborn triplets, no other complicating factors (family max should give it same PV as prior test)', () => {
        service.setToday(new MonthYearDate(2019, 0))
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
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
          .toBeCloseTo(318780, 0)
      })
  
      it('should return appropriate PV for single person, adult disabled child, earnings test applicable, future benefit cut assumption', () => {
        service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        scenario.maritalStatus = "single"
        scenario.benefitCutAssumption = true
        scenario.benefitCutYear = 2034
        scenario.benefitCutPercentage = 23
        let child1:Person = new Person("1")
        scenario.children = [child1]
        person.SSbirthDate = new MonthYearDate(1960, 3, 1) //Person born April 1960
        child1.SSbirthDate = new MonthYearDate(2000, 3, 1) //child1 born April 2000
        child1.isOnDisability = true
        person.PIA = 1000
        person.retirementBenefitDate = new MonthYearDate(2023, 3, 1) //filing at age 63
        person.quitWorkDate = new MonthYearDate (2028, 3, 1) //Working until beyond FRA. Earnings test is relevant.
        person.monthlyEarnings = 3000
        scenario.discountRate = 1 //1% discount rate
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
        person = familyMaximumService.calculateFamilyMaximum(person, service.today)
        expect(service.calculateSinglePersonPV(person, scenario, false).PV)
        .toBeCloseTo(356479, 0)
      })
  
      //Integration testing -- not actually testing the calculated PV itself
      it('should show zero retirement benefit in table when a single person files before FRA and has high enough earnings', () => {
        service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
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
        service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
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
        service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
        person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
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




describe('tests calculateCouplePV', () => {
  let service:CalculatePvService
  let birthdayService:BirthdayService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let familyMaximumService:FamilyMaximumService
  let scenario:CalculationScenario
  let personA:Person
  let personB:Person

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(CalculatePvService)
    birthdayService = TestBed.inject(BirthdayService)
    benefitService = TestBed.inject(BenefitService)
    mortalityService = TestBed.inject(MortalityService)
    familyMaximumService = TestBed.inject(FamilyMaximumService)
    scenario = new CalculationScenario()
    personA = new Person("A")
    personB = new Person("B")
  })

    //Test the actual present value calculated
    it('should return appropriate PV for married couple, basic inputs', () => {
      service.setToday(new MonthYearDate(2020, 8)) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8) //At age 68
      personB.retirementBenefitDate = new MonthYearDate (2029, 8) //At age 66 and 2 months
      personA.spousalBenefitDate = new MonthYearDate (2032, 8) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(542950, 0)
    })
  
    it('should return appropriate PV for married couple, basic inputs, no spousal benefits, one filing early one late', () => {
      service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1960, 3, 1) //Spouse A born in April 1960
      personB.SSbirthDate = new MonthYearDate(1960, 3, 1) //Spouse B born in April 1960
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
      personA.PIA = 1000
      personB.PIA = 1000
      personA.retirementBenefitDate = new MonthYearDate (2030, 3) //At age 70 ($1240 monthly)
      personB.retirementBenefitDate = new MonthYearDate (2022, 5) //At age 62 and 2 months (58 months early -> monthly benefit = $708.33)
      personA.spousalBenefitDate = new MonthYearDate (2030, 3) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2030, 3) //Later of two retirement benefit dates
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(332609, 0)
      //no spousal for anybody.
      //Survivor beginning at 66 and 8 months (Dec 2026)
      //for personA, it's 82.5% of personB's PIA ($825). After reduction for own entitlement, it'll be $0.
      //for personB, it'll be $531.67/month
    })

  
  
    it('should return appropriate PV for married couple, still working', () => {
      service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
      service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
      service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1963, 6, 1) //Spouse B born in July 1963
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
      personA.WEP_PIA = 700
      personA.nonWEP_PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
      personB.retirementBenefitDate = new MonthYearDate (2029, 8, 1) //At age 66 and 2 months
      personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personA.nonCoveredPensionDate = new MonthYearDate(2030, 0) //Any date before personA's spousalBenefitDate, so that GPO applies
      personA.governmentPension = 900
      personA.eligibleForNonCoveredPension = true
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(486558, 0)
    })

    it ('should return appropriate PV for basic divorce scenario', () => {
      service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "divorced"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
      personA.SSbirthDate = new MonthYearDate(1964, 8, 1) //Spouse A born in Sept 1964
      personB.SSbirthDate = new MonthYearDate(1955, 3, 1) //Spouse B born in April 1955
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
      personA.WEP_PIA = 700
      personA.nonWEP_PIA = 700
      personB.PIA = 1900
      personA.retirementBenefitDate = new MonthYearDate (2032, 8, 1) //At age 68
      personB.retirementBenefitDate = new MonthYearDate (2017, 4, 1) //ASAP at 62 and 1 month
      personA.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personB.spousalBenefitDate = new MonthYearDate (2032, 8, 1) //Later of two retirement benefit dates
      personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
      personA.nonCoveredPensionDate = new MonthYearDate(2030, 0) //Any date before personA's spousalBenefitDate, so that GPO applies
      personA.governmentPension = 300
      personA.eligibleForNonCoveredPension = true
      scenario.discountRate = 1
      expect(service.calculateCouplePV(personA, personB, scenario, false).PV)
        .toBeCloseTo(158226, 0)
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are zero), both file at FRA but suspend immediately until 70', () => {
      service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse A born in Sept 1970
      personB.SSbirthDate = new MonthYearDate(1970, 8, 1) //Spouse B born in Sept 1970
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
      service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse A born in Jan 1970
      personB.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse B born in Jan 1970
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
        .toBeCloseTo(399022, 0)//See "present value service" spreadsheet for a calculation of this figure. (Update: the spreadsheet though was discounting to 62 instead of to "today")
    })
  
    it('should return appropriate PV for married couple (where spousal benefits are relevant). PersonB is disabled prior to 62. He suspends FRA to 70. Person A files at 70 for retirement and spousal.', () => { 
      service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse A born in Jan 1970
      personB.SSbirthDate = new MonthYearDate(1970, 0, 1) //Spouse B born in Jan 1970
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
        .toBeCloseTo(621734, 0)//Went year-by-year checking benefit amounts. They're good.
    })

    it('should return appropriate PV for married couple, personB recently started retirement benefit, suspends 3 months from now until 70. personA filed two years ago.', () => { 
      service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1951, 8) //Sept 1951
      personB.SSbirthDate = new MonthYearDate(1952, 2)  //March 1952
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
        .toBeCloseTo(466050, 0)
    })

    it('should return appropriate PV for married couple, both currently age 63, filed already, not suspending, spousal benefit relevant.', () => { 
      service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
      scenario.maritalStatus = "married"
      personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
      personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
      personA.SSbirthDate = new MonthYearDate(1955, 10) //Nov 1955
      personB.SSbirthDate = new MonthYearDate(1955, 10)  //Nov 1955
      mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
      mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1500
        personB.WEP_PIA = 500
        personB.nonWEP_PIA = 500
        personA.retirementBenefitDate = new MonthYearDate(2026, 2) //March 2026
        personB.retirementBenefitDate = new MonthYearDate(2027, 7) //August 2027 (age 64, 3 years before FRA) Own retirement benefit will be $400
        personA.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.nonCoveredPensionDate = new MonthYearDate(2027, 0)//Just some date before personB's spousal benefit date, so GPO is applicable
        personB.governmentPension = 150
        personB.eligibleForNonCoveredPension = true
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[2][0]).toEqual(2028)
        expect(claimStrategy.outputTable[2][5]).toEqual("$1,050")
        //same as prior, minus 2/3 of $150 monthly gov pension = $87.50 spousal per month
      })
    
      it('should calculate spousal benefit appropriately prior to FRA, when reduced to zero by GPO', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        personA.actualBirthDate = new Date(1963, 2, 15) //March 1963
        personB.actualBirthDate = new Date(1963, 7, 2) //August 1963
        personA.SSbirthDate = new MonthYearDate(1963, 2)
        personB.SSbirthDate = new MonthYearDate (1963, 7)
        personA.FRA = birthdayService.findFRA(personA.SSbirthDate) //March 2030
        personB.FRA = birthdayService.findFRA(personB.SSbirthDate) //August 2030
        personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
        personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
        personA.PIA = 1500
        personB.WEP_PIA = 500
        personB.nonWEP_PIA = 500
        personA.retirementBenefitDate = new MonthYearDate(2026, 2) //March 2026
        personB.retirementBenefitDate = new MonthYearDate(2027, 7) //August 2027 (age 64, 3 years before FRA) Own retirement benefit will be $400
        personA.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.spousalBenefitDate = new MonthYearDate(2027, 7) //later of two retirementBenefitDates
        personB.nonCoveredPensionDate = new MonthYearDate(2027, 0)//Just some date before personB's spousal benefit date, so GPO is applicable
        personB.governmentPension = 1000
        personB.eligibleForNonCoveredPension = true
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[2][0]).toEqual(2028)
        expect(claimStrategy.outputTable[2][5]).toEqual("$0")
      })
    
      it('should calculate spousal benefit appropriately after FRA', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
        personA.survivorBenefitDate = new MonthYearDate(personA.survivorFRA)
        personB.survivorBenefitDate = new MonthYearDate(personB.survivorFRA)
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.outputTable[11][0]).toEqual("If your spouse outlives you")
        expect(claimStrategy.outputTable[11][6]).toEqual("$6,480") //deceased filed at 70 with FRA of 67. Benefit would have been 1240. Minus survivor's own 700 retirement benefit, gives 540 survivor benefit. 12 x 540 = 6480
      })
  
      it('should calculate personB survivor benefit appropriately as zero with own larger retirement benefit. Deceased personA filed at age 70', () => {
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
          personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
          personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
          personA.survivorBenefitDate = new MonthYearDate(personA.survivorFRA)
          personB.survivorBenefitDate = new MonthYearDate(personB.survivorFRA)
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
          personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
          personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
        service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
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
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
        service.setToday (new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
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
        mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
        service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
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
        mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
        personA.retirementBenefitDate = new MonthYearDate(2043, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2047, 6) //files at 65
        personA.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates
        personB.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates
        personB.quitWorkDate = new MonthYearDate(2048, 0) //Working until Jan 2048
        personB.monthlyEarnings = 3000
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(376954, 0)
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
        service.setToday(new MonthYearDate(2018, 11))//Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
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
        mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
        personA.retirementBenefitDate = new MonthYearDate(2045, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2047, 6) //files at 65
        personA.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates (65 and 4 months)
        personB.spousalBenefitDate = new MonthYearDate(2047, 6) //later of two retirement benefit dates (age 65, not that it's relevant)
        personB.quitWorkDate = new MonthYearDate(2048, 0) //Working until Jan 2048
        personB.monthlyEarnings = 2800
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(379750, 0)
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
        service.setToday(new MonthYearDate(2018, 11))
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        scenario.numberOfChildren = 1
        let child1:Person = new Person("1")
        child1.SSbirthDate = new MonthYearDate(2009, 2) //March 2009
        scenario.setChildrenArray([child1], service.today)
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        personA.PIA = 1500
        personB.PIA = 600
        personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
        personB.actualBirthDate = new Date (1960, 2, 21) //March 1960
        personA.SSbirthDate = new MonthYearDate(1960, 2)
        personB.SSbirthDate = new MonthYearDate(1960, 2)
        mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
        personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
        personB.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63
        personA.spousalBenefitDate = new MonthYearDate(2025, 2) //This date doesn't matter, given PIAs. But same reasoning as field for personB
        personB.spousalBenefitDate = new MonthYearDate(2025, 2)
        personB.childInCareSpousalBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
        //^^Spousal benefit begins March 2023 when personA starts retirement. But it's child in care spousal benefit until child turns 16 in March 2025. Here we are having them file Form SSA-25 immediately at that date.
        personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
        personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(403991, 0)
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
        service.setToday(new MonthYearDate(2018, 11))
        scenario.maritalStatus = "married"
        scenario.discountRate = 1
        scenario.numberOfChildren = 1
        let child1:Person = new Person("1")
        child1.SSbirthDate = new MonthYearDate(2009, 2) //March 2009
        scenario.setChildrenArray([child1], service.today)
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
        personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
        personA.PIA = 1500
        personB.PIA = 600
        personA.actualBirthDate = new Date (1960, 2, 5) //March 1960
        personB.actualBirthDate = new Date (1960, 2, 21) //March 1960
        personA.SSbirthDate = new MonthYearDate(1960, 2)
        personB.SSbirthDate = new MonthYearDate(1960, 2)
        personB.quitWorkDate = new MonthYearDate(2027, 0) //quitWorkDate January 2027, so it's the first month without work
        personB.monthlyEarnings = 10000
        personA.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63 (48 months early, retirement benefit = $1,125)
        personB.retirementBenefitDate = new MonthYearDate(2023, 2) //files at 63 (48 months early, retirement benefit = $450)
        personA.spousalBenefitDate = new MonthYearDate(2025, 2) //This date doesn't matter, given PIAs. But same reasoning as field for personB
        personB.spousalBenefitDate = new MonthYearDate(2025, 2)
        //^^Spousal benefit begins March 2023 when personA starts retirement. But it's child in care spousal benefit until child turns 16 in March 2025. Here we are having them file Form SSA-25 immediately at that date.
        personA.survivorBenefitDate = new MonthYearDate(personA.survivorFRA)//doesn't file for survivor benefits prior to survivor FRA
        personB.survivorBenefitDate = new MonthYearDate(personB.survivorFRA)//doesn't file for survivor benefits prior to survivor FRA
        mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
        personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
        personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
        let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
        expect(claimStrategy.PV).toBeCloseTo(365492, 0)
        //manual calculation:
          //personA.familyMaximum = 2684.32 (150% up to $1144, 272% up to $1651)
          //personB.familyMaximum = 900
          //1500 + 750 + 750 (original benefits on personA's record) < combined family max, so family max isn't an issue here.
          //personA spousal benefit = 0
          //personB spousal benefit = 150 (1500/2 - 600) <- not reduced for age during time that child1 is under age 16
          //in March 2025 child1 turns 16. So now personB's spousal benefit will be reduced for age if they file form SSA-25 immediately, which we they are doing, given spousalBenefitDate above.
            //personB's new spousal benefit: $125 (Age 65 and 0 months. 24 months early = 83.33% full spousal benefit)
          //personB annual earnings: 120k -> (120000 - 17040)/2 = $51,480 withholding necessary in years prior to FRA (from personB's record)
          //Available to withhold per month: $450 retirement for personB, $150 spousal for personB, and $750 child benefit = $1,350
            //^^Going with POMS RS 02501.140 here, even though it contradicts SSAct and CFR. (That is, we're making child benefit withholdable on personB's record, even though it's coming on personA's record.)
          //$51,480 necessary withholding / 1350 available per month = 39 months per year need to be withheld. (So whole year is withheld for 2023, 2024, 2025, 2026)
          expect(claimStrategy.outputTable[0]).toEqual([2023, "$11,250", "$0", "$0", "$0", "$0", "$0", "$0", "$11,250"])//10 months of retirement for personA, everything else withheld
          expect(claimStrategy.outputTable[1]).toEqual([2024, "$13,500", "$0", "$0", "$0", "$0", "$0", "$0", "$13,500"])//12 months of retirement for personA, everything else withheld
          //March 2025 child turns 16 and personB files SSA-25. So now spousal benefit would be normal spousal benefit (reduced to $125 due to being 24 months early). But it's withheld due to earnings. So we start counting spousal ARF credits
          expect(claimStrategy.outputTable[2]).toEqual([2025, "$13,500", "$0", "$0", "$0", "$0", "$0", "$0", "$13,500"])//12 months of retirement for personA, everything else withheld (10 ARF credits)
          expect(claimStrategy.outputTable[3]).toEqual([2026, "$13,500", "$0", "$0", "$0", "$0", "$0", "$0", "$13,500"])//12 months of retirement for personA, everything else withheld (12 ARF credits)
          //In 2027, no earnings so no withholding.
          //personB filed for retirement 48 months early, but was withheld for 46 of those months. ARF happens in March, so now benefit is only 2 months early (98.88888% = $593.33)
          //$450 x 2 + $593.33 x 10 = $6,833
          //Gets $125 spousal benefit for 2 months, then ARF happens in March. Was 24 months early, but has 22 spousal ARF credits.
          //2 months early spousal reduction factor = 98.611111%. (1500/2 - 600) * 0.986111 = $147.91
          //$125 x 2 + $147.91 x 10 = $1729.17
          //Child gets 2 months of child benefits on personA, then turns 18.
          expect(claimStrategy.outputTable[4]).toEqual([2027, "$13,500", "$0", "$0", "$6,833", "$1,729", "$0", "$1,500", "$23,563"])
      })



        it('Should calculate retirement/spousal/child benefits appropriately for everybody in combined family max scenario', () => {
          service.setToday(new MonthYearDate(2022, 1)) //Test was updated in 2022. Have to hardcode in the year, otherwise it will fail every new year.
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
          personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
          personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
          mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.PV).toBeCloseTo(485757, 0)
          //manual calculation:
            //personA.familyMaximum = 2484.24 (150% up to $1308, 272% up to $1889)
            //personB.familyMaximum = 900
            //1500 + 750*4 (i.e., original benefits on personA's record) > combined family max, so family max IS an issue here.
            //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
            //personA spousal benefit = 0
            //personB retirement benefit = 450 (75% of PIA due to 48 months early)
            //Combined family max = 3384.24
            //Back out personA's PIA -> amount left for everybody else is 1884.24
            //That's $471.06 for personB and each of 3 children
            //Adjust personB's spousal for own entitlement: subtract $600. personB spousal is now $0
            //So now we have $1884.24/3 = $628.08 for each of 3 children
            //table begins in 2023
            //Events to consider: Child1 hits 18 in Jan 2025. Child2 hits 18 in Jan 2027, and Child3 hits 16 on same date. Child3 hits 18 in Jan 2029.
            //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
            expect(claimStrategy.outputTable[0]).toEqual([2023, "$11,250", "$0", "$0", "$4,500", "$0", "$0", "$18,842", "$34,592"])
            expect(claimStrategy.outputTable[1]).toEqual([2024, "$13,500", "$0", "$0", "$5,400", "$0", "$0", "$22,611", "$41,511"]) //Same as 2023, but 12 months instead of 10
            //For 2025, there are now only 2 children. So we divide $1884.24 by 3 people = $628.08 per child but also for personB as spousal original benefit.
            //Subtract 600 for own entitlement. personB spousal benefit = $28.08
            //1884.24 - $28.08 = $1856.16 left for two children, which is more than enough to give each one their full original benefit of $750
            expect(claimStrategy.outputTable[2]).toEqual([2025, "$13,500", "$0", "$0", "$5,400", "$337", "$0", "$18,000", "$37,237"])
            expect(claimStrategy.outputTable[3]).toEqual([2026, "$13,500", "$0", "$0", "$5,400", "$337", "$0", "$18,000", "$37,237"])
            //As of Jan 2027, there is only 1 child. $1884.24 / 2 = $942.12 available for child3 and for personB (in both-alive scenario)
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
            console.log(claimStrategy.outputTable)
        })


        it("Should calculate everybody's benefits appropriately in pre-62 scenario with child in care (before child 16, after child 16)", () => {
          service.setToday(new MonthYearDate(2022, 1)) //Test was updated in 2022. Have to hardcode in the year, otherwise it will fail every new year.
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          scenario.numberOfChildren = 1
          let child1:Person = new Person("1")
          child1.SSbirthDate = new MonthYearDate(2010, 2) //March 2010
          scenario.setChildrenArray([child1], service.today)
          personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
          personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
          mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.PV).toBeCloseTo(445719, 0)
          //manual calculation
            //personA.familyMaximum = 2484.24 (150% up to $1308, 272% up to $1889)
            //personB.familyMaximum = 900
            //Combined family max isn't applicable though until personB is entitled to retirement.
            //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
            //personA spousal benefit = 0
            //personB retirement benefit (eventually) = $480 (80% of PIA due to 36 months early)
            //personB original spousal benefit = $750
            //family maximum application:
              //2484.24 - 1500 = 984.24 left for everybody else
              //984.24 / 2 = 492.12 each for child1 and personB
            //personB spousal benefit doesn't get reduced for own entitlement, because not yet entitled to retirement. Doesn't get reduced for age because of child in care.
            //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
            expect(claimStrategy.outputTable[0]).toEqual([2023, "$11,250", "$0", "$0", "$0", "$4,921", "$0", "$4,921", "$21,092"]) //10 months for everybody
            expect(claimStrategy.outputTable[1]).toEqual([2024, "$13,500", "$0", "$0", "$0", "$5,905", "$0", "$5,905", "$25,311"]) //12 months for everybody
            expect(claimStrategy.outputTable[2]).toEqual([2025, "$13,500", "$0", "$0", "$0", "$5,905", "$0", "$5,905", "$25,311"]) //same as 2024
            //in March 2026 child1 turns 16, so personB's spousal benefit stops. (Child1 can then get full original benefit.)
            expect(claimStrategy.outputTable[3]).toEqual([2026, "$13,500", "$0", "$0", "$0", "$984", "$0", "$8,484", "$22,968"]) //2 months spousal for personB. child gets 2x492.12 + 10x750
            //in March 2034 personB begins retirement benefit and spousal benefit. At this point there is no child under 18, so family max not a concern.
            //spousal benefit is 36 months early (75% reduction factor) = (1500/2 - 600) * .75 = 112.50
            expect(claimStrategy.outputTable[11]).toEqual([2034, "$13,500", "$0", "$0", "$4,800", "$1,125", "$0", "$0", "$19,425"])
            expect(claimStrategy.outputTable[12]).toEqual([2035, "$13,500", "$0", "$0", "$5,760", "$1,350", "$0", "$0", "$20,610"])
        })

        it("Should calculate everybody's benefits appropriately in pre-62 scenario with child in care (child turns 16 when person is 63. person files SSA-25 on that date, so spousal continues but is reduced for age.)", () => {
          service.setToday(new MonthYearDate(2022, 1)) //Test was updated in 2022. Have to hardcode in the year, otherwise it will fail every new year.
          scenario.maritalStatus = "married"
          scenario.discountRate = 1
          scenario.numberOfChildren = 1
          let child1:Person = new Person("1")
          child1.SSbirthDate = new MonthYearDate(2010, 2) //March 2010
          scenario.setChildrenArray([child1], service.today)
          personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
          personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
          mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
          let claimStrategy:ClaimStrategy = service.calculateCouplePV(personA, personB, scenario, true)
          expect(claimStrategy.PV).toBeCloseTo(442317, 0)
          //manual calculation
            //personA.familyMaximum = 2484.24 (150% up to $1308, 272% up to $1889)
            //personB.familyMaximum = 900
            //Combined family max isn't applicable though until personB is entitled to retirement (April 2025).
            //personA retirement benefit = 1125 (75% of PIA due to 48 months early)
            //personA spousal benefit = 0
            //personB retirement benefit = $422.50 (70.41666% of PIA due to 59 months early)
            //personB original spousal benefit = $750
            //family maximum application in 2023:
              //2484.24 - 1500 = 984.24 left for everybody else
              //984.24 / 2 = 492.12 each for child1 and personB
            //personB spousal benefit doesn't get reduced for own entitlement, because not yet entitled to retirement. Doesn't get reduced for age because of child in care.
            //each row: year, personAretirement, personAspousal, personAsurvivor, personBretirement, personBspousal, personBsurvivor, total child benefit, total
            expect(claimStrategy.outputTable[0]).toEqual([2023, "$11,250", "$0", "$0", "$0", "$4,921", "$0", "$4,921", "$21,092"]) //10 months for everybody
            expect(claimStrategy.outputTable[1]).toEqual([2024, "$13,500", "$0", "$0", "$0", "$5,905", "$0", "$5,905", "$25,311"]) //12 months for everybody
            //April 2025: personB retirement begins -- changes personB's spousal benefit and family max application
            //now we have combined family max of 3384.24.
            //back out personA PIA of $1500. We have $1884.24 left for everybody else. More than enough for each person's "original benefit" amounts.
            //child benefit = $492.12x 3 months + $750 x 9 months = 8226
            //personB retirement benefit (59 months early, 70.41666%) = 600 * 70.41666% = $422.50
            //personB spousal is now reduced for own entitlement beginning in April. Still not reduced for age yet due to child in care. ($750 - $600 = 150)
              //personB spousal for year = $492.12 x 3 months + $150 x 9 months = 2826.36
            expect(claimStrategy.outputTable[2]).toEqual([2025, "$13,500", "$0", "$0", "$3,803", "$2,826", "$0", "$8,226", "$28,355"])
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
          service.setToday(new MonthYearDate(2019, 0))
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
          personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
          personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
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
          mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
          personA = familyMaximumService.calculateFamilyMaximum(personA, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
          personB = familyMaximumService.calculateFamilyMaximum(personB, service.today)  //(It's normally calculated in maximize PV function so it doesn't get done over and over. This has to be after PIA named of course.)
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

        it ('should calculate survivorPV appropriately...', () => {
          service.setToday(new MonthYearDate(2020, 8))//Sept 2020 when creating this test
          scenario.maritalStatus = "survivor"
          personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
          personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
          personA.SSbirthDate = new MonthYearDate(1960, 3)
          personB.SSbirthDate = new MonthYearDate(1960, 3)
          personB.dateOfDeath = new MonthYearDate(2020, 3)//personB died April 2020 (not quite age 60)
          mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
          mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
          personB.hasFiled = false //personB died before having filed and before reaching their FRA, so their retirementBenefitDate is their FRA
          personA.PIA = 600
          personB.PIA = 2340
          personA.retirementBenefitDate = new MonthYearDate(2028, 9)//Oct 2028
          personA.survivorBenefitDate = new MonthYearDate(2023, 7)//Aug 2023
          personB.retirementBenefitDate = new MonthYearDate(personB.FRA)//personB hadn't filed as of date of death and died before FRA, so we use FRA for this field
          scenario.discountRate = 1
          let results = service.calculateCouplePV(personA, personB, scenario, false)
          expect(results.PV)
          .toBeCloseTo(488867, 0)
        })
        
      })





describe('test discountToPresentValue', () => {
  let service:CalculatePvService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(CalculatePvService)
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

describe('test whenShouldPVcalculationStart()', () => {
  let service:CalculatePvService
  let birthdayService:BirthdayService
  let scenario:CalculationScenario
  let personA:Person
  let personB:Person
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(CalculatePvService)
    birthdayService = TestBed.inject(BirthdayService)
    scenario = new CalculationScenario()
    personA = new Person("A")
    personB = new Person("B")
  })

  it('should correctly determine to start PV calc on Jan 1 of last year in survivor scenario with kids and deceased spouse died last year', () => {
    let startDate:MonthYearDate
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    scenario.maritalStatus = "survivor"
    scenario.numberOfChildren = 2
    let child1:Person = new Person("1")
    let child2:Person = new Person("2")
    child1.SSbirthDate = new MonthYearDate(2015, 7) //child 1 born August 2015
    child2.SSbirthDate = new MonthYearDate(2016, 10) //child 2 born November 2016
    scenario.setChildrenArray([child1,child2], service.today)
    personB.dateOfDeath = new MonthYearDate(2019, 11)//died Dec 2019
    startDate = service.whenShouldPVcalculationStart(scenario, personA, personB)
    expect(startDate).toEqual(new MonthYearDate(2019, 0))
  })

  it('should correctly determine to start PV calc on Jan 1 of this year in survivor scenario with kids and deceased spouse died earlier this year', () => {
    let startDate:MonthYearDate
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    scenario.maritalStatus = "survivor"
    scenario.numberOfChildren = 2
    let child1:Person = new Person("1")
    let child2:Person = new Person("2")
    child1.SSbirthDate = new MonthYearDate(2015, 7) //child 1 born August 2015
    child2.SSbirthDate = new MonthYearDate(2016, 10) //child 2 born November 2016
    scenario.setChildrenArray([child1,child2], service.today)
    personB.dateOfDeath = new MonthYearDate(2020, 2)//died March 2020
    personA.survivorBenefitDate = new MonthYearDate(2021, 2) //Planning to file for survivor benefits March of 2021 
    personA.retirementBenefitDate = new MonthYearDate(2023, 2) //Planning to file for retirement benefits March 2023 (These filing dates make no sense as good choices, but that doesn't matter here.)
    startDate = service.whenShouldPVcalculationStart(scenario, personA, personB)
    expect(startDate).toEqual(new MonthYearDate(2020, 0))
  })

  it('should correctly determine to start PV calc on Jan 1 of last year in survivor scenario with personA already having reached FRA', () => {
    let startDate:MonthYearDate
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1953, 11)//Dec 1953
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    scenario.maritalStatus = "survivor"
    personB.dateOfDeath = new MonthYearDate(2019, 11)//died Dec 2019
    startDate = service.whenShouldPVcalculationStart(scenario, personA, personB)
    expect(startDate).toEqual(new MonthYearDate(2019, 0))
  })

  it('should correctly determine to start PV calc on Jan 1 of earlier of retirementBenefitYear or survivorBenefitYear in survivor scenario with no kids and person younger than FRA', () => {
    let startDate:MonthYearDate
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1958, 5)//June 1958. So they're 62 and 2 months old right now.
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    scenario.maritalStatus = "survivor"
    personB.dateOfDeath = new MonthYearDate(2019, 11)//died Dec 2019
    personA.retirementBenefitDate = new MonthYearDate(2022, 5) //planning to file for survivor benefits at age 64
    personA.survivorBenefitDate = new MonthYearDate(2028, 5) //planning to file for retirement benefits at age 70
    startDate = service.whenShouldPVcalculationStart(scenario, personA, personB)
    expect(startDate).toEqual(new MonthYearDate(2022, 0))
  })

  it('should correctly determine to start PV calc on Jan 1 of earlier of retirementBenefitYear or survivorBenefitYear in survivor scenario with no kids and person younger than FRA', () => {
    let startDate:MonthYearDate
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1958, 5)//June 1958. So they're 62 and 2 months old right now.
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    scenario.maritalStatus = "survivor"
    personB.dateOfDeath = new MonthYearDate(2019, 11)//died Dec 2019
    personA.retirementBenefitDate = new MonthYearDate(2026, 5) //planning to file for survivor benefits at age 68
    personA.survivorBenefitDate = new MonthYearDate(2021, 7) //planning to file for retirement benefits at age 63 and 2 months
    startDate = service.whenShouldPVcalculationStart(scenario, personA, personB)
    expect(startDate).toEqual(new MonthYearDate(2021, 0))
  })
})

