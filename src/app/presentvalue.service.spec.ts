import {TestBed, inject} from '@angular/core/testing'
import {PresentValueService} from './presentvalue.service'
import {BenefitService} from './benefit.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {MortalityService} from './mortality.service'
import {BirthdayService} from './birthday.service';
import {Person} from './person';


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
    let person:Person = new Person() 
    person.SSbirthDate = new Date(1960, 3, 1) //Person born April 1960
    person.FRA = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAgeRounded = 58 //younger than 62 when fillling out form
    person.PIA = 1000
    let inputBenefitDate: Date = new Date(2030, 3, 1) //filing at age 70
    let quitWorkDate:Date = new Date (2026, 3, 1) //quitting work prior to filing date, earnings test not relevant
    let monthlyEarnings:number = 4500 //Doesn't matter really, given date inputs
    let discountRate: number = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.calculateSinglePersonPV(person, inputBenefitDate, quitWorkDate, monthlyEarnings, discountRate))
      .toBeCloseTo(151765, 0)
  }))

  it('should return appropriate PV for single person, but with "still working" inputs and a different mortality table', inject([PresentValueService], (service: PresentValueService) => { 
    let person:Person = new Person() 
    person.SSbirthDate = new Date(1960, 3, 1) //Person born April 1960
    person.FRA = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAgeRounded = 58 //younger than 62 when fillling out form
    person.PIA = 1000
    let inputBenefitDate: Date = new Date(2024, 3, 1) //filing at age 64
    let quitWorkDate:Date = new Date (2026, 3, 1) //quitting work after filing date but before FRA, earnings test IS relevant
    let monthlyEarnings:number = 4500 //Just picking something here...
    let discountRate: number = 1 //1% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("female", "NS1", 0) //Using female nonsmoker1 mortality table
    expect(service.calculateSinglePersonPV(person, inputBenefitDate, quitWorkDate, monthlyEarnings, discountRate))
      .toBeCloseTo(201310, 0)
  }))
  
  //Test calculateCouplePV
  it('should return appropriate PV for married couple, basic inputs', inject([PresentValueService], (service: PresentValueService) => { 
    let personA:Person = new Person()
    let personB:Person = new Person()
    let maritalStatus:string = "married"
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
    let spouseAretirementBenefitDate: Date = new Date (2032, 8, 1) //At age 68
    let spouseBretirementBenefitDate: Date = new Date (2029, 8, 1) //At age 66 and 2 months
    let spouseAspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseBspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseAquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseBquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseAmonthlyEarnings: number = 0
    let spouseBmonthlyEarnings: number = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    let discountRate:number = 1
    expect(service.calculateCouplePV(maritalStatus, personA, personB,
    spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, discountRate))
      .toBeCloseTo(578594, 0)
  }))

  it ('should return appropriate PV for married couple, including GPO', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person()
    let personB:Person = new Person()
    let maritalStatus:string = "married"
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
    let spouseAretirementBenefitDate: Date = new Date (2032, 8, 1) //At age 68
    let spouseBretirementBenefitDate: Date = new Date (2029, 8, 1) //At age 66 and 2 months
    let spouseAspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseBspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseAquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseBquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseAmonthlyEarnings: number = 0
    let spouseBmonthlyEarnings: number = 0
    personA.governmentPension = 900
    personB.governmentPension = 0
    let discountRate:number = 1
    expect(service.calculateCouplePV(maritalStatus, personA, personB,
    spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, discountRate))
      .toBeCloseTo(531263, 0)
  }))


  it ('should return appropriate PV for basic divorce scenario', inject([PresentValueService], (service: PresentValueService) => {
    //Can't really write a test for "one has filed" scenario for a still-married couple, because the PV will be different every time, as the person in question gets older (and remaing years decreases)
    let personA:Person = new Person()
    let personB:Person = new Person()
    let maritalStatus:string = "divorced"
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
    let spouseAretirementBenefitDate: Date = new Date (2032, 8, 1) //At age 68
    let spouseBretirementBenefitDate: Date = new Date (2017, 4, 1) //ASAP at 62 and 1 month
    let spouseAspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseBspousalBenefitDate: Date = new Date (2032, 8, 1) //Later of two retirement benefit dates
    let spouseAquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseBquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseAmonthlyEarnings: number = 0
    let spouseBmonthlyEarnings: number = 0
    personA.governmentPension = 300
    personB.governmentPension = 0
    let discountRate:number = 1
    expect(service.calculateCouplePV(maritalStatus, personA, personB,
    spouseAretirementBenefitDate, spouseBretirementBenefitDate, spouseAspousalBenefitDate, spouseBspousalBenefitDate,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, discountRate))
      .toBeCloseTo(161095, 0)
  }))


  //Test maximize functions
  it('should tell a single person to file ASAP with very high discount rate', inject([PresentValueService], (service: PresentValueService) => {
    let person:Person = new Person()
    let maritalStatus:string = "single"
    person.actualBirthDate = new Date(1960, 3, 15) //Person born April 15 1960
    person.SSbirthDate = new Date(1960, 3, 1)
    person.FRA = new Date (2027, 3, 1) //FRA April 2027 (age 67)
    person.initialAge = 58 //younger than 62 when fillling out form
    person.PIA = 1000
    let quitWorkDate:Date = new Date (2020, 3, 1) //quitting work prior to age 62, earnings test not relevant
    let monthlyEarnings:number = 4500 //Doesn't matter really, given date inputs
    let discountRate: number = 9 //9% discount rate
    let mortalityService:MortalityService = new MortalityService()
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0)
    expect(service.maximizeSinglePersonPV(maritalStatus, person, quitWorkDate, monthlyEarnings, discountRate).solutionsArray[0].date)
      .toEqual(new Date(2022, 4, 1))
  }))

  it ('should tell a high-PIA spouse to wait until 70, with low discount rate and long lifespans', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person()
    let personB:Person = new Person()
    let maritalStatus:string = "married"
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
    let spouseAquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseBquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseAmonthlyEarnings: number = 0
    let spouseBmonthlyEarnings: number = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    let discountRate:number = 1
    expect(service.maximizeCouplePV(maritalStatus, personA, personB,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, discountRate).solutionsArray[1].date)
    .toEqual(new Date(2034, 9, 1))
    //We're looking at item [1] in the array. This array should have 3 items in it: retirement benefit dates for each spouse, and a survivor date for spouse A (lower earner).
    //No spousal dates because neither spouse gets a spousal benefit. Since it's sorted in date order, first retirement date will be low earner, second is higher earner, which we want. Third is survivor.
  }))

  it ('should tell a high-PIA spouse to file a restricted app when possible', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person()
    let personB:Person = new Person()
    let maritalStatus:string = "married"
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
    let spouseAquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseBquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseAmonthlyEarnings: number = 0
    let spouseBmonthlyEarnings: number = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    let discountRate:number = 1
    expect(service.maximizeCouplePV(maritalStatus, personA, personB,
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, discountRate).solutionsArray[1].date)
    .toEqual(new Date(2019, 8, 1))
    //We're looking at item [1] in the array. This array should have 4 items in it, in this order:
      //low PIA retirement claiming date
      //high PIA restricted app date
      //high PIA retirement date
      //Survivor for low-PIA
  }))

  it ('should tell a divorced user with significantly lower PIA to file ASAP', inject([PresentValueService], (service: PresentValueService) => {
    let personA:Person = new Person()
    let personB:Person = new Person()
    let spouseAhasFiled: boolean = false
    let spouseBhasFiled: boolean = false
    let maritalStatus:string = "divorced"
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
    let spouseAquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseBquitWorkDate: Date = new Date(2018,3,1) //already quit working
    let spouseAmonthlyEarnings: number = 0
    let spouseBmonthlyEarnings: number = 0
    personA.governmentPension = 0
    personB.governmentPension = 0
    let discountRate:number = 1
    expect(service.maximizeCoupleOneHasFiledPV(maritalStatus, spouseAhasFiled, spouseBhasFiled, spouseBretirementBenefitDate,
    personA, personB, 
    spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, discountRate).solutionsArray[0].date)
    .toEqual(new Date(2026, 10, 1))
    //We're looking at item [0] in the array. This array should have 3 items in it: retirement benefit date and spousal benefit date for spouseA, and a survivor date for spouse A (lower earner).
    //Since it's sorted in date order, we want first date (or second date -- they should be the same)
  }))


})