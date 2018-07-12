import {TestBed, inject} from '@angular/core/testing'
import {PresentValueService} from './presentvalue.service'
import {BenefitService} from './benefit.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {MortalityService} from './mortality.service'
import {BirthdayService} from './birthday.service'
import {Person} from './data model classes/person'
import {ClaimingScenario} from './data model classes/claimingscenario'


describe('PresentValueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentValueService, BenefitService, EarningsTestService, SolutionSetService, MortalityService, BirthdayService]
    })
  })

  it('should be created', inject([PresentValueService], (service: PresentValueService) => {
    expect(service).toBeTruthy()
  }))

  //Test calculateSinglePersonPV()
  it('should return appropriate PV for single person, no complicating factors', inject([PresentValueService], (service: PresentValueService) => {
    let person:Person = new Person("A")
    let scenario:ClaimingScenario = new ClaimingScenario
    person.SSbirthDate = new Date(1960, 3, 1) //Person born April 1960
    person.FRA = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAgeRounded = 58 //younger than 62 when fillling out form
    person.PIA = 1000
    person.retirementBenefitDate = new Date(2030, 3, 1) //filing at age 70
    person.quitWorkDate = new Date (2026, 3, 1) //quitting work prior to filing date, earnings test not relevant
    person.monthlyEarnings = 4500 //Doesn't matter really, given date inputs
    scenario.discountRate = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.calculateSinglePersonPV(person, scenario))
      .toBeCloseTo(151765, 0)
  }))

  it('should return appropriate PV for single person, but with "still working" inputs and a different mortality table', inject([PresentValueService], (service: PresentValueService) => { 
    let person:Person = new Person("A")
    let scenario:ClaimingScenario = new ClaimingScenario
    person.SSbirthDate = new Date(1960, 3, 1) //Person born April 1960
    person.FRA = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAgeRounded = 58 //younger than 62 when fillling out form
    person.PIA = 1000
    person.retirementBenefitDate = new Date(2024, 3, 1) //filing at age 64
    person.quitWorkDate = new Date (2026, 3, 1) //quitting work after filing date but before FRA, earnings test IS relevant
    person.monthlyEarnings = 4500 //Just picking something here...
    scenario.discountRate = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    expect(service.calculateSinglePersonPV(person, scenario))
      .toBeCloseTo(201310, 0)
  }))
  
  //Test calculateCouplePV
  it('should return appropriate PV for married couple, basic inputs', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new Date(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new Date(1963, 6, 1) //Spouse B born in July 1963
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new Date (2032, 8, 1) //At age 68
    personB.retirementBenefitDate = new Date (2029, 8, 1) //At age 66 and 2 months
    personA.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario))
      .toBeCloseTo(578594, 0)
  }))

  it('should return appropriate PV for married couple, still working', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new Date(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new Date(1963, 6, 1) //Spouse B born in July 1963
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new Date (2032, 8, 1) //At age 68 (Sept 2032)
    personB.retirementBenefitDate = new Date (2027, 8, 1) //At age 64 and 2 months (Sept 2029) -- Earnings test IS relevant
    personA.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new Date(2028,3,1) //planning to quit work at age 64 (April 2028)
    personB.quitWorkDate = new Date(2030,3,1) //planning to quit work at at 67 (April 2030)
    personA.monthlyEarnings = 5000
    personB.monthlyEarnings = 9000
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario))
      .toBeCloseTo(570824, 0)
  }))

  it ('should return appropriate PV for married couple, including GPO', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new Date(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new Date(1963, 6, 1) //Spouse B born in July 1963
    personA.initialAgeRounded = 61
    personB.initialAgeRounded = 61
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new Date (2032, 8, 1) //At age 68
    personB.retirementBenefitDate = new Date (2029, 8, 1) //At age 66 and 2 months
    personA.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 900
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario))
      .toBeCloseTo(531263, 0)
  }))


  it ('should return appropriate PV for basic divorce scenario', inject([PresentValueService], (service: PresentValueService) => {
    //Can't really write a test for "one has filed" scenario for a still-married couple, because the PV will be different every time, as the person in question gets older (and remaing years decreases)
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "divorced"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.SSbirthDate = new Date(1964, 8, 1) //Spouse A born in Sept 1964 (has to be under 62 right now, otherwise the value will be different every time we run the calculator because the discounting will happen to a different date)
    personB.SSbirthDate = new Date(1955, 3, 1) //Spouse B born in April 1955
    personA.initialAgeRounded = 53
    personB.initialAgeRounded = 63
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.retirementBenefitDate = new Date (2032, 8, 1) //At age 68
    personB.retirementBenefitDate = new Date (2017, 4, 1) //ASAP at 62 and 1 month
    personA.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personB.spousalBenefitDate = new Date (2032, 8, 1) //Later of two retirement benefit dates
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 300
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.calculateCouplePV(personA, personB, scenario))
      .toBeCloseTo(161095, 0)
  }))


  //Test maximize functions
  it('should tell a single person to file ASAP with very high discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let person:Person = new Person("A")
    let scenario:ClaimingScenario = new ClaimingScenario
    scenario.maritalStatus = "single"
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 15 1960
    person.SSbirthDate = new Date(1960, 3, 1)
    person.FRA = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAge = 58 //younger than 62 when fillling out form
    person.PIA = 1000
    person.quitWorkDate = new Date (2020, 3, 1) //quitting work prior to age 62, earnings test not relevant
    person.monthlyEarnings = 4500 //Doesn't matter really, given date inputs
    scenario.discountRate = 9 //9% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(person, scenario).solutionsArray[0].date)
      .toEqual(new Date(2022, 4, 1))
  }))

  it ('should tell a high-PIA spouse to wait until 70, with low discount rate and long lifespans', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "NS2", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    personA.actualBirthDate = new Date(1964, 8, 15) //Spouse A born in Sept 1964
    personA.SSbirthDate = new Date(1964, 8, 1)
    personB.actualBirthDate = new Date(1964, 9, 11) //Spouse B born in October 1964
    personB.SSbirthDate = new Date(1964, 9, 1)
    personA.initialAgeRounded = 60
    personB.initialAgeRounded = 60
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1200
    personB.PIA = 1900
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.maximizeCouplePV(personA, personB, scenario).solutionsArray[1].date)
    .toEqual(new Date(2034, 9, 1))
    //We're looking at item [1] in the array. This array should have 3 items in it: retirement benefit dates for each spouse, and a survivor date for spouse A (lower earner).
    //No spousal dates because neither spouse gets a spousal benefit. Since it's sorted in date order, first retirement date will be low earner, second is higher earner, which we want. Third is survivor.
  }))

  it ('should tell a high-PIA spouse to file a restricted app when possible', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) //Using male nonsmoker2 mortality table
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0) //Using female nonsmoker1 mortality table
    personA.actualBirthDate = new Date(1953, 8, 15) //Spouse A born in Sept 1953
    personA.SSbirthDate = new Date(1953, 8, 1)
    personB.actualBirthDate = new Date(1953, 9, 11) //Spouse B born in October 1953
    personB.SSbirthDate = new Date(1953, 9, 1)
    personA.initialAgeRounded = 64
    personB.initialAgeRounded = 64
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2200
    personB.PIA = 1400
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.maximizeCouplePV(personA, personB, scenario).solutionsArray[1].date)
    .toEqual(new Date(2019, 8, 1))
    //We're looking at item [1] in the array. This array should have 4 items in it, in this order:
      //low PIA retirement claiming date
      //high PIA restricted app date
      //high PIA retirement date
      //Survivor for low-PIA
  }))


  //tests for maximizeCouplePVpersonBisFixed (divorced)
  it ('should tell a divorced user with significantly lower PIA to file ASAP', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.personAhasFiled = false
    scenario.personBhasFiled = false
    scenario.maritalStatus = "divorced"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1964, 9, 15) //Spouse A born in October 1964
    personA.SSbirthDate = new Date(1964, 9, 1)
    personB.actualBirthDate = new Date(1960, 9, 11) //Spouse B born in October 1960
    personB.SSbirthDate = new Date(1960, 9, 1)
    let spouseBretirementBenefitDate:Date = new Date (2028, 9, 1) //Filing at exactly age 68
    personA.initialAgeRounded = 54
    personB.initialAgeRounded = 58
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 700
    personB.PIA = 1900
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.maximizeCouplePVpersonBisFixed(scenario, spouseBretirementBenefitDate, personA, personB).solutionsArray[0].date)
    .toEqual(new Date(2026, 10, 1))
    //We're looking at item [0] in the array. This array should have 3 items in it: retirement benefit date and spousal benefit date for spouseA, and a survivor date for spouse A (lower earner).
    //Since it's sorted in date order, we want first date (or second date -- they should be the same)
  }))
  
  it ('should tell a divorced user with higher PIA and an ex who filed early (so essentially a single person) to file at 70 given long life expectancy and low discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.personAhasFiled = false
    scenario.personBhasFiled = false
    scenario.maritalStatus = "divorced"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "SSA", 0)
    personA.actualBirthDate = new Date(1955, 9, 15) //Spouse A born in October 1955
    personA.SSbirthDate = new Date(1955, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //Spouse B born in October 1954
    personB.SSbirthDate = new Date(1954, 9, 1)
    let spouseBretirementBenefitDate:Date = new Date (2016, 10, 1) //Ex filing at 62
    personA.initialAgeRounded = 62
    personB.initialAgeRounded = 63
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1200
    personB.PIA = 800
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 0
    expect(service.maximizeCouplePVpersonBisFixed(scenario, spouseBretirementBenefitDate, personA, personB).solutionsArray[0].date)
    .toEqual(new Date(2025, 9, 1))
    //We're looking at item [0] in the array. This array should have 1 item in it: retirement benefit date for spouseA.
  }))

  //tests for maximizeCouplePVpersonBisFixed (married)
  it ('should tell personA to wait until 70, even with slightly lower PIA, if personB filed early at 62, given low discount rate and long life expectancies', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.personAhasFiled = false
    scenario.personBhasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS2", 0)
    personA.actualBirthDate = new Date(1955, 9, 15) //personA born in October 1955
    personA.SSbirthDate = new Date(1955, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
    personB.SSbirthDate = new Date(1954, 9, 1)
    let spouseBretirementBenefitDate:Date = new Date (2016, 10, 1) //personB filed at 62
    personA.initialAgeRounded = 62
    personB.initialAgeRounded = 63
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1000
    personB.PIA = 1150
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 0
    expect(service.maximizeCouplePVpersonBisFixed(scenario, spouseBretirementBenefitDate, personA, personB).solutionsArray[0].date)
    .toEqual(new Date(2025, 9, 1))
    //We're looking at item [0] in the array. This array should have 2 items in it: retirement date for personA, survivor benefit for personB
  }))

  it ('should tell personA to file ASAP, even if personB filed early at 62, if personA has much lower PIA', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.personAhasFiled = false
    scenario.personBhasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1960, 9, 15) //personA born in October 1960
    personA.SSbirthDate = new Date(1960, 9, 1)
    personB.actualBirthDate = new Date(1954, 9, 11) //personB born in October 1954
    personB.SSbirthDate = new Date(1954, 9, 1)
    let spouseBretirementBenefitDate:Date = new Date (2016, 10, 1) //personB filed at 62
    personA.initialAgeRounded = 62
    personB.initialAgeRounded = 63
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 400
    personB.PIA = 2000
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.maximizeCouplePVpersonBisFixed(scenario, spouseBretirementBenefitDate, personA, personB).solutionsArray[0].date)
    .toEqual(new Date(2022, 10, 1))
    //We're looking at item [0] in the array. This array should have 3 items in it: retirement date for personA, spousaldate for personA (same as retirement date), survivor benefit for personA
  }))


  //tests for maximizeCouplePVpersonBisFixed (married)
  it ('should tell personB to wait until 70, even with slightly lower PIA, if personA filed early at 62, given low discount rate and long life expectancies', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.personAhasFiled = false
    scenario.personBhasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("female", "NS2", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0)
    personA.actualBirthDate = new Date(1954, 9, 11) //personA born in October 1954
    personA.SSbirthDate = new Date(1954, 9, 1)
    personB.actualBirthDate = new Date(1955, 9, 15) //personB born in October 1955
    personB.SSbirthDate = new Date(1955, 9, 1)
    let spouseAretirementBenefitDate:Date = new Date (2016, 10, 1) //personA filed at 62
    personA.initialAgeRounded = 63
    personB.initialAgeRounded = 62
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 1150
    personB.PIA = 1000
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 0
    expect(service.maximizeCouplePVpersonAisFixed(scenario, spouseAretirementBenefitDate, personA, personB).solutionsArray[0].date)
    .toEqual(new Date(2025, 9, 1))
    //We're looking at item [0] in the array. This array should have 2 items in it: retirement date for personB, survivor benefit for personA
  }))

  it ('should tell personB to file ASAP, even if personA filed early at 62, if personB has much lower PIA', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.personAhasFiled = false
    scenario.personBhasFiled = true
    scenario.maritalStatus = "married"
    let mortalityService:MortalityService = new MortalityService()
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personB.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    personA.actualBirthDate = new Date(1954, 9, 11) //personA born in October 1954
    personA.SSbirthDate = new Date(1954, 9, 1)
    personB.actualBirthDate = new Date(1960, 9, 15) //personB born in October 1960
    personB.SSbirthDate = new Date(1960, 9, 1)
    let spouseAretirementBenefitDate:Date = new Date (2016, 10, 1) //personA filed at 62
    personA.initialAgeRounded = 63
    personB.initialAgeRounded = 62
    let birthdayService:BirthdayService = new BirthdayService()
    personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
    personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
    personA.survivorFRA = birthdayService.findSurvivorFRA(personA.SSbirthDate)
    personB.survivorFRA = birthdayService.findSurvivorFRA(personB.SSbirthDate)
    personA.PIA = 2000
    personB.PIA = 400
    personA.quitWorkDate = new Date(2018,3,1) //already quit working
    personB.quitWorkDate = new Date(2018,3,1) //already quit working
    personA.monthlyEarnings = 0
    personB.monthlyEarnings = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    scenario.discountRate = 1
    expect(service.maximizeCouplePVpersonAisFixed(scenario, spouseAretirementBenefitDate, personA, personB).solutionsArray[0].date)
    .toEqual(new Date(2022, 10, 1))
    //We're looking at item [0] in the array. This array should have 3 items in it: retirement date for personB, spousaldate for personB (same as retirement date), survivor benefit for personB
  }))

})