import {Injectable} from '@angular/core'
import {CalculationYear} from './data model classes/calculationyear'
import {Person} from './data model classes/person'
import {BenefitService} from './benefit.service'
import {ClaimingScenario} from './data model classes/claimingscenario'

@Injectable({
  providedIn: 'root'
})
export class EarningsTestService {

  constructor(private benefitService: BenefitService) { }
  today: Date = new Date()


  calculateWithholding(currentCalculationDate:Date, quitWorkDate:Date, FRA:Date, monthlyEarnings:number){
      //Determine annual earnings subject to earnings test
      let annualEarnings: number = 0
      if (currentCalculationDate.getFullYear() > quitWorkDate.getFullYear() || currentCalculationDate.getFullYear() > FRA.getFullYear()) {//If current calc year after FRAyear or quitYear, zero earnings to consider
        annualEarnings = 0            
      } else if (currentCalculationDate.getFullYear() < quitWorkDate.getFullYear() && currentCalculationDate.getFullYear() < FRA.getFullYear()) {//If current calc year before FRAyear AND before quitYear, 12 months of earnings to consider
        annualEarnings = 12 * monthlyEarnings
      } else {//Annual earnings is equal to monthlyEarnings, times number of months before earlier of FRAmonth or quitMonth
        if (FRA < quitWorkDate) {
          annualEarnings = monthlyEarnings * FRA.getMonth() //e.g,. if FRA is in March, "getMonth" returns 2, which is how many months of earnings we want to consider
        } else {
          annualEarnings = monthlyEarnings * quitWorkDate.getMonth() //e.g,. if quitWorkDate is in March, "getMonth" returns 2, which is how many months of earnings we want to consider
        }
      }
      //determine withholdingAmount
      let withholdingAmount:number = 0
      if (currentCalculationDate.getFullYear() < FRA.getFullYear()) {
        //withhold using $17,040 threshold, $1 per $2 excess
        withholdingAmount = (annualEarnings - 17040) / 2
      } else if (currentCalculationDate.getFullYear() == FRA.getFullYear()) {
        //withhold using $45,360 threshold, $1 per $3 excess
        withholdingAmount = (annualEarnings - 45360) / 3
      }
      //Don't let withholdingAmount be negative
      if (withholdingAmount < 0) {
        withholdingAmount = 0
      }
      return Number(withholdingAmount)
  }

  isGraceYear(hasHadGraceYear: boolean, quitWorkDate: Date, currentCalculationDate: Date, retirementBenefitDate: Date, spousalBenefitDate?: Date, survivorBenefitDate?: Date) {
    //If quitWorkDate has already happened (or happens this year) and at least one benefit has started (or starts this year) it's a grace year
    //Assumption: in the year they quit work, following months are non-service months.
    let graceYear:boolean = false
    if (hasHadGraceYear === true) { //if graceyear was true before, set it to false, so it's only true once
      graceYear = false
    }
    else if (quitWorkDate.getFullYear() <= currentCalculationDate.getFullYear()) {
      if (retirementBenefitDate.getFullYear() <= currentCalculationDate.getFullYear()) {
        graceYear = true
      }
      if (spousalBenefitDate && spousalBenefitDate.getFullYear() <= currentCalculationDate.getFullYear()) {//i.e., if spousalBenefitDate exists, and it is this year or a prior year
      graceYear = true
      }
      if (survivorBenefitDate && survivorBenefitDate.getFullYear() <= currentCalculationDate.getFullYear()) {//i.e., if survivorBenefitDate exists, and it is this year or a prior year
      graceYear = true
      }
    }
    return graceYear
  }


  earningsTestSingle(calcYear:CalculationYear, person:Person){
    let withholdingAmount: number = 0
    let monthsWithheld: number = 0

    if (isNaN(person.quitWorkDate.getTime())) {
      person.quitWorkDate = new Date(1,0,1)
    }
    if (person.quitWorkDate > this.today){//If quitWorkDate is an invalid date (because there was no input) or is in the past for some reason, this whole business below gets skipped  
        //Determine if it's a grace year. If quitWorkDate has already happened (or happens this year) and retirement benefit has started (or starts this year) it's a grace year
          //Assumption: in the year they quit work, following months are non-service months.
        let graceYear:boolean = this.isGraceYear(person.hasHadGraceYear, person.quitWorkDate, calcYear.date, person.retirementBenefitDate)
        if (graceYear === true) {person.hasHadGraceYear = true}
          
        //Calculate necessary withholding based on earnings
        withholdingAmount = this.calculateWithholding(calcYear.date, person.quitWorkDate, person.FRA, person.monthlyEarnings)

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
              availableForWithholding = availableForWithholding + person.initialRetirementBenefit
              calcYear.monthsOfPersonAretirementPreARF = calcYear.monthsOfPersonAretirementPreARF - 1
              monthsWithheld  = monthsWithheld + 1
            }
          //Subtracting 1 from monthsOfRetirement will often result in overwithholding (as it does in real life) for a partial month. Gets added back later.
          //Reduce necessary withholding by the amount we withhold this month:
          withholdingAmount = withholdingAmount - availableForWithholding //(this kicks us out of loop, potentially)
          earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
        }
      //Find new retirementBenefit, after recalculation ("AdjustmentReductionFactor") at FRA
      person.adjustedRetirementBenefitDate.setMonth(person.adjustedRetirementBenefitDate.getMonth()+monthsWithheld)
      person.retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(person, person.adjustedRetirementBenefitDate)

      }
    //Ignore earnings test if user wasn't working
    else {
      withholdingAmount = 0
      person.retirementBenefitAfterARF = person.initialRetirementBenefit
    }

    //withholdingAmount is negative at this point if we overwithheld. Have to add that negative amounts back to annual benefit amounts
      //We add it back to annual retirement benefit in a moment.
      calcYear.personAoverWithholding = 0
      if (withholdingAmount < 0) {
        calcYear.personAoverWithholding = calcYear.personAoverWithholding - withholdingAmount
      }

      let earningsTestResult:any[] = [calcYear, person]
      
      return earningsTestResult
  }


  earningsTestCouple(calcYear:CalculationYear, scenario:ClaimingScenario, personA:Person, personB:Person){
    let withholdingDueToSpouseAearnings: number = 0
    let withholdingDueToSpouseBearnings: number = 0
    let monthsSpouseAretirementWithheld: number = 0
    let monthsSpouseAspousalWithheld: number = 0
    let monthsSpouseBretirementWithheld: number = 0
    let monthsSpouseBspousalWithheld: number = 0

      if (isNaN(personA.quitWorkDate.getTime())) {
        personA.quitWorkDate = new Date(1,0,1)
      }
      if (isNaN(personB.quitWorkDate.getTime())) {
        personB.quitWorkDate = new Date(1,0,1)
      }
      if (personA.quitWorkDate > this.today || personB.quitWorkDate > this.today){//If quitWorkDates are invalid dates (because there was no input) or in the past for some reason, this whole business below gets skipped
        //Determine if it's a grace year for either spouse. If quitWorkDate has already happened (or happens this year) and at least one type of benefit has started (or starts this year)
          //Assumption: in the year they quit work, following months are non-service months.
        let spouseAgraceYear:boolean = this.isGraceYear(personA.hasHadGraceYear, personA.quitWorkDate, calcYear.date, personA.retirementBenefitDate, personA.spousalBenefitDate, personA.survivorFRA)
        if (spouseAgraceYear === true) {personA.hasHadGraceYear = true}  
        let spouseBgraceYear:boolean = this.isGraceYear(personB.hasHadGraceYear, personB.quitWorkDate, calcYear.date, personB.retirementBenefitDate, personB.spousalBenefitDate, personB.survivorFRA)
        if (spouseBgraceYear === true) {personB.hasHadGraceYear = true}  

          //Calculate necessary withholding based on each spouse's earnings
          withholdingDueToSpouseAearnings = this.calculateWithholding(calcYear.date, personA.quitWorkDate, personA.FRA, personA.monthlyEarnings)
          withholdingDueToSpouseBearnings = this.calculateWithholding(calcYear.date, personB.quitWorkDate, personB.FRA, personB.monthlyEarnings)

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
                    availableForWithholding = availableForWithholding + personA.initialRetirementBenefit
                    calcYear.monthsOfPersonAretirementPreARF = calcYear.monthsOfPersonAretirementPreARF - 1
                    monthsSpouseAretirementWithheld  = monthsSpouseAretirementWithheld  + 1
                  }
                  if (scenario.maritalStatus == "married"){//Only make spouse B's benefit as a spouse available for withholding if they're currently married (as opposed to divorced). If divorced, spouseB is automatically "not working," so we don't have any withholding due to their earnings to worry about.
                    if (earningsTestMonth >= personB.spousalBenefitDate && earningsTestMonth >= personB.retirementBenefitDate //i.e., if this is a "spouseBspousalBenefitWithRetirementBenefit" month
                      && (spouseBgraceYear === false || earningsTestMonth < personB.quitWorkDate) //Make sure it isn't a nonservice month in grace year
                    ) {//If it's a "withRetirement" month for personB, figure out which type of "withRetirement" month it is (pre-ARF, post-ARF, etc)
                      if (earningsTestMonth < personB.FRA){
                        availableForWithholding = availableForWithholding + personB.spousalBenefitWithRetirementPreARF
                        calcYear.monthsOfPersonBspousalWithRetirementPreARF = calcYear.monthsOfPersonBspousalWithRetirementPreARF - 1
                        monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                      else if (earningsTestMonth < personB.endSuspensionDate){
                        availableForWithholding = availableForWithholding + personB.spousalBenefitWithRetirementAfterARF
                        calcYear.monthsOfPersonBspousalWithRetirementPostARF = calcYear.monthsOfPersonBspousalWithRetirementPostARF - 1
                        monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
                      else {
                        availableForWithholding = availableForWithholding + personB.spousalBenefitWithSuspensionDRCRetirement
                        calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs = calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs - 1
                        monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                      }
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
                    availableForWithholding = availableForWithholding + personB.initialRetirementBenefit
                    calcYear.monthsOfPersonBretirementPreARF = calcYear.monthsOfPersonBretirementPreARF - 1
                    monthsSpouseBretirementWithheld  = monthsSpouseBretirementWithheld  + 1
                  }
                  if (earningsTestMonth >= personA.spousalBenefitDate && earningsTestMonth >= personA.retirementBenefitDate //i.e., if this is a "spouseAspousalBenefitWithRetirementBenefit" month
                    && (spouseAgraceYear === false || earningsTestMonth < personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                  ) {//If it's a "withRetirement" month for personA, figure out which type of "withRetirement" month it is (pre-ARF, post-ARF, etc)
                      if (earningsTestMonth < personA.FRA){
                        availableForWithholding = availableForWithholding + personA.spousalBenefitWithRetirementPreARF
                        calcYear.monthsOfPersonAspousalWithRetirementPreARF = calcYear.monthsOfPersonAspousalWithRetirementPreARF - 1
                        monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                      }
                      else if (earningsTestMonth < personA.endSuspensionDate){
                        availableForWithholding = availableForWithholding + personA.spousalBenefitWithRetirementAfterARF
                        calcYear.monthsOfPersonAspousalWithRetirementPostARF = calcYear.monthsOfPersonAspousalWithRetirementPostARF - 1
                        monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                      }
                      else {
                        availableForWithholding = availableForWithholding + personA.spousalBenefitWithSuspensionDRCRetirement
                        calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs = calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs - 1
                        monthsSpouseAspousalWithheld = monthsSpouseAspousalWithheld + 1
                      }
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
                  availableForWithholding = availableForWithholding + personA.spousalBenefitWithRetirementPreARF
                  calcYear.monthsOfPersonAspousalWithRetirementPreARF = calcYear.monthsOfPersonAspousalWithRetirementPreARF - 1 //<-- This is going to result in overwithholding for the partial months.
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
                    availableForWithholding = availableForWithholding + personB.spousalBenefitWithRetirementPreARF
                    calcYear.monthsOfPersonBspousalWithRetirementPreARF = calcYear.monthsOfPersonBspousalWithRetirementPreARF - 1 //<-- This is going to result in overwithholding for the partial months.
                    monthsSpouseBspousalWithheld = monthsSpouseBspousalWithheld + 1
                    }
                  withholdingDueToSpouseBearnings = withholdingDueToSpouseBearnings - availableForWithholding //(this kicks us out of loop, potentially)
                  earningsTestMonth.setMonth(earningsTestMonth.getMonth()+1) //add 1 to earningsTestMonth (kicks us out of loop at end of year)
                }
              }
                

          //Find post-ARF ("AdjustmentReductionFactor") monthly benefit amounts, for use at/after FRA
            //Find adjusted dates
            personA.adjustedRetirementBenefitDate.setMonth(personA.adjustedRetirementBenefitDate.getMonth() + monthsSpouseAretirementWithheld)
            personA.adjustedSpousalBenefitDate.setMonth(personA.adjustedSpousalBenefitDate.getMonth() + monthsSpouseAspousalWithheld)
            personB.adjustedRetirementBenefitDate.setMonth(personB.adjustedRetirementBenefitDate.getMonth() + monthsSpouseBretirementWithheld)
            personB.adjustedSpousalBenefitDate.setMonth(personB.adjustedSpousalBenefitDate.getMonth() + monthsSpouseBspousalWithheld)
            //Find adjusted retirement benefits
            personA.retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(personA, personA.adjustedRetirementBenefitDate)
            personB.retirementBenefitAfterARF = this.benefitService.calculateRetirementBenefit(personB, personB.adjustedRetirementBenefitDate)
            //Find adjusted spousal benefits
            personA.spousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personA, personB, personA.retirementBenefitAfterARF, personA.adjustedSpousalBenefitDate)
            personA.spousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personA, personB, 0, personA.adjustedSpousalBenefitDate)
            personB.spousalBenefitWithRetirementAfterARF = this.benefitService.calculateSpousalBenefit(personB, personA, personB.retirementBenefitAfterARF, personB.spousalBenefitDate)
            personB.spousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personB, personA, 0, personB.adjustedSpousalBenefitDate)
            //Find adjusted survivor benefits
            personA.survivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personA, personA.retirementBenefitAfterARF, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
            personA.survivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personA, 0, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
            personB.survivorBenefitWithRetirementAfterARF = this.benefitService.calculateSurvivorBenefit(personB, personB.retirementBenefitAfterARF, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
            personB.survivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personB, 0, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
        }

        //Ignore earnings test if users aren't working
        else {
          withholdingDueToSpouseAearnings = 0
          withholdingDueToSpouseBearnings = 0
          personA.retirementBenefitAfterARF = personA.initialRetirementBenefit
          personB.retirementBenefitAfterARF = personB.initialRetirementBenefit
          personA.spousalBenefitWithoutRetirement = personA.spousalBenefitWithoutRetirement
          personA.spousalBenefitWithRetirementAfterARF = personA.spousalBenefitWithRetirementPreARF
          personB.spousalBenefitWithoutRetirement = personB.spousalBenefitWithoutRetirement
          personB.spousalBenefitWithRetirementAfterARF = personB.spousalBenefitWithRetirementPreARF
          personA.survivorBenefitWithoutRetirement = personA.survivorBenefitWithoutRetirement
          personA.survivorBenefitWithRetirementAfterARF = personA.survivorBenefitWithRetirementPreARF
          personB.survivorBenefitWithoutRetirement = personB.survivorBenefitWithoutRetirement
          personB.survivorBenefitWithRetirementAfterARF = personB.survivorBenefitWithRetirementPreARF
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

          let earningsTestResult:any[] = [calcYear, personA, personB]
          
          return earningsTestResult
  }
}
