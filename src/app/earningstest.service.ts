import {Injectable} from '@angular/core'
import {CalculationYear} from './data model classes/calculationyear'
import {Person} from './data model classes/person'
import {BenefitService} from './benefit.service'

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
    let monthsWithheld: number = 0 //THIS IS THE PROBLEM. CAN'T HAVE MONTHSWITHHELD RESET TO ZERO EACH TIME THIS FUNCTION RUNS, BECAUSE IT RUNS EACH YEAR

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

      let earningsTestResult:any[] = [calcYear, person]
      
      return earningsTestResult
  }
}
