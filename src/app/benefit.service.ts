import { Injectable } from '@angular/core';
import {Person} from './data model classes/person';
import { CalculationYear } from './data model classes/calculationyear';


@Injectable()
export class BenefitService {

  constructor() { }

  storedRetirementCalculations = {}

  calculateRetirementBenefit(person:Person, benefitDate: Date) {
    let retirementBenefit: number = 0
    let monthsWaited = benefitDate.getMonth() - person.FRA.getMonth() + 12 * (benefitDate.getFullYear() - person.FRA.getFullYear())
    if (monthsWaited < -36)
    {retirementBenefit = person.PIA - (person.PIA / 100 * 5 / 9 * 36) + (person.PIA / 100 * 5 / 12 * (monthsWaited+36))}
    if (monthsWaited < 0 && monthsWaited >= -36)
    {retirementBenefit = person.PIA + (person.PIA / 100 * 5 / 9 * monthsWaited)}
    if (monthsWaited == 0)
    {retirementBenefit = person.PIA}
    if (monthsWaited > 0 )
    {retirementBenefit = person.PIA + (person.PIA / 100 * 2 / 3 * monthsWaited)}
    
    retirementBenefit = retirementBenefit + person.PIA * (2/3/100) * person.DRCsViaSuspension
    
    return Number(retirementBenefit)
  }

  calculateSpousalBenefit(person:Person, otherPerson:Person, retirementBenefit: number, spousalStartDate: Date)
  {
    //no need to check for filing prior to 62, because we're already checking for that in the input form component.

    //Initial calculation
    let spousalBenefit = otherPerson.PIA / 2

    //subtract greater of PIA or retirement benefit, but no more than spousal benefit. No subtraction if retirement benefit is zero (i.e., if not yet filed for retirement benefit)
      if (retirementBenefit > 0 && retirementBenefit >= person.PIA) {
        spousalBenefit = spousalBenefit - retirementBenefit
        }
      else if (retirementBenefit > 0 && retirementBenefit < person.PIA) {
        spousalBenefit = spousalBenefit - person.PIA
      }

    //Multiply by a reduction factor if spousal benefit claimed prior to FRA
    let monthsWaited = spousalStartDate.getMonth() - person.FRA.getMonth() + 12 * (spousalStartDate.getFullYear() - person.FRA.getFullYear())
    if (monthsWaited >= -36 && monthsWaited < 0)
    {spousalBenefit = spousalBenefit + (spousalBenefit * 25/36/100 * monthsWaited)}
    if (monthsWaited < -36)
    {spousalBenefit = spousalBenefit - (spousalBenefit * 25/36/100 * 36) + (spousalBenefit * 5/12/100 * (monthsWaited+36))}

    //GPO: reduce by 2/3 of government pension
    spousalBenefit = spousalBenefit - 2/3 * person.governmentPension

    //If GPO or reduction for own retirementBenefit/PIA reduced spousalBenefit below zero, spousalBenefit is zero.
    if (spousalBenefit < 0) {
      spousalBenefit = 0
    }


    return Number(spousalBenefit)
  }

  calculateSurvivorBenefit(survivingPerson:Person, survivorRetirementBenefit: number,  survivorSurvivorBenefitDate: Date,
    deceasedPerson:Person, dateOfDeath: Date, deceasedClaimingDate: Date)
  {
    let deceasedRetirementBenefit: number
    let survivorBenefit: number

    //If deceased had filed, survivorBenefit = deceased spouse's retirement benefit, but no less than 82.5% of deceased's PIA
    if (deceasedClaimingDate <= dateOfDeath) {
      deceasedRetirementBenefit = this.calculateRetirementBenefit(deceasedPerson, deceasedClaimingDate)
      survivorBenefit = deceasedRetirementBenefit
      if (survivorBenefit < 0.825 * deceasedPerson.PIA) {
        survivorBenefit = 0.825 * deceasedPerson.PIA
       }
      }
    else { //i.e., if deceased sposue had NOT filed as of date of death...
        //if deceased spouse was younger than FRA, survivor benefit = deceasedPIA
        if (dateOfDeath < deceasedPerson.FRA){
          survivorBenefit = deceasedPerson.PIA
        }
        //if deceased spouse was older than FRA, survivorBenefit = deceased's retirement benefit on date of death
        else {
        survivorBenefit = this.calculateRetirementBenefit(deceasedPerson, dateOfDeath)
        }
    }
    
    //If survivor files for survivor benefit prior to their survivorFRA...
    if (survivorSurvivorBenefitDate < survivingPerson.survivorFRA){

      //find percentage of the way survivor is from 60 to FRA
      let monthsFrom60toFRA: number = (survivingPerson.survivorFRA.getFullYear() - (survivingPerson.SSbirthDate.getFullYear()+60))*12 + (survivingPerson.survivorFRA.getMonth() - survivingPerson.SSbirthDate.getMonth())
      let monthsElapsed: number = (survivorSurvivorBenefitDate.getFullYear() - (survivingPerson.SSbirthDate.getFullYear()+60))*12 + (survivorSurvivorBenefitDate.getMonth() - survivingPerson.SSbirthDate.getMonth())
      let percentageWaited: number = monthsElapsed / monthsFrom60toFRA

      //if deceased had not filed before FRA, adjust survivor benefit downward relative to initial survivor benefit calculation above.
      if (deceasedClaimingDate >= deceasedPerson.FRA) {
        survivorBenefit = survivorBenefit - (survivorBenefit * 0.285 * (1 - percentageWaited))
      }

      //If deceased had filed before FRA, do completely new calculation, with survivor benefit based on deceasedPIA rather than deceased retirement benefit.
      if (deceasedClaimingDate < deceasedPerson.FRA && survivorSurvivorBenefitDate < survivingPerson.survivorFRA) {
        survivorBenefit = deceasedPerson.PIA - (deceasedPerson.PIA * 0.285 * (1 - percentageWaited))
        console.log("survivorFRA: " + survivingPerson.survivorFRA)
        console.log("percentageWaited: " + percentageWaited)
        console.log("survivor benefit before limitation: " + survivorBenefit)
        //survivorBenefit then limited to greater of 82.5% of deceased's PIA or amount deceased was receiving on date of death
        if (0.825 * deceasedPerson.PIA < deceasedRetirementBenefit) {
          if (survivorBenefit > deceasedRetirementBenefit) {
            survivorBenefit = deceasedRetirementBenefit
          }
        } else {
            if (survivorBenefit > 0.825 * deceasedPerson.PIA) {
              survivorBenefit = 0.825 * deceasedPerson.PIA
            }
          }
      }
    }

      //subtract own retirement benefit
      survivorBenefit = survivorBenefit - survivorRetirementBenefit

      //GPO: reduce by 2/3 of government pension
      survivorBenefit = survivorBenefit - 2/3 * survivingPerson.governmentPension

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
  

  //Calculates annual benefit (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
  calculateAnnualBenefitAmountSingle(person:Person, calcYear:CalculationYear){
      if (calcYear.date.getFullYear() < person.FRA.getFullYear()) {
        calcYear.personAannualRetirementBenefit = calcYear.monthsOfPersonAretirement * person.retirementBenefit
      } else if (calcYear.date.getFullYear() == person.FRA.getFullYear()){
          //total monthsOfRetirement is monthsOfRetirement. Some will be retirementBenefitAfterARF. Rest will be retirementBenefit.  Then subtract withholdingAmount
          //ARF should be applied for (12 - FRA.getMonth) months (e.g., all 12 if FRA is January). But limited to monthsOfRetirement.
          let ARFmonths = 12 - person.FRA.getMonth()
          if (ARFmonths > calcYear.monthsOfPersonAretirement) {
            ARFmonths = calcYear.monthsOfPersonAretirement
          }
          calcYear.personAannualRetirementBenefit = ARFmonths * person.retirementBenefitAfterARF + (calcYear.monthsOfPersonAretirement - ARFmonths) * person.retirementBenefit
        } else {//i.e., if whole year is past FRA
        calcYear.personAannualRetirementBenefit = calcYear.monthsOfPersonAretirement * person.retirementBenefitAfterARF
        }
      //Add back overwithholding
      calcYear.personAannualRetirementBenefit = calcYear.personAannualRetirementBenefit + calcYear.personAoverWithholding

    return calcYear
  }

  
  //Calculates annual benefit (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
  calculateAnnualBenefitAmountsCouple(personA:Person, personB:Person, calcYear:CalculationYear){
      //Spouse A retirement and spousal
      if (calcYear.date.getFullYear() < personA.FRA.getFullYear()) {
        calcYear.personAannualRetirementBenefit = calcYear.monthsOfPersonAretirement * personA.retirementBenefit
        calcYear.personAannualSpousalBenefit = (calcYear.monthsOfPersonAspousalWithoutRetirement * personA.spousalBenefitWithoutRetirement) + (calcYear.monthsOfPersonAspousalWithRetirement * personA.spousalBenefitWithRetirement)
      } else if (calcYear.date.getFullYear() == personA.FRA.getFullYear()){
          //Calculate number of ARF months (e.g., 10 if FRA is March)
          let ARFmonths = 12 - personA.FRA.getMonth()
          if (ARFmonths > calcYear.monthsOfPersonAretirement) {
            ARFmonths = calcYear.monthsOfPersonAretirement //Limit ARFmonths to number of months of retirement benefit
          }
          calcYear.personAannualRetirementBenefit = ARFmonths * personA.retirementBenefitAfterARF + (calcYear.monthsOfPersonAretirement - ARFmonths) * personA.retirementBenefit
          //Figure out how many months there are of "pre-ARF with retirement benefit" "post-ARF with retirement benefit" and "post-ARF without retirement benefit" ("Without" months require restricted app. So none are pre-ARF)
          ARFmonths = 12 - personA.FRA.getMonth() //reset ARFmonths
          calcYear.personAannualSpousalBenefit =
            personA.spousalBenefitWithoutRetirementAfterARF * calcYear.monthsOfPersonAspousalWithoutRetirement //Without retirement is always after ARF
          + personA.spousalBenefitWithRetirementAfterARF * (ARFmonths - calcYear.monthsOfPersonAspousalWithoutRetirement) //post-ARF "with retirement" months is ARF months minus the "without retirement months"
          + personA.spousalBenefitWithRetirement * (calcYear.monthsOfPersonAspousalWithRetirement - (ARFmonths - calcYear.monthsOfPersonAspousalWithoutRetirement)) //pre-ARF "with retirement" months is total "with retirement" months minus the post-ARF "with" months (calculated in line above)
        } else {//i.e., if whole year is past FRA
          calcYear.personAannualRetirementBenefit = calcYear.monthsOfPersonAretirement * personA.retirementBenefitAfterARF
          calcYear.personAannualSpousalBenefit = (calcYear.monthsOfPersonAspousalWithoutRetirement * personA.spousalBenefitWithoutRetirementAfterARF) + (calcYear.monthsOfPersonAspousalWithRetirement * personA.spousalBenefitWithRetirementAfterARF)
        }

      //Spouse B retirement and spousal
      if (calcYear.date.getFullYear() < personB.FRA.getFullYear()) {
        calcYear.personBannualRetirementBenefit = calcYear.monthsOfPersonBretirement * personB.retirementBenefit
        calcYear.personBannualSpousalBenefit = (calcYear.monthsOfPersonBspousalWithoutRetirement * personB.spousalBenefitWithoutRetirement) + (calcYear.monthsOfPersonBspousalWithRetirement * personB.spousalBenefitWithRetirement)
      } else if (calcYear.date.getFullYear() == personB.FRA.getFullYear()){
          //Calculate number of ARF months (e.g., 10 if FRA is March)
          let ARFmonths = 12 - personB.FRA.getMonth()
          if (ARFmonths > calcYear.monthsOfPersonBretirement) {
            ARFmonths = calcYear.monthsOfPersonBretirement //Limit ARFmonths to number of months of retirement benefit
          }
          calcYear.personBannualRetirementBenefit = ARFmonths * personB.retirementBenefitAfterARF + (calcYear.monthsOfPersonBretirement - ARFmonths) * personB.retirementBenefit
          //Figure out how many months there are of "pre-ARF with retirement benefit" "post-ARF with retirement benefit" and "post-ARF without retirement benefit" ("Without" months require restricted app. So none are pre-ARF)
          ARFmonths = 12 - personA.FRA.getMonth() //reset ARFmonths
          calcYear.personBannualSpousalBenefit =
            personB.spousalBenefitWithoutRetirementAfterARF * calcYear.monthsOfPersonBspousalWithoutRetirement //Without retirement is always after ARF
          + personB.spousalBenefitWithRetirementAfterARF * (ARFmonths - calcYear.monthsOfPersonBspousalWithoutRetirement) //post-ARF "with retirement" months is ARF months minus the "without retirement months"
          + personB.spousalBenefitWithRetirement * (calcYear.monthsOfPersonBspousalWithRetirement - (ARFmonths - calcYear.monthsOfPersonBspousalWithoutRetirement)) //pre-ARF "with retirement" months is total "with retirement" months minus the post-ARF "with" months (calculated in line above)
        } else {//i.e., if whole year is past FRA
          calcYear.personBannualRetirementBenefit = calcYear.monthsOfPersonBretirement * personB.retirementBenefitAfterARF
          calcYear.personBannualSpousalBenefit = (calcYear.monthsOfPersonBspousalWithoutRetirement * personB.spousalBenefitWithoutRetirementAfterARF) + (calcYear.monthsOfPersonBspousalWithRetirement * personB.spousalBenefitWithRetirementAfterARF)
        }

        //Survivor benefits are always with ARF since we assume it doesn't even get claimed until FRA
        calcYear.personAannualSurvivorBenefit = (calcYear.monthsOfPersonAsurvivorWithoutRetirement * personA.survivorBenefitWithoutRetirementAfterARF) + (calcYear.monthsOfPersonAsurvivorWithRetirement * personA.survivorBenefitWithRetirementAfterARF) 
        calcYear.personBannualSurvivorBenefit = (calcYear.monthsOfPersonBsurvivorWithoutRetirement * personB.survivorBenefitWithoutRetirementAfterARF) + (calcYear.monthsOfPersonBsurvivorWithRetirement * personB.survivorBenefitWithRetirementAfterARF)

      //Add back overwithholding
      calcYear.personAannualRetirementBenefit = calcYear.personAannualRetirementBenefit + calcYear.personAoverWithholding
      calcYear.personBannualRetirementBenefit = calcYear.personBannualRetirementBenefit + calcYear.personBoverWithholding

    return calcYear
  }


}
