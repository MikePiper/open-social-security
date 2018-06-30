import { Injectable } from '@angular/core';
import {Person} from './person';


@Injectable()
export class BenefitService {

  constructor() { }

  calculateRetirementBenefit(PIA: number, person:Person, benefitDate: Date)
  {
    let retirementBenefit: number = 0
    let monthsWaited = benefitDate.getMonth() - person.FRA.getMonth() + 12 * (benefitDate.getFullYear() - person.FRA.getFullYear())

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

  calculateSpousalBenefit(PIA: number, otherSpousePIA: number, person:Person, retirementBenefit: number, spousalStartDate: Date, governmentPension: number)
  {
    //no need to check for filing prior to 62, because we're already checking for that in the input form component.

    //Initial calculation
    let spousalBenefit = otherSpousePIA / 2

    //subtract greater of PIA or retirement benefit, but no more than spousal benefit. No subtraction if retirement benefit is zero (i.e., if not yet filed for retirement benefit)
      if (retirementBenefit > 0 && retirementBenefit >= PIA) {
        spousalBenefit = spousalBenefit - retirementBenefit
        }
      else if (retirementBenefit > 0 && retirementBenefit < PIA) {
        spousalBenefit = spousalBenefit - PIA
      }

    //Multiply by a reduction factor if spousal benefit claimed prior to FRA
    let monthsWaited = spousalStartDate.getMonth() - person.FRA.getMonth() + 12 * (spousalStartDate.getFullYear() - person.FRA.getFullYear())
    if (monthsWaited >= -36 && monthsWaited < 0)
    {spousalBenefit = spousalBenefit + (spousalBenefit * 25/36/100 * monthsWaited)}
    if (monthsWaited < -36)
    {spousalBenefit = spousalBenefit - (spousalBenefit * 25/36/100 * 36) + (spousalBenefit * 5/12/100 * (monthsWaited+36))}

    //GPO: reduce by 2/3 of government pension
    spousalBenefit = spousalBenefit - 2/3 * governmentPension

    //If GPO or reduction for own retirementBenefit/PIA reduced spousalBenefit below zero, spousalBenefit is zero.
    if (spousalBenefit < 0) {
      spousalBenefit = 0
    }


    return Number(spousalBenefit)
  }

  calculateSurvivorBenefit(survivorSSbirthDate: Date, survivingPerson:Person, survivorRetirementBenefit: number,  survivorSurvivorBenefitDate: Date,
    deceasedPerson:Person, dateOfDeath: Date,  deceasedPIA: number, deceasedClaimingDate: Date, governmentPension: number)
  {
    let deceasedRetirementBenefit: number
    let survivorBenefit: number

    //If deceased had filed, survivorBenefit = deceased spouse's retirement benefit, but no less than 82.5% of deceased's PIA
    if (deceasedClaimingDate <= dateOfDeath) {
      deceasedRetirementBenefit = this.calculateRetirementBenefit(deceasedPIA, deceasedPerson, deceasedClaimingDate)
      survivorBenefit = deceasedRetirementBenefit
      if (survivorBenefit < 0.825 * deceasedPIA) {
        survivorBenefit = 0.825 * deceasedPIA
       }
      }
    else { //i.e., if deceased sposue had NOT filed as of date of death...
        //if deceased spouse was younger than FRA, survivor benefit = deceasedPIA
        if (dateOfDeath < deceasedPerson.FRA){
          survivorBenefit = deceasedPIA
        }
        //if deceased spouse was older than FRA, survivorBenefit = deceased's retirement benefit on date of death
        else {
        survivorBenefit = this.calculateRetirementBenefit(deceasedPIA, deceasedPerson, dateOfDeath)
        }
    }
    
    //If survivor files for survivor benefit prior to their survivorFRA...
    if (survivorSurvivorBenefitDate < survivingPerson.survivorFRA){

      //find percentage of the way survivor is from 60 to FRA
      let monthsFrom60toFRA: number = (survivingPerson.survivorFRA.getFullYear() - (survivorSSbirthDate.getFullYear()+60))*12 + (survivingPerson.survivorFRA.getMonth() - survivorSSbirthDate.getMonth())
      let monthsElapsed: number = (survivorSurvivorBenefitDate.getFullYear() - (survivorSSbirthDate.getFullYear()+60))*12 + (survivorSurvivorBenefitDate.getMonth() - survivorSSbirthDate.getMonth())
      let percentageWaited: number = monthsElapsed / monthsFrom60toFRA

      //if deceased had not filed before FRA, adjust survivor benefit downward relative to initial survivor benefit calculation above.
      if (deceasedClaimingDate >= deceasedPerson.FRA) {
        survivorBenefit = survivorBenefit - (survivorBenefit * 0.285 * (1 - percentageWaited))
      }

      //If deceased had filed before FRA, do completely new calculation, with survivor benefit based on deceasedPIA rather than deceased retirement benefit.
      if (deceasedClaimingDate < deceasedPerson.FRA && survivorSurvivorBenefitDate < survivingPerson.survivorFRA) {
        survivorBenefit = deceasedPIA - (deceasedPIA * 0.285 * (1 - percentageWaited))
        console.log("survivorFRA: " + survivingPerson.survivorFRA)
        console.log("percentageWaited: " + percentageWaited)
        console.log("survivor benefit before limitation: " + survivorBenefit)
        //survivorBenefit then limited to greater of 82.5% of deceased's PIA or amount deceased was receiving on date of death
        if (0.825 * deceasedPIA < deceasedRetirementBenefit) {
          if (survivorBenefit > deceasedRetirementBenefit) {
            survivorBenefit = deceasedRetirementBenefit
          }
        } else {
            if (survivorBenefit > 0.825 * deceasedPIA) {
              survivorBenefit = 0.825 * deceasedPIA
            }
          }
      }
    }

      //subtract own retirement benefit
      survivorBenefit = survivorBenefit - survivorRetirementBenefit

      //GPO: reduce by 2/3 of government pension
      survivorBenefit = survivorBenefit - 2/3 * governmentPension

      //If GPO or reduction for own retirement benefit reduced spousalBenefit below zero, spousalBenefit is zero.
      if (survivorBenefit < 0) {
        survivorBenefit = 0
    }
      
    return Number(survivorBenefit)
  }

  countBenefitMonths(benefitFilingDate:Date, currentCalculationDate:Date){
    let monthsBeforeBenefit: number = benefitFilingDate.getMonth() - currentCalculationDate.getMonth() + 12*(benefitFilingDate.getFullYear() - currentCalculationDate.getFullYear())
    let monthsOfBenefit: number
    if (monthsBeforeBenefit >= 12) {
      monthsOfBenefit = 0
    }
    else if (monthsBeforeBenefit > 0) {
      monthsOfBenefit = 12 - monthsBeforeBenefit
    } else {
      monthsOfBenefit = 12
    }
    return Number(monthsOfBenefit)
  }
  
}
