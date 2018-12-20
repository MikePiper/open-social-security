import { Person } from "./person"
import {MonthYearDate} from "./monthyearDate"

  export class ClaimingSolution {
    maritalStatus: string
    benefitType: string //retirementAlone, retirementReplacingSpousal, spousalAlone, spousalWithRetirement, survivor
    date: MonthYearDate
    ageYears: number
    ageMonths: number
    message: string //build one of messages below

    constructor(maritalStatus: string, typeOfBenefit:string, person:Person, date:MonthYearDate, ageYears:number, ageMonths:number){
        this.maritalStatus = maritalStatus
        this.benefitType = typeOfBenefit
        this.date = date
        this.ageYears = ageYears
        this.ageMonths = ageMonths
        if (person.id == "A") {
          if (this.benefitType == "retirement"){
            this.message = "You file for your retirement benefit to begin " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "retroactiveRetirement"){
            this.message = "You file for your retirement benefit to begin (retroactively) as of " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "spousal") {
            this.message = "You file for your spousal benefit to begin " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "retroactiveSpousal") {
            this.message = "You file for your spousal benefit to begin (retroactively) as of " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "childInCareSpousal") {
            this.message = "You file for child-in-care spousal benefits to begin " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "childInCareSpousalSuspension") {
            this.message = "Your child-in-care spousal benefit is automatically suspended when your youngest child reaches age 16 (" + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + "), at your age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "automaticSpousalUnsuspension") {
            this.message = "Your spousal benefit begins again automatically at your full retirement age (" + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ")."
          }
          if (this.benefitType == "suspendToday") {
            this.message = "You suspend your retirement benefit today."
          }
          if (this.benefitType == "suspendAtFRA") {
            this.message = "You suspend your retirement benefit at your full retirement age (" + (person.FRA.getMonth()+1) + "/" + person.FRA.getFullYear() + ")."
          }
          if (this.benefitType == "unsuspend") {
            this.message = "You unsuspend your retirement benefit " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "disabilityConversion"){
            this.message = "At your full retirement age (" + (person.FRA.getMonth()+1) + "/" + person.FRA.getFullYear() + "), your disability benefit will automatically convert to a retirement benefit of the same amount."
          }
          if (this.benefitType == "child"){
            this.message = "Your child(ren) file(s) for child benefits on your work record " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + "."
          }
          if (this.benefitType == "retroactiveChild"){
            this.message = "Your child(ren) file(s) for child benefits on your work record to begin (retroactively) as of " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + "."
          }
        }
        if (person.id == "B") {
          if (this.benefitType == "retirement"){
            this.message = "Your spouse files for his/her retirement benefit to begin " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "retroactiveRetirement"){
            this.message = "Your spouse files for his/her retirement benefit to begin (retroactively) as of " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "spousal") {
            this.message = "Your spouse files for his/her spousal benefit to begin " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "retroactiveSpousal") {
            this.message = "Your spouse files for his/her spousal benefit to begin (retroactively) as of " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "childInCareSpousal") {
            this.message = "Your spouse files for child-in-care spousal benefits to begin " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "childInCareSpousalSuspension") {
            this.message = "Your spouse's child-in-care spousal benefit is automatically suspended when your youngest child reaches age 16 " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at your age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "automaticSpousalUnsuspension") {
            this.message = "Your spouse's spousal benefit begins again automatically at his/her full retirement age (" + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ")."
          }
          if (this.benefitType == "suspendToday") {
            this.message = "Your spouse suspends his/her retirement benefit today."
          }
          if (this.benefitType == "suspendAtFRA") {
            this.message = "Your spouse suspends his/her retirement benefit at full retirement age (" + (person.FRA.getMonth()+1) + "/" + person.FRA.getFullYear() + ")."
          }
          if (this.benefitType == "unsuspend") {
            this.message = "Your spouse unsuspends his/her retirement benefit " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + ", at age " + this.ageYears + " and " + this.ageMonths + " months."
          }
          if (this.benefitType == "disabilityConversion"){
            this.message = "At your spouse's full retirement age (" + (person.FRA.getMonth()+1) + "/" + person.FRA.getFullYear() + "), his/her disability benefit will automatically convert to a retirement benefit of the same amount."
          }
          if (this.benefitType == "child"){
            this.message = "Your child(ren) file(s) for child benefits on your spouse's work record " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + "."
          }
          if (this.benefitType == "retroactiveChild"){
            this.message = "Your child(ren) file(s) for child benefits on your spouse's work record to begin (retroactively) as of " + (this.date.getMonth()+1) + "/" + this.date.getFullYear() + "."
          }
        }
        if (this.benefitType == "doNothing"){
          this.message = "Given the inputs provided, there is no recommended action for you to take other than what you have already done."
        }
    }
  }

