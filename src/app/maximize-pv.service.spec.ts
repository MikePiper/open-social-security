import {TestBed} from '@angular/core/testing'
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
import { MaximizePVService } from './maximize-pv.service';


//Util used to replace certain things that would happen in real life application, but which need to be done in tests because getPrimaryFormInputs() never gets called
function mockGetPrimaryFormInputs(person:Person, scenario:CalculationScenario, today:MonthYearDate, birthdayService:BirthdayService, benefitService:BenefitService, mortalityService:MortalityService){
  person.FRA = birthdayService.findFRA(person.SSbirthDate)
  person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate)
  if (scenario.maritalStatus !== "survivor"){
    person.survivorBenefitDate = new MonthYearDate(person.survivorFRA)
  }
  person.initialAge =  birthdayService.findAgeOnDate(person, today)
  person.initialAgeRounded = Math.round(person.initialAge)
  if (!person.mortalityTable) {person.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA2017", 0) }//Give them a mortality table if test doesn't include one
  person.baseMortalityFactor = mortalityService.calculateBaseMortalityFactor(person)
}

describe('MaximizePVService', () => {
  let service: MaximizePVService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    });
    service = TestBed.inject(MaximizePVService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


describe('test maximizeSinglePersonPV', () => {
  let service:MaximizePVService
  let benefitService:BenefitService
  let birthdayService:BirthdayService
  let mortalityService:MortalityService
  let scenario:CalculationScenario
  let person:Person

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(MaximizePVService)
    benefitService = TestBed.inject(BenefitService)
    birthdayService = TestBed.inject(BirthdayService)
    mortalityService = TestBed.inject(MortalityService)
    scenario = new CalculationScenario()
    person = new Person("A")
  })

  it('should tell a single person to file ASAP with very high discount rate', () => {
    service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
    scenario.maritalStatus = "single"
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.PIA = 1000
    scenario.discountRate = 9 //9% discount rate
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2022, 4, 1))
  })

  it('should tell a single person slightly past FRA to file retroactively at FRA with very high discount rate', () => {
    service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
    person.actualBirthDate = new Date(1952, 8, 15)
    person.SSbirthDate = new MonthYearDate(1952, 8) //SSBirthdate Sept 1952
    person.FRA = birthdayService.findFRA(person.SSbirthDate) //FRA age 66 -> Sept 2018
    person.PIA = 1000
    scenario.maritalStatus = "single"
    scenario.discountRate = 9 //9% discount rate
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new MonthYearDate(2018, 8))
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("retroactiveRetirement")
  })

  it('should tell a single person to suspend until 70 if filed early, long life expectancy, and zero discount rate', () => {
    service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
    scenario.maritalStatus = "single"
    person.hasFiled = true
    person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    person.actualBirthDate = new Date(1953, 3, 15) //Person born April 16 1953
    person.SSbirthDate = new MonthYearDate(1953, 3, 1)
    mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2018, 10)) //hard-coding "today" so that it doesn't fail in future just because date changes
    let child:Person = new Person("1")
    scenario.maritalStatus = "single"
    scenario.children = [child]
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 16 1960
    person.SSbirthDate = new MonthYearDate(1960, 3, 1)
    person.PIA = 1000
    child.SSbirthDate = new MonthYearDate(1990, 7)
    child.isOnDisability = true
    scenario.discountRate = 1 //1% discount rate
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    mockGetPrimaryFormInputs(person, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
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
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    let today:MonthYearDate = new MonthYearDate()
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].benefitType)
      .toEqual("child")
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(today)
  })
  
})



describe('Tests for maximizeCouplePViterateBothPeople', () => {
  let service:MaximizePVService
  let mortalityService:MortalityService
  let birthdayService:BirthdayService
  let benefitService:BenefitService
  let familyMaximumService:FamilyMaximumService
  let scenario:CalculationScenario
  let personA:Person
  let personB:Person


  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(MaximizePVService)
    mortalityService = TestBed.inject(MortalityService)
    birthdayService = TestBed.inject(BirthdayService)
    benefitService = TestBed.inject(BenefitService)
    familyMaximumService = TestBed.inject(FamilyMaximumService)
    scenario = new CalculationScenario()
    personA = new Person("A")
    personB = new Person("B")
  })

  afterEach(() => {//For some reason, without an afterEach, one of these tests gets skipped.
    // console.log()
  })

  it ('should tell a high-PIA spouse to wait until 70, with low discount rate and long lifespans', () => {
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.actualBirthDate = new Date(1964, 8, 15) //Spouse A born in Sept 1964
    personA.SSbirthDate = new MonthYearDate(1964, 8, 1)
    personB.actualBirthDate = new Date(1964, 9, 11) //Spouse B born in October 1964
    personB.SSbirthDate = new MonthYearDate(1964, 9, 1)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) 
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0) 
    personA.actualBirthDate = new Date(1953, 8, 15) //Spouse A born in Sept 1953
    personA.SSbirthDate = new MonthYearDate(1953, 8, 1)
    personB.actualBirthDate = new Date(1953, 9, 11) //Spouse B born in October 1953
    personB.SSbirthDate = new MonthYearDate(1953, 9, 1)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personA.actualBirthDate = new Date(1955, 9, 15) //personA born in October 1955
    personA.SSbirthDate = new MonthYearDate(1955, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
    personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
    personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personB filed at 62 and 1 month
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personA.PIA = 1000
    personB.PIA = 1150
    personA.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2018,3,1) //already quit working
    scenario.discountRate = 0
    let results = service.maximizeCouplePViterateBothPeople(personA, personB, scenario)
    expect(results.solutionsArray[2].date)
    .toEqual(new MonthYearDate(2025, 9, 1))
    //We're looking at item [0] in the array. This array should have 3 items in it: suspend for personB, unsuspend for personB, retirement date for personA
  })

  it('should tell personA to file ASAP, even if personB filed early at 62, if personA has lower PIA (such that even delaying wouldnnt result in higher last-to-die benefit', () => {
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    personB.hasFiled = true
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 9, 15) //personA born in October 1960
    personA.SSbirthDate = new MonthYearDate(1960, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
    personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
    personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personB filed at 62 and 1 month
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    personA.hasFiled = true
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1954, 9, 11) //personA born in October 1954
    personA.SSbirthDate = new MonthYearDate(1954, 9, 1)
    personB.actualBirthDate = new Date(1960, 9, 15) //personB born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
    personA.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //personA filed at 62
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    personA.hasFiled = true
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SM2", 0)
    personA.actualBirthDate = new Date(1954, 2, 11) //personA born in March 1954
    personA.SSbirthDate = new MonthYearDate(1954, 2, 1)
    personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
    personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
    personA.fixedRetirementBenefitDate = new MonthYearDate (2018, 3, 1) //personA filed at 64
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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

  it('should tell personA to file at assumed death age, if they have higher PIA, personB has normal life expectancy, and they are using A-dies-at-68 assumption', () => {
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 68)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personA.actualBirthDate = new Date(1960, 2, 11) //personA born in March 1960
    personA.SSbirthDate = new MonthYearDate(1960, 2, 1)
    personB.actualBirthDate = new Date(1960, 2, 15) //personB born in March 1960
    personB.SSbirthDate = new MonthYearDate(1960, 2, 1)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personA.PIA = 2000
    personB.PIA = 1100
    personA.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
    personB.quitWorkDate = new MonthYearDate(2015,3,1) //already quit working
    scenario.discountRate = 0
    expect(service.maximizeCouplePViterateBothPeople(personA, personB, scenario).solutionsArray[1].date)
    .toEqual(new MonthYearDate(2029, 0))
    //We're looking at item [1] in the array. This array should have 2 items in it: retirementDate for personA and retirement date for personB.
    //personBs should be somewhere early-ish, while personA should wait as long as possible (assumed death date)
      //Note that an assumed age at death of 68 means we assume they live through 2028, then die in Jan 2029.
  })

  it('should tell personA to suspend from FRA to 70, if personA is disabled, personA has higher PIA, both have normal life expectancies', () => {
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 2, 11) //personA born in March 1960
    personA.SSbirthDate = new MonthYearDate(1960, 2, 1)
    personB.actualBirthDate = new Date(1960, 2, 15) //personB born in March 1960
    personB.SSbirthDate = new MonthYearDate(1960, 2, 1)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2018, 11)) //Test was written in 2018. Have to hardcode in the year, otherwise it will fail every new year.
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0) //originally SM2
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0) //originally SSA
    personA.actualBirthDate = new Date(1964, 3, 11) //personA born in April 1964
    personA.SSbirthDate = new MonthYearDate(1964, 3, 1)
    personB.actualBirthDate = new Date(1960, 3, 15) //personB born in April 1960
    personB.SSbirthDate = new MonthYearDate(1960, 3, 1)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
    scenario.maritalStatus = "married"
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0) 
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SM2", 0) 
    personA.actualBirthDate = new Date(1952, 8, 15) //Spouse A born in Sept 1952
    personA.SSbirthDate = new MonthYearDate(1952, 8)
    personB.actualBirthDate = new Date(1952, 9, 11) //Spouse B born in October 1952
    personB.SSbirthDate = new MonthYearDate(1952, 9)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
    service.setToday(new MonthYearDate(2019, 0))//(date when creating this test, so that it doesn't fail in the future as "today" changes)
    familyMaximumService.today = new MonthYearDate(2019, 0) //Ditto
    scenario.maritalStatus = "married"
    scenario.discountRate = 1
    scenario.numberOfChildren = 1
    let child1:Person = new Person("1")
    child1.SSbirthDate = new MonthYearDate(2017, 3) //April 2017
    scenario.setChildrenArray([child1], service.today)
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) 
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0) 
    personA.actualBirthDate = new Date(1960, 3, 15) //Spouse A born in April 1960
    personA.SSbirthDate = new MonthYearDate(1960, 3)
    personB.actualBirthDate = new Date(1970, 3, 11) //Spouse B born in April 1970
    personB.SSbirthDate = new MonthYearDate(1970, 3)
    personA.PIA = 2500
    personB.PIA = 400
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
  let service:MaximizePVService
  let calculatePVservice:CalculatePvService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let birthdayService:BirthdayService
  let scenario:CalculationScenario
  let personA:Person
  let personB:Person

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(MaximizePVService)
    calculatePVservice = TestBed.inject(CalculatePvService)
    benefitService = TestBed.inject(BenefitService)
    mortalityService = TestBed.inject(MortalityService)
    birthdayService = TestBed.inject(BirthdayService)
    scenario = new CalculationScenario()
    personA = new Person("A")
    personB = new Person("B")
  })

it ('should tell a divorced user with significantly lower PIA to file ASAP', () => {
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  scenario.maritalStatus = "divorced"
  personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
  personA.actualBirthDate = new Date(1964, 9, 15) //Spouse A born in October 1964
  personA.SSbirthDate = new MonthYearDate(1964, 9, 1)
  personB.actualBirthDate = new Date(1960, 9, 11) //Spouse B born in October 1960
  personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
  personB.fixedRetirementBenefitDate = new MonthYearDate (2028, 9, 1) //Filing at exactly age 68
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  scenario.maritalStatus = "divorced"
  personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
  personA.actualBirthDate = new Date(1955, 9, 15) //Spouse A born in October 1955
  personA.SSbirthDate = new MonthYearDate(1955, 9, 1)
  personB.actualBirthDate = new Date(1954, 9, 11) //Spouse B born in October 1954
  personB.SSbirthDate = new MonthYearDate(1954, 9, 1)
  personB.fixedRetirementBenefitDate = new MonthYearDate (2016, 10, 1) //Ex filing at 62
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  personA.hasFiled = true
  scenario.maritalStatus = "married"
  personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS1", 0)
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
  personA.actualBirthDate = new Date(1948, 3, 11) //personA born April 1948
  personA.SSbirthDate = new MonthYearDate(1948, 3, 1)
  personB.actualBirthDate = new Date(1960, 9, 15) //personB born October 1960
  personB.SSbirthDate = new MonthYearDate(1960, 9, 1)
  personA.fixedRetirementBenefitDate = new MonthYearDate (2010, 4, 1) //personA filed at 62 and 1 month
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  personB.hasFiled = true
  scenario.maritalStatus = "married"
  personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
  personA.actualBirthDate = new Date(1960, 9, 15) //personA born October 1960
  personA.SSbirthDate = new MonthYearDate(1960, 9, 1)
  personB.actualBirthDate = new Date(1948, 3, 11) //personB born April 1948
  personB.SSbirthDate = new MonthYearDate(1948, 3, 1)
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  personA.hasFiled = true
  personB.hasFiled = true
  scenario.maritalStatus = "married"
  personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS1", 0)
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
  personA.actualBirthDate = new Date(1948, 3, 11) //personA born April 1948
  personA.SSbirthDate = new MonthYearDate(1948, 3, 1)
  personB.actualBirthDate = new Date(1952, 3, 15) //personB born April 1952
  personB.SSbirthDate = new MonthYearDate(1952, 3, 1)
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  personA.hasFiled = true
  personB.hasFiled = true
  scenario.maritalStatus = "married"
  personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0)
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SM2", 0)
  personA.actualBirthDate = new Date(1947, 2, 11) //personA born in March 1947
  personA.SSbirthDate = new MonthYearDate(1947, 2, 1)
  personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
  personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
  personA.fixedRetirementBenefitDate = new MonthYearDate (2015, 2, 11) //personA filed at 68
  personB.fixedRetirementBenefitDate = new MonthYearDate (2018, 3, 1) //personB filed at 64
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  personA.hasFiled = true
  scenario.maritalStatus = "divorced"
  personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
  personA.actualBirthDate = new Date(1954, 2, 11) //personA born in March 1954
  personA.SSbirthDate = new MonthYearDate(1954, 2, 1)
  personB.actualBirthDate = new Date(1954, 2, 15) //personB born in March 1954
  personB.SSbirthDate = new MonthYearDate(1954, 2, 1)
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
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

it('should suggest retroactive application for low-PIA spouse when possible, given high discount rate and short life expectancies', () => {
  service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  scenario.maritalStatus = "married"
  personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SM2", 0) 
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SM2", 0) 
  personA.actualBirthDate = new Date(1948, 8, 15) //Spouse A born in Sept 1948 (already age 70)
  personA.SSbirthDate = new MonthYearDate(1948, 8)
  personB.actualBirthDate = new Date(1952, 9, 11) //Spouse B born in October 1952
  personB.SSbirthDate = new MonthYearDate(1952, 9)
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
  personA.PIA = 1800
  personB.PIA = 1400
  scenario.discountRate = 8
  personA.fixedRetirementBenefitDate = new MonthYearDate(2018, 2) //filed March 2018, at 69 and 6 months
  let results = service.maximizeCouplePViterateOnePerson(scenario, personB, personA)
  expect(results.solutionsArray[0].date).toEqual(new MonthYearDate(2018, 9)) //retroactive back to personB's FRA
  //This array should have 1 item in it, personB's retirement date. No spousal for either person.

})

it('should tell a divorced user with lower PIA, two children already entitled on ex-spouse record, and an assumed age at death of 75 to file at 62 and 1 month for retirement and child-in-care spousal benefits', () => {
  service.setToday(new MonthYearDate(2020, 5))//June 2020 (date when creating this test, so that it doesn't fail in the future as "today" changes)
  benefitService.today = new MonthYearDate(2020, 5)//Same idea, but for benefitService's "today" value as well
  scenario.maritalStatus = "divorced"
  personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 75) 
  personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA2016", 0)
  personA.actualBirthDate = new Date(1960, 8, 15) //Spouse A born in Sept 1960
  personA.SSbirthDate = new MonthYearDate(1960, 8)
  personB.actualBirthDate = new Date(1957, 3, 11) //Spouse B born in April 1957
  personB.SSbirthDate = new MonthYearDate(1957, 3)
  personB.hasFiled = true
  personB.fixedRetirementBenefitDate = new MonthYearDate (2019, 5) //ex-spouse filed in past, June 2019
  personA.PIA = 600
  personB.PIA = 2300
  scenario.discountRate = 0
  mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
  mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
  scenario.numberOfChildren = 2
  let child1:Person = new Person("1")
  let child2:Person = new Person("2")
  child1.SSbirthDate = new MonthYearDate(2015, 7) //child 1 born August 2015
  child2.SSbirthDate = new MonthYearDate(2016, 10) //child 2 born November 2016
  scenario.setChildrenArray([child1,child2], service.today)
  let results = service.maximizeCouplePViterateOnePerson(scenario, personA, personB)
  expect(results.solutionsArray[0].date).toEqual(new MonthYearDate(2019, 11))
  expect(results.solutionsArray[1].date).toEqual(new MonthYearDate(2022, 9))
  expect(results.solutionsArray[2].date).toEqual(new MonthYearDate(2022, 9))
  //This array should have 3 items in it, in this order:
    //children file retroactively on personB's record. Max retroactivity is back to 12/2019
    //personA files for retirement benefit October 2022, at age 62 and 1 months.
    //personA files for child-in-care spousal benefits October 2022, at age 62 and 1 months.
  let claimStrategy:ClaimStrategy = calculatePVservice.calculateCouplePV(personA, personB, scenario, true)
  expect(claimStrategy.outputTable[0][0]).toEqual(2022)
  expect(claimStrategy.outputTable[0][1]).toEqual("$1,268")//personA retirement benefit, times 3 months. (600 PIA, filing 59 months early, means he gets 70.41666% of PIA, or $422.50/month)
  expect(claimStrategy.outputTable[0][2]).toEqual("$1,650")//personA child-in-care spousal, times 3 months. 2300PIA/2 - 600 = $550 per month. Not reduced for early entitlement because there's a child in care.
  expect(claimStrategy.outputTable[0][4]).toEqual("$22,417")//total children benefit in 2022 is 9 months of $1,724.08 (i.e,. amount left on personB's family max),
    //plus 3 months of $2,300 (i.e., full 50% of personB PIA for each child, now that combined family max has kicked in)
  //personA.familyMax (62 in 2022) should be 150% of 600 = 900
  //personB.familyMax (62 in 2019) should be 150% * 1,184 + 272% * (1,708-1184) + 134% * (2,228 -1708) + 175% * (2300 -2228) = 4024.08
  //combined family max should be 4924.08, limited to $5707.60
  //in 2022 Jan-Sept
    //4024.08 - 2300 = 1724.08 left for the two children (personA doesn't count toward limit because they're an ex-spouse)
})

})


describe('Tests for maximizeSurvivorPV', () => {
  let service:MaximizePVService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let birthdayService:BirthdayService
  let scenario:CalculationScenario
  let personA:Person
  let personB:Person

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(MaximizePVService)
    benefitService = TestBed.inject(BenefitService)
    mortalityService = TestBed.inject(MortalityService)
    birthdayService = TestBed.inject(BirthdayService)
    scenario = new CalculationScenario()
    personA = new Person("A")
    personB = new Person("B")
  })

  it ('should tell a widower, age 63, not working, not disabled, to file immediately for survivor benefit (and 70 for retirement) if she has the higher PIA', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020 when creating this test
    scenario.maritalStatus = "survivor"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1957, 7, 15) //born Aug 1957
    personA.SSbirthDate = new MonthYearDate(1957, 7)
    personB.actualBirthDate = new Date(1960, 9, 11) //deceased spouse born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9)
    personB.dateOfDeath = new MonthYearDate(2020, 4)//personB died May 2020 (not quite age 60)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personB.hasFiled = false //personB died before having filed and before reaching their FRA, so their retirementBenefitDate is their FRA
    personA.PIA = 1900
    personB.PIA = 1100
    scenario.discountRate = 1
    let results = service.maximizeSurvivorPV(personA, personB, scenario)
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2020, 7))
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2027, 7))
    //survivorBenefit = 1100, reduced for early entitlement to survivor benefit. 1957 DoB so survivorFRA = 66and2months = October 2023
    //So there are 74 possible early months. Entitled for 38 of them (5 + 12 + 12 + 9). Reduction = 38/74 * 0.285 = 14.63514%. 1100 * (1 - 0.1463514) = $939.01/month
    //5 months in 2020 = $4,695.07
    expect(results.claimStrategy.outputTable[0])
    .toEqual([2020, "$0", "$4,695", "$4,695"])
    //7 months of survivor = $6,573.07.
    //retirement FRA = 66and6months = Feb 2024. Waiting 42 months past FRA = 128% of PIA as retirement benefit = $2,432. 5 months of that is $12,160
    expect(results.claimStrategy.outputTable[7])
    .toEqual([2027, "$12,160", "$6,573", "$18,733"])
    expect(results.claimStrategy.PV)
    .toBeCloseTo(437974, 0)
  })

  it ('should tell a widower, age 68, to file retroactive back to date of death for survivor benefit (and 70 for retirement) if she has the higher PIA', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020 when creating this test
    scenario.maritalStatus = "survivor"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1952, 7, 5) //born Aug 1952
    personA.SSbirthDate = new MonthYearDate(1952, 7)
    personB.actualBirthDate = new Date(1955, 9, 11) //deceased spouse born in October 1955
    personB.SSbirthDate = new MonthYearDate(1955, 9)
    personB.dateOfDeath = new MonthYearDate(2020, 4)//personB died May 2020 (not quite age 65)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personB.hasFiled = true
    personB.fixedRetirementBenefitDate = new MonthYearDate (2017, 11) //personB had filed at age 62 and 2 months. (With 1955 DoB, FRA is 66 and 2 months, so that's 48 months early.)
    personA.PIA = 1900
    personB.PIA = 1100
    scenario.discountRate = 1
    let results = service.maximizeSurvivorPV(personA, personB, scenario)
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2020, 4))//retroactivity limited to date of death
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2022, 7))
    //survivor originalBenefit = 1100. No reduction for survivor early entitlement given filing after survivor FRA. RIB LIM is applicable though because deceased filed early. So limited to 82.5% of 1100 = $907.50
    //Filing retroactively to May 2020, so 8 months in 2020 = 8 x 907.50 = $7,260
    expect(results.claimStrategy.outputTable[0])
    .toEqual([2020, "$0", "$7,260", "$7,260"])
    //7 months of survivor = $6,352.50.
    //retirement FRA = 66and0months = Aug 2018. Waiting 48 months past FRA = 132% of PIA as retirement benefit = $2,508. 5 months of that is $12,540
    expect(results.claimStrategy.outputTable[2])
    .toEqual([2022, "$12,540", "$6,353", "$18,893"])
    expect(results.claimStrategy.PV)
    .toBeCloseTo(439400, 0)
  })

  it ('should tell a widower, age 63, still working, not disabled, to file in Jan of quitWorkYear for survivor benefit (and 70 for retirement) given earnings and PIAs', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020 when creating this test
    scenario.maritalStatus = "survivor"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1957, 7, 15) //born Aug 1957
    personA.SSbirthDate = new MonthYearDate(1957, 7)
    personB.actualBirthDate = new Date(1960, 9, 11) //deceased spouse born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9)
    personB.dateOfDeath = new MonthYearDate(2020, 4)//personB died May 2020 (not quite age 60)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personB.hasFiled = false //personB died before having filed and before reaching their FRA, so their retirementBenefitDate is their FRA
    personA.PIA = 1900
    personB.PIA = 1100
    personA.quitWorkDate = new MonthYearDate(2021, 1) //Feb 2021
    personA.monthlyEarnings = 9000
    scenario.discountRate = 1
    let results = service.maximizeSurvivorPV(personA, personB, scenario)
    //Current earnings test threshold is $18,240 for years prior to FRA. So 2020 would be completely withheld if they filed, but they can file in Jan 2021 and get full benefit.
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2021, 0))
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2027, 7))
    //survivorBenefit = 1100, reduced for early entitlement to survivor benefit. 1957 DoB so survivorFRA = 66and2months = October 2023
    //So there are 74 possible early months. Entitled for 33 of them (12 + 12 + 9). Reduction = 33/74 * 0.285 = 12.7095%. 1100 * (1 - 0.127095) = $960.20/month
    //12 months in 2021 = $11,522
    expect(results.claimStrategy.outputTable[0])
    .toEqual([2021, "$0", "$11,522", "$11,522"])
    //7 months of survivor = $6,721.37
    //retirement FRA = 66and6months = Feb 2024. Waiting 42 months past FRA = 128% of PIA as retirement benefit = $2,432. 5 months of that is $12,160
    expect(results.claimStrategy.outputTable[6])
    .toEqual([2027, "$12,160", "$6,721", "$18,881"])
    expect(results.claimStrategy.PV)
    .toBeCloseTo(434841, 0)
  })

  it ('should tell a widower, age 63, still working, not disabled, to file on quitWorkMonth for survivor benefit (and 70 for retirement) given super high current earnings', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020 when creating this test
    scenario.maritalStatus = "survivor"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1957, 7, 15) //born Aug 1957
    personA.SSbirthDate = new MonthYearDate(1957, 7)
    personB.actualBirthDate = new Date(1960, 9, 11) //deceased spouse born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9)
    personB.dateOfDeath = new MonthYearDate(2020, 4)//personB died May 2020 (not quite age 60)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personB.hasFiled = false //personB died before having filed and before reaching their FRA, so their retirementBenefitDate is their FRA
    personA.PIA = 1900
    personB.PIA = 1100
    personA.quitWorkDate = new MonthYearDate(2021, 3) //April 2021
    personA.monthlyEarnings = 30000
    scenario.discountRate = 1
    let results = service.maximizeSurvivorPV(personA, personB, scenario)
    //Current earnings test threshold is $18,240 for years prior to FRA. So 2020 or 2021 would be completely withheld, except grace year rule allows for benefits from April 2021 onward
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2021, 3))
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2027, 7))
    //survivorBenefit = 1100, reduced for early entitlement to survivor benefit. 1957 DoB so survivorFRA = 66and2months = October 2023
    //So there are 74 possible early months. Entitled for 30 of them (9 + 12 + 9). Reduction = 30/74 * 0.285 = 11.55405%. 1100 * (1 - 0.1155405) = $972.91/month
    //9 months in 2021 = $8,756
    expect(results.claimStrategy.outputTable[0])
    .toEqual([2021, "$0", "$8,756", "$8,756"])
    //7 months of survivor = $6,810.37
    //retirement FRA = 66and6months = Feb 2024. Waiting 42 months past FRA = 128% of PIA as retirement benefit = $2,432. 5 months of that is $12,160
    expect(results.claimStrategy.outputTable[6])
    .toEqual([2027, "$12,160", "$6,810", "$18,970"])
    expect(results.claimStrategy.PV)
    .toBeCloseTo(432913, 0)
  })

  //same as first survivor test, except person is told to file for retirementASAP and survivor at survivorFRA
  it ('should tell a widower, age 63, not working, not disabled, to file immediately for retirement benefit (and survivorFRA for survivor) if she has the lower PIA', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020 when creating this test
    scenario.maritalStatus = "survivor"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1957, 7, 15) //born Aug 1957
    personA.SSbirthDate = new MonthYearDate(1957, 7)
    personB.actualBirthDate = new Date(1960, 9, 11) //deceased spouse born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9)
    personB.dateOfDeath = new MonthYearDate(2020, 4)//personB died May 2020 (not quite age 60)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personB.hasFiled = false //personB died before having filed and before reaching their FRA, so their retirementBenefitDate is their FRA
    personA.PIA = 500
    personB.PIA = 1900
    scenario.discountRate = 0
    let results = service.maximizeSurvivorPV(personA, personB, scenario)
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2020, 7))
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2023, 9))//1957 DoB so survivorFRA = 66and2months = October 2023
    //retirement FRA = 66and6months = Feb 2024. Filing Aug 2020 which is 42 months early. Gets 77.5% of PIA = 387.50/month
    //5 months in 2020 = 1937.50
    expect(results.claimStrategy.outputTable[0])
    .toEqual([2020, "$1,938", "$0", "$1,938"])
    //survivor original benefit = 1900, not reduced for early entitlement at all. No RIB-LIM either. Reduced for own entitlement. 1900 - 387.50 = $1,512.50/month
    //3 months survivor in 2023 = $4,537.50
    //12 months retirement in 2020 = 4650
    expect(results.claimStrategy.outputTable[3])
    .toEqual([2023, "$4,650", "$4,538", "$9,188"])
    expect(results.claimStrategy.PV)
    .toBeCloseTo(499457, 0)
  })


    it ('should tell a widower, age 53, disabled, to file retroactive 12 months for survivor benefit and at FRA disability will convert to retirement', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020 when creating this test
    scenario.maritalStatus = "survivor"
    personA.isOnDisability = true
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1967, 7, 5) //born Aug 1967
    personA.SSbirthDate = new MonthYearDate(1967, 7)
    personB.actualBirthDate = new Date(1955, 9, 11) //deceased spouse born in October 1955
    personB.SSbirthDate = new MonthYearDate(1955, 9)
    personB.dateOfDeath = new MonthYearDate(2018, 4)//personB died May 2018 (age 62 and 9 months)
    personB.hasFiled = true
    personA.fixedRetirementBenefitDate = new MonthYearDate(2018, 0)//On disability since Jan 2018
    personB.fixedRetirementBenefitDate = new MonthYearDate (2017, 11) //personB had filed at age 62 and 2 months. (With 1955 DoB, FRA is 66 and 2 months, so that's 48 months early.)
    personA.PIA = 1000
    personB.PIA = 2500
    scenario.discountRate = 1
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let results = service.maximizeSurvivorPV(personA, personB, scenario)
    expect(results.solutionsArray[0].benefitType)
    .toEqual("retroactiveSurvivor")
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2019, 7))//retroactive 12 months because personA is disabled
      //This isn't working. whenShouldPVCalc start is returning the right date. And findEarliestSurvivorDate is finding the right date as well. So what's going wrong in the PV calc such that it doesn't want those extra months?
    expect(results.solutionsArray[1].benefitType)
    .toEqual("disabilityConversion")
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(personA.FRA))
    expect(results.claimStrategy.outputTable[0])
    .toEqual([2019, "$12,000", "$3,938", "$15,938"])
    //Disability = PIA x 12 (disability benefit = PIA)
    //Survivor original benefit = $2,500
    //Survivor benefit adjusted for age: treated as if age 60 (reduced by 28.5%) = 2500 * 0.715 = $1787.50
    //RIB LIM: personB was receiving less than 82.5% of PIA, so survivor benefit limited to 82.5% of PIA (2500 x .825 = $2062.50). No effect.
    //Survivor benefit adjusted for own entitlement: reduce by 1000 = 787.50
    //787.50 x 5 months = 3937.50
    expect(results.claimStrategy.outputTable[15])
    .toEqual([2034, "$12,000", "$9,450", "$21,450"])//At FRA. None of benefit amounts actually change. Just 12 months of disabillity (converting to retirement at same amount) and 12 months of survivor
    expect(results.claimStrategy.PV)
    .toBeCloseTo(555696, 0)
  })



  it ('should tell a widower, age 58, not working, not disabled, with child age 10, to file at appropriate dates', () => {
    //expecting retroactive child, back to date of death (less than 6 months ago)
    //expecting retroactive mother/father benefit, back to date of death
    //expecting survivor benefit when mother/father benefit ends (child turns 16)
    //expecting retirement benefit age 70
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020 when creating this test
    scenario.maritalStatus = "survivor"
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1962, 7, 15) //born Aug 1962
    personA.SSbirthDate = new MonthYearDate(1962, 7)
    personB.actualBirthDate = new Date(1960, 9, 11) //deceased spouse born in October 1960
    personB.SSbirthDate = new MonthYearDate(1960, 9)
    personB.dateOfDeath = new MonthYearDate(2020, 4)//personB died May 2020 (not quite age 60)
    scenario.numberOfChildren = 1
    let child1:Person = new Person("1")
    child1.SSbirthDate = new MonthYearDate(2010, 7) //Aug 2010, exactly 10 yrs old when calculator used
    scenario.setChildrenArray([child1], service.today)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personB.hasFiled = false //personB died before having filed and before reaching their FRA, so their retirementBenefitDate is their FRA
    personA.PIA = 1900
    personB.PIA = 1100
    scenario.discountRate = 1
    let results = service.maximizeSurvivorPV(personA, personB, scenario)
    expect(results.solutionsArray[0].benefitType)
    .toEqual("retroactiveMotherFather")
    expect(results.solutionsArray[0].date)
    .toEqual(new MonthYearDate(2020, 4))
    expect(results.solutionsArray[1].benefitType)
    .toEqual("retroactiveChild")
    expect(results.solutionsArray[1].date)
    .toEqual(new MonthYearDate(2020, 4))
    expect(results.solutionsArray[2].benefitType)
    .toEqual("survivor")
    expect(results.solutionsArray[2].date)
    .toEqual(new MonthYearDate(2026,7))//date child1 turns 16 and therefore mother/father benefit ends, so personA files for survivor at that time
    expect(results.solutionsArray[3].benefitType)
    .toEqual("retirement")
    expect(results.solutionsArray[3].date)
    .toEqual(new MonthYearDate(2032, 7))//age 70
    //mother benefit = 1100 x .75 = 825
    //child benefit = 1100 x .75 = 825
    //8 months of child and survivor = $6600 each
    //year, retirement, mother/father, survivor, child, total
    expect(results.claimStrategy.outputTable[0])
    .toEqual([2020, "$0", "$6,600", "$0", "$6,600", "$13,200"])
    expect(results.claimStrategy.outputTable[1])
    .toEqual([2021, "$0", "$9,900", "$0", "$9,900", "$19,800"])//12 months now of each benefit
    //In Aug 2026, child turns 16 so mother/father ends. Child benefit continues though until child turns 18.
    //survivor originalBenefit = 1100
    //Family max is 150% of PIA = $1,650
    //1650 / (825 + 1100) = 85.714% of benefits able to be paid
    //825 x 0.85714 = $707.14 new child benefit
    //1100 x 0.85714 = $942.86 survivor benefit
    //Then we do second round of family max calculation. (Happens now because has to be before reduction for age. Nothing happens here though because nobody's benefit has been reduced by anything else yet.)
    //Survivor benefit must also be reduced for early entitlement. 1962 DoB so survivorFRA = 67 = Aug 2029
    //So there are 84 possible early months. Entitled for 36 of them (filing for survivor at exactly 64). Reduction = 36/84 * 0.285 = 12.2143%. $942.86 * (1 - 0.122143) = $827.70/month
    //RIB-LIM not applicable because personB hadn't filed before date of death. No earnings test or GPO reduction either.
    //So 7 months of mother benefits = 7x825 = $5775. And 5 months of survivor benefit = 5x827.70 = $4138.
    //Child benefit = 7x825 + 5x707.14 = $9310.70
    expect(results.claimStrategy.outputTable[6])
    .toEqual([2026, "$0", "$5,775", "$4,138", "$9,311", "$19,224"])
    //Child turns 18 in Aug 2028. Child benefit ends.
    //Survivor benefit will no longer be limited by family max. So it will now be 1100 * (1 - 0.122143) = $965.64
    //mother benefit zero at this point. Survivor = 7x827.70 + 5x965.64 = $10,622.10
    //child benefit = 707.14 x 7 = $4949.98
    expect(results.claimStrategy.outputTable[8])
    .toEqual([2028, "$0", "$0", "$10,622", "$4,950", "$15,572"])
    //Then in Aug 2032, personA files for retirement.
    //Retirement = 1900 * 1.24 = $2356. 5 months of that is $11,780
    //Survivor is reduced to zero at that point. So survivor = 7x965.65 = $6,759.48
    expect(results.claimStrategy.outputTable[12])
    .toEqual([2032, "$11,780", "$0", "$6,760", "$0", "$18,540"])
    expect(results.claimStrategy.PV)
    .toBeCloseTo(517240, 0)
  })
})

describe('test functions that find earliest/latest dates', () => {
  let service:MaximizePVService
  let birthdayService:BirthdayService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let personA:Person
  let personB:Person
  let scenario:CalculationScenario
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
    service = TestBed.inject(MaximizePVService)
    birthdayService = TestBed.inject(BirthdayService)
    benefitService = TestBed.inject(BenefitService)
    mortalityService = TestBed.inject(MortalityService)
    personA = new Person("A")
    personB = new Person("B")
    scenario = new CalculationScenario()
  })

  it('should correctly determine earliest retirementBenefitDate when person is younger than 62 and born on the second of the month', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1960, 7)
    personA.actualBirthDate = new Date(1960, 7, 1)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestPossibleRetirementBenefitDate(personA)
    expect(returnedDate).toEqual(new MonthYearDate(2022, 7))
  })

  it('should correctly determine earliest retirementBenefitDate when person is younger than 62 and born on the third of the month', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1960, 7)
    personA.actualBirthDate = new Date(1960, 7, 2)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestPossibleRetirementBenefitDate(personA)
    expect(returnedDate).toEqual(new MonthYearDate(2022, 8))
  })

  it('should correctly determine earliest retirementBenefitDate when person is currently age 63 and 2 months', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1957, 5)
    personA.actualBirthDate = new Date(1957, 5, 3)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestPossibleRetirementBenefitDate(personA)
    expect(returnedDate).toEqual(new MonthYearDate(service.today))
  })

  it('should correctly determine earliest retirementBenefitDate when person is currently 3 months past FRA', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1954, 4)//Born May 1954. FRA is 66 = May 2020
    personA.actualBirthDate = new Date(1954, 4, 8)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestPossibleRetirementBenefitDate(personA)
    expect(returnedDate).toEqual(new MonthYearDate(2020, 4))//May 2020 (person's FRA)
  })

  it('should correctly determine latest retirementBenefitDate when person has normal inputs', () => {
    personA.SSbirthDate = new MonthYearDate(1960, 7)
    personA.actualBirthDate = new Date(1960, 7, 1)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findLatestRetirementBenefitDate(personA)
    expect(returnedDate).toEqual(new MonthYearDate(2030, 7))
  })

  it('should correctly determine latest retirementBenefitDate when person assumes they die at age 69', () => {
    personA.SSbirthDate = new MonthYearDate(1960, 7)
    personA.actualBirthDate = new Date(1960, 7, 1)
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed" , 69) 
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findLatestRetirementBenefitDate(personA)
    expect(returnedDate).toEqual(new MonthYearDate(2030, 0))//"Assumed death age of 69 means we assume they die in January of the year they would turn 70."
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is over 60 but younger than FRA, RIB-LIM applicable, and deceased person died 4 months ago', () => {
    service.setToday(new MonthYearDate(2022, 3))//April 2022
    personA.SSbirthDate = new MonthYearDate(1958, 3)//Age 64 and 0 months right now. Survivor FRA is 66 and 4 months
    personB.SSbirthDate = new MonthYearDate(1959, 3)//Deceased would be age 63 right now.
    personB.dateOfDeath = new MonthYearDate(2021, 11)//4 months ago, age 62 and 8 months
    personB.retirementBenefitDate = new MonthYearDate(2021, 4)//Filed asap at 62 and 1 month
    personB.hasFiled = true
    personA.PIA = 500
    personB.PIA = 2500
    // personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA2017", 0) 
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    //personB hasn't filed as of date of death (in which case maximizeSurvivorPV function sets it to FRA if they died before FRA and date of death if they died after FRA)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    //PersonA is not disabled and hasn't reached FRA, but we still have to check if RIB-LIM is applicable, in which case retroactive application is available.
    //76 months total between age 60 and personA's survivor FRA.
    //28.5% / 76 = 0.375% reduction for each month early. (28.5% is maximum survivor reduction for age)
    //17.5 / 0.375 = 46.66
    //We round that down to 46. (At 47 months early, reduction from age would still be greater than reduction from RIB-LIM. At 46, reduction from RIB-LIM would be greater.)
    //46 months early (2 months less than 4 years early) would be 62 and 6 months. So RIB-LIM is applicable for any filing age 62 and 6 months or later.
    //So we should expect retroactive application to 4 months ago (would be 6 months, except death occurred 4 months ago).
    expect(returnedDate).toEqual(new MonthYearDate(2021, 11))
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is over 60 but younger than FRA, RIB-LIM not applicable, and deceased person died 4 months ago', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1957, 7)//Age 63 and 0 months right now. Survivor FRA is 66 and 2 months
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personA.PIA = 500
    personB.PIA = 2500
    personB.dateOfDeath = new MonthYearDate(2020, 3)// 4 months ago, not quite age 60
    // personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA2017", 0) 
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    //personB hasn't filed as of date of death (in which case maximizeSurvivorPV function sets it to FRA if they died before FRA and date of death if they died after FRA)
    personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    //PersonA is not disabled and hasn't reached FRA. And RIB-LIM is not applicable, because deceased hadn't filed.
    expect(returnedDate).toEqual(new MonthYearDate(2020, 7))
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is age 68, and deceased person died 4 months ago', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.PIA = 500
    personB.PIA = 2500
    personA.SSbirthDate = new MonthYearDate(1952, 7)//Age 68 and 0 months right now
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2020, 3)// 4 months ago, not quite age 60
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    //personB hasn't filed as of date of death (in which case maximizeSurvivorPV function sets it to FRA if they died before FRA and date of death if they died after FRA)
    personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    expect(returnedDate).toEqual(new MonthYearDate(2020, 3))//4 months ago -- dateOfDeath is earliest retroactive date here
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is 1 month past survivorFRA, and deceased person died 10 months ago, not having filed', () => {
    service.setToday(new MonthYearDate(2020, 6))//July 2020
    personA.PIA = 500
    personB.PIA = 2500
    personA.SSbirthDate = new MonthYearDate(1954, 5)//born June 1954. Currently age 66 and 1 month. survivorFRA = 66 = June 2020 = 1 month ago
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2019, 8)// 10 months ago, age 59 and 1 month
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    //personB hasn't filed as of date of death (in which case maximizeSurvivorPV function sets it to FRA if they died before FRA and date of death if they died after FRA)
    personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    //RIB-LIM not applicable since deceased hadn't filed.
    //So max retroactive date is 1 month ago, to survivor FRA.
    expect(returnedDate).toEqual(new MonthYearDate(2020, 5))
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is 1 month past survivorFRA, and deceased person died 10 months ago, having filed early', () => {
    service.setToday(new MonthYearDate(2020, 6))//July 2020
    personA.PIA = 500
    personB.PIA = 2500
    personA.SSbirthDate = new MonthYearDate(1954, 5)//born June 1954. Currently age 66 and 1 month. survivorFRA = 66 = June 2020 = 1 month ago
    personB.SSbirthDate = new MonthYearDate(1956, 7)
    personB.dateOfDeath = new MonthYearDate(2019, 8)// 10 months ago, age 63 and 1 month
    personB.retirementBenefitDate = new MonthYearDate(2019, 7)//Filed early at age 63 and 0 months.
    personB.hasFiled = true
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    //We have to check if RIB-LIM is applicable, to see if maximum retroactive application is 6 months ago, or just 1 month ago (to survivorFRA).
    //72 months total between age 60 and personA's survivor FRA.
    //28.5% / 72 = 0.395833333333333% reduction for each month early. (28.5% is maximum survivor reduction for age)
    //17.5 / 0.395833333333333 = 44.2 (Once reduction is 17.5%, survivor benefit would be less than 82.5% of deceased's PIA, so RIB-LIM is applicable.)
    //We round that down to 44. (At 45 months early, reduction from age would still be greater than reduction from RIB-LIM. At 44, reduction from RIB-LIM would be greater.)
    //44 months early (4 months less than 4 years early) would be 62 and 4 months. So RIB-LIM is applicable for any filing month 62 and 4 months or later.
    //So we should expect retroactive application to 6 months ago.
    expect(returnedDate).toEqual(new MonthYearDate(2020, 0))
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is age 61 (so RIB-LIM not applicable, because reduction for age is greater), and deceased person died more than 2 years ago', () => {
    service.setToday(new MonthYearDate(2022, 3))//April 2022
    personA.PIA = 500
    personB.PIA = 2500
    personA.SSbirthDate = new MonthYearDate(1961, 3)//born April 1961. Currently age 61 and 0 months. survivorFRA = 66 and 10 months = Feb 2028
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2019, 8)//More than 2 years ago, age 59 and 1 month
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    //personB hasn't filed as of date of death (in which case maximizeSurvivorPV function sets it to FRA if they died before FRA and date of death if they died after FRA)
    personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    //We have to check if RIB-LIM is applicable, to see if 6 month retroactive application is available.
    //82 months total between age 60 and personA's survivor FRA.
    //28.5% / 82 = 0.347560975609756% reduction for each month early. (28.5% is maximum survivor reduction for age)
    //17.5 / 0.347560975609756 = 50.35
    //We round that down to 50. (At 51 months early, reduction from age would still be greater than reduction from RIB-LIM. At 50, reduction from RIB-LIM would be greater.)
    //50 months early (2 months more than 4 years early) would be 62 and 8 months. So RIB-LIM is applicable for any filing month 62 and 8 months or later.
    //So at age 61, RIB-LIM not applicable, so no retroactive option.
    expect(returnedDate).toEqual(new MonthYearDate(2022, 3))
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is younger than survivorFRA, and RIB-LIM not applicable, and deceased person died more than 2 years ago', () => {
    service.setToday(new MonthYearDate(2022, 3))//April 2022
    personA.PIA = 500
    personB.PIA = 2500
    personA.SSbirthDate = new MonthYearDate(1959, 6)//born July 1959. Currently age 62 and 9 months. survivorFRA = 66 and 6 months = Jan 2026
    personB.SSbirthDate = new MonthYearDate(1960, 7)//Aug 1960
    personB.dateOfDeath = new MonthYearDate(2019, 8)//Sept 2019, More than 2 years ago, age 59 and 1 month
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    //RIB-LIM is not applicable, because deceased had not filed.
    //So no retroactive option.
    expect(returnedDate).toEqual(new MonthYearDate(2022, 3))//today
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is not disabled, is age 62 and 9 months, RIB-LIM applicable as of 2 months ago (deceased filed very early), and deceased person died more than 2 years ago', () => {
    service.setToday(new MonthYearDate(2022, 3))//April 2022
    personA.PIA = 500
    personB.PIA = 2500
    personA.SSbirthDate = new MonthYearDate(1959, 6)//born July 1959. Currently age 62 and 9 months. survivorFRA = 66 and 6 months = Jan 2026
    personB.SSbirthDate = new MonthYearDate(1956, 7)//Aug 1956
    personB.retirementBenefitDate = new MonthYearDate(2018, 8)//Sept 2018, age 62 and 1 month
    personB.hasFiled = true
    personB.dateOfDeath = new MonthYearDate(2019, 8)//Sept 2019, More than 2 years ago, age 63 and 1 month
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    //We have to check if RIB-LIM is applicable, to see if retroactive application is available.
    //78 months total between age 60 and personA's survivor FRA.
    //28.5% / 78 = 0.365384615384615% reduction for each month early. (28.5% is maximum survivor reduction for age)
    //17.5 / 0.365384615384615 = 47.9
    //We round that down to 47. (At 48 months early, reduction from age would still be greater than reduction from RIB-LIM. At 47, reduction from RIB-LIM would be greater.)
    //So RIB-LIM starts to apply at 47 months early, which would be 66 and 7 months.
    //So retroactive should be available as of 2 months before today
    expect(returnedDate).toEqual(new MonthYearDate(2022, 1))//Feb 2022
  })

  it('should correctly determine earliest survivorBenefitDate when survivor is disabled, is age 54, and deceased person died 14 months ago', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.isOnDisability = true
    personA.SSbirthDate = new MonthYearDate(1966, 7)//born Aug 1966, so age 54 and 0 months right now
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2019, 5)// 14 months ago
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    expect(returnedDate).toEqual(new MonthYearDate(2019, 7))//12 months retroactive since that's no earlier than age 50 and otherPerson died 14 months ago
  })

  it('should correctly determine earliest survivorBenefitDate as 1 month ago when survivor is younger than FRA and date of death was one month ago', () => {
    //Per POMS GN 00204.030, if date of death was exactly last month, retroactive to 1 month allowed even if younger than FRA.
    service.setToday(new MonthYearDate(2022, 3))//April 2022
    personA.SSbirthDate = new MonthYearDate(1959, 3)//born April 1959, so exactly 63 right now.
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2022, 2)//Last month
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestSurvivorBenefitDate(scenario, personA, personB)
    expect(returnedDate).toEqual(new MonthYearDate(2022, 2))//Last month
  })



  it('should correctly determine earliest motherFatherBenefitDate (undefined) when there are no kids under 16 or disabled', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1954, 5)//born June 1954, survivorFRA = 66 = June 2020 = 2 months ago
    let personB:Person = new Person("B")
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2020, 3)// 4 months ago
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestMotherFatherBenefitDate(personB, scenario)
    expect(returnedDate).toBeUndefined()
  })

  it('should correctly determine earliest motherFatherBenefitDate (6 months ago) when personB died 12 months ago', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1954, 5)//born June 1954, survivorFRA = 66 = June 2020 = 2 months ago
    let personB:Person = new Person("B")
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2019, 7)// 12 months ago
    scenario.numberOfChildren = 1
    let child1:Person = new Person("1")
    child1.SSbirthDate = new MonthYearDate(2017, 3) //April 2017
    scenario.setChildrenArray([child1], service.today)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestMotherFatherBenefitDate(personB, scenario)
    expect(returnedDate).toEqual(new MonthYearDate(2020, 1))
  })

  it('should correctly determine earliest motherFatherBenefitDate (3 months ago) when personB died 3 months ago', () => {
    service.setToday(new MonthYearDate(2020, 7))//Aug 2020
    personA.SSbirthDate = new MonthYearDate(1954, 5)//born June 1954, survivorFRA = 66 = June 2020 = 2 months ago
    let personB:Person = new Person("B")
    personB.SSbirthDate = new MonthYearDate(1960, 7)
    personB.dateOfDeath = new MonthYearDate(2020, 4)// 3 months ago
    scenario.numberOfChildren = 1
    let child1:Person = new Person("1")
    child1.SSbirthDate = new MonthYearDate(2017, 3) //April 2017
    scenario.setChildrenArray([child1], service.today)
    mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
    mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
    let returnedDate:MonthYearDate = service.findEarliestMotherFatherBenefitDate(personB, scenario)
    expect(returnedDate).toEqual(new MonthYearDate(2020, 4))
  })

})

  describe('test checkForDeemedSurvivorBenefitDate()', () => {
    let service:MaximizePVService
    let benefitService:BenefitService
    let mortalityService:MortalityService
    let birthdayService:BirthdayService
    let scenario:CalculationScenario
    let personA:Person
    let personB:Person
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [CalculatePvService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
      })
      service = TestBed.inject(MaximizePVService)
      benefitService = TestBed.inject(BenefitService)
      mortalityService = TestBed.inject(MortalityService)
      birthdayService = TestBed.inject(BirthdayService)
      scenario = new CalculationScenario()
      personA = new Person("A")
      personB = new Person("B")
    })
  
      //Testing married calculation, where one person is using assumed age at death, which triggers deemed filing for the other person
      //Testing the output table here basically, as well as that the deemed filing check works -- and the resulting benefit calculations.
      it ('should calculate survivor benefit appropriately, in deemed survivor filing situation', () => {
        service.setToday(new MonthYearDate(2021, 9))//Oct 2021 when creating this test
        scenario.maritalStatus = "married"
        scenario.discountRate = 2 //2% discount rate and shortish life expectancy for the wife, so she should file for spousal early
        personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 72)//Dies at age 72, which means we're assuming he's alive through 2023 and dead throughout 2024.
        personB.mortalityTable = mortalityService.determineMortalityTable("female", "SM2", 0)
        personA.SSbirthDate = new MonthYearDate(1951, 8)//Born Sept 1951
        personB.SSbirthDate = new MonthYearDate(1958, 3)//Wife is several years younger, so she's 65 and 9 months when husband dies in Jan 2024.
        personA.actualBirthDate = new Date(1951, 8, 5)
        personB.actualBirthDate = new Date(1958, 3, 5)
        personA.PIA = 1000
        personB.PIA = 0 //She has no PIA, so she is not entitled to a retirement benefit, and therefore deemed survivor will occur if she has started her spousal.
        personA.fixedRetirementBenefitDate = new MonthYearDate(2021, 8) //filed at 70
        mockGetPrimaryFormInputs(personA, scenario, service.today, birthdayService, benefitService, mortalityService)
        mockGetPrimaryFormInputs(personB, scenario, service.today, birthdayService, benefitService, mortalityService)
        let results = service.maximizeCouplePViterateOnePerson(scenario, personB, personA)
        //FRA of 66, filing at 70, so he gets 132% of his PIA per month. $1320.
        //If she hasn't filed yet, it should tell her to file now (October 2021). So she'll be 63 and 6 months at that time. Her FRA is 66 and 8 months. So that's 38 months early.
        //So she gets 74.16666% of 50% of his PIA, or $370.83 per month.
        expect(results.claimStrategy.outputTable[0]).toEqual([2021, "$5,280", "$0", "$0", "$0", "$1,113", "$0", "$6,393"])
        expect(results.claimStrategy.outputTable[1]).toEqual([2022, "$15,840", "$0", "$0", "$0", "$4,450", "$0", "$20,290"])
        expect(results.claimStrategy.outputTable[2]).toEqual([2023, "$15,840", "$0", "$0", "$0", "$4,450", "$0", "$20,290"])
        //Then she has a deemed filing for survivor benfits in January of 2024. She'll be 65 and 9 months at that time.
        //Her survivor FRA is 66 and 4 months. So that's 7 months early. Out of a possible 76 months.
        // 7/76 * 0.285 = 0.02625. So that's the percentage reduction. 0.02625 * $1320 = $34.65. So she gets $1,285.35 survivor per month.
        expect(results.claimStrategy.outputTable[3]).toEqual([2024, "$0", "$0", "$0", "$0", "$0", "$15,424", "$15,424"])
      })

    })
