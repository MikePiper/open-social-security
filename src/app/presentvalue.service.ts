import { Injectable } from '@angular/core';
import {BenefitService} from './benefit.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSet} from './solutionset'

@Injectable()
export class PresentvalueService {

  constructor(private benefitService: BenefitService, private earningsTestService: EarningsTestService) { }
  
  //Has maximize calc been run?
  maximizedOrNot: boolean = false

  today: Date = new Date()

  calculateSinglePersonPV(FRA: Date, SSbirthDate: Date, initialAge: number, PIA: number, inputBenefitDate: Date, quitWorkDate:Date, monthlyEarnings:number, mortalityTable:number[], discountRate: number)
  {
    let retirementBenefit: number = this.benefitService.calculateRetirementBenefit(PIA, FRA, inputBenefitDate)
    let retirementBenefitAfterARF: number = 0
    let adjustedBenefitDate: Date
    let annualRetirementBenefit: number
    let retirementPV: number = 0
    let ageLastBirthday: number
    let denominatorAge: number
    let probabilityAlive: number
    let withholdingAmount: number
    let monthsWithheld: number = 0
    let graceYear: boolean = false
    let hasHadGraceYear: boolean = false

    //Find Jan 1 of the year they plan to start benefit
    let currentCalculationDate = new Date(inputBenefitDate.getFullYear(), 0, 1)

    //calculate age as of that date
    let age: number = ( 12 * (currentCalculationDate.getFullYear() - SSbirthDate.getFullYear()) + (currentCalculationDate.getMonth()) - SSbirthDate.getMonth()  )/12

    //Calculate PV via loop until they hit age 115 (by which point "remaining lives" is zero)
      while (age < 115) {

      //Count number of months in year that are before/after inputBenefitDate
      let monthsOfRetirement = this.benefitService.countBenefitMonths(inputBenefitDate, currentCalculationDate)


          //Earnings test
          if (isNaN(quitWorkDate.getTime())) {
            quitWorkDate = new Date(1,0,1)
          }
          if (quitWorkDate > this.today){//If quitWorkDate is an invalid date (because there was no input) or is in the past for some reason, this whole business below gets skipped  
              //Determine if it's a grace year. If quitWorkDate has already happened (or happens this year) and retirement benefit has started (or starts this year) it's a grace year
                //Assumption: in the year they quit work, following months are non-service months.
              if (hasHadGraceYear === true) { //if graceyear was true before, set it to false, so it's only true once. And only check if this year is grace year if last year *wasn't* a grace year -- because you only get one.
                graceYear = false
              } else if (quitWorkDate.getFullYear() <= currentCalculationDate.getFullYear() && inputBenefitDate.getFullYear() <= currentCalculationDate.getFullYear() )
                {
                graceYear = true
                hasHadGraceYear = true
                }
               
              //Calculate necessary withholding based on earnings
              withholdingAmount = this.earningsTestService.calculateWithholding(currentCalculationDate, quitWorkDate, FRA, monthlyEarnings)

              //Have to loop monthly for earnings test
              let earningsTestMonth:Date = new Date(currentCalculationDate) //set earningsTestMonth to beginning of year
              let earningsTestEndDate:Date = new Date(currentCalculationDate.getFullYear(), 11, 1) //set earningsTestEndDate to Dec of currentCalculationYear
              let availableForWithholding:number
              while (withholdingAmount > 0 && earningsTestMonth <= earningsTestEndDate) {
                availableForWithholding = 0 //reset availableForWithholding for new month
                //Checks to see if there is a retirement benefit this month from which we can withhold:
                  if (earningsTestMonth >= inputBenefitDate  //check that they've started retirement benefit
                    && (!graceYear || earningsTestMonth < quitWorkDate ) //make sure it isn't a nonservice month in grace year
                    && (earningsTestMonth < FRA) //make sure current month is prior to FRA
                  ) {
                    availableForWithholding = availableForWithholding + retirementBenefit
                    monthsOfRetirement = monthsOfRetirement - 1
                    monthsWithheld  = monthsWithheld + 1
                  }
                //Subtracting 1 from monthsOfRetirement will often result in overwithholding (as it does in real life) for a partial month. Gets added back later.
                //Reduce necessary withholding by the amount we withhold this month:
                withholdingAmount = withholdingAmount - availableForWithholding //(this kicks us out of loop, potentially)
                earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
              }
            //Find new retirementBenefit, after recalculation ("AdjustmentReductionFactor") at FRA
            adjustedBenefitDate = new Date(inputBenefitDate.getFullYear(), inputBenefitDate.getMonth()+monthsWithheld, 1)
            retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(PIA, FRA, adjustedBenefitDate)

            }
          //Ignore earnings test if user wasn't working
          else {
            withholdingAmount = 0
            retirementBenefitAfterARF = retirementBenefit}

          //withholdingAmount is negative at this point if we overwithheld. Have to add that negative amounts back to annual benefit amounts
            //We add it back to annual retirement benefit in a moment.
            let overWithholding: number = 0
            if (withholdingAmount < 0) {
              overWithholding = overWithholding - withholdingAmount
            }

          //Calculate annual benefit (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
          if (currentCalculationDate.getFullYear() < FRA.getFullYear()) {
            annualRetirementBenefit = monthsOfRetirement * retirementBenefit + overWithholding
          } else if (currentCalculationDate.getFullYear() == FRA.getFullYear()){
              //total monthsOfRetirement is monthsOfRetirement. Some will be retirementBenefitAfterARF. Rest will be retirementBenefit.  Then subtract withholdingAmount
              //ARF should be applied for (12 - FRA.getMonth) months (e.g., all 12 if FRA is January). But limited to monthsOfRetirement.
              let ARFmonths = 12 - FRA.getMonth()
              if (ARFmonths > monthsOfRetirement) {
                ARFmonths = monthsOfRetirement
              }
              annualRetirementBenefit = ARFmonths * retirementBenefitAfterARF + (monthsOfRetirement - ARFmonths) * retirementBenefit + overWithholding
            } else {//i.e., if whole year is past FRA
            annualRetirementBenefit = monthsOfRetirement * retirementBenefitAfterARF
            }

          //Calculate probability of being alive at end of age in question
          //If user is older than 62 when filling out form, denominator is lives remaining at age when filling out form. Otherwise it's lives remaining at age 62
          let initialAgeRounded: number = Math.round(initialAge) //"initialAge" is age when filling out the form.
          if (initialAgeRounded > 62) {
            denominatorAge = initialAgeRounded
          }
          else {
            denominatorAge = 62
          }
          ageLastBirthday = Math.floor(age)
          probabilityAlive = //need probability of being alive at end of "currentCalculationDate" year
            mortalityTable[ageLastBirthday + 1] / mortalityTable[denominatorAge] * (1 - (age%1)) //eg if user is 72 and 4 months at beginning of year, we want probability of living to end of 72 * 8/12 (because they're 72 for 8 months of year) and probability of living to end of 73 * (4/12)
          + mortalityTable[ageLastBirthday + 2] / mortalityTable[denominatorAge] * (age%1)
          
          //Calculate probability-weighted benefit
          let annualPV = annualRetirementBenefit * probabilityAlive

          //Discount that benefit to age 62
          annualPV = annualPV / (1 + discountRate/2) //e.g., benefits received during age 62 must be discounted for 0.5 years
          annualPV = annualPV / Math.pow((1 + discountRate),(age - 62)) //e.g., benefits received during age 63 must be discounted for 1.5 years

          /*
          //Logging for debugging, if maximize function has already been run. (This way we avoid logging a zillion things when maximizing for the first time)
          if (this.maximizedOrNot === true) {
            console.log("-----")
            console.log("currentCalculationDate: " + currentCalculationDate.getMonth() + 1 + "/" + currentCalculationDate.getFullYear())
            console.log("age: " + age)
            console.log("adjustedBenefitDate: " + adjustedBenefitDate)
            console.log("retirementBenefit: " + retirementBenefit)
            console.log("retirementBenefitAfterARF: " + retirementBenefitAfterARF)
            console.log("withholdingAmount: " + withholdingAmount)
            console.log("monthsWithheld: " + monthsWithheld)
            console.log("graceYear: " + graceYear)
            console.log("monthsOfRetirement: " + monthsOfRetirement)
            console.log("annualRetirementBenefit: " + annualRetirementBenefit)
            console.log("AnnualPV: " + annualPV)
          }
          */
         
          //Add discounted benefit to ongoing count of retirementPV, add 1 year to age and calculationYear, and start loop over
          retirementPV = retirementPV + annualPV
          age = age + 1
          currentCalculationDate.setFullYear(currentCalculationDate.getFullYear()+1)
      }
        return retirementPV
  }

  calculateCouplePV(maritalStatus:string, spouseAmortalityTable:number[], spouseBmortalityTable:number[], spouseASSbirthDate: Date, spouseBSSbirthDate: Date, spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number,
    spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAPIA: number, spouseBPIA: number, spouseAretirementBenefitDate: Date, spouseBretirementBenefitDate: Date, spouseAspousalBenefitDate: Date, spouseBspousalBenefitDate: Date,
    spouseAquitWorkDate: Date, spouseBquitWorkDate: Date, spouseAmonthlyEarnings: number, spouseBmonthlyEarnings: number,
    spouseAgovernmentPension: number, spouseBgovernmentPension:number, discountRate:number){
    
    //Monthly benefit variables pre-ARF
    let spouseAretirementBenefit: number = 0
    let spouseAspousalBenefitWithoutRetirement: number = 0
    let spouseAspousalBenefitWithRetirement: number = 0
    let spouseAsurvivorBenefitWithoutRetirement: number = 0
    let spouseAsurvivorBenefitWithRetirement: number = 0
    let spouseBretirementBenefit: number = 0
    let spouseBspousalBenefitWithoutRetirement: number = 0
    let spouseBspousalBenefitWithRetirement: number = 0
    let spouseBsurvivorBenefitWithoutRetirement: number = 0
    let spouseBsurvivorBenefitWithRetirement: number = 0
    //Annual benefit variables
    let spouseAannualRetirementBenefit: number = 0
    let spouseAannualSpousalBenefit: number = 0
    let spouseAannualSurvivorBenefit: number = 0
    let spouseBannualRetirementBenefit: number = 0
    let spouseBannualSpousalBenefit: number = 0
    let spouseBannualSurvivorBenefit: number = 0
    //Adjusted claiming date variables. (Don't need adjusted survivor benefit dates, because we're assuming no early filing for survivor benefits anyway.)
    let spouseAadjustedRetirementBenefitDate: Date
    let spouseAadjustedSpousalBenefitDate: Date
    let spouseBadjustedRetirementBenefitDate: Date
    let spouseBadjustedSpousalBenefitDate: Date
    //Monthly benefit variable post-ARF
    let spouseAretirementBenefitAfterARF: number = 0
    let spouseAspousalBenefitWithRetirementAfterARF: number = 0
    let spouseAspousalBenefitWithoutRetirementAfterARF: number = 0
    let spouseAsurvivorBenefitWithoutRetirementAfterARF: number = 0
    let spouseAsurvivorBenefitWithRetirementAfterARF: number = 0
    let spouseBretirementBenefitAfterARF: number = 0
    let spouseBspousalBenefitWithRetirementAfterARF: number = 0
    let spouseBspousalBenefitWithoutRetirementAfterARF: number = 0
    let spouseBsurvivorBenefitWithoutRetirementAfterARF: number = 0
    let spouseBsurvivorBenefitWithRetirementAfterARF: number = 0

    //Other assorted variables
    let spouseAage: number
    let spouseAageLastBirthday: number
    let probabilityAalive: number
    let spouseBage: number
    let spouseBageLastBirthday: number
    let probabilityBalive: number
    let couplePV = 0
    let initialCalcDate: Date
    let spouseAdenominatorAge: number
    let spouseBdenominatorAge: number
    let withholdingDueToSpouseAearnings: number
    let withholdingDueToSpouseBearnings: number
    let monthsSpouseAretirementWithheld: number = 0
    let monthsSpouseAspousalWithheld: number = 0
    let monthsSpouseBretirementWithheld: number = 0
    let monthsSpouseBspousalWithheld: number = 0
    let spouseAgraceYear: boolean = false
    let spouseAhasHadGraceYear: boolean = false
    let spouseBgraceYear: boolean = false
    let spouseBhasHadGraceYear: boolean = false


    //If married, set initialCalcDate to date on which first spouse reaches age 62
    if (maritalStatus == "married"){
      if (spouseASSbirthDate < spouseBSSbirthDate)
        {
        initialCalcDate = new Date(spouseASSbirthDate.getFullYear()+62, spouseASSbirthDate.getMonth(), 1)
        }
      else {//This is fine as a simple "else" statement. If the two SSbirth dates are equal, doing it as of either date is fine.
      initialCalcDate = new Date(spouseBSSbirthDate.getFullYear()+62, spouseBSSbirthDate.getMonth(), 1)
        }
    }
    //If divorced, we want initialCalcDate to equal SpouseA's age62 date.
    if (maritalStatus == "divorced") {
      initialCalcDate = new Date(spouseASSbirthDate.getFullYear()+62, spouseASSbirthDate.getMonth(), 1)
    }


    //Find Jan 1 of the year containing initialCalcDate
    let currentCalculationDate: Date = new Date(initialCalcDate.getFullYear(), 0, 1)

    //Find age of each spouse as of that Jan 1
    spouseAage = ( currentCalculationDate.getMonth() - spouseASSbirthDate.getMonth() + 12 * (currentCalculationDate.getFullYear() - spouseASSbirthDate.getFullYear()) )/12
    spouseBage = ( currentCalculationDate.getMonth() - spouseBSSbirthDate.getMonth() + 12 * (currentCalculationDate.getFullYear() - spouseBSSbirthDate.getFullYear()) )/12

    //Calculate PV via loop until both spouses are at least age 115 (by which point "remaining lives" is zero)
    while (spouseAage < 115 || spouseBage < 115){

        //Calculate number of months of retirement benefit for each spouse
        let monthsOfSpouseAretirement = this.benefitService.countBenefitMonths(spouseAretirementBenefitDate, currentCalculationDate)
        let monthsOfSpouseBretirement = this.benefitService.countBenefitMonths(spouseBretirementBenefitDate, currentCalculationDate)

        //Calculate number of months of spouseA spousalBenefit w/ retirementBenefit and number of months of spouseA spousalBenefit w/o retirementBenefit
        let monthsOfSpouseAspousal: number = this.benefitService.countBenefitMonths(spouseAspousalBenefitDate, currentCalculationDate)
        if (monthsOfSpouseAretirement >= monthsOfSpouseAspousal) {
          var monthsOfSpouseAspousalWithRetirement: number = monthsOfSpouseAspousal
          var monthsOfSpouseAspousalWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseAspousalWithRetirement: number = monthsOfSpouseAretirement
          var monthsOfSpouseAspousalWithoutRetirement: number = monthsOfSpouseAspousal - monthsOfSpouseAretirement
        }

        //Calculate number of months of spouseB spousalBenefit w/ retirementBenefit and number of months of spouseB spousalBenefit w/o retirementBenefit
        let monthsOfSpouseBspousal: number = this.benefitService.countBenefitMonths(spouseBspousalBenefitDate, currentCalculationDate)
        if (monthsOfSpouseBretirement >= monthsOfSpouseBspousal) {
          var monthsOfSpouseBspousalWithRetirement: number = monthsOfSpouseBspousal
          var monthsOfSpouseBspousalWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseBspousalWithRetirement: number = monthsOfSpouseBretirement
          var monthsOfSpouseBspousalWithoutRetirement: number = monthsOfSpouseBspousal - monthsOfSpouseBretirement
        }

        //Calculate number of months of spouseA survivorBenefit w/ retirementBenefit and number of months of spouseA survivorBenefit w/o retirementBenefit
        let monthsOfSpouseAsurvivor: number = this.benefitService.countBenefitMonths(spouseAsurvivorFRA, currentCalculationDate)
        if (monthsOfSpouseAretirement >= monthsOfSpouseAsurvivor) {
          var monthsOfSpouseAsurvivorWithRetirement: number = monthsOfSpouseAsurvivor
          var monthsOfSpouseAsurvivorWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseAsurvivorWithRetirement: number = monthsOfSpouseAretirement
          var monthsOfSpouseAsurvivorWithoutRetirement: number = monthsOfSpouseAsurvivor - monthsOfSpouseAretirement
        }

        //Calculate number of months of spouseB survivorBenefit w/ retirementBenefit and number of months of spouseB survivorBenefit w/o retirementBenefit
        let monthsOfSpouseBsurvivor: number = this.benefitService.countBenefitMonths(spouseBsurvivorFRA, currentCalculationDate)
        if (monthsOfSpouseBretirement >= monthsOfSpouseBsurvivor) {
          var monthsOfSpouseBsurvivorWithRetirement: number = monthsOfSpouseBsurvivor
          var monthsOfSpouseBsurvivorWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseBsurvivorWithRetirement: number = monthsOfSpouseBretirement
          var monthsOfSpouseBsurvivorWithoutRetirement: number = monthsOfSpouseBsurvivor - monthsOfSpouseBretirement
        }

        //Calculate monthly benefit amounts, pre-ARF
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


         //Earnings test
        if (isNaN(spouseAquitWorkDate.getTime())) {
          spouseAquitWorkDate = new Date(1,0,1)
        }
        if (isNaN(spouseBquitWorkDate.getTime())) {
          spouseBquitWorkDate = new Date(1,0,1)
        }
        if (spouseAquitWorkDate > this.today || spouseBquitWorkDate > this.today){//If quitWorkDates are invalid dates (because there was no input) or in the past for some reason, this whole business below gets skipped
          //Determine if it's a grace year for either spouse. If quitWorkDate has already happened (or happens this year) and at least one type of benefit has started (or starts this year)
            //Assumption: in the year they quit work, following months are non-service months.
            //Grace year for spouseA?
            if (spouseAhasHadGraceYear === true) {//if graceyear was true before, set it to false, so it's only true once
              spouseAgraceYear = false
            } else if (spouseAquitWorkDate.getFullYear() <= currentCalculationDate.getFullYear() &&
              (
              spouseAretirementBenefitDate.getFullYear() <= currentCalculationDate.getFullYear() ||
              spouseAspousalBenefitDate.getFullYear() <= currentCalculationDate.getFullYear() ||
              spouseAsurvivorFRA.getFullYear() <= currentCalculationDate.getFullYear()
              )
            ) {
              spouseAgraceYear = true
              spouseAhasHadGraceYear = true
            }

            //Grace year for spouseB? 
            if (spouseBhasHadGraceYear === true) {//if graceyear was true before, set it to false, so it's only true once
              spouseBgraceYear = false
            } else if (spouseBquitWorkDate.getFullYear() <= currentCalculationDate.getFullYear() &&
              (
              spouseBretirementBenefitDate.getFullYear() <= currentCalculationDate.getFullYear() ||
              spouseBspousalBenefitDate.getFullYear() <= currentCalculationDate.getFullYear() ||
              spouseBsurvivorFRA.getFullYear() <= currentCalculationDate.getFullYear()
              )
            ) {
              spouseBgraceYear = true
              spouseBhasHadGraceYear = true
            }

            //Calculate necessary withholding based on each spouse's earnings
            withholdingDueToSpouseAearnings = this.earningsTestService.calculateWithholding(currentCalculationDate, spouseAquitWorkDate, spouseAFRA, spouseAmonthlyEarnings)
            withholdingDueToSpouseBearnings = this.earningsTestService.calculateWithholding(currentCalculationDate, spouseBquitWorkDate, spouseBFRA, spouseBmonthlyEarnings)

            //If divorced, withholding due to spouseB's earnings is zero
            if (maritalStatus == "divorced"){
              withholdingDueToSpouseBearnings = 0
            }
              

              //Have to loop monthly for earnings test
              let earningsTestMonth:Date = new Date(currentCalculationDate) //set earningsTestMonth to beginning of year
              let earningsTestEndDate:Date = new Date(currentCalculationDate.getFullYear(), 11, 1) //set earningsTestEndDate to Dec of currentCalculationYear
              let availableForWithholding:number
                  
              //Key point with all of the below is that A's earnings first reduce A's retirement benefit and B's spousal benefit. *Then* B's earnings reduce B's spousal benefit. See CFR 404.434
                //So we first use A's earnings to reduce A's retirement and B's spousal. And we use B's earnings to reduce B's retirement and A's spousal.
                //Then if further withholding is necessary we have their own earnings reduce their own spousal.
                  
                //Counting A's excess earnings against A's retirement and B's benefit as spouse
                while (withholdingDueToSpouseAearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                  availableForWithholding = 0 //reset availableForWithholding for new month
                  //Check what benefits there *are* this month from which we can withhold
                    if (earningsTestMonth >= spouseAretirementBenefitDate //Make sure they started their retirement benefit
                      && (spouseAgraceYear === false || earningsTestMonth < spouseAquitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < spouseAFRA) //Make sure current month is prior to FRA
                    ) {  
                      availableForWithholding = availableForWithholding + spouseAretirementBenefit
                      monthsOfSpouseAretirement = monthsOfSpouseAretirement - 1
                      monthsSpouseAretirementWithheld  = monthsSpouseAretirementWithheld  + 1
                    }
                    if (maritalStatus == "married"){//Only make spouse B's benefit as a spouse available for withholding if they're currently married (as opposed to divorced). If divorced, spouseB is automatically "not working," so we don't have any withholding due to their earnings to worry about.
                      if (earningsTestMonth >= spouseBspousalBenefitDate && earningsTestMonth >= spouseBretirementBenefitDate //i.e., if this is a "spouseBspousalBenefitWithRetirementBenefit" month
                        && (spouseBgraceYear === false || earningsTestMonth < spouseBquitWorkDate) //Make sure it isn't a nonservice month in grace year
                        && (earningsTestMonth < spouseBFRA) //Make sure current month is prior to spouseB FRA
                      ) {
                      availableForWithholding = availableForWithholding + spouseBspousalBenefitWithRetirement
                      monthsOfSpouseBspousalWithRetirement = monthsOfSpouseBspousalWithRetirement - 1
                      monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                      if (earningsTestMonth >= spouseBspousalBenefitDate && earningsTestMonth < spouseBretirementBenefitDate //i.e., if this is a "spouseBspousalBenefitWithoutRetirementBenefit" month
                        && (spouseBgraceYear === false || earningsTestMonth < spouseBquitWorkDate) //Make sure it isn't a nonservice month in grace year
                        && (earningsTestMonth < spouseBFRA) //Make sure current month is prior to spouseB FRA
                      ){
                      availableForWithholding = availableForWithholding + spouseBspousalBenefitWithoutRetirement
                      monthsOfSpouseBspousalWithoutRetirement = monthsOfSpouseBspousalWithoutRetirement - 1
                      monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                    }

                  //Subtracting 1 from the above months will often result in overwithholding (as it does in real life) for a partial month. Gets added back later.
                  //Reduce necessary withholding by the amount we withhold this month:
                  withholdingDueToSpouseAearnings = withholdingDueToSpouseAearnings - availableForWithholding //(this kicks us out of loop, potentially)
                  earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
                }
                  
                //Counting B's excess earnings against B's retirement and A's benefit as spouse
                earningsTestMonth = new Date(currentCalculationDate) //reset earningsTestMonth to beginning of year
                while (withholdingDueToSpouseBearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                  availableForWithholding = 0 //reset availableForWithholding for new month
                  //Check what benefits there *are* this month from which we can withhold:
                    if (earningsTestMonth >= spouseBretirementBenefitDate //Make sure they started their retirement benefit
                      && (spouseBgraceYear === false || earningsTestMonth < spouseBquitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < spouseBFRA) //Make sure current month is prior to FRA
                    ) {
                      availableForWithholding = availableForWithholding + spouseBretirementBenefit
                      monthsOfSpouseBretirement = monthsOfSpouseBretirement - 1
                      monthsSpouseBretirementWithheld  = monthsSpouseBretirementWithheld  + 1
                    }
                    if (earningsTestMonth >= spouseAspousalBenefitDate && earningsTestMonth >= spouseAretirementBenefitDate //i.e., if this is a "spouseAspousalBenefitWithRetirementBenefit" month
                      && (spouseAgraceYear === false || earningsTestMonth < spouseAquitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < spouseAFRA) //Make sure current month is prior to FRA
                    ) {
                    availableForWithholding = availableForWithholding + spouseAspousalBenefitWithRetirement
                    monthsOfSpouseAspousalWithRetirement = monthsOfSpouseAspousalWithRetirement - 1
                    monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                    }
                    if (earningsTestMonth >= spouseAspousalBenefitDate && earningsTestMonth < spouseAretirementBenefitDate //i.e., if this is a "spouseAspousalBenefitWithoutRetirementBenefit" month
                      && (spouseAgraceYear === false || earningsTestMonth < spouseAquitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < spouseAFRA) //Make sure current month is prior to FRA
                    ){
                    availableForWithholding = availableForWithholding + spouseAspousalBenefitWithoutRetirement
                    monthsOfSpouseAspousalWithoutRetirement = monthsOfSpouseAspousalWithoutRetirement - 1
                    monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                    }
                  //Subtracting 1 from the above months will often result in overwithholding (as it does in real life) for a partial month. Gets added back later.
                  //Reduce necessary withholding by the amount we withhold this month:
                  withholdingDueToSpouseBearnings = withholdingDueToSpouseBearnings - availableForWithholding //(this kicks us out of loop, potentially)
                  earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
                }
                  
                //If A still has excess earnings, count those against A's benefit as a spouse. (Don't have to check for withholding against benefit as survivor, because we assume no survivor application until survivorFRA.)
                if (withholdingDueToSpouseAearnings > 0) {
                  earningsTestMonth = new Date(currentCalculationDate) //reset earningsTestMonth to beginning of year
                  while (withholdingDueToSpouseAearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                    availableForWithholding = 0
                    //Check if there is a spouseAspousal benefit this month (Always "spousalBenefitWithRetirement" because without retirement requires a restricted app. And spouseA is by definition younger than FRA here, otherwise there are no excess earnings.)
                    if (earningsTestMonth >= spouseAspousalBenefitDate && earningsTestMonth >= spouseAretirementBenefitDate
                      && (spouseAgraceYear === false || earningsTestMonth < spouseAquitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < spouseAFRA) //Make sure current month is prior to FRA
                    ) {
                    availableForWithholding = availableForWithholding + spouseAspousalBenefitWithRetirement
                    monthsOfSpouseAspousalWithRetirement = monthsOfSpouseAspousalWithRetirement - 1 //<-- This is going to result in overwithholding for the partial months.
                    monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                    }
                    withholdingDueToSpouseAearnings = withholdingDueToSpouseAearnings - availableForWithholding //(this kicks us out of loop, potentially)
                    earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
                  }
                }
                  
                //If B still has excess earnings, count those against B's benefit as a spouse. (Don't have to check for withholding against benefit as survivor, because we assume no survivor application until survivorFRA.)
                if (withholdingDueToSpouseBearnings > 0) {
                  earningsTestMonth = new Date(currentCalculationDate) //reset earningsTestMonth to beginning of year
                  while (withholdingDueToSpouseBearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                    availableForWithholding = 0
                    //Check if there is a spouseBspousal benefit this month (Always "spousalBenefitWithRetirement" because without retirement requires a restricted app. And spouseB is by definition younger than FRA here, otherwise there are no excess earnings.)
                    if (earningsTestMonth >= spouseBspousalBenefitDate && earningsTestMonth >= spouseBretirementBenefitDate
                      && (spouseBgraceYear === false || spouseBquitWorkDate > earningsTestMonth) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < spouseBFRA) //Make sure current month is prior to FRA
                    ) {
                      availableForWithholding = availableForWithholding + spouseBspousalBenefitWithRetirement
                      monthsOfSpouseBspousalWithRetirement = monthsOfSpouseBspousalWithRetirement - 1 //<-- This is going to result in overwithholding for the partial months.
                      monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                    withholdingDueToSpouseBearnings = withholdingDueToSpouseBearnings - availableForWithholding //(this kicks us out of loop, potentially)
                    earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
                  }
                }
                  

            //Find post-ARF ("AdjustmentReductionFactor") monthly benefit amounts, for use at/after FRA
              //Find adjusted dates
              spouseAadjustedRetirementBenefitDate = new Date(spouseAretirementBenefitDate.getFullYear(), spouseAretirementBenefitDate.getMonth()+monthsSpouseAretirementWithheld, 1)
              spouseAadjustedSpousalBenefitDate = new Date(spouseAspousalBenefitDate.getFullYear(), spouseAspousalBenefitDate.getMonth()+monthsSpouseAspousalWithheld , 1)
              spouseBadjustedRetirementBenefitDate = new Date(spouseBretirementBenefitDate.getFullYear(), spouseBretirementBenefitDate.getMonth()+monthsSpouseBretirementWithheld, 1)
              spouseBadjustedSpousalBenefitDate = new Date(spouseBspousalBenefitDate.getFullYear(), spouseBspousalBenefitDate.getMonth()+monthsSpouseBspousalWithheld , 1)
              //Find adjusted retirement benefits
              spouseAretirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAadjustedRetirementBenefitDate)
              spouseBretirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(spouseBPIA, spouseBFRA, spouseBadjustedRetirementBenefitDate)
              //Find adjusted spousal benefits
              spouseAspousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, spouseAretirementBenefitAfterARF, spouseAadjustedSpousalBenefitDate, spouseAgovernmentPension)
              spouseAspousalBenefitWithoutRetirementAfterARF = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, 0, spouseAadjustedSpousalBenefitDate, spouseAgovernmentPension)
              spouseBspousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, spouseBretirementBenefitAfterARF, spouseBspousalBenefitDate, spouseBgovernmentPension)
              spouseBspousalBenefitWithoutRetirementAfterARF = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, 0, spouseBadjustedSpousalBenefitDate, spouseBgovernmentPension)
              //Find adjusted survivor benefits
              spouseAsurvivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(spouseASSbirthDate, spouseAsurvivorFRA, spouseAretirementBenefitAfterARF, spouseAsurvivorFRA, spouseBFRA, spouseBretirementBenefitDate, spouseBPIA, spouseBretirementBenefitDate, spouseAgovernmentPension)
              spouseAsurvivorBenefitWithoutRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(spouseASSbirthDate, spouseAsurvivorFRA, 0, spouseAsurvivorFRA, spouseBFRA, spouseBretirementBenefitDate, spouseBPIA, spouseBretirementBenefitDate, spouseAgovernmentPension)
              spouseBsurvivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(spouseBSSbirthDate, spouseBsurvivorFRA, spouseBretirementBenefitAfterARF, spouseBsurvivorFRA, spouseAFRA, spouseAretirementBenefitDate, spouseAPIA, spouseAretirementBenefitDate, spouseBgovernmentPension)
              spouseBsurvivorBenefitWithoutRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(spouseBSSbirthDate, spouseBsurvivorFRA, 0, spouseBsurvivorFRA, spouseAFRA, spouseAretirementBenefitDate, spouseAPIA, spouseAretirementBenefitDate, spouseBgovernmentPension)
          }

          //Ignore earnings test if users aren't working
          else {
            withholdingDueToSpouseAearnings = 0
            withholdingDueToSpouseBearnings = 0
            spouseAretirementBenefitAfterARF = spouseAretirementBenefit
            spouseBretirementBenefitAfterARF = spouseBretirementBenefit
            spouseAspousalBenefitWithoutRetirementAfterARF = spouseAspousalBenefitWithoutRetirement
            spouseAspousalBenefitWithRetirementAfterARF = spouseAspousalBenefitWithRetirement
            spouseBspousalBenefitWithoutRetirementAfterARF = spouseBspousalBenefitWithoutRetirement
            spouseBspousalBenefitWithRetirementAfterARF = spouseBspousalBenefitWithRetirement
            spouseAsurvivorBenefitWithoutRetirementAfterARF = spouseAsurvivorBenefitWithoutRetirement
            spouseAsurvivorBenefitWithRetirementAfterARF = spouseAsurvivorBenefitWithRetirement
            spouseBsurvivorBenefitWithoutRetirementAfterARF = spouseBsurvivorBenefitWithoutRetirement
            spouseBsurvivorBenefitWithRetirementAfterARF = spouseBsurvivorBenefitWithRetirement
          }

          //WithholdingDueToSpouseAearnings and withholdingDueToSpouseBearnings are negative at this point if we overwithheld. Have to add those negative amounts back to annual benefit amounts
            //We add them back to annual retirement benefit later.
            let spouseAoverWithholding: number = 0
            let spouseBoverWithholding: number = 0
            if (withholdingDueToSpouseAearnings < 0) {
              spouseAoverWithholding = spouseAoverWithholding - withholdingDueToSpouseAearnings
            }
            if (withholdingDueToSpouseBearnings < 0) {
              spouseBoverWithholding = spouseBoverWithholding - withholdingDueToSpouseBearnings
            }


        //Calculate annual benefits, accounting for Adjustment Reduction Factor in years beginning at FRA
          //Spouse A retirement and spousal
          if (currentCalculationDate.getFullYear() < spouseAFRA.getFullYear()) {
            spouseAannualRetirementBenefit = monthsOfSpouseAretirement * spouseAretirementBenefit
            spouseAannualSpousalBenefit = (monthsOfSpouseAspousalWithoutRetirement * spouseAspousalBenefitWithoutRetirement) + (monthsOfSpouseAspousalWithRetirement * spouseAspousalBenefitWithRetirement)
          } else if (currentCalculationDate.getFullYear() == spouseAFRA.getFullYear()){
              //Calculate number of ARF months (e.g., 10 if FRA is March)
              let ARFmonths = 12 - spouseAFRA.getMonth()
              if (ARFmonths > monthsOfSpouseAretirement) {
                ARFmonths = monthsOfSpouseAretirement //Limit ARFmonths to number of months of retirement benefit
              }
              spouseAannualRetirementBenefit = ARFmonths * spouseAretirementBenefitAfterARF + (monthsOfSpouseAretirement - ARFmonths) * spouseAretirementBenefit
              //Figure out how many months there are of "pre-ARF with retirement benefit" "post-ARF with retirement benefit" and "post-ARF without retirement benefit" ("Without" months require restricted app. So none are pre-ARF)
              ARFmonths = 12 - spouseAFRA.getMonth() //reset ARFmonths
              spouseAannualSpousalBenefit =
                spouseAspousalBenefitWithoutRetirementAfterARF * monthsOfSpouseAspousalWithoutRetirement //Without retirement is always after ARF
              + spouseAspousalBenefitWithRetirementAfterARF * (ARFmonths - monthsOfSpouseAspousalWithoutRetirement) //post-ARF "with retirement" months is ARF months minus the "without retirement months"
              + spouseAspousalBenefitWithRetirement * (monthsOfSpouseAspousalWithRetirement - (ARFmonths - monthsOfSpouseAspousalWithoutRetirement)) //pre-ARF "with retirement" months is total "with retirement" months minus the post-ARF "with" months (calculated in line above)
            } else {//i.e., if whole year is past FRA
              spouseAannualRetirementBenefit = monthsOfSpouseAretirement * spouseAretirementBenefitAfterARF
              spouseAannualSpousalBenefit = (monthsOfSpouseAspousalWithoutRetirement * spouseAspousalBenefitWithoutRetirementAfterARF) + (monthsOfSpouseAspousalWithRetirement * spouseAspousalBenefitWithRetirementAfterARF)
            }

          //Spouse B retirement and spousal
          if (currentCalculationDate.getFullYear() < spouseBFRA.getFullYear()) {
            spouseBannualRetirementBenefit = monthsOfSpouseBretirement * spouseBretirementBenefit
            spouseBannualSpousalBenefit = (monthsOfSpouseBspousalWithoutRetirement * spouseBspousalBenefitWithoutRetirement) + (monthsOfSpouseBspousalWithRetirement * spouseBspousalBenefitWithRetirement)
          } else if (currentCalculationDate.getFullYear() == spouseBFRA.getFullYear()){
              //Calculate number of ARF months (e.g., 10 if FRA is March)
              let ARFmonths = 12 - spouseBFRA.getMonth()
              if (ARFmonths > monthsOfSpouseBretirement) {
                ARFmonths = monthsOfSpouseBretirement //Limit ARFmonths to number of months of retirement benefit
              }
              spouseBannualRetirementBenefit = ARFmonths * spouseBretirementBenefitAfterARF + (monthsOfSpouseBretirement - ARFmonths) * spouseBretirementBenefit
              //Figure out how many months there are of "pre-ARF with retirement benefit" "post-ARF with retirement benefit" and "post-ARF without retirement benefit" ("Without" months require restricted app. So none are pre-ARF)
              ARFmonths = 12 - spouseAFRA.getMonth() //reset ARFmonths
              spouseBannualSpousalBenefit =
                spouseBspousalBenefitWithoutRetirementAfterARF * monthsOfSpouseBspousalWithoutRetirement //Without retirement is always after ARF
              + spouseBspousalBenefitWithRetirementAfterARF * (ARFmonths - monthsOfSpouseBspousalWithoutRetirement) //post-ARF "with retirement" months is ARF months minus the "without retirement months"
              + spouseBspousalBenefitWithRetirement * (monthsOfSpouseBspousalWithRetirement - (ARFmonths - monthsOfSpouseBspousalWithoutRetirement)) //pre-ARF "with retirement" months is total "with retirement" months minus the post-ARF "with" months (calculated in line above)
            } else {//i.e., if whole year is past FRA
              spouseBannualRetirementBenefit = monthsOfSpouseBretirement * spouseBretirementBenefitAfterARF
              spouseBannualSpousalBenefit = (monthsOfSpouseBspousalWithoutRetirement * spouseBspousalBenefitWithoutRetirementAfterARF) + (monthsOfSpouseBspousalWithRetirement * spouseBspousalBenefitWithRetirementAfterARF)
            }

            //Survivor benefits are always with ARF since we assume it doesn't even get claimed until FRA
            spouseAannualSurvivorBenefit = (monthsOfSpouseAsurvivorWithoutRetirement * spouseAsurvivorBenefitWithoutRetirementAfterARF) + (monthsOfSpouseAsurvivorWithRetirement * spouseAsurvivorBenefitWithRetirementAfterARF) 
            spouseBannualSurvivorBenefit = (monthsOfSpouseBsurvivorWithoutRetirement * spouseBsurvivorBenefitWithoutRetirementAfterARF) + (monthsOfSpouseBsurvivorWithRetirement * spouseBsurvivorBenefitWithRetirementAfterARF)
    
          //Add back overwithholding
          spouseAannualRetirementBenefit = spouseAannualRetirementBenefit + spouseAoverWithholding
          spouseBannualRetirementBenefit = spouseBannualRetirementBenefit + spouseBoverWithholding

          //If user is divorced, we don't actually want to include the ex-spouse's benefit amounts in our PV sum
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


     /* 
      //Logging for debugging purposes
        if (this.maximizedOrNot === true) {
          console.log(currentCalculationDate)
          console.log("spouseAage: " + spouseAage)
          console.log("monthsSpouseAretirementWithheld: " + monthsSpouseAretirementWithheld)
          console.log("spouseAadjustedBenefitDate: " + spouseAadjustedRetirementBenefitDate)
          console.log("spouseAretirementBenefit: " + spouseAretirementBenefit)
          console.log("spouseAretirementBenefitAfterARF: " + spouseAretirementBenefitAfterARF)
          console.log("monthsOfSpouseAretirement: " + monthsOfSpouseAretirement)
          console.log("spouseAannualRetirementBenefit: " + spouseAannualRetirementBenefit)
          console.log("spouseAannualSpousalBenefit: " + spouseAannualSpousalBenefit)
          console.log("spouseAannualSurvivorBenefit: " + spouseAannualSurvivorBenefit)
          console.log("spouseBage: " + spouseBage)
          console.log("monthsSpouseBretirementWithheld: " + monthsSpouseBretirementWithheld)
          console.log("spouseBadjustedBenefitDate: " + spouseBadjustedRetirementBenefitDate)
          console.log("spouseBretirementBenefit: " + spouseBretirementBenefit)
          console.log("spouseBretirementBenefitAfterARF: " + spouseBretirementBenefitAfterARF)
          console.log("monthsOfSpouseBretirement: " + monthsOfSpouseBretirement)
          console.log("spouseBannualRetirementBenefit: " + spouseBannualRetirementBenefit)
          console.log("spouseBannualSpousalBenefit: " + spouseBannualSpousalBenefit)
          console.log("spouseBannualSurvivorBenefit: " + spouseBannualSurvivorBenefit)
          console.log("AnnualPV: " + annualPV)
        }
        */

      //Add discounted benefit to ongoing count of retirementPV, add 1 to each age, add 1 year to currentCalculationDate, and start loop over
        couplePV = couplePV + annualPV
        spouseAage = spouseAage + 1
        spouseBage = spouseBage + 1
        currentCalculationDate.setFullYear(currentCalculationDate.getFullYear()+1)

    }

    return couplePV
  }


  maximizeSinglePersonPV(PIA: number, SSbirthDate: Date, actualBirthDate:Date, initialAge:number, FRA: Date, quitWorkDate, monthlyEarnings, mortalityTable:number[], discountRate: number){
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
    let savedPV: number = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, testClaimingDate, quitWorkDate, monthlyEarnings, mortalityTable, discountRate)
    let savedClaimingDate = new Date(testClaimingDate)

    //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
    let endingTestDate = new Date(SSbirthDate.getFullYear()+70, SSbirthDate.getMonth()-1, 1)
    while (testClaimingDate <= endingTestDate){
      //Add 1 month to claiming age and run both calculations again and compare results. Save better of the two. (If they're literally the same, save the second one tested, because it gives better longevity insurance)
      testClaimingDate.setMonth(testClaimingDate.getMonth() + 1)
      let currentTestPV = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, testClaimingDate, quitWorkDate, monthlyEarnings, mortalityTable, discountRate)
      if (currentTestPV >= savedPV)
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
    this.maximizedOrNot = true
    return solutionSet
  }


  maximizeCouplePV(maritalStatus:string, spouseAPIA: number, spouseBPIA: number, spouseAactualBirthDate:Date, spouseBactualBirthDate:Date, spouseASSbirthDate: Date, spouseBSSbirthDate: Date, spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number,
    spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAmortalityTable:number[], spouseBmortalityTable:number[],
    spouseAquitWorkDate: Date, spouseBquitWorkDate: Date, spouseAmonthlyEarnings: number, spouseBmonthlyEarnings: number,
    spouseAgovernmentPension:number, spouseBgovernmentPension:number, discountRate: number){

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
            let currentTestPV: number = this.calculateCouplePV(maritalStatus, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, Number(spouseAinitialAgeRounded), Number(spouseBinitialAgeRounded), spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, Number(spouseAPIA), Number(spouseBPIA), spouseAretirementDate, spouseBretirementDate, spouseAspousalDate, spouseBspousalDate, spouseAquitWorkDate, spouseBquitWorkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, Number(spouseAgovernmentPension), Number(spouseBgovernmentPension), Number(discountRate))
            //If PV is greater than saved PV, save new PV and save new testDates.
            if (currentTestPV >= savedPV) {
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
        //Add 1 month to spouseAretirementDate
          spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1)
        
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

      this.maximizedOrNot = true
      return solutionSet
  }


  maximizeDivorceePV(maritalStatus:string, exSpouseRetirementBenefitDate:Date, spouseAPIA: number, spouseBPIA: number, spouseAactualBirthDate:Date, spouseBactualBirthDate:Date, spouseASSbirthDate: Date, spouseBSSbirthDate: Date,
    spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number, spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAmortalityTable:number[], spouseBmortalityTable:number[],
    spouseAquitWorkDate: Date, spouseBquitworkDate: Date, spouseAmonthlyEarnings: number, spouseBmonthlyEarnings: number,
    spouseAgovernmentPension:number, spouseBgovernmentPension:number, discountRate: number){

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

      //Don't let spouseAspousalDate be earlier than first month for which ex-spouse is 62 for whole month
      let exSpouse62Date = new Date(spouseBSSbirthDate.getFullYear()+62, 1, 1)
      if (spouseBactualBirthDate.getDate() <= 2){
        exSpouse62Date.setMonth(spouseBactualBirthDate.getMonth())
      } else {
        exSpouse62Date.setMonth(spouseBactualBirthDate.getMonth()+1)
      }
      if (spouseAspousalDate < exSpouse62Date) {
        spouseAspousalDate.setFullYear(exSpouse62Date.getFullYear())
        spouseAspousalDate.setMonth(exSpouse62Date.getMonth())
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
        let currentTestPV: number = this.calculateCouplePV(maritalStatus, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, Number(spouseAinitialAgeRounded), Number(spouseBinitialAgeRounded), spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, Number(spouseAPIA), Number(spouseBPIA), spouseAretirementDate, exSpouseRetirementBenefitDate, spouseAspousalDate, spouseBspousalDate, spouseAquitWorkDate, spouseBquitworkDate, spouseAmonthlyEarnings, spouseBmonthlyEarnings, Number(spouseAgovernmentPension), Number(spouseBgovernmentPension), Number(discountRate))

        //If PV is greater than or equal to saved PV, save new PV and save new testDates
        if (currentTestPV >= savedPV) {
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
            if (spouseAspousalDate <= spouseAretirementDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
              spouseAspousalDate.setMonth(spouseAspousalDate.getMonth()+1)
            }
          } else { //i.e., if old deemed filling rules apply
            //If current retirement test date younger than FRA, increment both by 1 month
            if (spouseAretirementDate < spouseAFRA) {
              spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1)
              if (spouseAspousalDate <= spouseAretirementDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
              spouseAspousalDate.setMonth(spouseAspousalDate.getMonth()+1)
              }
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
  
        this.maximizedOrNot = true
        return solutionSet


    }

//Lives remaining out of 100k, from SSA 2014 period life table
maleSSAtable = [
  100000,
  99362,
  99317,
  99289,
  99266,
  99249,
  99234,
  99219,
  99206,
  99194,
  99184,
  99174,
  99164,
  99151,
  99131,
  99100,
  99059,
  99006,
  98941,
  98863,
  98771,
  98663,
  98542,
  98410,
  98272,
  98131,
  97989,
  97844,
  97698,
  97547,
  97393,
  97235,
  97072,
  96906,
  96736,
  96562,
  96383,
  96198,
  96006,
  95809,
  95603,
  95389,
  95164,
  94925,
  94671,
  94397,
  94102,
  93784,
  93436,
  93054,
  92632,
  92168,
  91659,
  91103,
  90501,
  89851,
  89150,
  88396,
  87588,
  86724,
  85802,
  84819,
  83772,
  82663,
  81498,
  80277,
  78995,
  77644,
  76216,
  74704,
  73100,
  71393,
  69574,
  67640,
  65592,
  63426,
  61130,
  58693,
  56117,
  53406,
  50564,
  47585,
  44475,
  41251,
  37939,
  34566,
  31158,
  27748,
  24374,
  21079,
  17915,
  14934,
  12186,
  9714,
  7549,
  5706,
  4193,
  2996,
  2083,
  1410,
  932,
  600,
  376,
  228,
  134,
  76,
  42,
  22,
  11,
  5,
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
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
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
  99463,
  99427,
  99405,
  99388,
  99375,
  99364,
  99353,
  99343,
  99334,
  99325,
  99316,
  99306,
  99295,
  99281,
  99264,
  99243,
  99217,
  99188,
  99156,
  99120,
  99080,
  99037,
  98990,
  98941,
  98890,
  98836,
  98779,
  98719,
  98656,
  98588,
  98515,
  98437,
  98354,
  98267,
  98175,
  98080,
  97978,
  97870,
  97756,
  97633,
  97502,
  97360,
  97207,
  97041,
  96861,
  96665,
  96452,
  96220,
  95965,
  95686,
  95380,
  95047,
  94686,
  94296,
  93877,
  93425,
  92939,
  92420,
  91870,
  91289,
  90673,
  90017,
  89317,
  88569,
  87769,
  86910,
  85982,
  84978,
  83889,
  82706,
  81414,
  80004,
  78475,
  76827,
  75058,
  73150,
  71088,
  68862,
  66466,
  63895,
  61131,
  58167,
  55013,
  51688,
  48207,
  44585,
  40838,
  36992,
  33085,
  29167,
  25303,
  21563,
  18020,
  14740,
  11781,
  9192,
  6998,
  5199,
  3771,
  2673,
  1848,
  1243,
  812,
  514,
  313,
  184,
  103,
  55,
  28,
  13,
  6,
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
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
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
