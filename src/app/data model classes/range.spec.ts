import {TestBed} from '@angular/core/testing'
import { monitorEventLoopDelay } from 'perf_hooks'
import { BirthdayService } from '../birthday.service'
import { CalculationScenario } from './calculationscenario'
import {ClaimStrategy} from "./claimStrategy"
import { MonthYearDate } from './monthyearDate'
import { Person } from './person'
import { Range } from './range'

let today:MonthYearDate = new MonthYearDate(2020, 8)//Sept 2020 as these tests are being written

function mockGetPrimaryFormInputs(person:Person, scenario:CalculationScenario, today:MonthYearDate, birthdayService:BirthdayService){
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate)
    if (scenario.maritalStatus !== "survivor"){
      person.survivorBenefitDate = new MonthYearDate(person.survivorFRA)
    }
    person.initialAge =  birthdayService.findAgeOnDate(person, today)
  }

describe('testing getIndexDateXfromClaimStrategy() and getIndexDateYfromClaimStrategy()', () => {

let personA:Person
let personB:Person
let scenario:CalculationScenario
let birthdayService:BirthdayService
let range:Range

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BirthdayService]
    })
    personA = new Person("A")
    personB = new Person("B")
    scenario = new CalculationScenario()
    birthdayService = TestBed.inject(BirthdayService)
    range = new Range(new MonthYearDate(2022, 9), new MonthYearDate(2030, 8), new MonthYearDate(2022, 9), new MonthYearDate(2030, 8))
    //^^These dates don't actually matter for the methods being tested here.
    //But we need to have something in constructor.
  })


  it('getIndexDateXfromClaimStrategy() should return personA.retirementBenefitDate in normal case', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personA.PIA = 1000
    personA.retirementBenefitDate = new MonthYearDate(2025, 5)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateXfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(personA.retirementBenefitDate))
  })


  it('getIndexDateXfromClaimStrategy() should return personA.spousalBenefitDate in case with zero PIA', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personA.PIA = 0
    personA.retirementBenefitDate = new MonthYearDate(2025, 5)
    personA.spousalBenefitDate = new MonthYearDate(2027, 9)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateXfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(personA.spousalBenefitDate))
  })

  it('getIndexDateXfromClaimStrategy() should return personB.retirementBenefitDate when personA.initialAge > 70 and personB.PIA > 0', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1950, 4)//May 1950
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personA.PIA = 1000
    personB.PIA = 1000
    personA.retirementBenefitDate = new MonthYearDate(2015, 5)
    personA.spousalBenefitDate = new MonthYearDate(2027, 10)
    personB.retirementBenefitDate = new MonthYearDate(2027, 9)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateXfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(personB.retirementBenefitDate))
  })

  it('getIndexDateXfromClaimStrategy() should return personA.endSuspensionDate in case where personA has filed and is beginning suspension at later of FRA or today', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personA.PIA = 1000
    personA.retirementBenefitDate = new MonthYearDate(2025, 5)
    personA.beginSuspensionDate = new MonthYearDate(personA.FRA)
    personA.endSuspensionDate = new MonthYearDate(2030, 7)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateXfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(personA.endSuspensionDate))
  })

  it('getIndexDateXfromClaimStrategy() should return placeholder date in case where personA has filed and is beginning suspension after later of FRA or today', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personA.PIA = 1000
    personA.retirementBenefitDate = new MonthYearDate(2025, 5)
    personA.beginSuspensionDate = new MonthYearDate(2028, 5)
    personA.endSuspensionDate = new MonthYearDate(2030, 7)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateXfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(1900, 0))
  })

  it('getIndexDateYfromClaimStrategy() should return personA.survivorBenefitDate in survivor scenario', () => {
    scenario.maritalStatus = "survivor"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.dateOfDeath = new MonthYearDate(2020, 4)
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personB.PIA = 1000
    personA.survivorBenefitDate = new MonthYearDate(2020, 6)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateYfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(2020, 6))
  })

  it('getIndexDateYfromClaimStrategy() should return personB.retirementBenefitDate in normal case', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personB.PIA = 1000
    personB.retirementBenefitDate = new MonthYearDate(2025, 6)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateYfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(2025, 6))
  })

  it('getIndexDateYfromClaimStrategy() should return personB.spousalBenefitDate if PIA = 0', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personB.PIA = 0
    personB.retirementBenefitDate = new MonthYearDate(2025, 6)
    personB.spousalBenefitDate = new MonthYearDate(2027, 8)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateYfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(2027, 8))
  })

  it('getIndexDateYfromClaimStrategy() should return personB.endSuspensionDate if already filed but younger than 70', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personB.PIA = 1000
    personB.retirementBenefitDate = new MonthYearDate(2025, 5)
    personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
    personB.endSuspensionDate = new MonthYearDate(2030, 7)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateYfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(personB.endSuspensionDate))
  })

  it('getIndexDateYfromClaimStrategy() should return placeholder date in case where personB has filed and is beginning suspension after later of FRA or today', () => {
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    personB.SSbirthDate = new MonthYearDate(1960, 8)//Sept 1960
    mockGetPrimaryFormInputs(personA, scenario, today, birthdayService)
    mockGetPrimaryFormInputs(personB, scenario, today, birthdayService)
    personB.PIA = 1000
    personB.retirementBenefitDate = new MonthYearDate(2025, 5)
    personB.beginSuspensionDate = new MonthYearDate(2028, 5)
    personB.endSuspensionDate = new MonthYearDate(2030, 7)
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    expect(range.getIndexDateYfromClaimStrategy(claimStrategy)).toEqual(new MonthYearDate(1900, 0))
  })
})