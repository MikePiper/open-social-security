import {TestBed, inject} from '@angular/core/testing'
import {InputValidationService} from './inputvalidation.service'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {BirthdayService} from './birthday.service'
import {MonthYearDate} from "./data model classes/monthyearDate"
import { ErrorCollection } from './data model classes/errorcollection'
import { MortalityService } from './mortality.service'
import { BenefitService } from './benefit.service'
import { MaximizePVService } from './maximize-pv.service'
import { CalculatePvService } from './calculate-PV.service'

function mockGetPrimaryFormInputs(person:Person, today:MonthYearDate, birthdayService:BirthdayService){
  person.FRA = birthdayService.findFRA(person.SSbirthDate)
  person.survivorFRA = birthdayService.findSurvivorFRA(person.SSbirthDate)
  person.initialAge =  birthdayService.findAgeOnDate(person, today)
  person.initialAgeRounded = Math.round(person.initialAge)
}


describe('InputvalidationService', () => {
  let birthdayService:BirthdayService
  let benefitService:BenefitService
  let mortalityService:MortalityService
  let scenario:CalculationScenario

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InputValidationService, BirthdayService, MortalityService, BenefitService, MaximizePVService, CalculatePvService]
    })
    birthdayService = TestBed.inject(BirthdayService)
    mortalityService = TestBed.inject(MortalityService)
    benefitService = TestBed.inject(BenefitService)
    scenario = new CalculationScenario()
  })

  it('should be created', inject([InputValidationService], (service: InputValidationService) => {
    expect(service).toBeTruthy();
  }))


  //Check checkValidRetirementInputs()
  it('should give no error message when input date is good', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate(2023, 7, 1)
    expect(service.checkValidRetirementInput(scenario, person, retirementBenefitDate))
      .toEqual(undefined)
  }))

  it('should demand a date when user fails to input one', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate(undefined, 1, 0)
    expect(service.checkValidRetirementInput(scenario, person, retirementBenefitDate))
      .toEqual("Please enter a date.")
  }))

  it('should reject retirementBenefitDate that is too early', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2022, 11, 1) //62 years and 0 months (not possible for somebody born on not first or second of month)
    expect(service.checkValidRetirementInput(scenario, person, retirementBenefitDate))
      .toEqual("Please enter a later date. A person cannot file for retirement benefits before the first month in which they are 62 for the entire month.")
  }))

  it('should reject retirementBenefitDate that is later than 70', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2031, 0, 1) //70 years and 1 month
    expect(service.checkValidRetirementInput(scenario, person, retirementBenefitDate))
      .toEqual("Please enter an earlier date. You do not want to wait beyond age 70.")
  }))

  it('should allow retroactive retirementBenefitDate if after FRA and no more than 6 months ago', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    person.SSbirthDate = new MonthYearDate (1952, 8)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2018, 9) //only 1 month in the past, after FRA
    expect(service.checkValidRetirementInput(scenario, person, retirementBenefitDate))
      .toEqual(undefined)
  }))

  it('should reject retirementBenefitDate that is more than 6 months ago, even if after FRA', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test)
    person.actualBirthDate = new Date (1952, 2, 29) //March 30, 1952
    person.SSbirthDate = new MonthYearDate (1952, 2)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2018, 3) //after FRA, but more than 6 months ago
    expect(service.checkValidRetirementInput(scenario, person, retirementBenefitDate))
      .toEqual("The effective date for a retroactive application for retirement benefits must be no earlier than your full retirement age and no more than 6 months before today.")
  }))

  it('should reject retirementBenefitDate that prior to FRA, even if no more than 6 months ago', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test)
    person.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    person.SSbirthDate = new MonthYearDate (1952, 8)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2018, 7) //only 3 months ago, but before FRA
    expect(service.checkValidRetirementInput(scenario, person, retirementBenefitDate))
      .toEqual("The effective date for a retroactive application for retirement benefits must be no earlier than your full retirement age and no more than 6 months before today.")
  }))

  //Check checkValidSpousalInputs()
  it('should give no error message when input dates are good', inject([InputValidationService], (service: InputValidationService) => {
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1958, 5, 3) //June 4, 1958
    otherPerson.SSbirthDate = new MonthYearDate (1958, 5, 1)
    let ownRetirementBenefitDate:MonthYearDate = new MonthYearDate(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:MonthYearDate = new MonthYearDate(2026, 11, 1) //own spousal at 66 years 0 months
    let otherSpouseRetirementBenefitDate:MonthYearDate = new MonthYearDate(2022, 7, 1) //Before the attempted own spousal date, so that it's not a problem
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual(undefined)
  }))

  it('should reject spousalBenefitDate that is prior to age 62', inject([InputValidationService], (service: InputValidationService) => {
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1958, 5, 3) //June 4, 1958
    otherPerson.SSbirthDate = new MonthYearDate (1958, 5, 1)
    let ownRetirementBenefitDate:MonthYearDate = new MonthYearDate(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:MonthYearDate = new MonthYearDate(2022, 10, 1) //own spousal at 61 years 11 months
    let otherSpouseRetirementBenefitDate:MonthYearDate = new MonthYearDate(2022, 7, 1) //Before the attempted own spousal date, so that *this* isn't the problem
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("Please enter a later date. A person cannot file for spousal benefits before the first month in which they are 62 for the entire month.")
  }))

  it('should reject spousalBenefitDate that is prior to other spouse retirementBenefitDate', inject([InputValidationService], (service: InputValidationService) => {
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1962, 5, 3) //June 4, 1962
    otherPerson.SSbirthDate = new MonthYearDate (1962, 5, 1)
    let ownRetirementBenefitDate:MonthYearDate = new MonthYearDate(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:MonthYearDate = new MonthYearDate(2026, 11, 1) //own spousal at 66 years 0 months
    let otherSpouseRetirementBenefitDate:MonthYearDate = new MonthYearDate(2031, 11, 1) //After the attempted own spousal date
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("A person cannot start spousal benefits before the other spouse has filed for his/her own retirement benefit.")
  }))

  it('should reject spousalBenefitDate that is later than later of the two retirementBenefitDates', inject([InputValidationService], (service: InputValidationService) => {
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1962, 5, 3) //June 4, 1962
    otherPerson.SSbirthDate = new MonthYearDate (1962, 5, 1)
    let ownRetirementBenefitDate:MonthYearDate = new MonthYearDate(2026, 11, 1)
    let otherSpouseRetirementBenefitDate:MonthYearDate = new MonthYearDate(2031, 11, 1)
    let spousalBenefitDate:MonthYearDate = new MonthYearDate(2032, 0, 1) //Later than both retirementBenefitDates
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("Per deemed filing rules, a person's spousal benefit date must be the later of their own retirement benefit date, or their spouse's retirement benefit date.")
  }))

  it('should reject spousalBenefitDate that is later than later of the two retirementBenefitDates, for divorcee', inject([InputValidationService], (service: InputValidationService) => {
    scenario.maritalStatus = "divorced"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 30, 1960
    person.SSbirthDate = new MonthYearDate (1960, 11, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1962, 5, 3) //June 4, 1962
    otherPerson.SSbirthDate = new MonthYearDate (1962, 5, 1)
    let ownRetirementBenefitDate:MonthYearDate = new MonthYearDate(2026, 11, 1)
    let spousalBenefitDate:MonthYearDate = new MonthYearDate(2032, 0, 1)
    let otherSpouseRetirementBenefitDate:MonthYearDate = new MonthYearDate(2031, 11, 1)
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("Per deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or the first month in which your ex-spouse is 62 for the entire month.")
  }))

  it('should allow retroactive spousal date if after FRA and no more than 6 months ago', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    person.SSbirthDate = new MonthYearDate (1952, 8)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    otherPerson.SSbirthDate = new MonthYearDate (1952, 8)
    mockGetPrimaryFormInputs(otherPerson, service.today, birthdayService)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2018, 9) //only 1 month in the past, after FRA
    let spousalBenefitDate:MonthYearDate = new MonthYearDate (2018, 9) //only 1 month in the past, after FRA
    let otherPersonRetirementBenefitDate:MonthYearDate = new MonthYearDate (2016, 9) //filed Oct 2016
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, retirementBenefitDate, spousalBenefitDate, otherPersonRetirementBenefitDate))
      .toEqual(undefined)
  }))

  it('should allow retroactive spousal date if after FRA and 8 months ago because other person is disabled', inject([InputValidationService], (service: InputValidationService) => {
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    otherPerson.isOnDisability = true
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1952, 1, 29) //Feb 30, 1952
    person.SSbirthDate = new MonthYearDate (1952, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    otherPerson.SSbirthDate = new MonthYearDate (1952, 8)
    mockGetPrimaryFormInputs(otherPerson, service.today, birthdayService)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2018, 2) //8 months in the past, after FRA
    let spousalBenefitDate:MonthYearDate = new MonthYearDate (2018, 2) //8 months in the past, after FRA
    let otherPersonRetirementBenefitDate:MonthYearDate = new MonthYearDate (2016, 9) //filed Oct 2016
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, retirementBenefitDate, spousalBenefitDate, otherPersonRetirementBenefitDate))
      .toEqual(undefined)
  }))

  it('should reject retroactive spousal date if after FRA but more than 6 months ago', inject([InputValidationService], (service: InputValidationService) => {
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1952, 2, 29) //March 30, 1952
    person.SSbirthDate = new MonthYearDate (1952, 2)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    otherPerson.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    otherPerson.SSbirthDate = new MonthYearDate (1952, 8)
    otherPerson.FRA = birthdayService.findFRA(otherPerson.SSbirthDate)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2018, 3)
    let spousalBenefitDate:MonthYearDate = new MonthYearDate (2018, 3) //after FRA, but 7 months ago
    let otherPersonRetirementBenefitDate:MonthYearDate = new MonthYearDate (2016, 9) //filed Oct 2016
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, retirementBenefitDate, spousalBenefitDate, otherPersonRetirementBenefitDate))
      .toEqual("The effective date for a retroactive application for spousal benefits must be no earlier than your full retirement age and no more than 6 months before today (12 months if your spouse/ex-spouse is disabled).")
  }))

  it('should reject retroactive spousal date if less than 6 months ago but before FRA', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    person.SSbirthDate = new MonthYearDate (1952, 8)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    otherPerson.actualBirthDate = new Date (1952, 8, 29) //Sept 30, 1952
    otherPerson.SSbirthDate = new MonthYearDate (1952, 8)
    mockGetPrimaryFormInputs(otherPerson, service.today, birthdayService)
    let retirementBenefitDate:MonthYearDate = new MonthYearDate (2018, 7)
    let spousalBenefitDate:MonthYearDate = new MonthYearDate (2018, 7) //only 3 months ago, but before FRA
    let otherPersonRetirementBenefitDate:MonthYearDate = new MonthYearDate (2016, 9) //filed Oct 2016
    expect(service.checkValidSpousalInput(scenario, person, otherPerson, retirementBenefitDate, spousalBenefitDate, otherPersonRetirementBenefitDate))
      .toEqual("The effective date for a retroactive application for spousal benefits must be no earlier than your full retirement age and no more than 6 months before today (12 months if your spouse/ex-spouse is disabled).")
  }))

  //Testing checkValidBeginSuspensionInput()
  it('should reject beginSuspensionDate that is prior to FRA', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1953, 4, 29) //May 30, 1953
    person.SSbirthDate = new MonthYearDate (1953, 4, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    person.beginSuspensionDate = new MonthYearDate(2019, 3, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toEqual("It is not possible to suspend benefits prior to full retirement age.")
  }))

  it('should reject beginSuspensionDate that is in the past', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1950, 4, 29) //May 30, 1950
    person.SSbirthDate = new MonthYearDate (1950, 4, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    person.beginSuspensionDate = new MonthYearDate(2018, 3, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toEqual("Please enter a date no earlier than today.")
  }))

  it('should reject beginSuspensionDate that is prior to fixedRetirementBenefitDate', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1960, 4, 29)
    person.SSbirthDate = new MonthYearDate (1960, 4, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    person.fixedRetirementBenefitDate = new MonthYearDate(2028, 1, 1) //Feb 2018
    person.beginSuspensionDate = new MonthYearDate(2027, 5, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toEqual("It is not possible to suspend a retirement benefit prior to having filed for that retirement benefit.")
  }))

  it('should give no error message when beginSuspensionDate is a valid choice', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    service.setToday(new MonthYearDate(2018, 10))//November 2018 (date when writing test) so that it doesn't fail in future
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new MonthYearDate (1956, 4, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    person.fixedRetirementBenefitDate = new MonthYearDate(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new MonthYearDate(2025, 3, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toBeUndefined()
  }))


  //Testing checkValidEndSuspensionInput()
  it('should give no error message when endSuspensionDate is a valid choice', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new MonthYearDate (1956, 4, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    person.fixedRetirementBenefitDate = new MonthYearDate(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new MonthYearDate(2025, 3, 1)
    person.endSuspensionDate = new MonthYearDate(2026, 3, 1)
    expect(service.checkValidEndSuspensionInput(person))
      .toBeUndefined()
  }))


  it('should reject endSuspensionDate when it is prior to beginSuspensionDate', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new MonthYearDate (1956, 4, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    person.fixedRetirementBenefitDate = new MonthYearDate(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new MonthYearDate(2026, 3, 1)
    person.endSuspensionDate = new MonthYearDate(2025, 3, 1)
    expect(service.checkValidEndSuspensionInput(person))
      .toEqual("Please enter an end-suspension date that is no earlier than the begin-suspension date.")
  }))

  it('should reject endSuspensionDate when it is after age 70', inject([InputValidationService], (service: InputValidationService) => {
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new MonthYearDate (1956, 4, 1)
    mockGetPrimaryFormInputs(person, service.today, birthdayService)
    person.fixedRetirementBenefitDate = new MonthYearDate(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new MonthYearDate(2026, 3, 1)
    person.endSuspensionDate = new MonthYearDate(2026, 5, 1)
    expect(service.checkValidEndSuspensionInput(person))
      .toEqual("Please enter a date no later than the month in which this person attains age 70.")
  }))

  //Testing checkValidSurvivorInput()
  it('should reject survivorBenefit date that is prior to date of death', inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2020, 8))//Sept 2020 writing this test
    let livingPerson:Person = new Person("A")
    let deceasedPerson:Person = new Person("B")
    deceasedPerson.dateOfDeath = new MonthYearDate(2020, 7)//died August 2020
    livingPerson.SSbirthDate = new MonthYearDate (1952, 8)//Age 68 now, has already reached survivor FRA
    livingPerson.survivorBenefitDate = new MonthYearDate(2020, 6)
    mockGetPrimaryFormInputs(livingPerson, service.today, birthdayService)
    expect(service.checkValidSurvivorInput(scenario, livingPerson, deceasedPerson, livingPerson.survivorBenefitDate))
      .toEqual("A survivor benefit cannot be claimed prior to the deceased spouse's date of death.")
  }))

  it('should reject survivorBenefit date that is prior to 6 months ago', inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2020, 8))//Sept 2020 writing this test
    let livingPerson:Person = new Person("A")
    let deceasedPerson:Person = new Person("B")
    deceasedPerson.dateOfDeath = new MonthYearDate(2020, 0)//died Jan 2020
    livingPerson.SSbirthDate = new MonthYearDate (1952, 8)//Age 68 now, has already reached survivor FRA
    livingPerson.survivorBenefitDate = new MonthYearDate(2020, 1)
    mockGetPrimaryFormInputs(livingPerson, service.today, birthdayService)
    expect(service.checkValidSurvivorInput(scenario, livingPerson, deceasedPerson, livingPerson.survivorBenefitDate))
      .toEqual("The effective date for a retroactive application for survivor benefits must be no earlier than 6 months before today (12 if disabled). If you are not disabled, the effective date for a retroactive application must also be no earlier than your survivor FRA, in most cases. (See <a href='https://secure.ssa.gov/poms.nsf/lnx/0200204030#d' target='_blank'>POMS GN 00204.030.D</a> for more information.)")
  }))

  it('should allow survivorBenefit date 7 months ago, even if person younger than survivorFRA, if survivor is disabled', inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2020, 8))//Sept 2020 writing this test
    let livingPerson:Person = new Person("A")
    let deceasedPerson:Person = new Person("B")
    deceasedPerson.dateOfDeath = new MonthYearDate(2019, 11)//died Dec 2019
    livingPerson.SSbirthDate = new MonthYearDate (1965, 8)//Age 55 now
    livingPerson.survivorBenefitDate = new MonthYearDate(2020, 1)
    livingPerson.isOnDisability = true
    mockGetPrimaryFormInputs(livingPerson, service.today, birthdayService)
    expect(service.checkValidSurvivorInput(scenario, livingPerson, deceasedPerson, livingPerson.survivorBenefitDate))
      .toBeUndefined()
  }))

  it('should allow survivorBenefit date 5 months ago, even if person younger than survivorFRA, if RIB-LIM is applicable', inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2022, 3))//April 2022 writing this test
    let livingPerson:Person = new Person("A")
    let deceasedPerson:Person = new Person("B")
    livingPerson.PIA = 500
    deceasedPerson.PIA = 2500
    deceasedPerson.dateOfDeath = new MonthYearDate(2021, 11)//Died December 2021
    livingPerson.SSbirthDate = new MonthYearDate (1956, 4) //Born May 1956. With 1956 DoB, survivor FRA is 66 and 0 months, so that would be May 2022.
    deceasedPerson.SSbirthDate = new MonthYearDate (1956, 1)//Born Feb 1956
    mockGetPrimaryFormInputs(livingPerson, service.today, birthdayService)
    mockGetPrimaryFormInputs(deceasedPerson,service.today, birthdayService)
    livingPerson.survivorBenefitDate = new MonthYearDate(2021, 11)
    //RIB-LIM has to apply. Let's say deceased filed asap at 62 and 1 month. So RIB-LIM is 82.5%
    deceasedPerson.hasFiled = true
    deceasedPerson.retirementBenefitDate = new MonthYearDate(2018, 2)//Filed at 62 and 1 month
    deceasedPerson.retirementBenefit = benefitService.calculateRetirementBenefit(deceasedPerson, deceasedPerson.retirementBenefitDate)
    expect(service.checkValidSurvivorInput(scenario, livingPerson, deceasedPerson, livingPerson.survivorBenefitDate))
      .toBeUndefined()
  }))

  it('should reject survivorBenefit date 5 months ago, if person younger than survivorFRA, and RIB-LIM is NOT applicable', inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2022, 3))//April 2022 writing this test
    let livingPerson:Person = new Person("A")
    let deceasedPerson:Person = new Person("B")
    livingPerson.PIA = 500
    deceasedPerson.PIA = 2500
    deceasedPerson.dateOfDeath = new MonthYearDate(2021, 11)//Died December 2021
    livingPerson.SSbirthDate = new MonthYearDate (1956, 4) //Born May 1956. With 1956 DoB, survivor FRA is 66 and 0 months, so that would be May 2022.
    deceasedPerson.SSbirthDate = new MonthYearDate (1952, 1)//Born Feb 1952
    mockGetPrimaryFormInputs(livingPerson, service.today, birthdayService)
    mockGetPrimaryFormInputs(deceasedPerson,service.today, birthdayService)
    livingPerson.survivorBenefitDate = new MonthYearDate(2021, 11)
    //RIB-LIM has to apply. Let's say deceased filed asap at 62 and 1 month. So RIB-LIM is 82.5%
    deceasedPerson.retirementBenefitDate = new MonthYearDate(2021, 10)//Filed at 69 and 9 months
    deceasedPerson.retirementBenefit = benefitService.calculateRetirementBenefit(deceasedPerson, deceasedPerson.retirementBenefitDate)
    expect(service.checkValidSurvivorInput(scenario, livingPerson, deceasedPerson, livingPerson.survivorBenefitDate))
      .toEqual("The effective date for a retroactive application for survivor benefits must be no earlier than 6 months before today (12 if disabled). If you are not disabled, the effective date for a retroactive application must also be no earlier than your survivor FRA, in most cases. (See <a href='https://secure.ssa.gov/poms.nsf/lnx/0200204030#d' target='_blank'>POMS GN 00204.030.D</a> for more information.)")
  }))

  //Testing checkValidMotherFatherInput()
  it('should reject mother/father benefit date that is prior to date of death', inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2020, 8))//Sept 2020 writing this test
    let livingPerson:Person = new Person("A")
    let deceasedPerson:Person = new Person("B")
    deceasedPerson.dateOfDeath = new MonthYearDate(2020, 7)//died August 2020
    livingPerson.SSbirthDate = new MonthYearDate (1952, 8)//Age 68 now, has already reached survivor FRA
    livingPerson.fixedMotherFatherBenefitDate = new MonthYearDate(2020, 6)
    mockGetPrimaryFormInputs(livingPerson, service.today, birthdayService)
    expect(service.checkValidMotherFatherInput(livingPerson, deceasedPerson, livingPerson.fixedMotherFatherBenefitDate))
      .toEqual("A mother/father benefit cannot be claimed prior to the deceased spouse's date of death.")
  }))

  //Testing checkForAssumedDeathAgeErrors()
  it("should reject an assumed age at death that is younger than the person's age at the end of this year", inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2021, 9))//October 2021 writing this test
    let errorCollection:ErrorCollection = new ErrorCollection() 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    personA.SSbirthDate = new MonthYearDate (1956, 4)//Born May 1956, so they're 65 right now.
    personB.SSbirthDate = new MonthYearDate (1956, 4)
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 64)//64 is too young for an assumed death age.
    personB.mortalityTable = mortalityService.determineMortalityTable("female", "SSA", 0)
    mockGetPrimaryFormInputs(personA, service.today, birthdayService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService)
    expect(service.checkForAssumedDeathAgeErrors(errorCollection, personA, personB).personAassumedDeathAgeError)
      .toEqual("Assumed death age is too young. Please choose an age no earlier than this person's age at the end of this calendar year.")
  }))


  it("should allow an assumed age at death that is equal to the person's age at the end of this year", inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2021, 9))//October 2021 writing this test
    let errorCollection:ErrorCollection = new ErrorCollection() 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    personA.SSbirthDate = new MonthYearDate (1956, 4)//Born May 1956, so they're 65 right now.
    personB.SSbirthDate = new MonthYearDate (1956, 4)
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 65)//65 should be allowed as an assumed death age (i.e., dying end of this year).
    personB.mortalityTable = mortalityService.determineMortalityTable("female", "SSA", 0)
    mockGetPrimaryFormInputs(personA, service.today, birthdayService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService)
    expect(service.checkForAssumedDeathAgeErrors(errorCollection, personA, personB).personAassumedDeathAgeError)
      .toBeUndefined()
  }))

  it("should reject an assumed age at death that is younger than 62", inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2021, 9))//October 2021 writing this test
    let errorCollection:ErrorCollection = new ErrorCollection() 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    personA.SSbirthDate = new MonthYearDate (1970, 4)//Born May 1970, so they're 51 right now.
    personB.SSbirthDate = new MonthYearDate (1970, 4)//Born May 1970, so they're 51 right now.
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 61)//61 is too young for an assumed death age.
    personB.mortalityTable = mortalityService.determineMortalityTable ("female", "fixed", 61)//61 is too young for an assumed death age.
    mockGetPrimaryFormInputs(personA, service.today, birthdayService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService)
    expect(service.checkForAssumedDeathAgeErrors(errorCollection, personA, personB).personAassumedDeathAgeError)
      .toEqual('For an assumed age at death younger than 62, please run the calculator using the "widow(er)" marital status, as if the person in question is already deceased. (While this will result in an assumed age at death younger than you are intending, for any assumed death age younger than 62, the math is unaffected by whether the age at death is, for example, 57 as opposed to 61.)')
      expect(service.checkForAssumedDeathAgeErrors(errorCollection, personA, personB).personBassumedDeathAgeError)
      .toEqual('For an assumed age at death younger than 62, please run the calculator using the "widow(er)" marital status, as if the person in question is already deceased. (While this will result in an assumed age at death younger than you are intending, for any assumed death age younger than 62, the math is unaffected by whether the age at death is, for example, 57 as opposed to 61.)')
  }))

  it("should reject an assumed age at death that is greater than 140", inject([InputValidationService], (service: InputValidationService) => {
    service.setToday(new MonthYearDate(2021, 9))//October 2021 writing this test
    let errorCollection:ErrorCollection = new ErrorCollection() 
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    personA.SSbirthDate = new MonthYearDate (1956, 4)//Born May 1956, so they're 65 right now.
    personB.SSbirthDate = new MonthYearDate (1956, 4)
    personA.mortalityTable = mortalityService.determineMortalityTable ("male", "fixed", 140)
    personB.mortalityTable = mortalityService.determineMortalityTable("female", "fixed", 140)
    mockGetPrimaryFormInputs(personA, service.today, birthdayService)
    mockGetPrimaryFormInputs(personB, service.today, birthdayService)
    expect(service.checkForAssumedDeathAgeErrors(errorCollection, personA, personB).personAassumedDeathAgeError)
      .toEqual("Please enter an assumed age at death that is less than 140.")
    expect(service.checkForAssumedDeathAgeErrors(errorCollection, personA, personB).personBassumedDeathAgeError)
      .toEqual("Please enter an assumed age at death that is less than 140.")
  }))

});
