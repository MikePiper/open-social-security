import { Person } from "./person"
import {MonthYearDate} from "./monthyearDate"

//This is defined here as explicit options so that if something is ever input as a typo elsewhere (eg "retirmnt") it will throw an error
type benefitTypeOption = "retirement" | "retroactiveRetirement" | "disabilityConversion" | "suspendToday" | "suspendAtFRA" | "suspendAtSomeOtherDate" | "unsuspend" |
"spousal" | "retroactiveSpousal" | "childInCareSpousal" | "childInCareSpousalSuspension" | "automaticSpousalUnsuspension" | "declineSpousal" |
"survivor" | "retroactiveSurvivor" |
"child" | "retroactiveChild" | "motherFather" | "retroactiveMotherFather" |
"doNothing"

  //This class represents the bulleted items in the recommended strategy output. (That is, one ClaimingSolution object for each item in the bulleted list.)
  //This is in contrast to "ClaimStrategy" which represents a collection of claiming dates, as well as the calculated PV and output table for that collection of dates.
  export class ClaimingSolution {
    maritalStatus: string
    benefitType: benefitTypeOption //retirementAlone, retirementReplacingSpousal, spousalAlone, spousalWithRetirement, survivor
    date: MonthYearDate
    ageYears: number
    ageMonths: number
    message: string //build one of messages below
    shortMessage: string // for display when hovering over graph of options
    person:Person

  constructor(maritalStatus: string, typeOfBenefit: benefitTypeOption, person: Person, 
    date: MonthYearDate, ageYears: number, ageMonths: number) {
    this.person = person
    this.maritalStatus = maritalStatus
    this.benefitType = typeOfBenefit
    this.date = date
    this.ageYears = ageYears
    this.ageMonths = ageMonths
    let dateString: string = this.date.toString();
    let ageString: string
    if (this.ageYears > 0) { // age will be output, so create that string
      ageString = ", at age " + this.ageYears + " and " + this.ageMonths + " months."
    }
    // create the short message
    if (person.id == "A") {
      this.shortMessage = "You"
    } else {
      this.shortMessage = "Spouse" 
    }
    switch (this.benefitType) {
      case "retirement":
      case "retroactiveRetirement":
        this.shortMessage += " (begin retirement) " + dateString
        break;
      case "spousal":
      case "retroactiveSpousal":
        this.shortMessage += " (begin spousal) " + dateString
        break;
      case "childInCareSpousal":
        this.shortMessage += " (begin child-in-care spousal) " + dateString
        break;
      case "childInCareSpousalSuspension":
        this.shortMessage += " (suspend child-in-care spousal) " + dateString
        break;
      case "automaticSpousalUnsuspension":
        this.shortMessage += " (unsuspend spousal at FRA) " + dateString
        break;
      case "declineSpousal":
        this.shortMessage += " (decline to file for spousal benefits)"
        break;
      case "survivor":
      case "retroactiveSurvivor":
        this.shortMessage += " (survivor) " + dateString
        break;
      case "suspendToday":
        this.shortMessage += " (suspend retirement today)"
        break;
      case "suspendAtFRA":
        this.shortMessage += " (suspend retirement at FRA) " + dateString
        break;
      case "suspendAtSomeOtherDate":
        this.shortMessage += " (suspend retirement) " + dateString
        break;
      case "unsuspend":
        this.shortMessage +=" (unsuspend retirement) " + dateString
        break;
      case "disabilityConversion":
        this.shortMessage +=" (disability benefit converts to retirement) " + dateString
        break;
      case "child":
      case "retroactiveChild":
        if (person.id == "A") {
          this.shortMessage = "Child benefits on your record " + dateString
        } else {
          this.shortMessage = "Child benefits on spouse's record " + dateString 
        }
        break;
      case "motherFather":
      case "retroactiveMotherFather":
        if (person.gender == "male"){
          this.shortMessage += "(father benefits) " + dateString
        }
        else if (person.gender == "female"){
          this.shortMessage += "(mother benefits) " + dateString
        }
        break
      case "doNothing":
        this.shortMessage = "Do nothing"
    }
    // create the long message 
    if (person.id == "A") {
      switch (this.benefitType) {
        case "retirement":
          this.message = "You file for your retirement benefit to begin " + dateString + ageString
          break;
        case "retroactiveRetirement":
          this.message = "You file for your retirement benefit to begin (retroactively) as of " + dateString + ageString
          break;
        case "spousal":
          this.message = "You file for your spousal benefit to begin " + dateString + ageString
          break;
        case "retroactiveSpousal":
          this.message = "You file for your spousal benefit to begin (retroactively) as of " + dateString + ageString
          break;
        case "childInCareSpousal":
          this.message = "You file for child-in-care spousal benefits to begin " + dateString + ageString
          break;
        case "childInCareSpousalSuspension":
          this.message = "Your child-in-care spousal benefit is automatically suspended when your youngest child reaches age 16 (" + dateString + "), at your age " + this.ageYears + " and " + this.ageMonths + " months."
          break;
        case "automaticSpousalUnsuspension":
          this.message = "Your spousal benefit begins again automatically at your full retirement age (" + dateString + ")."
          break;
        case "declineSpousal":
          this.message = "You do not file for spousal benefits at any point."
          break;
        case "survivor":
          this.message = "You file for your survivor benefit to begin " + dateString + ageString
          break;
        case "retroactiveSurvivor":
          this.message = "You file for your survivor benefit to begin (retroactively) as of " + dateString + ageString
          break;
        case "suspendToday":
          this.message = "You suspend your retirement benefit today."
          break;
        case "suspendAtFRA":
          // NOTE: previous version specified person's FRA date, but solution.service.ts provides FRA date as the input date, so no need for special case
          this.message = "You suspend your retirement benefit at your full retirement age (" + dateString + ")."
          break;
        case "suspendAtSomeOtherDate":
          this.message = "You suspend your retirement benefit " + dateString + ageString
          break;
        case "unsuspend":
          this.message = "You unsuspend your retirement benefit " + dateString + ageString
          break;
        case "disabilityConversion":
          // NOTE: previous version specified person's FRA date, but solution.service.ts provides FRA date as the input date, so no need for special case
          this.message = "At your full retirement age (" + dateString + "), your disability benefit will automatically convert to a retirement benefit of the same amount."
          break;
        case "child":
          this.message = "Your child(ren) file(s) for child benefits on your work record " + dateString + "."
          break;
        case "retroactiveChild":
          this.message = "Your child(ren) file(s) for child benefits on your work record to begin (retroactively) as of " + dateString + "."
          break;
        case "motherFather":
          if (person.gender == "male"){
            this.message = "You file for father benefits to begin as of " + dateString + ageString
          }
          else if (person.gender == "female"){
            this.message = "You file for mother benefits to begin as of " + dateString + ageString
          }
          break;
        case "retroactiveMotherFather":
          if (person.gender == "male"){
            this.message = "You file for father benefits to begin (retroactively) as of " + dateString + ageString
          }
          else if (person.gender == "female"){
            this.message = "You file for mother benefits to begin (retroactively) as of " + dateString + ageString
          }
          break;
        case "doNothing": // doNothing always produced for personA in solutionset.service.ts
          this.message = "Nobody in the household files for any additional benefits or voluntarily suspends their benefit at any time."
      }
    }
    else { // this is personB
      switch (this.benefitType) {
        case "retirement":
          this.message = "Your spouse files for his/her retirement benefit to begin " + dateString + ageString
          break;
        case "retroactiveRetirement":
          this.message = "Your spouse files for his/her retirement benefit to begin (retroactively) as of " + dateString + ageString
          break;
        case "spousal":
          this.message = "Your spouse files for his/her spousal benefit to begin " + dateString + ageString
          break;
        case "retroactiveSpousal":
          this.message = "Your spouse files for his/her spousal benefit to begin (retroactively) as of " + dateString + ageString
          break;
        case "childInCareSpousal":
          this.message = "Your spouse files for child-in-care spousal benefits to begin " + dateString + ageString
          break;
        case "childInCareSpousalSuspension":
          this.message = "Your spouse's child-in-care spousal benefit is automatically suspended when your youngest child reaches age 16 (" + dateString + "), when your spouse is age " + this.ageYears + " and " + this.ageMonths + " months."
          break;
        case "automaticSpousalUnsuspension":
          this.message = "Your spouse's spousal benefit begins again automatically at his/her full retirement age (" + dateString + ")."
          break;
        case "declineSpousal":
          this.message = "Your spouse does not file for spousal benefits at any point."
          break;
        case "survivor":
          this.message = "Your spouse files for his/her survivor benefit to begin " + dateString + ageString
          break;
        case "retroactiveSurvivor":
          this.message = "Your spouse files for his/her survivor benefit to begin (retroactively) as of " + dateString + ageString
          break;
        case "suspendToday":
          this.message = "Your spouse suspends his/her retirement benefit today."
          break;
        case "suspendAtFRA":
          this.message = "Your spouse suspends his/her retirement benefit at full retirement age (" + dateString + ")."
          break;
        case "suspendAtSomeOtherDate":
          this.message = "Your spouse suspends his/her retirement benefit " + dateString + ageString
          break;
        case "unsuspend":
          this.message = "Your spouse unsuspends his/her retirement benefit " + dateString + ageString
          break;
        case "disabilityConversion":
          this.message = "At your spouse's full retirement age (" + dateString + "), his/her disability benefit will automatically convert to a retirement benefit of the same amount."
          break;
        case "child":
          this.message = "Your child(ren) file(s) for child benefits on your spouse's work record " + dateString + "."
          break;
        case "retroactiveChild":
          this.message = "Your child(ren) file(s) for child benefits on your spouse's work record to begin (retroactively) as of " + dateString + "."
          break;
      }
    }
  }
}

