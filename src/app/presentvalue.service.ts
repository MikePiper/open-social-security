import {Injectable} from '@angular/core'
import {BenefitService} from './benefit.service'
import {MortalityService} from './mortality.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {SolutionSet} from './data model classes/solutionset'
import {Person} from './data model classes/person'
import {ClaimingScenario} from './data model classes/claimingscenario'
import {CalculationYear} from './data model classes/calculationyear'


@Injectable()
export class PresentValueService {

  constructor(private benefitService: BenefitService, private mortalityService:MortalityService, private earningsTestService: EarningsTestService, private solutionSetService: SolutionSetService) { }
  
  //Has maximize calc been run?
  maximizedOrNot: boolean = false

  today: Date = new Date()

  calculateSinglePersonPV(person:Person, inputBenefitDate: Date, scenario:ClaimingScenario)
  {
    let retirementBenefit: number = this.benefitService.calculateRetirementBenefit(person, inputBenefitDate)
    let retirementBenefitAfterARF: number = 0
    let adjustedBenefitDate: Date
    let annualRetirementBenefit: number
    let retirementPV: number = 0
    let probabilityAlive: number
    let withholdingAmount: number
    let monthsWithheld: number = 0
    let graceYear: boolean = false
    let hasHadGraceYear: boolean = false

    //Find Jan 1 of the year they plan to start benefit
    let initialCalcDate:Date = new Date(inputBenefitDate.getFullYear(), 0, 1)
    let calcYear:CalculationYear = new CalculationYear(initialCalcDate)

    //calculate age as of that date
    let age: number = ( 12 * (calcYear.date.getFullYear() - person.SSbirthDate.getFullYear()) + (calcYear.date.getMonth()) - person.SSbirthDate.getMonth()  )/12

    //Calculate PV via loop until they hit age 115 (by which point "remaining lives" is zero)
      while (age < 115) {

      //Count number of months in year that are before/after inputBenefitDate
      let monthsOfRetirement = this.benefitService.countBenefitMonths(inputBenefitDate, calcYear.date)


          //Earnings test
          if (isNaN(person.quitWorkDate.getTime())) {
            person.quitWorkDate = new Date(1,0,1)
          }
          if (person.quitWorkDate > this.today){//If quitWorkDate is an invalid date (because there was no input) or is in the past for some reason, this whole business below gets skipped  
              //Determine if it's a grace year. If quitWorkDate has already happened (or happens this year) and retirement benefit has started (or starts this year) it's a grace year
                //Assumption: in the year they quit work, following months are non-service months.
              graceYear = this.earningsTestService.isGraceYear(hasHadGraceYear, person.quitWorkDate, calcYear.date, inputBenefitDate)
              if (graceYear === true) {hasHadGraceYear = true}
               
              //Calculate necessary withholding based on earnings
              withholdingAmount = this.earningsTestService.calculateWithholding(calcYear.date, person.quitWorkDate, person.FRA, person.monthlyEarnings)

              //Have to loop monthly for earnings test
              let earningsTestMonth:Date = new Date(calcYear.date) //set earningsTestMonth to beginning of year
              let earningsTestEndDate:Date = new Date(calcYear.date.getFullYear(), 11, 1) //set earningsTestEndDate to Dec of currentCalculationYear
              let availableForWithholding:number
              while (withholdingAmount > 0 && earningsTestMonth <= earningsTestEndDate) {
                availableForWithholding = 0 //reset availableForWithholding for new month
                //Checks to see if there is a retirement benefit this month from which we can withhold:
                  if (earningsTestMonth >= inputBenefitDate  //check that they've started retirement benefit
                    && (graceYear === false || earningsTestMonth < person.quitWorkDate ) //make sure it isn't a nonservice month in grace year
                    && (earningsTestMonth < person.FRA) //make sure current month is prior to FRA
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
            retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(person, adjustedBenefitDate)

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
          if (calcYear.date.getFullYear() < person.FRA.getFullYear()) {
            annualRetirementBenefit = monthsOfRetirement * retirementBenefit + overWithholding
          } else if (calcYear.date.getFullYear() == person.FRA.getFullYear()){
              //total monthsOfRetirement is monthsOfRetirement. Some will be retirementBenefitAfterARF. Rest will be retirementBenefit.  Then subtract withholdingAmount
              //ARF should be applied for (12 - FRA.getMonth) months (e.g., all 12 if FRA is January). But limited to monthsOfRetirement.
              let ARFmonths = 12 - person.FRA.getMonth()
              if (ARFmonths > monthsOfRetirement) {
                ARFmonths = monthsOfRetirement
              }
              annualRetirementBenefit = ARFmonths * retirementBenefitAfterARF + (monthsOfRetirement - ARFmonths) * retirementBenefit + overWithholding
            } else {//i.e., if whole year is past FRA
            annualRetirementBenefit = monthsOfRetirement * retirementBenefitAfterARF
            }

          //Calculate probability of being alive at end of age in question
          probabilityAlive = this.mortalityService.calculateProbabilityAlive(person, age)

          
          //Calculate probability-weighted benefit
          let annualPV = annualRetirementBenefit * probabilityAlive

          //Discount that benefit to age 62
          annualPV = annualPV / (1 + scenario.discountRate/100/2) //e.g., benefits received during age 62 must be discounted for 0.5 years
          annualPV = annualPV / Math.pow((1 + scenario.discountRate/100),(age - 62)) //e.g., benefits received during age 63 must be discounted for 1.5 years

          /*
          //Logging for debugging, if maximize function has already been run. (This way we avoid logging a zillion things when maximizing for the first time)
          if (this.maximizedOrNot === true) {
            console.log("-----")
            console.log("currentCalculationDate: " + currentCalculationDate.getMonth() + 1 + "/" + currentCalculationDate.getFullYear())
            console.log("age: " + age)
            console.log("probabilityAlive: " + probabilityAlive)
            console.log("adjustedBenefitDate: " + adjustedBenefitDate)
            console.log("retirementBenefit: " + retirementBenefit)
            console.log("retirementBenefitAfterARF: " + retirementBenefitAfterARF)
            console.log("withholdingAmount: " + withholdingAmount)
            console.log("monthsWithheld: " + monthsWithheld)
            console.log("graceYear: " + graceYear)
            console.log("monthsOfRetirement: " + monthsOfRetirement)
            console.log("annualRetirementBenefit: " + annualRetirementBenefit)
            console.log("AnnualPV: " + annualPV)
            console.log("TotalPV: " + retirementPV)
            }
          */

          //Add discounted benefit to ongoing count of retirementPV, add 1 year to age and calculationYear, and start loop over
          retirementPV = retirementPV + annualPV
          age = age + 1
          let newCalcDate:Date = new Date(calcYear.date.getFullYear()+1, 0, 1)
          calcYear = new CalculationYear(newCalcDate)
      }
        return retirementPV
  }

  calculateCouplePV(personA:Person, personB:Person,
    spouseAretirementBenefitDate: Date, spouseBretirementBenefitDate: Date, spouseAspousalBenefitDate: Date, spouseBspousalBenefitDate: Date, scenario:ClaimingScenario){
    
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
    let probabilityAalive: number
    let spouseBage: number
    let probabilityBalive: number
    let couplePV: number = 0
    let initialCalcDate: Date
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


    //If married, set initialCalcDate to Jan 1 of year in which first spouse reaches age 62
    if (scenario.maritalStatus == "married"){
      if (personA.SSbirthDate < personB.SSbirthDate)
        {
        initialCalcDate = new Date(personA.SSbirthDate.getFullYear()+62, 0, 1)
        }
      else {//This is fine as a simple "else" statement. If the two SSbirth dates are equal, doing it as of either date is fine.
      initialCalcDate = new Date(personB.SSbirthDate.getFullYear()+62, 0, 1)
        }
    }
    //If divorced, we want initialCalcDate to be Jan 1 of SpouseA's age62 year.
    if (scenario.maritalStatus == "divorced") {
      initialCalcDate = new Date(personA.SSbirthDate.getFullYear()+62, 0, 1)
    }


    //Find Jan 1 of the year containing initialCalcDate
    let calcYear:CalculationYear = new CalculationYear(initialCalcDate)

    //Find age of each spouse as of that Jan 1
    spouseAage = ( calcYear.date.getMonth() - personA.SSbirthDate.getMonth() + 12 * (calcYear.date.getFullYear() - personA.SSbirthDate.getFullYear()) )/12
    spouseBage = ( calcYear.date.getMonth() - personB.SSbirthDate.getMonth() + 12 * (calcYear.date.getFullYear() - personB.SSbirthDate.getFullYear()) )/12


    //Calculate monthly benefit amounts, pre-ARF
    spouseAretirementBenefit = this.benefitService.calculateRetirementBenefit(personA, spouseAretirementBenefitDate)
    spouseBretirementBenefit = this.benefitService.calculateRetirementBenefit(personB, spouseBretirementBenefitDate)
    spouseAspousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personA, personB, 0, spouseAspousalBenefitDate)
    spouseAspousalBenefitWithRetirement = this.benefitService.calculateSpousalBenefit(personA, personB, spouseAretirementBenefit, spouseAspousalBenefitDate)
    spouseBspousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personB, personA, 0, spouseBspousalBenefitDate)
    spouseBspousalBenefitWithRetirement = this.benefitService.calculateSpousalBenefit(personB, personA, spouseBretirementBenefit, spouseBspousalBenefitDate)
    spouseAsurvivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personA, 0, personA.survivorFRA, personB, spouseBretirementBenefitDate, spouseBretirementBenefitDate)
    spouseAsurvivorBenefitWithRetirement = this.benefitService.calculateSurvivorBenefit(personA, spouseAretirementBenefit, personA.survivorFRA, personB, spouseBretirementBenefitDate, spouseBretirementBenefitDate)
    spouseBsurvivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personB, 0, personB.survivorFRA, personA, spouseAretirementBenefitDate, spouseAretirementBenefitDate)
    spouseBsurvivorBenefitWithRetirement = this.benefitService.calculateSurvivorBenefit(personB, spouseBretirementBenefit, personB.survivorFRA, personA, spouseAretirementBenefitDate, spouseAretirementBenefitDate)


    //Calculate PV via loop until both spouses are at least age 115 (by which point "remaining lives" is zero)
    while (spouseAage < 115 || spouseBage < 115){

        //Calculate number of months of retirement benefit for each spouse
        let monthsOfSpouseAretirement = this.benefitService.countBenefitMonths(spouseAretirementBenefitDate, calcYear.date)
        let monthsOfSpouseBretirement = this.benefitService.countBenefitMonths(spouseBretirementBenefitDate, calcYear.date)

        //Calculate number of months of spouseA spousalBenefit w/ retirementBenefit and number of months of spouseA spousalBenefit w/o retirementBenefit
        let monthsOfSpouseAspousal: number = this.benefitService.countBenefitMonths(spouseAspousalBenefitDate, calcYear.date)
        if (monthsOfSpouseAretirement >= monthsOfSpouseAspousal) {
          var monthsOfSpouseAspousalWithRetirement: number = monthsOfSpouseAspousal
          var monthsOfSpouseAspousalWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseAspousalWithRetirement: number = monthsOfSpouseAretirement
          var monthsOfSpouseAspousalWithoutRetirement: number = monthsOfSpouseAspousal - monthsOfSpouseAretirement
        }

        //Calculate number of months of spouseB spousalBenefit w/ retirementBenefit and number of months of spouseB spousalBenefit w/o retirementBenefit
        let monthsOfSpouseBspousal: number = this.benefitService.countBenefitMonths(spouseBspousalBenefitDate, calcYear.date)
        if (monthsOfSpouseBretirement >= monthsOfSpouseBspousal) {
          var monthsOfSpouseBspousalWithRetirement: number = monthsOfSpouseBspousal
          var monthsOfSpouseBspousalWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseBspousalWithRetirement: number = monthsOfSpouseBretirement
          var monthsOfSpouseBspousalWithoutRetirement: number = monthsOfSpouseBspousal - monthsOfSpouseBretirement
        }

        //Calculate number of months of spouseA survivorBenefit w/ retirementBenefit and number of months of spouseA survivorBenefit w/o retirementBenefit
        let monthsOfSpouseAsurvivor: number = this.benefitService.countBenefitMonths(personA.survivorFRA, calcYear.date)
        if (monthsOfSpouseAretirement >= monthsOfSpouseAsurvivor) {
          var monthsOfSpouseAsurvivorWithRetirement: number = monthsOfSpouseAsurvivor
          var monthsOfSpouseAsurvivorWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseAsurvivorWithRetirement: number = monthsOfSpouseAretirement
          var monthsOfSpouseAsurvivorWithoutRetirement: number = monthsOfSpouseAsurvivor - monthsOfSpouseAretirement
        }

        //Calculate number of months of spouseB survivorBenefit w/ retirementBenefit and number of months of spouseB survivorBenefit w/o retirementBenefit
        let monthsOfSpouseBsurvivor: number = this.benefitService.countBenefitMonths(personB.survivorFRA, calcYear.date)
        if (monthsOfSpouseBretirement >= monthsOfSpouseBsurvivor) {
          var monthsOfSpouseBsurvivorWithRetirement: number = monthsOfSpouseBsurvivor
          var monthsOfSpouseBsurvivorWithoutRetirement: number = 0
        } else {
          var monthsOfSpouseBsurvivorWithRetirement: number = monthsOfSpouseBretirement
          var monthsOfSpouseBsurvivorWithoutRetirement: number = monthsOfSpouseBsurvivor - monthsOfSpouseBretirement
        }

         //Earnings test
        if (isNaN(personA.quitWorkDate.getTime())) {
          personA.quitWorkDate = new Date(1,0,1)
        }
        if (isNaN(personB.quitWorkDate.getTime())) {
          personB.quitWorkDate = new Date(1,0,1)
        }
        if (personA.quitWorkDate > this.today || personB.quitWorkDate > this.today){//If quitWorkDates are invalid dates (because there was no input) or in the past for some reason, this whole business below gets skipped
          //Determine if it's a grace year for either spouse. If quitWorkDate has already happened (or happens this year) and at least one type of benefit has started (or starts this year)
            //Assumption: in the year they quit work, following months are non-service months.
          spouseAgraceYear = this.earningsTestService.isGraceYear(spouseAhasHadGraceYear, personA.quitWorkDate, calcYear.date, spouseAretirementBenefitDate, spouseAspousalBenefitDate, personA.survivorFRA)
          if (spouseAgraceYear === true) {spouseAhasHadGraceYear = true}  
          spouseBgraceYear = this.earningsTestService.isGraceYear(spouseBhasHadGraceYear, personB.quitWorkDate, calcYear.date, spouseBretirementBenefitDate, spouseBspousalBenefitDate, personB.survivorFRA)
          if (spouseBgraceYear === true) {spouseBhasHadGraceYear = true}  

            //Calculate necessary withholding based on each spouse's earnings
            withholdingDueToSpouseAearnings = this.earningsTestService.calculateWithholding(calcYear.date, personA.quitWorkDate, personA.FRA, personA.monthlyEarnings)
            withholdingDueToSpouseBearnings = this.earningsTestService.calculateWithholding(calcYear.date, personB.quitWorkDate, personB.FRA, personB.monthlyEarnings)

            //If divorced, withholding due to spouseB's earnings is zero
            if (scenario.maritalStatus == "divorced"){
              withholdingDueToSpouseBearnings = 0
            }
              

              //Have to loop monthly for earnings test
              let earningsTestMonth:Date = new Date(calcYear.date) //set earningsTestMonth to beginning of year
              let earningsTestEndDate:Date = new Date(calcYear.date.getFullYear(), 11, 1) //set earningsTestEndDate to Dec of currentCalculationYear
              let availableForWithholding:number
                  
              //Key point with all of the below is that A's earnings first reduce A's retirement benefit and B's spousal benefit. *Then* B's earnings reduce B's spousal benefit. See CFR 404.434
                //So we first use A's earnings to reduce A's retirement and B's spousal. And we use B's earnings to reduce B's retirement and A's spousal.
                //Then if further withholding is necessary we have their own earnings reduce their own spousal.
                  
                //Counting A's excess earnings against A's retirement and B's benefit as spouse
                while (withholdingDueToSpouseAearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                  availableForWithholding = 0 //reset availableForWithholding for new month
                  //Check what benefits there *are* this month from which we can withhold
                    if (earningsTestMonth >= spouseAretirementBenefitDate //Make sure they started their retirement benefit
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personA.FRA) //Make sure current month is prior to FRA
                    ) {  
                      availableForWithholding = availableForWithholding + spouseAretirementBenefit
                      monthsOfSpouseAretirement = monthsOfSpouseAretirement - 1
                      monthsSpouseAretirementWithheld  = monthsSpouseAretirementWithheld  + 1
                    }
                    if (scenario.maritalStatus == "married"){//Only make spouse B's benefit as a spouse available for withholding if they're currently married (as opposed to divorced). If divorced, spouseB is automatically "not working," so we don't have any withholding due to their earnings to worry about.
                      if (earningsTestMonth >= spouseBspousalBenefitDate && earningsTestMonth >= spouseBretirementBenefitDate //i.e., if this is a "spouseBspousalBenefitWithRetirementBenefit" month
                        && (spouseBgraceYear === false || earningsTestMonth < personB.quitWorkDate) //Make sure it isn't a nonservice month in grace year
                      ) {
                      availableForWithholding = availableForWithholding + spouseBspousalBenefitWithRetirement
                      monthsOfSpouseBspousalWithRetirement = monthsOfSpouseBspousalWithRetirement - 1
                      monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                      if (earningsTestMonth >= spouseBspousalBenefitDate && earningsTestMonth < spouseBretirementBenefitDate //i.e., if this is a "spouseBspousalBenefitWithoutRetirementBenefit" month
                        && (spouseBgraceYear === false || earningsTestMonth < personB.quitWorkDate) //Make sure it isn't a nonservice month in grace year
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
                earningsTestMonth = new Date(calcYear.date) //reset earningsTestMonth to beginning of year
                while (withholdingDueToSpouseBearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                  availableForWithholding = 0 //reset availableForWithholding for new month
                  //Check what benefits there *are* this month from which we can withhold:
                    if (earningsTestMonth >= spouseBretirementBenefitDate //Make sure they started their retirement benefit
                      && (spouseBgraceYear === false || earningsTestMonth < personB.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personB.FRA) //Make sure current month is prior to FRA
                    ) {
                      availableForWithholding = availableForWithholding + spouseBretirementBenefit
                      monthsOfSpouseBretirement = monthsOfSpouseBretirement - 1
                      monthsSpouseBretirementWithheld  = monthsSpouseBretirementWithheld  + 1
                    }
                    if (earningsTestMonth >= spouseAspousalBenefitDate && earningsTestMonth >= spouseAretirementBenefitDate //i.e., if this is a "spouseAspousalBenefitWithRetirementBenefit" month
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                    ) {
                    availableForWithholding = availableForWithholding + spouseAspousalBenefitWithRetirement
                    monthsOfSpouseAspousalWithRetirement = monthsOfSpouseAspousalWithRetirement - 1
                    monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                    }
                    if (earningsTestMonth >= spouseAspousalBenefitDate && earningsTestMonth < spouseAretirementBenefitDate //i.e., if this is a "spouseAspousalBenefitWithoutRetirementBenefit" month
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
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
                  earningsTestMonth = new Date(calcYear.date) //reset earningsTestMonth to beginning of year
                  while (withholdingDueToSpouseAearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                    availableForWithholding = 0
                    //Check if there is a spouseAspousal benefit this month (Always "spousalBenefitWithRetirement" because without retirement requires a restricted app. And spouseA is by definition younger than FRA here, otherwise there are no excess earnings.)
                    if (earningsTestMonth >= spouseAspousalBenefitDate && earningsTestMonth >= spouseAretirementBenefitDate
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personA.FRA) //Make sure current month is prior to FRA
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
                  earningsTestMonth = new Date(calcYear.date) //reset earningsTestMonth to beginning of year
                  while (withholdingDueToSpouseBearnings > 0 && earningsTestMonth <= earningsTestEndDate) {
                    availableForWithholding = 0
                    //Check if there is a spouseBspousal benefit this month (Always "spousalBenefitWithRetirement" because without retirement requires a restricted app. And spouseB is by definition younger than FRA here, otherwise there are no excess earnings.)
                    if (earningsTestMonth >= spouseBspousalBenefitDate && earningsTestMonth >= spouseBretirementBenefitDate
                      && (spouseBgraceYear === false || personB.quitWorkDate > earningsTestMonth) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personB.FRA) //Make sure current month is prior to FRA
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
              spouseAretirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(personA, spouseAadjustedRetirementBenefitDate)
              spouseBretirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(personB, spouseBadjustedRetirementBenefitDate)
              //Find adjusted spousal benefits
              spouseAspousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personA, personB, spouseAretirementBenefitAfterARF, spouseAadjustedSpousalBenefitDate)
              spouseAspousalBenefitWithoutRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personA, personB, 0, spouseAadjustedSpousalBenefitDate)
              spouseBspousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personB, personA, spouseBretirementBenefitAfterARF, spouseBspousalBenefitDate)
              spouseBspousalBenefitWithoutRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personB, personA, 0, spouseBadjustedSpousalBenefitDate)
              //Find adjusted survivor benefits
              spouseAsurvivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personA, spouseAretirementBenefitAfterARF, personA.survivorFRA, personB, spouseBretirementBenefitDate, spouseBretirementBenefitDate)
              spouseAsurvivorBenefitWithoutRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personA, 0, personA.survivorFRA, personB, spouseBretirementBenefitDate, spouseBretirementBenefitDate)
              spouseBsurvivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personB, spouseBretirementBenefitAfterARF, personB.survivorFRA, personA, spouseAretirementBenefitDate, spouseAretirementBenefitDate)
              spouseBsurvivorBenefitWithoutRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personB, 0, personB.survivorFRA, personA, spouseAretirementBenefitDate, spouseAretirementBenefitDate)
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
          if (calcYear.date.getFullYear() < personA.FRA.getFullYear()) {
            spouseAannualRetirementBenefit = monthsOfSpouseAretirement * spouseAretirementBenefit
            spouseAannualSpousalBenefit = (monthsOfSpouseAspousalWithoutRetirement * spouseAspousalBenefitWithoutRetirement) + (monthsOfSpouseAspousalWithRetirement * spouseAspousalBenefitWithRetirement)
          } else if (calcYear.date.getFullYear() == personA.FRA.getFullYear()){
              //Calculate number of ARF months (e.g., 10 if FRA is March)
              let ARFmonths = 12 - personA.FRA.getMonth()
              if (ARFmonths > monthsOfSpouseAretirement) {
                ARFmonths = monthsOfSpouseAretirement //Limit ARFmonths to number of months of retirement benefit
              }
              spouseAannualRetirementBenefit = ARFmonths * spouseAretirementBenefitAfterARF + (monthsOfSpouseAretirement - ARFmonths) * spouseAretirementBenefit
              //Figure out how many months there are of "pre-ARF with retirement benefit" "post-ARF with retirement benefit" and "post-ARF without retirement benefit" ("Without" months require restricted app. So none are pre-ARF)
              ARFmonths = 12 - personA.FRA.getMonth() //reset ARFmonths
              spouseAannualSpousalBenefit =
                spouseAspousalBenefitWithoutRetirementAfterARF * monthsOfSpouseAspousalWithoutRetirement //Without retirement is always after ARF
              + spouseAspousalBenefitWithRetirementAfterARF * (ARFmonths - monthsOfSpouseAspousalWithoutRetirement) //post-ARF "with retirement" months is ARF months minus the "without retirement months"
              + spouseAspousalBenefitWithRetirement * (monthsOfSpouseAspousalWithRetirement - (ARFmonths - monthsOfSpouseAspousalWithoutRetirement)) //pre-ARF "with retirement" months is total "with retirement" months minus the post-ARF "with" months (calculated in line above)
            } else {//i.e., if whole year is past FRA
              spouseAannualRetirementBenefit = monthsOfSpouseAretirement * spouseAretirementBenefitAfterARF
              spouseAannualSpousalBenefit = (monthsOfSpouseAspousalWithoutRetirement * spouseAspousalBenefitWithoutRetirementAfterARF) + (monthsOfSpouseAspousalWithRetirement * spouseAspousalBenefitWithRetirementAfterARF)
            }

          //Spouse B retirement and spousal
          if (calcYear.date.getFullYear() < personB.FRA.getFullYear()) {
            spouseBannualRetirementBenefit = monthsOfSpouseBretirement * spouseBretirementBenefit
            spouseBannualSpousalBenefit = (monthsOfSpouseBspousalWithoutRetirement * spouseBspousalBenefitWithoutRetirement) + (monthsOfSpouseBspousalWithRetirement * spouseBspousalBenefitWithRetirement)
          } else if (calcYear.date.getFullYear() == personB.FRA.getFullYear()){
              //Calculate number of ARF months (e.g., 10 if FRA is March)
              let ARFmonths = 12 - personB.FRA.getMonth()
              if (ARFmonths > monthsOfSpouseBretirement) {
                ARFmonths = monthsOfSpouseBretirement //Limit ARFmonths to number of months of retirement benefit
              }
              spouseBannualRetirementBenefit = ARFmonths * spouseBretirementBenefitAfterARF + (monthsOfSpouseBretirement - ARFmonths) * spouseBretirementBenefit
              //Figure out how many months there are of "pre-ARF with retirement benefit" "post-ARF with retirement benefit" and "post-ARF without retirement benefit" ("Without" months require restricted app. So none are pre-ARF)
              ARFmonths = 12 - personA.FRA.getMonth() //reset ARFmonths
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
          if (scenario.maritalStatus == "divorced") {
            spouseBannualRetirementBenefit = 0
            spouseBannualSpousalBenefit = 0
            spouseBannualSurvivorBenefit = 0
          }


      //Calculate each person's probability of being alive at end of age in question
        probabilityAalive = this.mortalityService.calculateProbabilityAlive(personA, spouseAage)
        probabilityBalive = this.mortalityService.calculateProbabilityAlive(personB, spouseBage)

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
            annualPV = annualPV / (1 + scenario.discountRate/100/2) / Math.pow((1 + scenario.discountRate/100),(olderAge - 62))
 
     /*
      //Logging for debugging purposes
        if (this.maximizedOrNot === true) {
          console.log(currentCalculationDate)
          console.log("spouseAage: " + spouseAage)
          console.log("spouseAgraceYear: " + spouseAgraceYear)
          console.log("monthsSpouseAretirementWithheld: " + monthsSpouseAretirementWithheld)
          console.log("spouseAadjustedBenefitDate: " + spouseAadjustedRetirementBenefitDate)
          console.log("spouseAretirementBenefit: " + spouseAretirementBenefit)
          console.log("spouseAretirementBenefitAfterARF: " + spouseAretirementBenefitAfterARF)
          console.log("monthsOfSpouseAretirement: " + monthsOfSpouseAretirement)
          console.log("spouseAannualRetirementBenefit: " + spouseAannualRetirementBenefit)
          console.log("spouseAannualSpousalBenefit: " + spouseAannualSpousalBenefit)
          console.log("spouseAannualSurvivorBenefit: " + spouseAannualSurvivorBenefit)
          console.log("spouseBage: " + spouseBage)
          console.log("spouseBgraceYear: " + spouseBgraceYear)
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
        //calcYear.date.setFullYear(calcYear.date.getFullYear()+1)
        let newCalcDate:Date = new Date(calcYear.date.getFullYear()+1, 0, 1)
        calcYear = new CalculationYear(newCalcDate)
    }

    return couplePV
  }




  maximizeSinglePersonPV(person:Person, scenario:ClaimingScenario){
    //find initial testClaimingDate for age 62
    let testClaimingDate = new Date(person.SSbirthDate.getFullYear()+62, 1, 1)
    if (person.actualBirthDate.getDate() <= 2){
      testClaimingDate.setMonth(person.actualBirthDate.getMonth())
    } else {
      testClaimingDate.setMonth(person.actualBirthDate.getMonth()+1)
    }

    //If user is currently over age 62 when filling out form, set testClaimingDate to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
    let ageToday = this.today.getFullYear() - person.SSbirthDate.getFullYear() + (this.today.getMonth() - person.SSbirthDate.getMonth())/12
    if (ageToday > 62){
      testClaimingDate.setMonth(this.today.getMonth())
      testClaimingDate.setFullYear(this.today.getFullYear())
    }

    //Run calculateSinglePersonPV for their earliest possible claiming date, save the PV and the date.
    let savedPV: number = this.calculateSinglePersonPV(person, testClaimingDate, scenario)
    let savedClaimingDate = new Date(testClaimingDate)

    //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
    let endingTestDate = new Date(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth()-1, 1)
    while (testClaimingDate <= endingTestDate){
      //Add 1 month to claiming age and run both calculations again and compare results. Save better of the two. (If they're literally the same, save the second one tested, because it gives better longevity insurance)
      testClaimingDate.setMonth(testClaimingDate.getMonth() + 1)
      let currentTestPV = this.calculateSinglePersonPV(person, testClaimingDate, scenario)
      if (currentTestPV >= savedPV)
        {savedClaimingDate.setMonth(testClaimingDate.getMonth())
          savedClaimingDate.setFullYear(testClaimingDate.getFullYear())
          savedPV = currentTestPV}
    }
    //after loop is finished
    console.log("saved PV: " + savedPV)
    console.log("savedClaimingDate: " + savedClaimingDate)

    //Generate solution set (for sake of output) from saved values
    let solutionSet:SolutionSet = this.solutionSetService.generateSingleSolutionSet(scenario.maritalStatus, person.SSbirthDate, person, Number(savedPV), savedClaimingDate)
    this.maximizedOrNot = true
    return solutionSet
  }


  maximizeCouplePV(personA:Person, personB:Person, scenario:ClaimingScenario){

    let deemedFilingCutoff: Date = new Date(1954, 0, 1)

    //find initial test dates for spouseA (first month for which spouseA is considered 62 for entire month)
    let spouseAretirementDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
    let spouseAspousalDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
    if (personA.actualBirthDate.getDate() <= 2){
      spouseAretirementDate.setMonth(personA.actualBirthDate.getMonth())
      spouseAspousalDate.setMonth(personA.actualBirthDate.getMonth())
    } else {
      spouseAretirementDate.setMonth(personA.actualBirthDate.getMonth()+1)
      spouseAspousalDate.setMonth(personA.actualBirthDate.getMonth()+1)
    }
    //If spouseA is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
    let today = new Date()
    let spouseAageToday: number = today.getFullYear() - personA.SSbirthDate.getFullYear() + (today.getMonth() - personA.SSbirthDate.getMonth()) /12
    if (spouseAageToday > 62){
      spouseAretirementDate.setMonth(today.getMonth())
      spouseAretirementDate.setFullYear(today.getFullYear())
      spouseAspousalDate.setMonth(today.getMonth())
      spouseAspousalDate.setFullYear(today.getFullYear())
    }
    //Do all of the same, but for spouseB.
    let spouseBretirementDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
    let spouseBspousalDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
    if (personB.actualBirthDate.getDate() <= 2){
      spouseBretirementDate.setMonth(personB.actualBirthDate.getMonth())
      spouseBspousalDate.setMonth(personB.actualBirthDate.getMonth())
    } else {
      spouseBretirementDate.setMonth(personB.actualBirthDate.getMonth()+1)
      spouseBspousalDate.setMonth(personB.actualBirthDate.getMonth()+1)
    }
    let spouseBageToday: number = today.getFullYear() - personB.SSbirthDate.getFullYear() + (today.getMonth() - personB.SSbirthDate.getMonth()) /12
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
    let spouseAendTestDate = new Date(personA.SSbirthDate.getFullYear()+70, personA.SSbirthDate.getMonth(), 1)
    let spouseBendTestDate = new Date(personB.SSbirthDate.getFullYear()+70, personB.SSbirthDate.getMonth(), 1)

    while (spouseAretirementDate <= spouseAendTestDate) {
        //Reset spouseB test dates to earliest possible (i.e., their "age 62 for whole month" month or today's month if they're currently older than 62, but never earlier than spouse A's retirementDate)
        if (spouseBageToday > 62){
          spouseBretirementDate.setMonth(today.getMonth())
          spouseBretirementDate.setFullYear(today.getFullYear())
          spouseBspousalDate.setMonth(today.getMonth())
          spouseBspousalDate.setFullYear(today.getFullYear())
        } else {
            spouseBretirementDate.setFullYear(personB.SSbirthDate.getFullYear()+62)
            spouseBspousalDate.setFullYear(personB.SSbirthDate.getFullYear()+62)
            if (personB.actualBirthDate.getDate() <= 2){
              spouseBretirementDate.setMonth(personB.actualBirthDate.getMonth())
              spouseBspousalDate.setMonth(personB.actualBirthDate.getMonth())
            } else {
              spouseBretirementDate.setMonth(personB.actualBirthDate.getMonth()+1)
              spouseBspousalDate.setMonth(personB.actualBirthDate.getMonth()+1)
            }
        }
        if (spouseBspousalDate < spouseAretirementDate) {
          spouseBspousalDate.setMonth(spouseAretirementDate.getMonth())
          spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear())
        }

          //After spouse B's retirement testdate has been reset, reset spouseA's spousal date as necessary
            //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
            if (personA.actualBirthDate > deemedFilingCutoff) {
              if (spouseAretirementDate > spouseBretirementDate) {
                spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
              } else {
                spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
              }
            }
            else {//i.e., if spouseA has old deemed filing rules
              if (spouseAretirementDate < personA.FRA) {
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
                if (personA.FRA > spouseBretirementDate) {
                  spouseAspousalDate.setMonth(personA.FRA.getMonth())
                  spouseAspousalDate.setFullYear(personA.FRA.getFullYear())
                } else {
                  spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                }
              }
            }

        while (spouseBretirementDate <= spouseBendTestDate) {
          //Calculate PV using current testDates
            let currentTestPV: number = this.calculateCouplePV(personA, personB, spouseAretirementDate, spouseBretirementDate, spouseAspousalDate, spouseBspousalDate, scenario)
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
            if (personB.actualBirthDate > deemedFilingCutoff) {
              if (spouseBspousalDate <= spouseBretirementDate) {
                spouseBspousalDate.setMonth(spouseBspousalDate.getMonth()+1)
              }
              spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
            }
          
            else {//i.e., if spouseB has old deemed filing rules
              //if spouseBretirementDate < FRA, increment both test dates by 1. (Don't increment spousalDate though if it is currently set later than retirementDate.)
              if (spouseBretirementDate < personB.FRA) {
                if (spouseBspousalDate <= spouseBretirementDate) {
                  spouseBspousalDate.setMonth(spouseBspousalDate.getMonth()+1)
                }
                spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
                //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
              }
              else {//i.e., if spouseBretirementDate >= FRA
                //Increment retirement testdate by 1 and set spousal date to earliest possible restricted application date (later of FRA or other spouse's retirementtestdate)
                spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
                if (spouseAretirementDate > personB.FRA) {
                  spouseBspousalDate.setMonth(spouseAretirementDate.getMonth())
                  spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                } else {
                  spouseBspousalDate.setMonth(personB.FRA.getMonth())
                  spouseBspousalDate.setFullYear(personB.FRA.getFullYear())
                }
              }

            }
          //After spouse B's retirement testdate has been incremented, adjust spouseA's spousal date as necessary
            //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
              if (personA.actualBirthDate > deemedFilingCutoff) {
                if (spouseAretirementDate > spouseBretirementDate) {
                  spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                } else {
                  spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                }
              }
              else {//i.e., if spouseA has old deemed filing rules
                if (spouseAretirementDate < personA.FRA) {
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
                  if (personA.FRA > spouseBretirementDate) {
                    spouseAspousalDate.setMonth(personA.FRA.getMonth())
                    spouseAspousalDate.setFullYear(personA.FRA.getFullYear())
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

      //Generate solution set (for sake of output) from saved values
      let solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario.maritalStatus, personA, personB, spouseAsavedRetirementDate, spouseBsavedRetirementDate, spouseAsavedSpousalDate, spouseBsavedSpousalDate, Number(savedPV))
      
      this.maximizedOrNot = true
      return solutionSet
  }


  //This function is for when personB has already filed. Also is the function for a divorcee, because we take the ex-spouse's filing date as a given (i.e., as an input)
  maximizeCouplePVpersonBisFixed(scenario:ClaimingScenario, personBfixedRetirementDate:Date, personA:Person, personB:Person){

      let deemedFilingCutoff: Date = new Date(1954, 0, 1)

      //find initial test dates for flexibleSpouse (first month for which flexibleSpouse is considered 62 for entire month)
      let personAretirementDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
      let personAspousalDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
      if (personA.actualBirthDate.getDate() <= 2){
        personAretirementDate.setMonth(personA.actualBirthDate.getMonth())
        personAspousalDate.setMonth(personA.actualBirthDate.getMonth())
      } else {
        personAretirementDate.setMonth(personA.actualBirthDate.getMonth()+1)
        personAspousalDate.setMonth(personA.actualBirthDate.getMonth()+1)
      }
      //If flexibleSpouse is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
      let personAageToday: number = this.today.getFullYear() - personA.SSbirthDate.getFullYear() + (this.today.getMonth() - personA.SSbirthDate.getMonth()) /12
      //TODO: could be just personA.initialAge, yeah?
      if (personAageToday > 62){
        personAretirementDate.setMonth(this.today.getMonth())
        personAretirementDate.setFullYear(this.today.getFullYear())
        personAspousalDate.setMonth(this.today.getMonth())
        personAspousalDate.setFullYear(this.today.getFullYear())
      }

      //Don't let flexibleSpouseSpousalDate be earlier than first month for which fixedSpouse is 62 for whole month.
        //This only matters for divorcee scenario. For still-married scenario where one spouse has filed, that filing date is already in the past, so it won't suggest an earlier spousal date for flexible spouse anyway.
      let personB62Date = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
      if (personB.actualBirthDate.getDate() <= 2){
        personB62Date.setMonth(personB.actualBirthDate.getMonth())
      } else {
        personB62Date.setMonth(personB.actualBirthDate.getMonth()+1)
      }
      if (personAspousalDate < personB62Date) {
        personAspousalDate.setFullYear(personB62Date.getFullYear())
        personAspousalDate.setMonth(personB62Date.getMonth())
      }

      //Initialize savedPV as zero. Set saved dates equal to their current testDates.
      let savedPV: number = 0
      let personAsavedRetirementDate = new Date(personAretirementDate)
      let personAsavedSpousalDate = new Date(personAspousalDate)

      //Set endTestDate equal to the month flexibleSpouse turns 70
      let endTestDate = new Date(personA.SSbirthDate.getFullYear()+70, personA.SSbirthDate.getMonth(), 1)

      //In theory: set fixed spouse's spousalDate equal to later of their own retirement benefit date or flexible spouse's retirement benefit date
          //In actuality: set it equal to flexible spouse's retirement benefit date, because that's always the later of the two (since fixed has already filed) 
          //For divorcee this date won't matter at all, since annual PV is ultimately set to zero for spouse b's spousal benefit, but PV calc will require it.
      let personBspousalDate: Date = new Date(personAretirementDate)
      let personBsavedSpousalDate: Date = new Date(personBspousalDate)            

      while (personAretirementDate <= endTestDate) {
        //Calculate PV using current test dates for flexibleSpouse and fixed dates for fixedSpouse
        let currentTestPV: number = this.calculateCouplePV(personA, personB, personAretirementDate, personBfixedRetirementDate, personAspousalDate, personBspousalDate, scenario)

        //If PV is greater than or equal to saved PV, save new PV and save new testDates
        if (currentTestPV >= savedPV) {
          savedPV = currentTestPV
          personAsavedRetirementDate.setMonth(personAretirementDate.getMonth())
          personAsavedRetirementDate.setFullYear(personAretirementDate.getFullYear())
          personAsavedSpousalDate.setMonth(personAspousalDate.getMonth())
          personAsavedSpousalDate.setFullYear(personAspousalDate.getFullYear())
          personBsavedSpousalDate.setMonth(personBspousalDate.getMonth())
          personBsavedSpousalDate.setFullYear(personBspousalDate.getFullYear())
          }
        
        //Increment flexibleSpouse's dates (and fixedSpouse's spousal date, since it is just set to be same as flexible spouse's retirement date)
          //if new deemed filing rules, increment flexibleSpouse's retirement and spousal by 1 month
          if (personA.actualBirthDate > deemedFilingCutoff) {
            personAretirementDate.setMonth(personAretirementDate.getMonth()+1)
            personBspousalDate.setMonth(personBspousalDate.getMonth()+1)
            if (personAspousalDate <= personAretirementDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
              personAspousalDate.setMonth(personAspousalDate.getMonth()+1)
            }
          } else { //i.e., if old deemed filling rules apply
            //If current retirement test date younger than FRA, increment flexibleSpouse's retirement and spousal by 1 month
            if (personAretirementDate < personA.FRA) {
              personAretirementDate.setMonth(personAretirementDate.getMonth()+1)
              personBspousalDate.setMonth(personBspousalDate.getMonth()+1)
              if (personAspousalDate <= personAretirementDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
              personAspousalDate.setMonth(personAspousalDate.getMonth()+1)
              }
            }
            else {//If current retirement test date beyond FRA, increment flexibleSpouse's retirement by 1 month and keep flexibleSpouse's spousal where it is (at FRA, unless they're older than FRA when filling form)
              personAretirementDate.setMonth(personAretirementDate.getMonth()+1)
              personBspousalDate.setMonth(personBspousalDate.getMonth()+1)
            }
          }

      }
        //after loop is finished
        console.log("saved PV: " + savedPV)
        console.log("saved flexibleSpouseRetirementDate: " + personAsavedRetirementDate)
        console.log("saved flexibleSpouseSpousalDate: " + personAsavedSpousalDate)
    
        let solutionSet:SolutionSet = this.solutionSetService.generateCoupleOneHasFiledSolutionSet(personA, personB, scenario,
        personAsavedRetirementDate, personAsavedSpousalDate, personBfixedRetirementDate, personBsavedSpousalDate, Number(savedPV))

        this.maximizedOrNot = true
        return solutionSet
    }


//This function is for when personA has already filed.
maximizeCouplePVpersonAisFixed(scenario:ClaimingScenario, personAfixedRetirementDate:Date, personA:Person, personB:Person){

  let deemedFilingCutoff: Date = new Date(1954, 0, 1)

  //find initial test dates for flexibleSpouse (first month for which flexibleSpouse is considered 62 for entire month)
  let personBretirementDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
  let personBspousalDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
  if (personB.actualBirthDate.getDate() <= 2){
    personBretirementDate.setMonth(personB.actualBirthDate.getMonth())
    personBspousalDate.setMonth(personB.actualBirthDate.getMonth())
  } else {
    personBretirementDate.setMonth(personB.actualBirthDate.getMonth()+1)
    personBspousalDate.setMonth(personA.actualBirthDate.getMonth()+1)
  }
  //If flexibleSpouse is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
  let personBageToday: number = this.today.getFullYear() - personB.SSbirthDate.getFullYear() + (this.today.getMonth() - personB.SSbirthDate.getMonth()) /12
  //TODO: could be just personA.initialAge, yeah?
  if (personBageToday > 62){
    personBretirementDate.setMonth(this.today.getMonth())
    personBretirementDate.setFullYear(this.today.getFullYear())
    personBspousalDate.setMonth(this.today.getMonth())
    personBspousalDate.setFullYear(this.today.getFullYear())
  }

  //Don't let flexibleSpouseSpousalDate be earlier than first month for which fixedSpouse is 62 for whole month.
    //This only matters for divorcee scenario. For still-married scenario where one spouse has filed, that filing date is already in the past, so it won't suggest an earlier spousal date for flexible spouse anyway.
  let personA62Date = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
  if (personA.actualBirthDate.getDate() <= 2){
    personA62Date.setMonth(personA.actualBirthDate.getMonth())
  } else {
    personA62Date.setMonth(personA.actualBirthDate.getMonth()+1)
  }
  if (personBspousalDate < personA62Date) {
    personBspousalDate.setFullYear(personA62Date.getFullYear())
    personBspousalDate.setMonth(personA62Date.getMonth())
  }

  //Initialize savedPV as zero. Set saved dates equal to their current testDates.
  let savedPV: number = 0
  let personBsavedRetirementDate = new Date(personBretirementDate)
  let personBsavedSpousalDate = new Date(personBspousalDate)

  //Set endTestDate equal to the month flexibleSpouse turns 70
  let endTestDate = new Date(personB.SSbirthDate.getFullYear()+70, personB.SSbirthDate.getMonth(), 1)

  //In theory: set fixed spouse's spousalDate equal to later of their own retirement benefit date or flexible spouse's retirement benefit date
      //In actuality: set it equal to flexible spouse's retirement benefit date, because that's always the later of the two (since fixed has already filed) 
  let personAspousalDate: Date = new Date(personBretirementDate)
  let personAsavedSpousalDate: Date = new Date(personAspousalDate)            

  while (personBretirementDate <= endTestDate) {
    //Calculate PV using current test dates for flexibleSpouse and fixed dates for fixedSpouse
    let currentTestPV: number = this.calculateCouplePV(personB, personA, personBretirementDate, personAfixedRetirementDate, personBspousalDate, personAspousalDate, scenario)

    //If PV is greater than or equal to saved PV, save new PV and save new testDates
    if (currentTestPV >= savedPV) {
      savedPV = currentTestPV
      personBsavedRetirementDate.setMonth(personBretirementDate.getMonth())
      personBsavedRetirementDate.setFullYear(personBretirementDate.getFullYear())
      personBsavedSpousalDate.setMonth(personBspousalDate.getMonth())
      personBsavedSpousalDate.setFullYear(personBspousalDate.getFullYear())
      personAsavedSpousalDate.setMonth(personAspousalDate.getMonth())
      personAsavedSpousalDate.setFullYear(personAspousalDate.getFullYear())
      }
    
    //Increment flexibleSpouse's dates (and fixedSpouse's spousal date, since it is just set to be same as flexible spouse's retirement date)
      //if new deemed filing rules, increment flexibleSpouse's retirement and spousal by 1 month
      if (personB.actualBirthDate > deemedFilingCutoff) {
        personBretirementDate.setMonth(personBretirementDate.getMonth()+1)
        personAspousalDate.setMonth(personAspousalDate.getMonth()+1)
        if (personBspousalDate <= personBretirementDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
          personBspousalDate.setMonth(personBspousalDate.getMonth()+1)
        }
      } else { //i.e., if old deemed filling rules apply
        //If current retirement test date younger than FRA, increment flexibleSpouse's retirement and spousal by 1 month
        if (personBretirementDate < personB.FRA) {
          personBretirementDate.setMonth(personBretirementDate.getMonth()+1)
          personAspousalDate.setMonth(personAspousalDate.getMonth()+1)
          if (personBspousalDate <= personBretirementDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
          personBspousalDate.setMonth(personBspousalDate.getMonth()+1)
          }
        }
        else {//If current retirement test date beyond FRA, increment flexibleSpouse's retirement by 1 month and keep flexibleSpouse's spousal where it is (at FRA, unless they're older than FRA when filling form)
          personBretirementDate.setMonth(personBretirementDate.getMonth()+1)
          personAspousalDate.setMonth(personAspousalDate.getMonth()+1)
        }
      }

  }
    //after loop is finished
    console.log("saved PV: " + savedPV)
    console.log("saved flexibleSpouseRetirementDate: " + personBsavedRetirementDate)
    console.log("saved flexibleSpouseSpousalDate: " + personBsavedSpousalDate)

    let solutionSet:SolutionSet = this.solutionSetService.generateCoupleOneHasFiledSolutionSet(personB, personA, scenario,
    personBsavedRetirementDate, personBsavedSpousalDate, personAfixedRetirementDate, personAsavedSpousalDate, Number(savedPV))

    this.maximizedOrNot = true
    return solutionSet
}

}
