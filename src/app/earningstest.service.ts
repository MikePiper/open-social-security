import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EarningsTestService {

  constructor() { }


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



}
