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

  calculateSinglePersonPV(person:Person, scenario:ClaimingScenario)
  {
    person.retirementBenefit = this.benefitService.calculateRetirementBenefit(person, person.retirementBenefitDate)
    let retirementPV: number = 0
    let probabilityAlive: number
    let withholdingAmount: number
    let monthsWithheld: number = 0
    let graceYear: boolean = false
    person.hasHadGraceYear = false //reset hasHadGraceYear for new PV calc

    //Find Jan 1 of the year they plan to start benefit
    let initialCalcDate:Date = new Date(person.retirementBenefitDate.getFullYear(), 0, 1)
    let calcYear:CalculationYear = new CalculationYear(initialCalcDate)

    //calculate age as of that date
    let age: number = ( 12 * (calcYear.date.getFullYear() - person.SSbirthDate.getFullYear()) + (calcYear.date.getMonth()) - person.SSbirthDate.getMonth()  )/12

    //Calculate PV via loop until they hit age 115 (by which point "remaining lives" is zero)
      while (age < 115) {

      //Count number of months in year that are before/after inputBenefitDate
      calcYear.monthsOfPersonAretirement = this.benefitService.countBenefitMonths(person.retirementBenefitDate, calcYear.date)


          //Earnings test
          if (isNaN(person.quitWorkDate.getTime())) {
            person.quitWorkDate = new Date(1,0,1)
          }
          if (person.quitWorkDate > this.today){//If quitWorkDate is an invalid date (because there was no input) or is in the past for some reason, this whole business below gets skipped  
              //Determine if it's a grace year. If quitWorkDate has already happened (or happens this year) and retirement benefit has started (or starts this year) it's a grace year
                //Assumption: in the year they quit work, following months are non-service months.
              graceYear = this.earningsTestService.isGraceYear(person.hasHadGraceYear, person.quitWorkDate, calcYear.date, person.retirementBenefitDate)
              if (graceYear === true) {person.hasHadGraceYear = true}
               
              //Calculate necessary withholding based on earnings
              withholdingAmount = this.earningsTestService.calculateWithholding(calcYear.date, person.quitWorkDate, person.FRA, person.monthlyEarnings)

              //Have to loop monthly for earnings test
              let earningsTestMonth:Date = new Date(calcYear.date) //set earningsTestMonth to beginning of year
              let earningsTestEndDate:Date = new Date(calcYear.date.getFullYear(), 11, 1) //set earningsTestEndDate to Dec of currentCalculationYear
              let availableForWithholding:number
              while (withholdingAmount > 0 && earningsTestMonth <= earningsTestEndDate) {
                availableForWithholding = 0 //reset availableForWithholding for new month
                //Checks to see if there is a retirement benefit this month from which we can withhold:
                  if (earningsTestMonth >= person.retirementBenefitDate  //check that they've started retirement benefit
                    && (graceYear === false || earningsTestMonth < person.quitWorkDate ) //make sure it isn't a nonservice month in grace year
                    && (earningsTestMonth < person.FRA) //make sure current month is prior to FRA
                  ) {
                    availableForWithholding = availableForWithholding + person.retirementBenefit
                    calcYear.monthsOfPersonAretirement = calcYear.monthsOfPersonAretirement - 1
                    monthsWithheld  = monthsWithheld + 1
                  }
                //Subtracting 1 from monthsOfRetirement will often result in overwithholding (as it does in real life) for a partial month. Gets added back later.
                //Reduce necessary withholding by the amount we withhold this month:
                withholdingAmount = withholdingAmount - availableForWithholding //(this kicks us out of loop, potentially)
                earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
              }
            //Find new retirementBenefit, after recalculation ("AdjustmentReductionFactor") at FRA
            person.adjustedRetirementBenefitDate = new Date(person.retirementBenefitDate.getFullYear(), person.retirementBenefitDate.getMonth()+monthsWithheld, 1)
            person.retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(person, person.adjustedRetirementBenefitDate)

            }
          //Ignore earnings test if user wasn't working
          else {
            withholdingAmount = 0
            person.retirementBenefitAfterARF = person.retirementBenefit
          }

          //withholdingAmount is negative at this point if we overwithheld. Have to add that negative amounts back to annual benefit amounts
            //We add it back to annual retirement benefit in a moment.
            calcYear.personAoverWithholding = 0
            if (withholdingAmount < 0) {
              calcYear.personAoverWithholding = calcYear.personAoverWithholding - withholdingAmount
            }
          
          //Calculate annual benefit (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
          calcYear = this.benefitService.calculateAnnualBenefitAmountSingle(person, calcYear)

          //Calculate probability of being alive at end of age in question
          probabilityAlive = this.mortalityService.calculateProbabilityAlive(person, age)

          //Calculate probability-weighted benefit
          let annualPV = calcYear.personAannualRetirementBenefit * probabilityAlive

          //Discount that benefit to age 62
          annualPV = annualPV / (1 + scenario.discountRate/100/2) //e.g., benefits received during age 62 must be discounted for 0.5 years
          annualPV = annualPV / Math.pow((1 + scenario.discountRate/100),(age - 62)) //e.g., benefits received during age 63 must be discounted for 1.5 years

          //Add discounted benefit to ongoing count of retirementPV, add 1 year to age and calculationYear, and start loop over
          retirementPV = retirementPV + annualPV
          age = age + 1
          let newCalcDate:Date = new Date(calcYear.date.getFullYear()+1, 0, 1)
          calcYear = new CalculationYear(newCalcDate)
      }
        return retirementPV
  }

  calculateCouplePV(personA:Person, personB:Person, scenario:ClaimingScenario){
    
    //Assorted variables
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
    let spouseBgraceYear: boolean = false

    //reset hasHadGraceYear values to false for new PV calc
    personA.hasHadGraceYear = false
    personB.hasHadGraceYear = false


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
    personA.retirementBenefit = this.benefitService.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
    personB.retirementBenefit = this.benefitService.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
    personA.spousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personA, personB, 0, personA.spousalBenefitDate)
    personA.spousalBenefitWithRetirement = this.benefitService.calculateSpousalBenefit(personA, personB, personA.retirementBenefit, personA.spousalBenefitDate)
    personB.spousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personB, personA, 0, personB.spousalBenefitDate)
    personB.spousalBenefitWithRetirement = this.benefitService.calculateSpousalBenefit(personB, personA, personB.retirementBenefit, personB.spousalBenefitDate)
    personA.survivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personA, 0, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
    personA.survivorBenefitWithRetirement = this.benefitService.calculateSurvivorBenefit(personA, personA.retirementBenefit, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
    personB.survivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personB, 0, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
    personB.survivorBenefitWithRetirement = this.benefitService.calculateSurvivorBenefit(personB, personB.retirementBenefit, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)


    //Calculate PV via loop until both spouses are at least age 115 (by which point "remaining lives" is zero)
    while (spouseAage < 115 || spouseBage < 115){

        //Calculate number of months of retirement benefit for each spouse
        calcYear.monthsOfPersonAretirement = this.benefitService.countBenefitMonths(personA.retirementBenefitDate, calcYear.date)
        calcYear.monthsOfPersonBretirement = this.benefitService.countBenefitMonths(personB.retirementBenefitDate, calcYear.date)

        //Calculate number of months of spouseA spousalBenefit w/ retirementBenefit and number of months of spouseA spousalBenefit w/o retirementBenefit
        calcYear.monthsOfPersonAspousal = this.benefitService.countBenefitMonths(personA.spousalBenefitDate, calcYear.date)
        if (calcYear.monthsOfPersonAretirement >= calcYear.monthsOfPersonAspousal) {
          calcYear.monthsOfPersonAspousalWithRetirement = calcYear.monthsOfPersonAspousal
          calcYear.monthsOfPersonAspousalWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonAspousalWithRetirement = calcYear.monthsOfPersonAretirement
          calcYear.monthsOfPersonAspousalWithoutRetirement = calcYear.monthsOfPersonAspousal - calcYear.monthsOfPersonAretirement
        }

        //Calculate number of months of spouseB spousalBenefit w/ retirementBenefit and number of months of spouseB spousalBenefit w/o retirementBenefit
        calcYear.monthsOfPersonBspousal = this.benefitService.countBenefitMonths(personB.spousalBenefitDate, calcYear.date)
        if (calcYear.monthsOfPersonBretirement >= calcYear.monthsOfPersonBspousal) {
          calcYear.monthsOfPersonBspousalWithRetirement = calcYear.monthsOfPersonBspousal
          calcYear.monthsOfPersonBspousalWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonBspousalWithRetirement = calcYear.monthsOfPersonBretirement
          calcYear.monthsOfPersonBspousalWithoutRetirement = calcYear.monthsOfPersonBspousal - calcYear.monthsOfPersonBretirement
        }

        //Calculate number of months of spouseA survivorBenefit w/ retirementBenefit and number of months of spouseA survivorBenefit w/o retirementBenefit
        calcYear.monthsOfPersonAsurvivor = this.benefitService.countBenefitMonths(personA.survivorFRA, calcYear.date)
        if (calcYear.monthsOfPersonAretirement >= calcYear.monthsOfPersonAsurvivor) {
          calcYear.monthsOfPersonAsurvivorWithRetirement = calcYear.monthsOfPersonAsurvivor
          calcYear.monthsOfPersonAsurvivorWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonAsurvivorWithRetirement = calcYear.monthsOfPersonAretirement
          calcYear.monthsOfPersonAsurvivorWithoutRetirement = calcYear.monthsOfPersonAsurvivor - calcYear.monthsOfPersonAretirement
        }

        //Calculate number of months of spouseB survivorBenefit w/ retirementBenefit and number of months of spouseB survivorBenefit w/o retirementBenefit
        calcYear.monthsOfPersonBsurvivor = this.benefitService.countBenefitMonths(personB.survivorFRA, calcYear.date)
        if (calcYear.monthsOfPersonBretirement >= calcYear.monthsOfPersonBsurvivor) {
          calcYear.monthsOfPersonBsurvivorWithRetirement = calcYear.monthsOfPersonBsurvivor
          calcYear.monthsOfPersonBsurvivorWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonBsurvivorWithRetirement = calcYear.monthsOfPersonBretirement
          calcYear.monthsOfPersonBsurvivorWithoutRetirement = calcYear.monthsOfPersonBsurvivor - calcYear.monthsOfPersonBretirement
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
          spouseAgraceYear = this.earningsTestService.isGraceYear(personA.hasHadGraceYear, personA.quitWorkDate, calcYear.date, personA.retirementBenefitDate, personA.spousalBenefitDate, personA.survivorFRA)
          if (spouseAgraceYear === true) {personA.hasHadGraceYear = true}  
          spouseBgraceYear = this.earningsTestService.isGraceYear(personB.hasHadGraceYear, personB.quitWorkDate, calcYear.date, personB.retirementBenefitDate, personB.spousalBenefitDate, personB.survivorFRA)
          if (spouseBgraceYear === true) {personB.hasHadGraceYear = true}  

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
                    if (earningsTestMonth >= personA.retirementBenefitDate //Make sure they started their retirement benefit
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personA.FRA) //Make sure current month is prior to FRA
                    ) {  
                      availableForWithholding = availableForWithholding + personA.retirementBenefit
                      calcYear.monthsOfPersonAretirement = calcYear.monthsOfPersonAretirement - 1
                      monthsSpouseAretirementWithheld  = monthsSpouseAretirementWithheld  + 1
                    }
                    if (scenario.maritalStatus == "married"){//Only make spouse B's benefit as a spouse available for withholding if they're currently married (as opposed to divorced). If divorced, spouseB is automatically "not working," so we don't have any withholding due to their earnings to worry about.
                      if (earningsTestMonth >= personB.spousalBenefitDate && earningsTestMonth >= personB.retirementBenefitDate //i.e., if this is a "spouseBspousalBenefitWithRetirementBenefit" month
                        && (spouseBgraceYear === false || earningsTestMonth < personB.quitWorkDate) //Make sure it isn't a nonservice month in grace year
                      ) {
                      availableForWithholding = availableForWithholding + personB.spousalBenefitWithRetirement
                      calcYear.monthsOfPersonBspousalWithRetirement = calcYear.monthsOfPersonBspousalWithRetirement - 1
                      monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                      if (earningsTestMonth >= personB.spousalBenefitDate && earningsTestMonth < personB.retirementBenefitDate //i.e., if this is a "spouseBspousalBenefitWithoutRetirementBenefit" month
                        && (spouseBgraceYear === false || earningsTestMonth < personB.quitWorkDate) //Make sure it isn't a nonservice month in grace year
                      ){
                      availableForWithholding = availableForWithholding + personB.spousalBenefitWithoutRetirement
                      calcYear.monthsOfPersonBspousalWithoutRetirement = calcYear.monthsOfPersonBspousalWithoutRetirement - 1
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
                    if (earningsTestMonth >= personB.retirementBenefitDate //Make sure they started their retirement benefit
                      && (spouseBgraceYear === false || earningsTestMonth < personB.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personB.FRA) //Make sure current month is prior to FRA
                    ) {
                      availableForWithholding = availableForWithholding + personB.retirementBenefit
                      calcYear.monthsOfPersonBretirement = calcYear.monthsOfPersonBretirement - 1
                      monthsSpouseBretirementWithheld  = monthsSpouseBretirementWithheld  + 1
                    }
                    if (earningsTestMonth >= personA.spousalBenefitDate && earningsTestMonth >= personA.retirementBenefitDate //i.e., if this is a "spouseAspousalBenefitWithRetirementBenefit" month
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                    ) {
                    availableForWithholding = availableForWithholding + personA.spousalBenefitWithRetirement
                    calcYear.monthsOfPersonAspousalWithRetirement = calcYear.monthsOfPersonAspousalWithRetirement - 1
                    monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                    }
                    if (earningsTestMonth >= personA.spousalBenefitDate && earningsTestMonth < personA.retirementBenefitDate //i.e., if this is a "spouseAspousalBenefitWithoutRetirementBenefit" month
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                    ){
                    availableForWithholding = availableForWithholding + personA.spousalBenefitWithoutRetirement
                    calcYear.monthsOfPersonAspousalWithoutRetirement = calcYear.monthsOfPersonAspousalWithoutRetirement - 1
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
                    if (earningsTestMonth >= personA.spousalBenefitDate && earningsTestMonth >= personA.retirementBenefitDate
                      && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personA.FRA) //Make sure current month is prior to FRA
                    ) {
                    availableForWithholding = availableForWithholding + personA.spousalBenefitWithRetirement
                    calcYear.monthsOfPersonAspousalWithRetirement = calcYear.monthsOfPersonAspousalWithRetirement - 1 //<-- This is going to result in overwithholding for the partial months.
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
                    if (earningsTestMonth >= personB.spousalBenefitDate && earningsTestMonth >= personB.retirementBenefitDate
                      && (spouseBgraceYear === false || personB.quitWorkDate > earningsTestMonth) //Make sure it's not a nonservice month in a grace year
                      && (earningsTestMonth < personB.FRA) //Make sure current month is prior to FRA
                    ) {
                      availableForWithholding = availableForWithholding + personB.spousalBenefitWithRetirement
                      calcYear.monthsOfPersonBspousalWithRetirement = calcYear.monthsOfPersonBspousalWithRetirement - 1 //<-- This is going to result in overwithholding for the partial months.
                      monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                    withholdingDueToSpouseBearnings = withholdingDueToSpouseBearnings - availableForWithholding //(this kicks us out of loop, potentially)
                    earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
                  }
                }
                  

            //Find post-ARF ("AdjustmentReductionFactor") monthly benefit amounts, for use at/after FRA
              //Find adjusted dates
              personA.adjustedRetirementBenefitDate = new Date(personA.retirementBenefitDate.getFullYear(), personA.retirementBenefitDate.getMonth()+monthsSpouseAretirementWithheld, 1)
              personA.adjustedSpousalBenefitDate = new Date(personA.spousalBenefitDate.getFullYear(), personA.spousalBenefitDate.getMonth()+monthsSpouseAspousalWithheld , 1)
              personB.adjustedRetirementBenefitDate = new Date(personB.retirementBenefitDate.getFullYear(), personB.retirementBenefitDate.getMonth()+monthsSpouseBretirementWithheld, 1)
              personB.adjustedSpousalBenefitDate = new Date(personB.spousalBenefitDate.getFullYear(), personB.spousalBenefitDate.getMonth()+monthsSpouseBspousalWithheld , 1)
              //Find adjusted retirement benefits
              personA.retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(personA, personA.adjustedRetirementBenefitDate)
              personB.retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(personB, personB.adjustedRetirementBenefitDate)
              //Find adjusted spousal benefits
              personA.spousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personA, personB, personA.retirementBenefitAfterARF, personA.adjustedSpousalBenefitDate)
              personA.spousalBenefitWithoutRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personA, personB, 0, personA.adjustedSpousalBenefitDate)
              personB.spousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personB, personA, personB.retirementBenefitAfterARF, personB.spousalBenefitDate)
              personB.spousalBenefitWithoutRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personB, personA, 0, personB.adjustedSpousalBenefitDate)
              //Find adjusted survivor benefits
              personA.survivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personA, personA.retirementBenefitAfterARF, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
              personA.survivorBenefitWithoutRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personA, 0, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
              personB.survivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personB, personB.retirementBenefitAfterARF, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
              personB.survivorBenefitWithoutRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personB, 0, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
          }

          //Ignore earnings test if users aren't working
          else {
            withholdingDueToSpouseAearnings = 0
            withholdingDueToSpouseBearnings = 0
            personA.retirementBenefitAfterARF = personA.retirementBenefit
            personB.retirementBenefitAfterARF = personB.retirementBenefit
            personA.spousalBenefitWithoutRetirementAfterARF = personA.spousalBenefitWithoutRetirement
            personA.spousalBenefitWithRetirementAfterARF = personA.spousalBenefitWithRetirement
            personB.spousalBenefitWithoutRetirementAfterARF = personB.spousalBenefitWithoutRetirement
            personB.spousalBenefitWithRetirementAfterARF = personB.spousalBenefitWithRetirement
            personA.survivorBenefitWithoutRetirementAfterARF = personA.survivorBenefitWithoutRetirement
            personA.survivorBenefitWithRetirementAfterARF = personA.survivorBenefitWithRetirement
            personB.survivorBenefitWithoutRetirementAfterARF = personB.survivorBenefitWithoutRetirement
            personB.survivorBenefitWithRetirementAfterARF = personB.survivorBenefitWithRetirement
          }

          //WithholdingDueToSpouseAearnings and withholdingDueToSpouseBearnings are negative at this point if we overwithheld. Have to add those negative amounts back to annual benefit amounts
            //We add them back to annual retirement benefit later.
            calcYear.personAoverWithholding = 0
            calcYear.personBoverWithholding = 0
            if (withholdingDueToSpouseAearnings < 0) {
              calcYear.personAoverWithholding = calcYear.personAoverWithholding - withholdingDueToSpouseAearnings
            }
            if (withholdingDueToSpouseBearnings < 0) {
              calcYear.personBoverWithholding = calcYear.personBoverWithholding - withholdingDueToSpouseBearnings
            }


        //Calculate annual benefits, accounting for Adjustment Reduction Factor in years beginning at FRA
        calcYear = this.benefitService.calculateAnnualBenefitAmountsCouple(personA, personB, calcYear)

        //If user is divorced, we don't actually want to include the ex-spouse's benefit amounts in our PV sum
        if (scenario.maritalStatus == "divorced") {
          calcYear.personBannualRetirementBenefit = 0
          calcYear.personBannualSpousalBenefit = 0
          calcYear.personBannualSurvivorBenefit = 0
        }


      //Calculate each person's probability of being alive at end of age in question
        probabilityAalive = this.mortalityService.calculateProbabilityAlive(personA, spouseAage)
        probabilityBalive = this.mortalityService.calculateProbabilityAlive(personB, spouseBage)

      //Find probability-weighted annual benefit
        let annualPV = 
        (probabilityAalive * (1-probabilityBalive) * (calcYear.personAannualRetirementBenefit + calcYear.personAannualSurvivorBenefit)) //Scenario where A is alive, B is deceased
        + (probabilityBalive * (1-probabilityAalive) * (calcYear.personBannualRetirementBenefit + calcYear.personBannualSurvivorBenefit)) //Scenario where B is alive, A is deceased
        + ((probabilityAalive * probabilityBalive) * (calcYear.personAannualRetirementBenefit + calcYear.personAannualSpousalBenefit + calcYear.personBannualRetirementBenefit + calcYear.personBannualSpousalBenefit)) //Scenario where both are alive

      //Discount that benefit
            //Find which spouse is older, because we're discounting back to date on which older spouse is age 62.
            let olderAge: number
            if (spouseAage > spouseBage) {
              olderAge = spouseAage
            } else {olderAge = spouseBage}
            //Here is where actual discounting happens. Discounting by half a year, because we assume all benefits received mid-year. Then discounting for any additional years needed to get back to PV at 62.
            annualPV = annualPV / (1 + scenario.discountRate/100/2) / Math.pow((1 + scenario.discountRate/100),(olderAge - 62))


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
    person.retirementBenefitDate = new Date(person.SSbirthDate.getFullYear()+62, 1, 1)
    if (person.actualBirthDate.getDate() <= 2){
      person.retirementBenefitDate.setMonth(person.actualBirthDate.getMonth())
    } else {
      person.retirementBenefitDate.setMonth(person.actualBirthDate.getMonth()+1)
    }

    //If user is currently over age 62 when filling out form, set testClaimingDate to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
    let ageToday = this.today.getFullYear() - person.SSbirthDate.getFullYear() + (this.today.getMonth() - person.SSbirthDate.getMonth())/12
    if (ageToday > 62){
      person.retirementBenefitDate.setMonth(this.today.getMonth())
      person.retirementBenefitDate.setFullYear(this.today.getFullYear())
    }

    //Run calculateSinglePersonPV for their earliest possible claiming date, save the PV and the date.
    let savedPV: number = this.calculateSinglePersonPV(person, scenario)
    let savedClaimingDate = new Date(person.retirementBenefitDate)

    //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
    let endingTestDate = new Date(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth()-1, 1)
    while (person.retirementBenefitDate <= endingTestDate){
      //Add 1 month to claiming age and run both calculations again and compare results. Save better of the two. (If they're literally the same, save the second one tested, because it gives better longevity insurance)
      person.retirementBenefitDate.setMonth(person.retirementBenefitDate.getMonth() + 1)
      let currentTestPV = this.calculateSinglePersonPV(person, scenario)
      if (currentTestPV >= savedPV)
        {savedClaimingDate.setMonth(person.retirementBenefitDate.getMonth())
          savedClaimingDate.setFullYear(person.retirementBenefitDate.getFullYear())
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
    personA.retirementBenefitDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
    personA.spousalBenefitDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
    if (personA.actualBirthDate.getDate() <= 2){
      personA.retirementBenefitDate.setMonth(personA.actualBirthDate.getMonth())
      personA.spousalBenefitDate.setMonth(personA.actualBirthDate.getMonth())
    } else {
      personA.retirementBenefitDate.setMonth(personA.actualBirthDate.getMonth()+1)
      personA.spousalBenefitDate.setMonth(personA.actualBirthDate.getMonth()+1)
    }
    //If spouseA is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
    let today = new Date()
    let spouseAageToday: number = today.getFullYear() - personA.SSbirthDate.getFullYear() + (today.getMonth() - personA.SSbirthDate.getMonth()) /12
    if (spouseAageToday > 62){
      personA.retirementBenefitDate.setMonth(today.getMonth())
      personA.retirementBenefitDate.setFullYear(today.getFullYear())
      personA.spousalBenefitDate.setMonth(today.getMonth())
      personA.spousalBenefitDate.setFullYear(today.getFullYear())
    }
    //Do all of the same, but for spouseB.
    personB.retirementBenefitDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
    personB.spousalBenefitDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
    if (personB.actualBirthDate.getDate() <= 2){
      personB.retirementBenefitDate.setMonth(personB.actualBirthDate.getMonth())
      personB.spousalBenefitDate.setMonth(personB.actualBirthDate.getMonth())
    } else {
      personB.retirementBenefitDate.setMonth(personB.actualBirthDate.getMonth()+1)
      personB.spousalBenefitDate.setMonth(personB.actualBirthDate.getMonth()+1)
    }
    let spouseBageToday: number = today.getFullYear() - personB.SSbirthDate.getFullYear() + (today.getMonth() - personB.SSbirthDate.getMonth()) /12
    if (spouseBageToday > 62){
      personB.retirementBenefitDate.setMonth(today.getMonth())
      personB.retirementBenefitDate.setFullYear(today.getFullYear())
      personB.spousalBenefitDate.setMonth(today.getMonth())
      personB.spousalBenefitDate.setFullYear(today.getFullYear())
    }
    //Check to see if spouseA's current spousalDate is prior to spouseB's earliest retirementDate. If so, adjust.
    if (personA.spousalBenefitDate < personB.retirementBenefitDate){
      personA.spousalBenefitDate.setFullYear(personB.retirementBenefitDate.getFullYear())
      personA.spousalBenefitDate.setMonth(personB.retirementBenefitDate.getMonth())
    }

    //Initialize savedPV as zero. Set spouseAsavedDate and spouseBsavedDate equal to their current testDates.
      let savedPV: number = 0
      let spouseAsavedRetirementDate = new Date(personA.retirementBenefitDate)
      let spouseBsavedRetirementDate = new Date(personB.retirementBenefitDate)
      let spouseAsavedSpousalDate = new Date(personA.spousalBenefitDate)
      let spouseBsavedSpousalDate = new Date(personB.spousalBenefitDate)

    //Set endingTestDate for each spouse equal to the month they turn 70
    let spouseAendTestDate = new Date(personA.SSbirthDate.getFullYear()+70, personA.SSbirthDate.getMonth(), 1)
    let spouseBendTestDate = new Date(personB.SSbirthDate.getFullYear()+70, personB.SSbirthDate.getMonth(), 1)

    while (personA.retirementBenefitDate <= spouseAendTestDate) {
        //Reset spouseB test dates to earliest possible (i.e., their "age 62 for whole month" month or today's month if they're currently older than 62, but never earlier than spouse A's retirementDate)
        if (spouseBageToday > 62){
          personB.retirementBenefitDate.setMonth(today.getMonth())
          personB.retirementBenefitDate.setFullYear(today.getFullYear())
          personB.spousalBenefitDate.setMonth(today.getMonth())
          personB.spousalBenefitDate.setFullYear(today.getFullYear())
        } else {
            personB.retirementBenefitDate.setFullYear(personB.SSbirthDate.getFullYear()+62)
            personB.spousalBenefitDate.setFullYear(personB.SSbirthDate.getFullYear()+62)
            if (personB.actualBirthDate.getDate() <= 2){
              personB.retirementBenefitDate.setMonth(personB.actualBirthDate.getMonth())
              personB.spousalBenefitDate.setMonth(personB.actualBirthDate.getMonth())
            } else {
              personB.retirementBenefitDate.setMonth(personB.actualBirthDate.getMonth()+1)
              personB.spousalBenefitDate.setMonth(personB.actualBirthDate.getMonth()+1)
            }
        }
        if (personB.spousalBenefitDate < personA.retirementBenefitDate) {
          personB.spousalBenefitDate.setMonth(personA.retirementBenefitDate.getMonth())
          personB.spousalBenefitDate.setFullYear(personA.retirementBenefitDate.getFullYear())
        }

          //After spouse B's retirement testdate has been reset, reset spouseA's spousal date as necessary
            //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
            if (personA.actualBirthDate > deemedFilingCutoff) {
              if (personA.retirementBenefitDate > personB.retirementBenefitDate) {
                personA.spousalBenefitDate.setMonth(personA.retirementBenefitDate.getMonth())
                personA.spousalBenefitDate.setFullYear(personA.retirementBenefitDate.getFullYear())
              } else {
                personA.spousalBenefitDate.setMonth(personB.retirementBenefitDate.getMonth())
                personA.spousalBenefitDate.setFullYear(personB.retirementBenefitDate.getFullYear())
              }
            }
            else {//i.e., if spouseA has old deemed filing rules
              if (personA.retirementBenefitDate < personA.FRA) {
                //Set spouseA spousal testdate to later of spouseA retirementDate or spouseB retirementDate
                if (personA.retirementBenefitDate > personB.retirementBenefitDate) {
                  personA.spousalBenefitDate.setMonth(personA.retirementBenefitDate.getMonth())
                  personA.spousalBenefitDate.setFullYear(personA.retirementBenefitDate.getFullYear())
                } else {
                  personA.spousalBenefitDate.setMonth(personB.retirementBenefitDate.getMonth())
                  personA.spousalBenefitDate.setFullYear(personB.retirementBenefitDate.getFullYear())
                }
              }
              else {//i.e., if spouseAretirementDate currently after spouseAFRA
                //Set spouseA spousalDate to earliest possible restricted application date (later of FRA or spouse B's retirementDate)
                if (personA.FRA > personB.retirementBenefitDate) {
                  personA.spousalBenefitDate.setMonth(personA.FRA.getMonth())
                  personA.spousalBenefitDate.setFullYear(personA.FRA.getFullYear())
                } else {
                  personA.spousalBenefitDate.setMonth(personB.retirementBenefitDate.getMonth())
                  personA.spousalBenefitDate.setFullYear(personB.retirementBenefitDate.getFullYear())
                }
              }
            }

        while (personB.retirementBenefitDate <= spouseBendTestDate) {
          //Calculate PV using current testDates
            let currentTestPV: number = this.calculateCouplePV(personA, personB, scenario)
            //If PV is greater than saved PV, save new PV and save new testDates.
            if (currentTestPV >= savedPV) {
              savedPV = currentTestPV
              spouseAsavedRetirementDate.setMonth(personA.retirementBenefitDate.getMonth())
              spouseAsavedRetirementDate.setFullYear(personA.retirementBenefitDate.getFullYear())
              spouseBsavedRetirementDate.setMonth(personB.retirementBenefitDate.getMonth())
              spouseBsavedRetirementDate.setFullYear(personB.retirementBenefitDate.getFullYear())
              spouseAsavedSpousalDate.setMonth(personA.spousalBenefitDate.getMonth())
              spouseAsavedSpousalDate.setFullYear(personA.spousalBenefitDate.getFullYear())
              spouseBsavedSpousalDate.setMonth(personB.spousalBenefitDate.getMonth())
              spouseBsavedSpousalDate.setFullYear(personB.spousalBenefitDate.getFullYear())
              }

          //Find next possible claiming combination for spouseB
            //if spouseB has new deemed filing rules, increment both dates by 1. (But don't increment spousalDate if it's currently set later than retirementDate.)
              //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
            if (personB.actualBirthDate > deemedFilingCutoff) {
              if (personB.spousalBenefitDate <= personB.retirementBenefitDate) {
                personB.spousalBenefitDate.setMonth(personB.spousalBenefitDate.getMonth()+1)
              }
              personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
            }
          
            else {//i.e., if spouseB has old deemed filing rules
              //if spouseBretirementDate < FRA, increment both test dates by 1. (Don't increment spousalDate though if it is currently set later than retirementDate.)
              if (personB.retirementBenefitDate < personB.FRA) {
                if (personB.spousalBenefitDate <= personB.retirementBenefitDate) {
                  personB.spousalBenefitDate.setMonth(personB.spousalBenefitDate.getMonth()+1)
                }
                personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
                //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
              }
              else {//i.e., if spouseBretirementDate >= FRA
                //Increment retirement testdate by 1 and set spousal date to earliest possible restricted application date (later of FRA or other spouse's retirementtestdate)
                personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
                if (personA.retirementBenefitDate > personB.FRA) {
                  personB.spousalBenefitDate.setMonth(personA.retirementBenefitDate.getMonth())
                  personB.spousalBenefitDate.setFullYear(personA.retirementBenefitDate.getFullYear())
                } else {
                  personB.spousalBenefitDate.setMonth(personB.FRA.getMonth())
                  personB.spousalBenefitDate.setFullYear(personB.FRA.getFullYear())
                }
              }

            }
          //After spouse B's retirement testdate has been incremented, adjust spouseA's spousal date as necessary
            //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
              if (personA.actualBirthDate > deemedFilingCutoff) {
                if (personA.retirementBenefitDate > personB.retirementBenefitDate) {
                  personA.spousalBenefitDate.setMonth(personA.retirementBenefitDate.getMonth())
                  personA.spousalBenefitDate.setFullYear(personA.retirementBenefitDate.getFullYear())
                } else {
                  personA.spousalBenefitDate.setMonth(personB.retirementBenefitDate.getMonth())
                  personA.spousalBenefitDate.setFullYear(personB.retirementBenefitDate.getFullYear())
                }
              }
              else {//i.e., if spouseA has old deemed filing rules
                if (personA.retirementBenefitDate < personA.FRA) {
                  //Set spouseA spousal testdate to later of spouseA retirementDate or spouseB retirementDate
                  if (personA.retirementBenefitDate > personB.retirementBenefitDate) {
                    personA.spousalBenefitDate.setMonth(personA.retirementBenefitDate.getMonth())
                    personA.spousalBenefitDate.setFullYear(personA.retirementBenefitDate.getFullYear())
                  } else {
                    personA.spousalBenefitDate.setMonth(personB.retirementBenefitDate.getMonth())
                    personA.spousalBenefitDate.setFullYear(personB.retirementBenefitDate.getFullYear())
                  }
                }
                else {//i.e., if spouseAretirementDate currently after spouseAFRA
                  //Set spouseA spousalDate to earliest possible restricted application date (later of FRA or spouse B's retirementDate)
                  if (personA.FRA > personB.retirementBenefitDate) {
                    personA.spousalBenefitDate.setMonth(personA.FRA.getMonth())
                    personA.spousalBenefitDate.setFullYear(personA.FRA.getFullYear())
                  } else {
                    personA.spousalBenefitDate.setMonth(personB.retirementBenefitDate.getMonth())
                    personA.spousalBenefitDate.setFullYear(personB.retirementBenefitDate.getFullYear())
                  }
                }
              }
        }
        //Add 1 month to spouseAretirementDate
          personA.retirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+1)
        
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
      personB.retirementBenefitDate = new Date(personBfixedRetirementDate)
      let deemedFilingCutoff: Date = new Date(1954, 0, 1)

      //find initial test dates for flexibleSpouse (first month for which flexibleSpouse is considered 62 for entire month)
      personA.retirementBenefitDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
      personA.spousalBenefitDate = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
      if (personA.actualBirthDate.getDate() <= 2){
        personA.retirementBenefitDate.setMonth(personA.actualBirthDate.getMonth())
        personA.spousalBenefitDate.setMonth(personA.actualBirthDate.getMonth())
      } else {
        personA.retirementBenefitDate.setMonth(personA.actualBirthDate.getMonth()+1)
        personA.spousalBenefitDate.setMonth(personA.actualBirthDate.getMonth()+1)
      }
      //If flexibleSpouse is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
      if (personA.initialAge > 62){
        personA.retirementBenefitDate.setMonth(this.today.getMonth())
        personA.retirementBenefitDate.setFullYear(this.today.getFullYear())
        personA.spousalBenefitDate.setMonth(this.today.getMonth())
        personA.spousalBenefitDate.setFullYear(this.today.getFullYear())
      }

      //Don't let flexibleSpouseSpousalDate be earlier than first month for which fixedSpouse is 62 for whole month.
        //This only matters for divorcee scenario. For still-married scenario where one spouse has filed, that filing date is already in the past, so it won't suggest an earlier spousal date for flexible spouse anyway.
      let personB62Date = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
      if (personB.actualBirthDate.getDate() <= 2){
        personB62Date.setMonth(personB.actualBirthDate.getMonth())
      } else {
        personB62Date.setMonth(personB.actualBirthDate.getMonth()+1)
      }
      if (personA.spousalBenefitDate < personB62Date) {
        personA.spousalBenefitDate.setFullYear(personB62Date.getFullYear())
        personA.spousalBenefitDate.setMonth(personB62Date.getMonth())
      }

      //Initialize savedPV as zero. Set saved dates equal to their current testDates.
      let savedPV: number = 0
      let personAsavedRetirementDate = new Date(personA.retirementBenefitDate)
      let personAsavedSpousalDate = new Date(personA.spousalBenefitDate)

      //Set endTestDate equal to the month flexibleSpouse turns 70
      let endTestDate = new Date(personA.SSbirthDate.getFullYear()+70, personA.SSbirthDate.getMonth(), 1)

      //In theory: set fixed spouse's spousalDate equal to later of their own retirement benefit date or flexible spouse's retirement benefit date
          //In actuality: set it equal to flexible spouse's retirement benefit date, because that's always the later of the two (since fixed has already filed) 
          //For divorcee this date won't matter at all, since annual PV is ultimately set to zero for spouse b's spousal benefit, but PV calc will require it.
      personB.spousalBenefitDate = new Date(personA.retirementBenefitDate)
      let personBsavedSpousalDate: Date = new Date(personB.spousalBenefitDate)            

      while (personA.retirementBenefitDate <= endTestDate) {
        //Calculate PV using current test dates for flexibleSpouse and fixed dates for fixedSpouse
        let currentTestPV: number = this.calculateCouplePV(personA, personB, scenario)

        //If PV is greater than or equal to saved PV, save new PV and save new testDates
        if (currentTestPV >= savedPV) {
          savedPV = currentTestPV
          personAsavedRetirementDate.setMonth(personA.retirementBenefitDate.getMonth())
          personAsavedRetirementDate.setFullYear(personA.retirementBenefitDate.getFullYear())
          personAsavedSpousalDate.setMonth(personA.spousalBenefitDate.getMonth())
          personAsavedSpousalDate.setFullYear(personA.spousalBenefitDate.getFullYear())
          personBsavedSpousalDate.setMonth(personB.spousalBenefitDate.getMonth())
          personBsavedSpousalDate.setFullYear(personB.spousalBenefitDate.getFullYear())
          }
        
        //Increment flexibleSpouse's dates (and fixedSpouse's spousal date, since it is just set to be same as flexible spouse's retirement date)
          //if new deemed filing rules, increment flexibleSpouse's retirement and spousal by 1 month
          if (personA.actualBirthDate > deemedFilingCutoff) {
            personA.retirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+1)
            personB.spousalBenefitDate.setMonth(personB.spousalBenefitDate.getMonth()+1)
            if (personA.spousalBenefitDate <= personA.retirementBenefitDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
              personA.spousalBenefitDate.setMonth(personA.spousalBenefitDate.getMonth()+1)
            }
          } else { //i.e., if old deemed filling rules apply
            //If current retirement test date younger than FRA, increment flexibleSpouse's retirement and spousal by 1 month
            if (personA.retirementBenefitDate < personA.FRA) {
              personA.retirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+1)
              personB.spousalBenefitDate.setMonth(personB.spousalBenefitDate.getMonth()+1)
              if (personA.spousalBenefitDate <= personA.retirementBenefitDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
              personA.spousalBenefitDate.setMonth(personA.spousalBenefitDate.getMonth()+1)
              }
            }
            else {//If current retirement test date beyond FRA, increment flexibleSpouse's retirement by 1 month and keep flexibleSpouse's spousal where it is (at FRA, unless they're older than FRA when filling form)
              personA.retirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+1)
              personB.spousalBenefitDate.setMonth(personB.spousalBenefitDate.getMonth()+1)
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
  personA.retirementBenefitDate = new Date(personAfixedRetirementDate)
  let deemedFilingCutoff: Date = new Date(1954, 0, 1)

  //find initial test dates for flexibleSpouse (first month for which flexibleSpouse is considered 62 for entire month)
  personB.retirementBenefitDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
  personB.spousalBenefitDate = new Date(personB.SSbirthDate.getFullYear()+62, 1, 1)
  if (personB.actualBirthDate.getDate() <= 2){
    personB.retirementBenefitDate.setMonth(personB.actualBirthDate.getMonth())
    personB.spousalBenefitDate.setMonth(personB.actualBirthDate.getMonth())
  } else {
    personB.retirementBenefitDate.setMonth(personB.actualBirthDate.getMonth()+1)
    personB.spousalBenefitDate.setMonth(personA.actualBirthDate.getMonth()+1)
  }
  //If flexibleSpouse is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
  if (personB.initialAge > 62){
    personB.retirementBenefitDate.setMonth(this.today.getMonth())
    personB.retirementBenefitDate.setFullYear(this.today.getFullYear())
    personB.spousalBenefitDate.setMonth(this.today.getMonth())
    personB.spousalBenefitDate.setFullYear(this.today.getFullYear())
  }

  //Don't let flexibleSpouseSpousalDate be earlier than first month for which fixedSpouse is 62 for whole month.
    //This only matters for divorcee scenario. For still-married scenario where one spouse has filed, that filing date is already in the past, so it won't suggest an earlier spousal date for flexible spouse anyway.
  let personA62Date = new Date(personA.SSbirthDate.getFullYear()+62, 1, 1)
  if (personA.actualBirthDate.getDate() <= 2){
    personA62Date.setMonth(personA.actualBirthDate.getMonth())
  } else {
    personA62Date.setMonth(personA.actualBirthDate.getMonth()+1)
  }
  if (personB.spousalBenefitDate < personA62Date) {
    personB.spousalBenefitDate.setFullYear(personA62Date.getFullYear())
    personB.spousalBenefitDate.setMonth(personA62Date.getMonth())
  }

  //Initialize savedPV as zero. Set saved dates equal to their current testDates.
  let savedPV: number = 0
  let personBsavedRetirementDate = new Date(personB.retirementBenefitDate)
  let personBsavedSpousalDate = new Date(personB.spousalBenefitDate)

  //Set endTestDate equal to the month flexibleSpouse turns 70
  let endTestDate = new Date(personB.SSbirthDate.getFullYear()+70, personB.SSbirthDate.getMonth(), 1)

  //In theory: set fixed spouse's spousalDate equal to later of their own retirement benefit date or flexible spouse's retirement benefit date
      //In actuality: set it equal to flexible spouse's retirement benefit date, because that's always the later of the two (since fixed has already filed) 
  personA.spousalBenefitDate = new Date(personB.retirementBenefitDate)
  let personAsavedSpousalDate: Date = new Date(personA.spousalBenefitDate)            

  while (personB.retirementBenefitDate <= endTestDate) {
    //Calculate PV using current test dates for flexibleSpouse and fixed dates for fixedSpouse
    let currentTestPV: number = this.calculateCouplePV(personB, personA, scenario)

    //If PV is greater than or equal to saved PV, save new PV and save new testDates
    if (currentTestPV >= savedPV) {
      savedPV = currentTestPV
      personBsavedRetirementDate.setMonth(personB.retirementBenefitDate.getMonth())
      personBsavedRetirementDate.setFullYear(personB.retirementBenefitDate.getFullYear())
      personBsavedSpousalDate.setMonth(personB.spousalBenefitDate.getMonth())
      personBsavedSpousalDate.setFullYear(personB.spousalBenefitDate.getFullYear())
      personAsavedSpousalDate.setMonth(personA.spousalBenefitDate.getMonth())
      personAsavedSpousalDate.setFullYear(personA.spousalBenefitDate.getFullYear())
      }
    
    //Increment flexibleSpouse's dates (and fixedSpouse's spousal date, since it is just set to be same as flexible spouse's retirement date)
      //if new deemed filing rules, increment flexibleSpouse's retirement and spousal by 1 month
      if (personB.actualBirthDate > deemedFilingCutoff) {
        personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
        personA.spousalBenefitDate.setMonth(personA.spousalBenefitDate.getMonth()+1)
        if (personB.spousalBenefitDate <= personB.retirementBenefitDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
          personB.spousalBenefitDate.setMonth(personB.spousalBenefitDate.getMonth()+1)
        }
      } else { //i.e., if old deemed filling rules apply
        //If current retirement test date younger than FRA, increment flexibleSpouse's retirement and spousal by 1 month
        if (personB.retirementBenefitDate < personB.FRA) {
          personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
          personA.spousalBenefitDate.setMonth(personA.spousalBenefitDate.getMonth()+1)
          if (personB.spousalBenefitDate <= personB.retirementBenefitDate) {//Don't increment spousal if it's currently later than retirement due to the "exspouse must be 62" rule
          personB.spousalBenefitDate.setMonth(personB.spousalBenefitDate.getMonth()+1)
          }
        }
        else {//If current retirement test date beyond FRA, increment flexibleSpouse's retirement by 1 month and keep flexibleSpouse's spousal where it is (at FRA, unless they're older than FRA when filling form)
          personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
          personA.spousalBenefitDate.setMonth(personA.spousalBenefitDate.getMonth()+1)
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
