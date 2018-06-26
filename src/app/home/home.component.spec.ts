import {TestBed, inject} from '@angular/core/testing'
import {HomeComponent} from './home.component'
import {BirthdayService} from '../birthday.service'
import {PresentValueService} from '../presentvalue.service'
import {MortalityService} from '../mortality.service'
import {BenefitService} from '../benefit.service'
import {SolutionSet} from '../solutionset'
import {FREDresponse} from '../fredresponse'
import {HttpClient} from '@angular/common/http'


describe('HomeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HomeComponent, BirthdayService, PresentValueService, MortalityService, BenefitService, SolutionSet, FREDresponse, {provide: HttpClient, useValue: HttpClientStub }]
    })
  })

    let HttpClientStub: Partial<HttpClient>


    it('should be created', inject([HomeComponent], (component: HomeComponent) => {
        expect(component).toBeTruthy()
    }))


    //Check checkValidRetirementInputs()
    it('should give no error message when input date is good', inject([HomeComponent], (component: HomeComponent) => {
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let retirementBenefitDate:Date = new Date(2023, 7, 1)
      expect(component.checkValidRetirementInputs(SSbirthDate, actualBirthDate, retirementBenefitDate))
        .toEqual(undefined)
    }))

    it('should demand a date when user fails to input one', inject([HomeComponent], (component: HomeComponent) => {
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let retirementBenefitDate:Date = new Date(undefined, 7, 1)
      expect(component.checkValidRetirementInputs(SSbirthDate, actualBirthDate, retirementBenefitDate))
        .toEqual("Please enter a date.")
    }))

    it('should reject retirementBenefitDate that is too early', inject([HomeComponent], (component: HomeComponent) => {
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let retirementBenefitDate:Date = new Date (2022, 11, 1) //62 years and 0 months (not possible for somebody born on not first or second of month)
      expect(component.checkValidRetirementInputs(SSbirthDate, actualBirthDate, retirementBenefitDate))
        .toEqual("Please enter a later date. You cannot file for retirement benefits before the first month in which you are 62 for the entire month.")
    }))

    it('should reject retirementBenefitDate that is later than 70', inject([HomeComponent], (component: HomeComponent) => {
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let retirementBenefitDate:Date = new Date (2031, 0, 1) //70 years and 1 month
      expect(component.checkValidRetirementInputs(SSbirthDate, actualBirthDate, retirementBenefitDate))
        .toEqual("Please enter an earlier date. You do not want to wait beyond age 70.")
    }))


    //Check checkValidSpousalInputs()
    it('should give no error message when input dates are good', inject([HomeComponent], (component: HomeComponent) => {
      component.maritalStatus = "married"
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let FRA: Date = new Date (2027, 11, 1) //67 years
      let otherSpouseActualBirthDate:Date = new Date (1958, 5, 3) //June 3, 1958
      let otherSpouseSSbirthDate:Date = new Date (1958, 5, 1)
      let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
      let spousalBenefitDate:Date = new Date(2026, 11, 1) //own spousal at 66 years 0 months
      let otherSpouseRetirementBenefitDate:Date = new Date(2022, 7, 1) //Before the attempted own spousal date, so that it's not a problem
      expect(component.checkValidSpousalInputs(FRA, actualBirthDate, SSbirthDate, otherSpouseActualBirthDate, otherSpouseSSbirthDate, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
        .toEqual(undefined)
    }))

    it('should reject spousalBenefitDate that is prior to age 62', inject([HomeComponent], (component: HomeComponent) => {
      component.maritalStatus = "married"
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let FRA: Date = new Date (2027, 11, 1) //67 years
      let otherSpouseActualBirthDate:Date = new Date (1958, 5, 3) //June 3, 1958
      let otherSpouseSSbirthDate:Date = new Date (1958, 5, 1)
      let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
      let spousalBenefitDate:Date = new Date(2022, 10, 1) //own spousal at 61 years 11 months
      let otherSpouseRetirementBenefitDate:Date = new Date(2022, 7, 1) //Before the attempted own spousal date, so that *this* isn't the problem
      expect(component.checkValidSpousalInputs(FRA, actualBirthDate, SSbirthDate, otherSpouseActualBirthDate, otherSpouseSSbirthDate, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
        .toEqual("Please enter a later date. You cannot file for spousal benefits before the first month in which you are 62 for the entire month.")
    }))

    it('should reject spousalBenefitDate that is prior to other spouse retirementBenefitDate', inject([HomeComponent], (component: HomeComponent) => {
      component.maritalStatus = "married"
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let FRA: Date = new Date (2027, 11, 1) //67 years
      let otherSpouseActualBirthDate:Date = new Date (1962, 5, 3) //June 3, 1962
      let otherSpouseSSbirthDate:Date = new Date (1962, 5, 1)
      let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
      let spousalBenefitDate:Date = new Date(2026, 11, 1) //own spousal at 66 years 0 months
      let otherSpouseRetirementBenefitDate:Date = new Date(2031, 11, 1) //After the attempted own spousal date
      expect(component.checkValidSpousalInputs(FRA, actualBirthDate, SSbirthDate, otherSpouseActualBirthDate, otherSpouseSSbirthDate, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
        .toEqual("You cannot start your spousal benefit before your spouse has filed for his/her own retirement benefit.")
    }))

    it('should reject spousalBenefitDate that is later than later of the two retirementBenefitDates', inject([HomeComponent], (component: HomeComponent) => {
      component.maritalStatus = "married"
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let FRA: Date = new Date (2027, 11, 1) //67 years
      let otherSpouseActualBirthDate:Date = new Date (1962, 5, 3) //June 3, 1962
      let otherSpouseSSbirthDate:Date = new Date (1962, 5, 1)
      let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
      let spousalBenefitDate:Date = new Date(2032, 0, 1) //own spousal at 66 years 0 months
      let otherSpouseRetirementBenefitDate:Date = new Date(2031, 11, 1) //After the attempted own spousal date
      expect(component.checkValidSpousalInputs(FRA, actualBirthDate, SSbirthDate, otherSpouseActualBirthDate, otherSpouseSSbirthDate, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
        .toEqual("Per new deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or your spouse's retirement benefit date.")
    }))

    it('should reject spousalBenefitDate that is later than later of the two retirementBenefitDates, for divorcee', inject([HomeComponent], (component: HomeComponent) => {
      component.maritalStatus = "divorced"
      let actualBirthDate:Date = new Date (1960, 11, 29) //December 29, 1960
      let SSbirthDate: Date = new Date (1960, 11, 1)
      let FRA: Date = new Date (2027, 11, 1) //67 years
      let otherSpouseActualBirthDate:Date = new Date (1962, 5, 3) //June 3, 1962
      let otherSpouseSSbirthDate:Date = new Date (1962, 5, 1)
      let ownRetirementBenefitDate:Date = new Date(2026, 11, 1) //own retirement at 66 years 0 months
      let spousalBenefitDate:Date = new Date(2032, 0, 1) //own spousal at 66 years 0 months
      let otherSpouseRetirementBenefitDate:Date = new Date(2031, 11, 1) //After the attempted own spousal date
      expect(component.checkValidSpousalInputs(FRA, actualBirthDate, SSbirthDate, otherSpouseActualBirthDate, otherSpouseSSbirthDate, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
        .toEqual("Per new deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or the first month in which your ex-spouse is 62 for the entire month.")
    }))

    it('should reject restricted app prior to FRA -- ie spousalBenefitDate prior to FRA for somebody born 1953 or prior ', inject([HomeComponent], (component: HomeComponent) => {
      component.maritalStatus = "married"
      let actualBirthDate:Date = new Date (1953, 4, 29) //May 29, 1953
      let SSbirthDate: Date = new Date (1953, 4, 1)
      let FRA: Date = new Date (2019, 4, 1) //66 years
      let otherSpouseActualBirthDate:Date = new Date (1954, 4, 3) //May 3, 1954
      let otherSpouseSSbirthDate:Date = new Date (1954, 4, 1)
      let ownRetirementBenefitDate:Date = new Date(2023, 4, 1) //own retirement at 70 years 0 months
      let spousalBenefitDate:Date = new Date(2017, 4, 1) //own spousal at 64 years 0 months (prior to FRA)
      let otherSpouseRetirementBenefitDate:Date = new Date(2017, 3, 1) //Prior to attempted ownSpousalBenefitDate, so that *this* isn't the problem
      expect(component.checkValidSpousalInputs(FRA, actualBirthDate, SSbirthDate, otherSpouseActualBirthDate, otherSpouseSSbirthDate, ownRetirementBenefitDate, spousalBenefitDate, otherSpouseRetirementBenefitDate))
        .toEqual("You can't file a restricted application (i.e., application for spousal-only) prior to your FRA.")
    }))







})