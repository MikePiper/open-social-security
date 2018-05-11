import { Injectable } from '@angular/core';
import {BirthdayService} from './birthday.service'

@Injectable()
export class BenefitService {

  constructor(private birthdayService: BirthdayService) { }

  calculateRetirementBenefit(PIA: number, FRA: Date, benefitDate: Date)
  {
    let retirementBenefit: number = 0
    let monthsWaited = benefitDate.getMonth() - FRA.getMonth() + 12 * (benefitDate.getFullYear() - FRA.getFullYear())

      if (monthsWaited < -36)
      {retirementBenefit = PIA - (PIA / 100 * 5 / 9 * 36) + (PIA / 100 * 5 / 12 * (monthsWaited+36))}
      if (monthsWaited < 0 && monthsWaited >= -36)
      {retirementBenefit = PIA + (PIA / 100 * 5 / 9 * monthsWaited)}
      if (monthsWaited == 0)
      {retirementBenefit = PIA}
      if (monthsWaited > 0 )
      {retirementBenefit = PIA + (PIA / 100 * 2 / 3 * monthsWaited)}

      return Number(retirementBenefit)
  }

  calculateSpousalBenefit(PIA: number, otherSpousePIA: number, FRA: Date, retirementStartDate: Date, spousalStartDate: Date)
  {
    //no need to check for filing prior to 62, because we're already checking for that in the input form component.

    //Initial calculation
    let spousalBenefit = otherSpousePIA / 2

    //subtract greater of PIA or retirement benefit, but no more than spousal benefit
      //This currently assumes new deemed filing rules for everybody. Eventually, will have to do this subtraction only if they are already receiving retirement benefit.
          //Also, inputStartDate could be different for retirement benefit and spousal benefit, with old deemed filing rules.
      let retirementBenefit = this.calculateRetirementBenefit(Number(PIA), FRA, retirementStartDate)
      if (retirementBenefit > PIA) {
        spousalBenefit = spousalBenefit - retirementBenefit
      }
      else {spousalBenefit = spousalBenefit - PIA}
      if (spousalBenefit < 0) {
        spousalBenefit = 0
      }

    //Multiply by a reduction factor if spousal benefit claimed prior to FRA
    let monthsWaited = spousalStartDate.getMonth() - FRA.getMonth() + 12 * (spousalStartDate.getFullYear() - FRA.getFullYear())
    if (monthsWaited >= -36 && monthsWaited < 0)
    {spousalBenefit = spousalBenefit + (spousalBenefit * 25/36/100 * monthsWaited)}
    if (monthsWaited < -36)
    {spousalBenefit = spousalBenefit - (spousalBenefit * 25/36/100 * 36) + (spousalBenefit * 5/12/100 * (monthsWaited+36))}

    return Number(spousalBenefit)
  }

  calculateSurvivorBenefit(survivorSSbirthDate: Date, survivorSurvivorFRA: Date, survivorRetirementBenefit: number,  survivorSurvivorBenefitDate: Date,
    deceasedFRA: Date, dateOfDeath: Date,  deceasedPIA: number, deceasedClaimingDate: Date)
  {
    let deceasedRetirementBenefit: number
    let survivorBenefit

    //find percentage of the way survivor is from 60 to FRA
    let monthsFrom60toFRA: number = (survivorSurvivorFRA.getFullYear() - (survivorSSbirthDate.getFullYear()+60))*12 + (survivorSurvivorFRA.getMonth() - survivorSSbirthDate.getMonth())
    let monthsElapsed: number = (survivorSurvivorBenefitDate.getFullYear() - (survivorSSbirthDate.getFullYear()+60))*12 + (survivorSurvivorBenefitDate.getMonth() - survivorSSbirthDate.getMonth())
    let percentageWaited: number = monthsElapsed / monthsFrom60toFRA

    //If deceased had filed, survivorBenefit = deceased spouse's retirement benefit, but no less than 82.5% of deceased's PIA
    if (deceasedClaimingDate <= dateOfDeath) {
      deceasedRetirementBenefit = this.calculateRetirementBenefit(deceasedPIA, deceasedFRA, deceasedClaimingDate)
      survivorBenefit = deceasedRetirementBenefit
      if (survivorBenefit < 0.825 * deceasedPIA) {
        survivorBenefit = 0.825 * deceasedPIA
       }
      }
    else { //i.e., if deceased sposue had NOT filed as of date of death...
        //if deceased spouse was younger than FRA, survivor benefit = deceasedPIA
        if (dateOfDeath < deceasedFRA){
          survivorBenefit = deceasedPIA
        }
        //if deceased spouse was older than FRA, survivorBenefit = deceased's retirement benefit on date of death
        else {
        survivorBenefit = this.calculateRetirementBenefit(deceasedPIA, deceasedFRA, dateOfDeath)
        }
    }

    //if deceased did not file before FRA, but survivor does file for survivor benefit before FRA, adjust survivor benefit downward. (Remember to use survivor's FRA as survivor.)
    if (deceasedClaimingDate >= deceasedFRA && survivorSurvivorBenefitDate < survivorSurvivorFRA) {
          survivorBenefit = survivorBenefit - (survivorBenefit * 0.285 * (1 - percentageWaited))
    }

    //If deceased had filed before FRA, and survivor files for survivor benefit before FRA, do completely new calculation, with survivor benefit based on deceasedPIA rather than deceased retirement benefit.
    if (deceasedClaimingDate < deceasedFRA && survivorSurvivorBenefitDate < survivorSurvivorFRA) {
        survivorBenefit = deceasedPIA - (deceasedPIA * 0.285 * (1 - percentageWaited))
        console.log("survivorFRA: " + survivorSurvivorFRA)
        console.log("percentageWaited: " + percentageWaited)
        console.log("survivor benefit before limitation: " + survivorBenefit)
        //survivorBenefit then limited to greater of 82.5% of deceased's PIA or amount deceased was receiving on date of death
        if (0.825 * deceasedPIA < deceasedRetirementBenefit) {
          if (survivorBenefit > deceasedRetirementBenefit) {
            survivorBenefit = deceasedRetirementBenefit
          }
        } else{
          if (survivorBenefit > 0.825 * deceasedPIA) {
            survivorBenefit = 0.825 * deceasedPIA
          }
        }
      }
      //subtract own retirement benefit, but do not subtract more than survivor benefit
      survivorBenefit = survivorBenefit - survivorRetirementBenefit
      if (survivorBenefit < 0) {
        survivorBenefit = 0
      }
    return Number(survivorBenefit)
  }
}
