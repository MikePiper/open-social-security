import { Injectable } from '@angular/core';
import {BirthdayService} from './birthday.service'
import {BenefitService} from './benefit.service'
import { CurrencyPipe } from '@angular/common';
import {SolutionSet} from './solutionset'
import { first } from 'rxjs/operators';

@Injectable()
export class PresentvalueService {

  constructor(private benefitService: BenefitService, private birthdayService: BirthdayService) { }
  
  today: Date = new Date()

  calculateSinglePersonPV(FRA: Date, SSbirthDate: Date, initialAge: number, PIA: number, inputBenefitDate: Date, gender: string, mortalityTable:number[], discountRate: number)
  {
    let retirementBenefit: number = this.benefitService.calculateRetirementBenefit(PIA, FRA, inputBenefitDate)
    let retirementPV: number = 0
    let ageLastBirthday: number
    let denominatorAge: number
    let probabilityAlive: number

    //calculate age in month in which they start benefit
    let age: number = ( 12 * (inputBenefitDate.getFullYear() - SSbirthDate.getFullYear()) + (inputBenefitDate.getMonth()) - SSbirthDate.getMonth()  )/12

    //calculate age when filling out form
    let today: Date = new Date()
    let initialAgeRounded: number = Math.round(initialAge)
    
    //Calculate PV via loop until they hit age 115 (by which point "remaining lives" is zero)
      while (age < 115) {
          //Calculate probability of being alive at end of age in question
          //If user is older than 62 when filling out form, denominator is lives remaining at age when filling out form. Otherwise it's lives remaining at age 62
          if (initialAgeRounded > 62) {
            denominatorAge = initialAgeRounded
          }
          else {
            denominatorAge = 62
          }
          ageLastBirthday = Math.floor(age)
          probabilityAlive = //need probability of being alive at end of "age"
            mortalityTable[ageLastBirthday + 1] / mortalityTable[denominatorAge] * (1 - (age%1)) //eg if user is 72 and 4 months, we want probability of living to end of 72 * 8/12 (because they're 72 for 8 months of year) and probability of living to end of 73 * (4/12)
          + mortalityTable[ageLastBirthday + 2] / mortalityTable[denominatorAge] * (age%1)
          
          //Calculate probability-weighted benefit
          let annualPV = retirementBenefit * 12 * probabilityAlive
          //Discount that benefit to age 62
          annualPV = annualPV / (1 + discountRate/2) //e.g., benefits received during age 62 must be discounted for 0.5 years
          annualPV = annualPV / Math.pow((1 + discountRate),(age - 62)) //e.g., benefits received during age 63 must be discounted for 1.5 years
          //Add discounted benefit to ongoing count of retirementPV, add 1 year to age and calculationYear, and start loop over
          retirementPV = retirementPV + annualPV
          age = age + 1
      }
        return retirementPV
  }

  calculateCouplePV(maritalStatus:string, spouseAgender: string, spouseBgender:string, spouseAmortalityTable:number[], spouseBmortalityTable:number[], spouseASSbirthDate: Date, spouseBSSbirthDate: Date, spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number,
    spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAPIA: number, spouseBPIA: number, spouseAretirementBenefitDate: Date, spouseBretirementBenefitDate: Date, spouseAspousalBenefitDate: Date, spouseBspousalBenefitDate: Date,
    spouseAgovernmentPension: number, spouseBgovernmentPension:number, discountRate:number){
    let spouseAretirementBenefit: number = 0
    let spouseAannualRetirementBenefit: number = 0
    let spouseBretirementBenefit: number = 0
    let spouseBannualRetirementBenefit: number = 0
    let spouseAspousalBenefitWithRetirement: number = 0
    let spouseAspousalBenefitWithoutRetirement: number = 0
    let spouseAannualSpousalBenefit: number = 0
    let spouseBspousalBenefitWithRetirement: number = 0
    let spouseBspousalBenefitWithoutRetirement: number = 0
    let spouseBannualSpousalBenefit: number = 0
    let spouseAsurvivorBenefitWithoutRetirement: number = 0
    let spouseAsurvivorBenefitWithRetirement: number = 0
    let spouseAannualSurvivorBenefit: number = 0
    let spouseBsurvivorBenefitWithoutRetirement: number = 0
    let spouseBsurvivorBenefitWithRetirement: number = 0
    let spouseBannualSurvivorBenefit: number = 0
    let spouseAage: number
    let spouseAageLastBirthday: number
    let probabilityAalive: number
    let spouseBage: number
    let spouseBageLastBirthday: number
    let probabilityBalive: number
    let couplePV = 0
    let firstStartDate: Date
    let secondStartDate: Date
    let spouseAdenominatorAge: number
    let spouseBdenominatorAge: number

    //If married, set firstStartDate to earlier of two retirement benefit dates. Set secondStartDate to the other.
    if (maritalStatus == "married"){
      if (spouseAretirementBenefitDate < spouseBretirementBenefitDate)
        {
        firstStartDate = new Date(spouseAretirementBenefitDate)
        secondStartDate = new Date(spouseBretirementBenefitDate)
        }
      else {//This is fine as a simple "else" statement. If the two input benefit dates are equal, doing it as of either date is fine.
      firstStartDate = new Date(spouseBretirementBenefitDate)
      secondStartDate = new Date(spouseAretirementBenefitDate)
        }
    }

    //If divorced, we want firstStartDate to equal earlier of SpouseA's retirement date or SpouseA's spousal date.
    if (maritalStatus == "divorced") {
      if (spouseAretirementBenefitDate < spouseAspousalBenefitDate) {
        firstStartDate = new Date(spouseAretirementBenefitDate)
      }
      else {
        firstStartDate = new Date(spouseAspousalBenefitDate)
      }
    }
    
    //Find age of each spouse as of firstStartDate
    spouseAage = ( firstStartDate.getMonth() - spouseASSbirthDate.getMonth() + 12 * (firstStartDate.getFullYear() - spouseASSbirthDate.getFullYear()) )/12
    spouseBage = ( firstStartDate.getMonth() - spouseBSSbirthDate.getMonth() + 12 * (firstStartDate.getFullYear() - spouseBSSbirthDate.getFullYear()) )/12

    //Calculate PV via loop until both spouses are at least age 115 (by which point "remaining lives" alive is zero)
    let currentCalculationDate: Date = new Date(firstStartDate)
    while (spouseAage < 115 || spouseBage < 115){

        //Calculate number of months of spouseA retirement benefit
        let monthsBeforeSpouseAretirement: number = spouseAretirementBenefitDate.getMonth() - currentCalculationDate.getMonth() + 12*(spouseAretirementBenefitDate.getFullYear() - currentCalculationDate.getFullYear())
        let monthsOfSpouseAretirement: number
        if (monthsBeforeSpouseAretirement >= 12) {
          monthsOfSpouseAretirement = 0
        } else if (monthsBeforeSpouseAretirement > 0) {
          monthsOfSpouseAretirement = 12 - monthsBeforeSpouseAretirement
        } else {
          monthsOfSpouseAretirement = 12
        }

        //Calculate number of months of spouseA spousalBenefit w/ retirementBenefit and number of months of spouseA spousalBenefit w/o retirementBenefit
        let monthsBeforeSpouseAspousal: number = spouseAspousalBenefitDate.getMonth() - currentCalculationDate.getMonth() + 12*(spouseAspousalBenefitDate.getFullYear() - currentCalculationDate.getFullYear())
        let monthsOfSpouseAspousal: number
        let monthsOfSpouseAspousalWithRetirement: number
        let monthsOfSpouseAspousalWithoutRetirement: number
        if (monthsBeforeSpouseAspousal >= 12) {
          monthsOfSpouseAspousal = 0
        } else if (monthsBeforeSpouseAspousal > 0) {
          monthsOfSpouseAspousal = 12 - monthsBeforeSpouseAspousal
        } else {
          monthsOfSpouseAspousal = 12
        }
        if (monthsOfSpouseAretirement >= monthsOfSpouseAspousal) {
          monthsOfSpouseAspousalWithRetirement = monthsOfSpouseAspousal
          monthsOfSpouseAspousalWithoutRetirement = 0
        } else {
          monthsOfSpouseAspousalWithRetirement = monthsOfSpouseAretirement
          monthsOfSpouseAspousalWithoutRetirement = monthsOfSpouseAspousal - monthsOfSpouseAretirement
        }

        //Calculate number of months of spouseA survivorBenefit w/ retirementBenefit and number of months of spouseA survivorBenefit w/o retirementBenefit
        let monthsBeforeSpouseAsurvivor: number = spouseAsurvivorFRA.getMonth() - currentCalculationDate.getMonth() + 12*(spouseAsurvivorFRA.getFullYear() - currentCalculationDate.getFullYear())
        let monthsOfSpouseAsurvivor: number
        let monthsOfSpouseAsurvivorWithRetirement: number
        let monthsOfSpouseAsurvivorWithoutRetirement: number
        if (monthsBeforeSpouseAsurvivor >= 12) {
          monthsOfSpouseAsurvivor = 0
        } else if (monthsBeforeSpouseAsurvivor > 0) {
          monthsOfSpouseAsurvivor = 12 - monthsBeforeSpouseAsurvivor
        } else {
          monthsOfSpouseAsurvivor = 12
        }
        if (monthsOfSpouseAretirement >= monthsOfSpouseAsurvivor) {
          monthsOfSpouseAsurvivorWithRetirement = monthsOfSpouseAsurvivor
          monthsOfSpouseAsurvivorWithoutRetirement = 0
        } else {
          monthsOfSpouseAsurvivorWithRetirement = monthsOfSpouseAretirement
          monthsOfSpouseAsurvivorWithoutRetirement = monthsOfSpouseAsurvivor - monthsOfSpouseAretirement
        }

        //Calculate number of months of spouseB retirement benefit
        let monthsBeforeSpouseBretirement: number = spouseBretirementBenefitDate.getMonth() - currentCalculationDate.getMonth() + 12*(spouseBretirementBenefitDate.getFullYear() - currentCalculationDate.getFullYear())
        let monthsOfSpouseBretirement: number
        if (monthsBeforeSpouseBretirement >= 12) {
          monthsOfSpouseBretirement = 0
        } else if (monthsBeforeSpouseBretirement > 0) {
          monthsOfSpouseBretirement = 12 - monthsBeforeSpouseBretirement
        } else {
          monthsOfSpouseBretirement = 12
        }

        //Calculate number of months of spouseB spousalBenefit w/ retirementBenefit and number of months of spouseB spousalBenefit w/o retirementBenefit
        let monthsBeforeSpouseBspousal: number = spouseBspousalBenefitDate.getMonth() - currentCalculationDate.getMonth() + 12*(spouseBspousalBenefitDate.getFullYear() - currentCalculationDate.getFullYear())
        let monthsOfSpouseBspousal: number
        let monthsOfSpouseBspousalWithRetirement: number
        let monthsOfSpouseBspousalWithoutRetirement: number
        if (monthsBeforeSpouseBspousal >= 12) {
          monthsOfSpouseBspousal = 0
        } else if (monthsBeforeSpouseBspousal > 0) {
          monthsOfSpouseBspousal = 12 - monthsBeforeSpouseBspousal
        } else {
          monthsOfSpouseBspousal = 12
        }
        if (monthsOfSpouseBretirement >= monthsOfSpouseBspousal) {
          monthsOfSpouseBspousalWithRetirement = monthsOfSpouseBspousal
          monthsOfSpouseBspousalWithoutRetirement = 0
        } else {
          monthsOfSpouseBspousalWithRetirement = monthsOfSpouseBretirement
          monthsOfSpouseBspousalWithoutRetirement = monthsOfSpouseBspousal - monthsOfSpouseBretirement
        }

        //Calculate number of months of spouseB survivorBenefit w/ retirementBenefit and number of months of spouseB survivorBenefit w/o retirementBenefit
        let monthsBeforeSpouseBsurvivor: number = spouseBsurvivorFRA.getMonth() - currentCalculationDate.getMonth() + 12*(spouseBsurvivorFRA.getFullYear() - currentCalculationDate.getFullYear())
        let monthsOfSpouseBsurvivor: number
        let monthsOfSpouseBsurvivorWithRetirement: number
        let monthsOfSpouseBsurvivorWithoutRetirement: number
        if (monthsBeforeSpouseBsurvivor >= 12) {
          monthsOfSpouseBsurvivor = 0
        } else if (monthsBeforeSpouseBsurvivor > 0) {
          monthsOfSpouseBsurvivor = 12 - monthsBeforeSpouseBsurvivor
        } else {
          monthsOfSpouseBsurvivor = 12
        }
        if (monthsOfSpouseBretirement >= monthsOfSpouseBsurvivor) {
          monthsOfSpouseBsurvivorWithRetirement = monthsOfSpouseBsurvivor
          monthsOfSpouseBsurvivorWithoutRetirement = 0
        } else {
          monthsOfSpouseBsurvivorWithRetirement = monthsOfSpouseBretirement
          monthsOfSpouseBsurvivorWithoutRetirement = monthsOfSpouseBsurvivor - monthsOfSpouseBretirement
        }

        //Calculate monthly benefit amounts
        spouseAretirementBenefit = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAretirementBenefitDate)
        spouseBretirementBenefit = this.benefitService.calculateRetirementBenefit(spouseBPIA, spouseBFRA, spouseBretirementBenefitDate)
        spouseAspousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, 0, spouseAspousalBenefitDate, spouseAgovernmentPension)
        spouseAspousalBenefitWithRetirement = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, spouseAretirementBenefit, spouseAspousalBenefitDate, spouseAgovernmentPension)
        spouseBspousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, 0, spouseBspousalBenefitDate, spouseBgovernmentPension)
        spouseBspousalBenefitWithRetirement = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, spouseBretirementBenefit, spouseBspousalBenefitDate, spouseBgovernmentPension)
        spouseAsurvivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(spouseASSbirthDate, spouseAsurvivorFRA, 0, spouseAsurvivorFRA, spouseBFRA, spouseBretirementBenefitDate, spouseBPIA, spouseBretirementBenefitDate, spouseAgovernmentPension)
        spouseAsurvivorBenefitWithRetirement = this.benefitService.calculateSurvivorBenefit(spouseASSbirthDate, spouseAsurvivorFRA, spouseAretirementBenefit, spouseAsurvivorFRA, spouseBFRA, spouseBretirementBenefitDate, spouseBPIA, spouseBretirementBenefitDate, spouseAgovernmentPension)
        spouseBsurvivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(spouseBSSbirthDate, spouseBsurvivorFRA, 0, spouseBsurvivorFRA, spouseAFRA, spouseAretirementBenefitDate, spouseAPIA, spouseAretirementBenefitDate, spouseBgovernmentPension)
        spouseBsurvivorBenefitWithRetirement = this.benefitService.calculateSurvivorBenefit(spouseBSSbirthDate, spouseBsurvivorFRA, spouseBretirementBenefit, spouseBsurvivorFRA, spouseAFRA, spouseAretirementBenefitDate, spouseAPIA, spouseAretirementBenefitDate, spouseBgovernmentPension)


        //Calculate annual benefits
        spouseAannualRetirementBenefit = monthsOfSpouseAretirement * spouseAretirementBenefit
        spouseBannualRetirementBenefit = monthsOfSpouseBretirement * spouseBretirementBenefit
        spouseAannualSpousalBenefit = (monthsOfSpouseAspousalWithoutRetirement * spouseAspousalBenefitWithoutRetirement) + (monthsOfSpouseAspousalWithRetirement * spouseAspousalBenefitWithRetirement)
        spouseBannualSpousalBenefit = (monthsOfSpouseBspousalWithoutRetirement * spouseBspousalBenefitWithoutRetirement) + (monthsOfSpouseBspousalWithRetirement * spouseBspousalBenefitWithRetirement)
        spouseAannualSurvivorBenefit = (monthsOfSpouseAsurvivorWithoutRetirement * spouseAsurvivorBenefitWithoutRetirement) + (monthsOfSpouseAsurvivorWithRetirement * spouseAsurvivorBenefitWithRetirement)
        spouseBannualSurvivorBenefit = (monthsOfSpouseBsurvivorWithoutRetirement * spouseBsurvivorBenefitWithoutRetirement) + (monthsOfSpouseBsurvivorWithRetirement * spouseBsurvivorBenefitWithRetirement)
        if (maritalStatus == "divorced") {
          spouseBannualRetirementBenefit = 0
          spouseBannualSpousalBenefit = 0
          spouseBannualSurvivorBenefit = 0
        }


          //Calculate probability of spouseA being alive at end of age in question
          //If spouseA is older than 62 when filling out form, denominator is lives remaining at age when filling out form. Otherwise it's lives remaining at age 62
          if (spouseAinitialAgeRounded > 62) {
            spouseAdenominatorAge = spouseAinitialAgeRounded
          }
          else { 
            spouseAdenominatorAge = 62
          }
          spouseAageLastBirthday = Math.floor(spouseAage)
          probabilityAalive = //need probability of being alive at end of "age"
            spouseAmortalityTable[spouseAageLastBirthday + 1] / spouseAmortalityTable[spouseAdenominatorAge] * (1 - (spouseAage%1)) //eg if user is 72 and 4 months, we want probability of living to end of 72 * 8/12 (because they're 72 for 8 months of year) and probability of living to end of 73 * (4/12)
          + spouseAmortalityTable[spouseAageLastBirthday + 2] / spouseAmortalityTable[spouseAdenominatorAge] * (spouseAage%1)
          //Do same math to calculate probability of spouseB being alive at given age
          if (spouseBinitialAgeRounded > 62) {
            spouseBdenominatorAge = spouseBinitialAgeRounded
          }
          else { 
            spouseBdenominatorAge = 62
          }
          spouseBageLastBirthday = Math.floor(spouseBage)
          probabilityBalive = //need probability of being alive at end of "age"
            spouseBmortalityTable[spouseBageLastBirthday + 1] / spouseBmortalityTable[spouseBdenominatorAge] * (1 - (spouseBage%1))
          + spouseBmortalityTable[spouseBageLastBirthday + 2] / spouseBmortalityTable[spouseBdenominatorAge] * (spouseBage%1)

      //Find probability-weighted annual benefit
        let annualPV = 
        (probabilityAalive * (1-probabilityBalive) * (spouseAannualRetirementBenefit + spouseAannualSurvivorBenefit)) //Scenario where A is alive, B is deceased
        + (probabilityBalive * (1-probabilityAalive) * (spouseBannualRetirementBenefit + spouseBannualSurvivorBenefit)) //Scenario where B is alive, A is deceased
        + ((probabilityAalive * probabilityBalive) * (spouseAannualRetirementBenefit + spouseAannualSpousalBenefit + spouseBannualRetirementBenefit + spouseBannualSpousalBenefit)) //Scenario where both are alive
      
      //Discount that benefit
            //Find which spouse is older, because we're discounting back to date on which older spouse is age 62.
            let olderAge: number
            if (spouseAage > spouseBage) {
              olderAge = spouseAage
            } else {olderAge = spouseBage}
            //Here is where actual discounting happens. Discounting by half a year, because we assume all benefits received mid-year. Then discounting for any additional years needed to get back to PV at 62.
            annualPV = annualPV / (1 + discountRate/2) / Math.pow((1 + discountRate),(olderAge - 62))
      
      //Add discounted benefit to ongoing count of retirementPV, add 1 to each age, add 1 year to currentCalculationDate, and start loop over
        couplePV = couplePV + annualPV
        spouseAage = spouseAage + 1
        spouseBage = spouseBage + 1
        currentCalculationDate.setFullYear(currentCalculationDate.getFullYear()+1)
    }
    return couplePV
  }


  maximizeSinglePersonPV(PIA: number, SSbirthDate: Date, actualBirthDate:Date, initialAge:number, FRA: Date, gender: string, mortalityTable:number[], discountRate: number){
    //find initial testClaimingDate for age 62
    let testClaimingDate = new Date(SSbirthDate.getFullYear()+62, 1, 1)
    if (actualBirthDate.getDate() <= 2){
      testClaimingDate.setMonth(actualBirthDate.getMonth())
    } else {
      testClaimingDate.setMonth(actualBirthDate.getMonth()+1)
    }

    //If user is currently over age 62 when filling out form, set testClaimingDate to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
    let ageToday = this.today.getFullYear() - SSbirthDate.getFullYear() + (this.today.getMonth() - SSbirthDate.getMonth())/12
    if (ageToday > 62){
      testClaimingDate.setMonth(this.today.getMonth())
      testClaimingDate.setFullYear(this.today.getFullYear())
    }

    //Run calculateSinglePersonPV for their earliest possible claiming date, save the PV and the date.
    let savedPV: number = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, testClaimingDate, gender, mortalityTable, discountRate)
    let savedClaimingDate = new Date(testClaimingDate)

    //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
    let endingTestDate = new Date(SSbirthDate.getFullYear()+70, SSbirthDate.getMonth()-1, 1)
    while (testClaimingDate <= endingTestDate){
      //Add 1 month to claiming age and run both calculations again and compare results. Save better of the two.
      testClaimingDate.setMonth(testClaimingDate.getMonth() + 1)
      let currentTestPV = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, testClaimingDate, gender, mortalityTable, discountRate)
      if (currentTestPV > savedPV)
        {savedClaimingDate.setMonth(testClaimingDate.getMonth())
          savedClaimingDate.setFullYear(testClaimingDate.getFullYear())
          savedPV = currentTestPV}
    }
    //after loop is finished
    console.log("saved PV: " + savedPV)
    console.log("savedClaimingDate: " + savedClaimingDate)

    //Find age at savedClaimingDate, for sake of output statement.
    let savedClaimingAge = savedClaimingDate.getFullYear() - SSbirthDate.getFullYear() + (savedClaimingDate.getMonth() - SSbirthDate.getMonth())/12
    let savedClaimingAgeYears = Math.floor(savedClaimingAge)
    let savedClaimingAgeMonths = Math.round((savedClaimingAge%1)*12)

    let solutionSet:SolutionSet = {
      "solutionPV":savedPV,
      "spouseAretirementSolutionDate":savedClaimingDate,
      "spouseAretirementSolutionAmount":null,
      "spouseAretirementSolutionAgeYears":savedClaimingAgeYears,
      "spouseAretirementSolutionAgeMonths":savedClaimingAgeMonths,
      "spouseBretirementSolutionDate":null,
      "spouseBretirementSolutionAmount":null,
      "spouseBretirementSolutionAgeYears":null,
      "spouseBretirementSolutionAgeMonths":null,
      "spouseAspousalSolutionDate":null,
      "spouseAspousalSolutionAmount":null,
      "spouseAspousalSolutionAgeYears":null,
      "spouseAspousalSolutionAgeMonths":null,
      "spouseBspousalSolutionDate":null,
      "spouseBspousalSolutionAmount":null,
      "spouseBspousalSolutionAgeYears":null,
      "spouseBspousalSolutionAgeMonths":null
    }
    return solutionSet
  }


  maximizeCouplePV(maritalStatus:string, spouseAPIA: number, spouseBPIA: number, spouseAactualBirthDate:Date, spouseBactualBirthDate:Date, spouseASSbirthDate: Date, spouseBSSbirthDate: Date, spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number,
    spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAgender: string, spouseBgender:string, spouseAmortalityTable:number[], spouseBmortalityTable:number[], spouseAgovernmentPension:number, spouseBgovernmentPension:number, discountRate: number){

    let deemedFilingCutoff: Date = new Date(1954, 0, 1)

    //find initial test dates for spouseA (first month for which spouseA is considered 62 for entire month)
    let spouseAretirementDate = new Date(spouseASSbirthDate.getFullYear()+62, 1, 1)
    let spouseAspousalDate = new Date(spouseASSbirthDate.getFullYear()+62, 1, 1)
    if (spouseAactualBirthDate.getDate() <= 2){
      spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth())
      spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth())
    } else {
      spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth()+1)
      spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth()+1)
    }
    //If spouseA is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
    let today = new Date()
    let spouseAageToday: number = today.getFullYear() - spouseASSbirthDate.getFullYear() + (today.getMonth() - spouseASSbirthDate.getMonth()) /12
    if (spouseAageToday > 62){
      spouseAretirementDate.setMonth(today.getMonth())
      spouseAretirementDate.setFullYear(today.getFullYear())
      spouseAspousalDate.setMonth(today.getMonth())
      spouseAspousalDate.setFullYear(today.getFullYear())
    }
    //Do all of the same, but for spouseB.
    let spouseBretirementDate = new Date(spouseBSSbirthDate.getFullYear()+62, 1, 1)
    let spouseBspousalDate = new Date(spouseBSSbirthDate.getFullYear()+62, 1, 1)
    if (spouseBactualBirthDate.getDate() <= 2){
      spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth())
      spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth())
    } else {
      spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth()+1)
      spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth()+1)
    }
    let spouseBageToday: number = today.getFullYear() - spouseBSSbirthDate.getFullYear() + (today.getMonth() - spouseBSSbirthDate.getMonth()) /12
    if (spouseBageToday > 62){
      spouseBretirementDate.setMonth(today.getMonth())
      spouseBretirementDate.setFullYear(today.getFullYear())
      spouseBspousalDate.setMonth(today.getMonth())
      spouseBspousalDate.setFullYear(today.getFullYear())
    }
    //Check to see if spouseA's current spousalDate is prior to spouseB's earliest retirementDate. If so, adjust.
    if (spouseAspousalDate < spouseBretirementDate){
      spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
      spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
    }

    //Initialize savedPV as zero. Set spouseAsavedDate and spouseBsavedDate equal to their current testDates.
      let savedPV: number = 0
      let spouseAsavedRetirementDate = new Date(spouseAretirementDate)
      let spouseBsavedRetirementDate = new Date(spouseBretirementDate)
      let spouseAsavedSpousalDate = new Date(spouseAspousalDate)
      let spouseBsavedSpousalDate = new Date(spouseBspousalDate)

    //Set endingTestDate for each spouse equal to the month they turn 70
    let spouseAendTestDate = new Date(spouseASSbirthDate.getFullYear()+70, spouseASSbirthDate.getMonth(), 1)
    let spouseBendTestDate = new Date(spouseBSSbirthDate.getFullYear()+70, spouseBSSbirthDate.getMonth(), 1)

    while (spouseAretirementDate <= spouseAendTestDate) {
        //Reset spouseB test dates to earliest possible (i.e., their "age 62 for whole month" month or today's month if they're currently older than 62, but never earlier than spouse A's retirementDate)
        if (spouseBageToday > 62){
          spouseBretirementDate.setMonth(today.getMonth())
          spouseBretirementDate.setFullYear(today.getFullYear())
          spouseBspousalDate.setMonth(today.getMonth())
          spouseBspousalDate.setFullYear(today.getFullYear())
        } else {
            spouseBretirementDate.setFullYear(spouseBSSbirthDate.getFullYear()+62)
            spouseBspousalDate.setFullYear(spouseBSSbirthDate.getFullYear()+62)
            if (spouseBactualBirthDate.getDate() <= 2){
              spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth())
              spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth())
            } else {
              spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth()+1)
              spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth()+1)
            }
        }
        if (spouseBspousalDate < spouseAretirementDate) {
          spouseBspousalDate.setMonth(spouseAretirementDate.getMonth())
          spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear())
        }

          //After spouse B's retirement testdate has been reset, reset spouseA's spousal date as necessary
            //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
            if (spouseAactualBirthDate > deemedFilingCutoff) {
              if (spouseAretirementDate > spouseBretirementDate) {
                spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
              } else {
                spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
              }
            }
            else {//i.e., if spouseA has old deemed filing rules
              if (spouseAretirementDate < spouseAFRA) {
                //Set spouseA spousal testdate to later of spouseA retirementDate or spouseB retirementDate
                if (spouseAretirementDate > spouseBretirementDate) {
                  spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                } else {
                  spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                }
              }
              else {//i.e., if spouseAretirementDate currently after spouseAFRA
                //Set spouseA spousalDate to earliest possible restricted application date (later of FRA or spouse B's retirementDate)
                if (spouseAFRA > spouseBretirementDate) {
                  spouseAspousalDate.setMonth(spouseAFRA.getMonth())
                  spouseAspousalDate.setFullYear(spouseAFRA.getFullYear())
                } else {
                  spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                }
              }
            }

        while (spouseBretirementDate <= spouseBendTestDate) {
          //Calculate PV using current testDates
            let currentTestPV: number = this.calculateCouplePV(maritalStatus, spouseAgender, spouseBgender, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, Number(spouseAinitialAgeRounded), Number(spouseBinitialAgeRounded), spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, Number(spouseAPIA), Number(spouseBPIA), spouseAretirementDate, spouseBretirementDate, spouseAspousalDate, spouseBspousalDate, Number(spouseAgovernmentPension), Number(spouseBgovernmentPension), Number(discountRate))
            //If PV is greater than saved PV, save new PV and save new testDates
            if (currentTestPV > savedPV) {
              savedPV = currentTestPV
              spouseAsavedRetirementDate.setMonth(spouseAretirementDate.getMonth())
              spouseAsavedRetirementDate.setFullYear(spouseAretirementDate.getFullYear())
              spouseBsavedRetirementDate.setMonth(spouseBretirementDate.getMonth())
              spouseBsavedRetirementDate.setFullYear(spouseBretirementDate.getFullYear())
              spouseAsavedSpousalDate.setMonth(spouseAspousalDate.getMonth())
              spouseAsavedSpousalDate.setFullYear(spouseAspousalDate.getFullYear())
              spouseBsavedSpousalDate.setMonth(spouseBspousalDate.getMonth())
              spouseBsavedSpousalDate.setFullYear(spouseBspousalDate.getFullYear())
              }
          //Find next possible claiming combination for spouseB
            //if spouseB has new deemed filing rules, increment both dates by 1. (But don't increment spousalDate if it's currently set later than retirementDate.)
              //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
            if (spouseBactualBirthDate > deemedFilingCutoff) {
              if (spouseBspousalDate <= spouseBretirementDate) {
                spouseBspousalDate.setMonth(spouseBspousalDate.getMonth()+1)
              }
              spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
            }
          
            else {//i.e., if spouseB has old deemed filing rules
              //if spouseBretirementDate < FRA, increment both test dates by 1. (Don't increment spousalDate though if it is currently set later than retirementDate.)
              if (spouseBretirementDate < spouseBFRA) {
                if (spouseBspousalDate <= spouseBretirementDate) {
                  spouseBspousalDate.setMonth(spouseBspousalDate.getMonth()+1)
                }
                spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
                //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
              }
              else {//i.e., if spouseBretirementDate >= FRA
                //Increment retirement testdate by 1 and set spousal date to earliest possible restricted application date (later of FRA or other spouse's retirementtestdate)
                spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
                if (spouseAretirementDate > spouseBFRA) {
                  spouseBspousalDate.setMonth(spouseAretirementDate.getMonth())
                  spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                } else {
                  spouseBspousalDate.setMonth(spouseBFRA.getMonth())
                  spouseBspousalDate.setFullYear(spouseBFRA.getFullYear())
                }
              }

            }
          //After spouse B's retirement testdate has been incremented, adjust spouseA's spousal date as necessary
            //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
              if (spouseAactualBirthDate > deemedFilingCutoff) {
                if (spouseAretirementDate > spouseBretirementDate) {
                  spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                } else {
                  spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                }
              }
              else {//i.e., if spouseA has old deemed filing rules
                if (spouseAretirementDate < spouseAFRA) {
                  //Set spouseA spousal testdate to later of spouseA retirementDate or spouseB retirementDate
                  if (spouseAretirementDate > spouseBretirementDate) {
                    spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                    spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                  } else {
                    spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                    spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                  }
                }
                else {//i.e., if spouseAretirementDate currently after spouseAFRA
                  //Set spouseA spousalDate to earliest possible restricted application date (later of FRA or spouse B's retirementDate)
                  if (spouseAFRA > spouseBretirementDate) {
                    spouseAspousalDate.setMonth(spouseAFRA.getMonth())
                    spouseAspousalDate.setFullYear(spouseAFRA.getFullYear())
                  } else {
                    spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                    spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                  }
                }
              }
        }
        //Add 1 month to spouseAretirementDate (with a "settimeout" to pause the function every 10 years, so javascript doesn't hang up)
        if (spouseAretirementDate.getFullYear()%5 == 0) {
          setTimeout(spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1), 5)
        } else {
          spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1)
        }
        

      }
    //after loop is finished
      console.log("saved PV: " + savedPV)
      console.log("spouseAretirementDate: " + spouseAsavedRetirementDate)
      console.log("spouseBretirementDate: " + spouseBsavedRetirementDate)
      console.log("spouseAspousalDate: " + spouseAsavedSpousalDate)
      console.log("spouseBspousalDate: " + spouseBsavedSpousalDate)


    //Find ages at saved claiming dates, for sake of output statement.
    let spouseAsavedRetirementAge = spouseAsavedRetirementDate.getFullYear() - spouseASSbirthDate.getFullYear() + (spouseAsavedRetirementDate.getMonth() - spouseASSbirthDate.getMonth())/12
    let spouseAsavedRetirementAgeYears = Math.floor(spouseAsavedRetirementAge)
    let spouseAsavedRetirementAgeMonths = Math.round((spouseAsavedRetirementAge%1)*12)
    let spouseBsavedRetirementAge = spouseBsavedRetirementDate.getFullYear() - spouseBSSbirthDate.getFullYear() + (spouseBsavedRetirementDate.getMonth() - spouseBSSbirthDate.getMonth())/12
    let spouseBsavedRetirementAgeYears = Math.floor(spouseBsavedRetirementAge)
    let spouseBsavedRetirementAgeMonths = Math.round((spouseBsavedRetirementAge%1)*12)
    let spouseAsavedSpousalAge = spouseAsavedSpousalDate.getFullYear() - spouseASSbirthDate.getFullYear() + (spouseAsavedSpousalDate.getMonth() - spouseASSbirthDate.getMonth())/12
    let spouseAsavedSpousalAgeYears = Math.floor(spouseAsavedSpousalAge)
    let spouseAsavedSpousalAgeMonths = Math.round((spouseAsavedSpousalAge%1)*12)
    let spouseBsavedSpousalAge = spouseBsavedSpousalDate.getFullYear() - spouseBSSbirthDate.getFullYear() + (spouseBsavedSpousalDate.getMonth() - spouseBSSbirthDate.getMonth())/12
    let spouseBsavedSpousalAgeYears = Math.floor(spouseBsavedSpousalAge)
    let spouseBsavedSpousalAgeMonths = Math.round((spouseBsavedSpousalAge%1)*12)


      let solutionSet: SolutionSet = {
        "solutionPV":savedPV,
        "spouseAretirementSolutionDate":spouseAsavedRetirementDate,
        "spouseAretirementSolutionAmount":null,
        "spouseAretirementSolutionAgeYears":spouseAsavedRetirementAgeYears,
        "spouseAretirementSolutionAgeMonths":spouseAsavedRetirementAgeMonths,
        "spouseBretirementSolutionDate":spouseBsavedRetirementDate,
        "spouseBretirementSolutionAmount":null,
        "spouseBretirementSolutionAgeYears":spouseBsavedRetirementAgeYears,
        "spouseBretirementSolutionAgeMonths":spouseBsavedRetirementAgeMonths,
        "spouseAspousalSolutionDate":spouseAsavedSpousalDate,
        "spouseAspousalSolutionAmount":null,
        "spouseAspousalSolutionAgeYears":spouseAsavedSpousalAgeYears,
        "spouseAspousalSolutionAgeMonths":spouseAsavedSpousalAgeMonths,
        "spouseBspousalSolutionDate":spouseBsavedSpousalDate,
        "spouseBspousalSolutionAmount":null,
        "spouseBspousalSolutionAgeYears":spouseBsavedSpousalAgeYears,
        "spouseBspousalSolutionAgeMonths":spouseBsavedSpousalAgeMonths
      }
      //Set spousal dates back to null in cases in which there will be no spousal benefit, so user doesn't see a suggested spousal claiming age that makes no sense.
        //need to recalculate spousal benefit for each spouse using the four saved dates.
      let finalCheckSpouseAretirement = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAsavedRetirementDate)
      let finalCheckSpouseAspousal = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, finalCheckSpouseAretirement, spouseAsavedSpousalDate, spouseAgovernmentPension)
      let finalCheckSpouseBretirement = this.benefitService.calculateRetirementBenefit(spouseBPIA, spouseBFRA, spouseBsavedRetirementDate)
      let finalCheckSpouseBspousal = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, finalCheckSpouseBretirement, spouseBsavedSpousalDate, spouseBgovernmentPension)
      if (finalCheckSpouseAspousal == 0 && spouseAsavedSpousalDate >= spouseAsavedRetirementDate) //We compare the dates because we don't want to eliminate the spousal date from output if it's prior to retirement date (as in restricted app)
        {solutionSet.spouseAspousalSolutionDate = null}
      if (finalCheckSpouseBspousal == 0 && spouseBsavedSpousalDate >= spouseBsavedRetirementDate) //Ditto about date comparisons
        {solutionSet.spouseBspousalSolutionDate = null}
      //Set retirement date to null if person has 0 PIA.
      if (spouseAPIA == 0) {solutionSet.spouseAretirementSolutionDate = null}
      if (spouseBPIA == 0) {solutionSet.spouseBretirementSolutionDate = null}

      return solutionSet
  }


  maximizeDivorceePV(maritalStatus:string, exSpouseRetirementBenefitDate:Date, spouseAPIA: number, spouseBPIA: number, spouseAactualBirthDate:Date, spouseBactualBirthDate:Date, spouseASSbirthDate: Date, spouseBSSbirthDate: Date,
    spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number, spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAgender: string, spouseBgender:string, spouseAmortalityTable:number[], spouseBmortalityTable:number[], spouseAgovernmentPension:number, spouseBgovernmentPension:number, discountRate: number){

      let deemedFilingCutoff: Date = new Date(1954, 0, 1)

      //find initial test dates for spouseA (first month for which spouseA is considered 62 for entire month)
      let spouseAretirementDate = new Date(spouseASSbirthDate.getFullYear()+62, 1, 1)
      let spouseAspousalDate = new Date(spouseASSbirthDate.getFullYear()+62, 1, 1)
      if (spouseAactualBirthDate.getDate() <= 2){
        spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth())
        spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth())
      } else {
        spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth()+1)
        spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth()+1)
      }
      //If spouseA is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
      let today = new Date()
      let spouseAageToday: number = today.getFullYear() - spouseASSbirthDate.getFullYear() + (today.getMonth() - spouseASSbirthDate.getMonth()) /12
      if (spouseAageToday > 62){
        spouseAretirementDate.setMonth(today.getMonth())
        spouseAretirementDate.setFullYear(today.getFullYear())
        spouseAspousalDate.setMonth(today.getMonth())
        spouseAspousalDate.setFullYear(today.getFullYear())
      }

      //Initialize savedPV as zero. Set saved dates equal to their current testDates.
      let savedPV: number = 0
      let spouseAsavedRetirementDate = new Date(spouseAretirementDate)
      let spouseAsavedSpousalDate = new Date(spouseAspousalDate)

      //Set endingTestDate equal to the month user turns 70
      let spouseAendTestDate = new Date(spouseASSbirthDate.getFullYear()+70, spouseASSbirthDate.getMonth(), 1)

      //Set spouseB's spousalDate equal to spouseB's retirement date. (This date won't matter at all, since annual PV is ultimately set to zero for spouse b's spousal benefit, but PV calc will require it.)
      let spouseBspousalDate: Date = new Date(exSpouseRetirementBenefitDate)


      while (spouseAretirementDate <= spouseAendTestDate) {
        //Calculate PV using current test dates for spouseA and fixed dates for spouseB
        let currentTestPV: number = this.calculateCouplePV(maritalStatus, spouseAgender, spouseBgender, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, Number(spouseAinitialAgeRounded), Number(spouseBinitialAgeRounded), spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, Number(spouseAPIA), Number(spouseBPIA), spouseAretirementDate, exSpouseRetirementBenefitDate, spouseAspousalDate, spouseBspousalDate, Number(spouseAgovernmentPension), Number(spouseBgovernmentPension), Number(discountRate))

        //If PV is greater than saved PV, save new PV and save new testDates
        if (currentTestPV > savedPV) {
          savedPV = currentTestPV
          spouseAsavedRetirementDate.setMonth(spouseAretirementDate.getMonth())
          spouseAsavedRetirementDate.setFullYear(spouseAretirementDate.getFullYear())
          spouseAsavedSpousalDate.setMonth(spouseAspousalDate.getMonth())
          spouseAsavedSpousalDate.setFullYear(spouseAspousalDate.getFullYear())
          }

        //Increment spouseA's dates (keep spouseB's fixed)
          //if new deemed filing rules, increment both by 1 month
          if (spouseAactualBirthDate > deemedFilingCutoff) {
            spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1)
            spouseAspousalDate.setMonth(spouseAspousalDate.getMonth()+1)
          } else { //i.e., if old deemed filling rules apply
            //If current retirement test date younger than FRA, increment both by 1 month
            if (spouseAretirementDate < spouseAFRA) {
              spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1)
              spouseAspousalDate.setMonth(spouseAspousalDate.getMonth()+1)
            }
            else {//If current retirement test date beyond FRA, increment retirement by 1 month and keep spousal where it is (at FRA, unless they're older than FRA when filling form)
              spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1)
            }
          }

      }
        //after loop is finished
        console.log("saved PV: " + savedPV)
        console.log("saved spouseAretirementDate: " + spouseAsavedRetirementDate)
        console.log("saved spouseAspousalDate: " + spouseAsavedSpousalDate)
    
        //Find age at saved claiming dates, for sake of output statement.
        let spouseAsavedRetirementAge = spouseAsavedRetirementDate.getFullYear() - spouseASSbirthDate.getFullYear() + (spouseAsavedRetirementDate.getMonth() - spouseASSbirthDate.getMonth())/12
        let spouseAsavedRetirementAgeYears = Math.floor(spouseAsavedRetirementAge)
        let spouseAsavedRetirementAgeMonths = Math.round((spouseAsavedRetirementAge%1)*12)
        let spouseAsavedSpousalAge = spouseAsavedSpousalDate.getFullYear() - spouseASSbirthDate.getFullYear() + (spouseAsavedSpousalDate.getMonth() - spouseASSbirthDate.getMonth())/12
        let spouseAsavedSpousalAgeYears = Math.floor(spouseAsavedSpousalAge)
        let spouseAsavedSpousalAgeMonths = Math.round((spouseAsavedSpousalAge%1)*12)

        let solutionSet: SolutionSet = {
          "solutionPV":savedPV,
          "spouseAretirementSolutionDate":spouseAsavedRetirementDate,
          "spouseAretirementSolutionAmount":null,
          "spouseAretirementSolutionAgeYears":spouseAsavedRetirementAgeYears,
          "spouseAretirementSolutionAgeMonths":spouseAsavedRetirementAgeMonths,
          "spouseBretirementSolutionDate":null,
          "spouseBretirementSolutionAmount":null,
          "spouseBretirementSolutionAgeYears":null,
          "spouseBretirementSolutionAgeMonths":null,
          "spouseAspousalSolutionDate":spouseAsavedSpousalDate,
          "spouseAspousalSolutionAmount":null,
          "spouseAspousalSolutionAgeYears":spouseAsavedSpousalAgeYears,
          "spouseAspousalSolutionAgeMonths":spouseAsavedSpousalAgeMonths,
          "spouseBspousalSolutionDate":null,
          "spouseBspousalSolutionAmount":null,
          "spouseBspousalSolutionAgeYears":null,
          "spouseBspousalSolutionAgeMonths":null
        }

      //Set spousal date back to null in cases in which there will be no spousal benefit, so user doesn't see a suggested spousal claiming age that makes no sense.
        //need to recalculate spousal benefit using the saved dates.
        let finalCheckSpouseAretirement = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAsavedRetirementDate)
        let finalCheckSpouseAspousal = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, finalCheckSpouseAretirement, spouseAsavedSpousalDate, spouseAgovernmentPension)
        if (finalCheckSpouseAspousal == 0 && spouseAsavedSpousalDate >= spouseAsavedRetirementDate) //We compare the dates because we don't want to eliminate the spousal date from output if it's prior to retirement date (as in restricted app)
          {solutionSet.spouseAspousalSolutionDate = null}
        //Set retirement date to null if person has 0 PIA.
        if (spouseAPIA == 0) {solutionSet.spouseAretirementSolutionDate = null}
  
        return solutionSet


    }

//Lives remaining out of 100k, from SSA 2014 period life table
maleSSAtable = [
  100000,
  99368,
  99328,
  99300,
  99279,
  99261,
  99245,
  99231,
  99218,
  99206,
  99197,
  99187,
  99177,
  99164,
  99144,
  99114,
  99074,
  99024,
  98963,
  98889,
  98802,
  98701,
  98588,
  98464,
  98335,
  98204,
  98072,
  97937,
  97801,
  97662,
  97520,
  97373,
  97224,
  97071,
  96914,
  96753,
  96587,
  96415,
  96236,
  96050,
  95856,
  95653,
  95437,
  95207,
  94958,
  94688,
  94394,
  94073,
  93721,
  93336,
  92913,
  92449,
  91943,
  91392,
  90792,
  90142,
  89439,
  88681,
  87867,
  87001,
  86081,
  85104,
  84065,
  82967,
  81812,
  80600,
  79324,
  77977,
  76550,
  75036,
  73427,
  71710,
  69878,
  67930,
  65866,
  63686,
  61377,
  58930,
  56344,
  53625,
  50776,
  47795,
  44685,
  41461,
  38148,
  34771,
  31358,
  27943,
  24565,
  21270,
  18107,
  15128,
  12381,
  9906,
  7733,
  5878,
  4348,
  3130,
  2194,
  1500,
  1001,
  652,
  413,
  254,
  151,
  87,
  48,
  26,
  13,
  6,
  3,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleSSAtable = [
  100000,
  99469,
  99434,
  99412,
  99396,
  99383,
  99372,
  99361,
  99351,
  99342,
  99334,
  99325,
  99317,
  99307,
  99294,
  99279,
  99260,
  99237,
  99210,
  99180,
  99146,
  99109,
  99069,
  99025,
  98978,
  98929,
  98877,
  98822,
  98765,
  98705,
  98641,
  98575,
  98505,
  98431,
  98351,
  98266,
  98175,
  98076,
  97970,
  97856,
  97735,
  97604,
  97463,
  97311,
  97146,
  96966,
  96771,
  96559,
  96327,
  96072,
  95794,
  95488,
  95155,
  94794,
  94405,
  93987,
  93539,
  93057,
  92542,
  91997,
  91420,
  90809,
  90157,
  89461,
  88715,
  87914,
  87049,
  86114,
  85102,
  84006,
  82818,
  81525,
  80117,
  78591,
  76947,
  75182,
  73280,
  71225,
  69008,
  66621,
  64059,
  61304,
  58350,
  55213,
  51913,
  48467,
  44889,
  41191,
  37394,
  33531,
  29650,
  25811,
  22083,
  18536,
  15240,
  12250,
  9620,
  7378,
  5525,
  4043,
  2893,
  2021,
  1375,
  909,
  583,
  361,
  215,
  123,
  67,
  35,
  17,
  8,
  3,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleNS1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99878, 
  99752, 
  99621, 
  99486, 
  99346, 
  99200, 
  99046, 
  98882, 
  98707, 
  98518, 
  98313, 
  98093, 
  97858, 
  97612, 
  97352, 
  97078, 
  96785, 
  96469, 
  96121, 
  95735, 
  95307, 
  94833, 
  94307, 
  93726, 
  93085, 
  92376, 
  91588, 
  90708, 
  89717, 
  88598, 
  87332, 
  85902, 
  84296, 
  82501, 
  80505, 
  78291, 
  75838, 
  73126, 
  70141, 
  66872, 
  63302, 
  59421, 
  55230, 
  50742, 
  45995, 
  41062, 
  36045, 
  31069, 
  26266, 
  21767, 
  17683, 
  14094, 
  11015, 
  8421, 
  6283, 
  4563, 
  3220, 
  2204, 
  1461, 
  937, 
  581, 
  349, 
  202, 
  114, 
  62, 
  33, 
  17, 
  9, 
  4, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleNS2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99857, 
  99708, 
  99555, 
  99396, 
  99232, 
  99061, 
  98881, 
  98691, 
  98485, 
  98261, 
  98016, 
  97751, 
  97467, 
  97164, 
  96843, 
  96502, 
  96138, 
  95741, 
  95305, 
  94822, 
  94286, 
  93694, 
  93042, 
  92325, 
  91541, 
  90680, 
  89733, 
  88686, 
  87521, 
  86219, 
  84765, 
  83144, 
  81347, 
  79364, 
  77188, 
  74807, 
  72204, 
  69362, 
  66267, 
  62914, 
  59291, 
  55397, 
  51238, 
  46835, 
  42230, 
  37497, 
  32740, 
  28076, 
  23631, 
  19516, 
  15818, 
  12597, 
  9845, 
  7526, 
  5615, 
  4079, 
  2878, 
  1970, 
  1306, 
  838, 
  520, 
  312, 
  181, 
  101, 
  55, 
  29, 
  15, 
  8, 
  4, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleSM1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99747, 
  99482, 
  99203, 
  98907, 
  98594, 
  98261, 
  97905, 
  97524, 
  97115, 
  96673, 
  96195, 
  95679, 
  95117, 
  94505, 
  93837, 
  93105, 
  92301, 
  91415, 
  90436, 
  89355, 
  88165, 
  86856, 
  85423, 
  83863, 
  82174, 
  80353, 
  78393, 
  76282, 
  74007, 
  71562, 
  68949, 
  66181, 
  63281, 
  60277, 
  57194, 
  54053, 
  50867, 
  47647, 
  44413, 
  41137, 
  37791, 
  34392, 
  30963, 
  27535, 
  24151, 
  20868, 
  17747, 
  14846, 
  12216, 
  9890, 
  7881, 
  6191, 
  4788, 
  3634, 
  2699, 
  1956, 
  1379, 
  944, 
  626, 
  401, 
  249, 
  149, 
  87, 
  49, 
  26, 
  14, 
  7, 
  4, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleSM2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99712, 
  99410, 
  99093, 
  98756, 
  98398, 
  98018, 
  97611, 
  97175, 
  96706, 
  96200, 
  95654, 
  95063, 
  94421, 
  93722, 
  92961, 
  92129, 
  91218, 
  90217, 
  89117, 
  87907, 
  86580, 
  85130, 
  83550, 
  81840, 
  80001, 
  78031, 
  75925, 
  73672, 
  71263, 
  68691, 
  65964, 
  63098, 
  60119, 
  57058, 
  53943, 
  50797, 
  47633, 
  44461, 
  41296, 
  38115, 
  34887, 
  31632, 
  28372, 
  25136, 
  21964, 
  18908, 
  16022, 
  13360, 
  10963, 
  8856, 
  7048, 
  5534, 
  4280, 
  3248, 
  2412, 
  1748, 
  1233, 
  844, 
  559, 
  359, 
  223, 
  133, 
  77, 
  43, 
  24, 
  13, 
  7, 
  3, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleNS1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99927, 
  99853, 
  99778, 
  99700, 
  99619, 
  99532, 
  99439, 
  99339, 
  99229, 
  99107, 
  98970, 
  98817, 
  98649, 
  98467, 
  98270, 
  98058, 
  97828, 
  97579, 
  97307, 
  97008, 
  96679, 
  96317, 
  95921, 
  95485, 
  95008, 
  94484, 
  93908, 
  93269, 
  92558, 
  91760, 
  90862, 
  89851, 
  88711, 
  87425, 
  85971, 
  84323, 
  82449, 
  80318, 
  77928, 
  75290, 
  72386, 
  69115, 
  65465, 
  61509, 
  57250, 
  52710, 
  47938, 
  43012, 
  38020, 
  33056, 
  28230, 
  23646, 
  19372, 
  15473, 
  12011, 
  9032, 
  6559, 
  4597, 
  3111, 
  2032, 
  1279, 
  777, 
  455, 
  257, 
  141, 
  75, 
  39, 
  20, 
  10, 
  5, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleNS2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99915, 
  99829, 
  99741, 
  99650, 
  99555, 
  99453, 
  99344, 
  99226, 
  99096, 
  98950, 
  98787, 
  98604, 
  98403, 
  98183, 
  97946, 
  97690, 
  97415, 
  97116, 
  96789, 
  96432, 
  96041, 
  95612, 
  95143, 
  94631, 
  94073, 
  93463, 
  92796, 
  92061, 
  91247, 
  90341, 
  89330, 
  88199, 
  86933, 
  85517, 
  83930, 
  82148, 
  80139, 
  77873, 
  75355, 
  72599, 
  69591, 
  66241, 
  62539, 
  58564, 
  54324, 
  49843, 
  45177, 
  40401, 
  35605, 
  30876, 
  26318, 
  22028, 
  18046, 
  14414, 
  11189, 
  8414, 
  6110, 
  4282, 
  2898, 
  1893, 
  1192, 
  723, 
  424, 
  240, 
  131, 
  70, 
  36, 
  18, 
  9, 
  5, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleSM1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99841, 
  99673, 
  99493, 
  99297, 
  99083, 
  98851, 
  98595, 
  98316, 
  98012, 
  97677, 
  97312, 
  96912, 
  96473, 
  95990, 
  95457, 
  94869, 
  94220, 
  93504, 
  92714, 
  91844, 
  90887, 
  89838, 
  88689, 
  87435, 
  86075, 
  84606, 
  83022, 
  81316, 
  79489, 
  77543, 
  75476, 
  73281, 
  70953, 
  68487, 
  65878, 
  63126, 
  60207, 
  57086, 
  53755, 
  50222, 
  46526, 
  42743, 
  38871, 
  34929, 
  31014, 
  27181, 
  23490, 
  20006, 
  16783, 
  13858, 
  11262, 
  9010, 
  7082, 
  5454, 
  4111, 
  3030, 
  2182, 
  1529, 
  1035, 
  676, 
  426, 
  258, 
  151, 
  86, 
  47, 
  25, 
  13, 
  7, 
  3, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleSM2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99800, 
  99588, 
  99360, 
  99111, 
  98838, 
  98541, 
  98215, 
  97857, 
  97465, 
  97035, 
  96564, 
  96049, 
  95484, 
  94864, 
  94184, 
  93437, 
  92619, 
  91722, 
  90743, 
  89674, 
  88511, 
  87248, 
  85884, 
  84414, 
  82839, 
  81159, 
  79373, 
  77474, 
  75466, 
  73356, 
  71142, 
  68820, 
  66388, 
  63841, 
  61179, 
  58404, 
  55490, 
  52407, 
  49148, 
  45724, 
  42173, 
  38579, 
  34936, 
  31260, 
  27640, 
  24125, 
  20768, 
  17625, 
  14738, 
  12137, 
  9846, 
  7871, 
  6187, 
  4765, 
  3591, 
  2647, 
  1907, 
  1336, 
  904, 
  591, 
  372, 
  226, 
  132, 
  75, 
  41, 
  22, 
  11, 
  6, 
  3, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

}
