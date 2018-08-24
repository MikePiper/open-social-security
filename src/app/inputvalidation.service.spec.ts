import {TestBed, inject} from '@angular/core/testing'
import {InputValidationService} from './inputvalidation.service'
import {Person} from './data model classes/person'
import {ClaimingScenario} from './data model classes/claimingscenario'
import {BirthdayService} from './birthday.service'

describe('InputvalidationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InputValidationService]
    });
  });

  it('should be created', inject([InputValidationService], (service: InputValidationService) => {
    expect(service).toBeTruthy();
  }));


  //Check checkValidRetirementInputs()
  it('should give no error message when input date is good', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    let retirementBenefitDate:Date = new Date(2023, 7, 1)
    expect(service.checkValidRetirementInputs(scenario, person, retirementBenefitDate))
      .toEqual(undefined)
  }))

  it('should demand a date when user fails to input one', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    let retirementBenefitDate:Date = new Date(undefined)
    expect(service.checkValidRetirementInputs(scenario, person, retirementBenefitDate))
      .toEqual("Please enter a date.")
  }))

  it('should reject retirementBenefitDate that is too early', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    let retirementBenefitDate:Date = new Date (2022, 11, 1) //62 years and 0 months (not possible for somebody born on not first or second of month)
    expect(service.checkValidRetirementInputs(scenario, person, retirementBenefitDate))
      .toEqual("Please enter a later date. A person cannot file for retirement benefits before the first month in which they are 62 for the entire month.")
  }))

  it('should reject retirementBenefitDate that is later than 70', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    let retirementBenefitDate:Date = new Date (2031, 0, 1) //70 years and 1 month
    expect(service.checkValidRetirementInputs(scenario, person, retirementBenefitDate))
      .toEqual("Please enter an earlier date. You do not want to wait beyond age 70.")
  }))


  //Check checkValidSpousalInputs()
  it('should give no error message when input dates are good', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    person.FRA = new Date (2027, 11, 1) //67 years
    otherPerson.actualBirthDate = new Date (1958, 5, 3) //June 3, 1958
    otherPerson.SSbirthDate = new Date (1958, 5, 1)
    let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:Date = new Date(2026, 11, 1) //own spousal at 66 years 0 months
    let otherSpouseRetirementBenefitDate:Date = new Date(2022, 7, 1) //Before the attempted own spousal date, so that it's not a problem
    expect(service.checkValidSpousalInputs(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual(undefined)
  }))

  it('should reject spousalBenefitDate that is prior to age 62', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    person.FRA = new Date (2027, 11, 1) //67 years
    otherPerson.actualBirthDate = new Date (1958, 5, 3) //June 3, 1958
    otherPerson.SSbirthDate = new Date (1958, 5, 1)
    let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:Date = new Date(2022, 10, 1) //own spousal at 61 years 11 months
    let otherSpouseRetirementBenefitDate:Date = new Date(2022, 7, 1) //Before the attempted own spousal date, so that *this* isn't the problem
    expect(service.checkValidSpousalInputs(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("Please enter a later date. You cannot file for spousal benefits before the first month in which you are 62 for the entire month.")
  }))

  it('should reject spousalBenefitDate that is prior to other spouse retirementBenefitDate', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    person.FRA = new Date (2027, 11, 1) //67 years
    otherPerson.actualBirthDate = new Date (1962, 5, 3) //June 3, 1962
    otherPerson.SSbirthDate = new Date (1962, 5, 1)
    let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:Date = new Date(2026, 11, 1) //own spousal at 66 years 0 months
    let otherSpouseRetirementBenefitDate:Date = new Date(2031, 11, 1) //After the attempted own spousal date
    expect(service.checkValidSpousalInputs(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("You cannot start your spousal benefit before your spouse has filed for his/her own retirement benefit.")
  }))

  it('should reject spousalBenefitDate that is later than later of the two retirementBenefitDates', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    person.FRA = new Date (2027, 11, 1) //67 years
    otherPerson.actualBirthDate = new Date (1962, 5, 3) //June 3, 1962
    otherPerson.SSbirthDate = new Date (1962, 5, 1)
    let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:Date = new Date(2032, 0, 1) //own spousal at 66 years 0 months
    let otherSpouseRetirementBenefitDate:Date = new Date(2031, 11, 1) //After the attempted own spousal date
    expect(service.checkValidSpousalInputs(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("Per new deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or your spouse's retirement benefit date.")
  }))

  it('should reject spousalBenefitDate that is later than later of the two retirementBenefitDates, for divorcee', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "divorced"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1960, 11, 29) //December 29, 1960
    person.SSbirthDate = new Date (1960, 11, 1)
    person.FRA = new Date (2027, 11, 1) //67 years
    otherPerson.actualBirthDate = new Date (1962, 5, 3) //June 3, 1962
    otherPerson.SSbirthDate = new Date (1962, 5, 1)
    let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
    let spousalBenefitDate:Date = new Date(2032, 0, 1) //own spousal at 66 years 0 months
    let otherSpouseRetirementBenefitDate:Date = new Date(2031, 11, 1) //After the attempted own spousal date
    expect(service.checkValidSpousalInputs(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("Per new deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or the first month in which your ex-spouse is 62 for the entire month.")
  }))

  it('should reject restricted app prior to FRA -- ie spousalBenefitDate prior to FRA for somebody born 1953 or prior ', inject([InputValidationService], (service: InputValidationService) => {
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    let person:Person = new Person("A")
    let otherPerson:Person = new Person("B")
    person.actualBirthDate = new Date (1953, 4, 29) //May 29, 1953
    person.SSbirthDate = new Date (1953, 4, 1)
    person.FRA = new Date (2019, 4, 1) //66 years
    otherPerson.actualBirthDate = new Date (1954, 4, 3) //May 3, 1954
    otherPerson.SSbirthDate = new Date (1954, 4, 1)
    let ownRetirementBenefitDate:Date = new Date(2023, 4, 1) //own retirement at 70 years 0 months
    let spousalBenefitDate:Date = new Date(2017, 4, 1) //own spousal at 64 years 0 months (prior to FRA)
    let otherSpouseRetirementBenefitDate:Date = new Date(2017, 3, 1) //Prior to attempted ownSpousalBenefitDate, so that *this* isn't the problem
    expect(service.checkValidSpousalInputs(scenario, person, otherPerson, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
      .toEqual("You can't file a restricted application (i.e., application for spousal-only) prior to your FRA.")
  }))

  //Testing checkValidBeginSuspensionInput()
  it('should reject beginSuspensionDate that is prior to FRA', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1953, 4, 29) //May 29, 1953
    person.SSbirthDate = new Date (1953, 4, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.beginSuspensionDate = new Date(2019, 3, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toEqual("It is not possible to suspend benefits prior to full retirement age.")
  }))

  it('should reject beginSuspensionDate that is in the past', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1950, 4, 29) //May 29, 1950
    person.SSbirthDate = new Date (1950, 4, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.beginSuspensionDate = new Date(2018, 3, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toEqual("Please enter a date no earlier than today.")
  }))

  it('should reject beginSuspensionDate that is prior to fixedRetirementBenefitDate', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1960, 4, 29)
    person.SSbirthDate = new Date (1960, 4, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.fixedRetirementBenefitDate = new Date(2028, 1, 1) //Feb 2018
    person.beginSuspensionDate = new Date(2027, 5, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toEqual("It is not possible to suspend a retirement benefit prior to having filed for that retirement benefit.")
  }))

  it('should give no error message when beginSuspensionDate is a valid choice', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new Date (1956, 4, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.fixedRetirementBenefitDate = new Date(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new Date(2025, 3, 1)
    expect(service.checkValidBeginSuspensionInput(person))
      .toBeUndefined()
  }))


  //Testing checkValidEndSuspensionInput()
  it('should give no error message when endSuspensionDate is a valid choice', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new Date (1956, 4, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.fixedRetirementBenefitDate = new Date(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new Date(2025, 3, 1)
    person.endSuspensionDate = new Date(2026, 3, 1)
    expect(service.checkValidEndSuspensionInput(person))
      .toBeUndefined()
  }))


  it('should reject endSuspensionDate when it is prior to beginSuspensionDate', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new Date (1956, 4, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.fixedRetirementBenefitDate = new Date(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new Date(2026, 3, 1)
    person.endSuspensionDate = new Date(2025, 3, 1)
    expect(service.checkValidEndSuspensionInput(person))
      .toEqual("Please enter an end-suspension date that is no earlier than the begin-suspension date.")
  }))

  it('should reject endSuspensionDate when it is after age 70', inject([InputValidationService], (service: InputValidationService) => {
    let birthdayService:BirthdayService = new BirthdayService()
    let person:Person = new Person("A")
    person.actualBirthDate = new Date (1956, 4, 29)
    person.SSbirthDate = new Date (1956, 4, 1)
    person.FRA = birthdayService.findFRA(person.SSbirthDate)
    person.fixedRetirementBenefitDate = new Date(2018, 6, 1) //July 2018
    person.beginSuspensionDate = new Date(2026, 3, 1)
    person.endSuspensionDate = new Date(2026, 5, 1)
    expect(service.checkValidEndSuspensionInput(person))
      .toEqual("Please enter a date no later than the month in which this person attains age 70.")
  }))


});
