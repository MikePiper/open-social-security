import { Injectable } from '@angular/core';
import {Person} from './data model classes/person';
import { CalculationYear } from './data model classes/calculationyear';
import { ClaimingScenario } from './data model classes/claimingscenario';
import { TabHeadingDirective } from 'ngx-bootstrap';


@Injectable()
export class BenefitService {

  constructor() { }

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

    if (person.isDisabled === true) {//set retirement benefit (before DRCs from suspension) to PIA if person is disabled
      retirementBenefit = person.PIA
    }
    
    if (benefitDate >= person.FRA) {//If person didn't file until FRA or later, DRCs via suspension are applied to PIA
      retirementBenefit = retirementBenefit + (person.PIA * (2/3/100) * person.DRCsViaSuspension)
    }
    else {//If person filed before FRA, DRCs via suspension are applied to reduced benefit amount
      retirementBenefit = retirementBenefit + (retirementBenefit * (2/3/100) * person.DRCsViaSuspension)
    }

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

    //If otherPerson has a family max (ie if they're married) make sure spousal benefit doesn't cause family max to be exceeded
    if (otherPerson.familyMaximum && spousalBenefit > otherPerson.familyMaximum - otherPerson.PIA){
      spousalBenefit = otherPerson.familyMaximum - otherPerson.PIA
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

  calculateChildBenefitParentLiving(parent:Person):number{
    let childBenefit:number = parent.PIA * 0.5
    return Number(childBenefit)
  }

  calculateChildBenefitParentDeceased(parent:Person):number{
    let childBenefit:number = parent.PIA * 0.75
    return Number(childBenefit)
  }

  //Calculates annual benefit (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
  calculateAnnualRetirementBenefit(person:Person, calcYear:CalculationYear){
    if (person.id == 'A') {
      calcYear.personAannualRetirementBenefit =
        calcYear.monthsOfPersonAretirementPreARF * person.initialRetirementBenefit
      + calcYear.monthsOfPersonAretirementPostARF * person.retirementBenefitAfterARF
      + calcYear.monthsOfPersonAretirementWithSuspensionDRCs * person.retirementBenefitWithDRCsfromSuspension
      //add back overwithholding
      calcYear.personAannualRetirementBenefit = calcYear.personAannualRetirementBenefit + calcYear.personAoverWithholding
    }
    else {
      calcYear.personBannualRetirementBenefit =
        calcYear.monthsOfPersonBretirementPreARF * person.initialRetirementBenefit
      + calcYear.monthsOfPersonBretirementPostARF * person.retirementBenefitAfterARF
      + calcYear.monthsOfPersonBretirementWithSuspensionDRCs * person.retirementBenefitWithDRCsfromSuspension
      //add back overwithholding
      calcYear.personBannualRetirementBenefit = calcYear.personBannualRetirementBenefit + calcYear.personBoverWithholding
    }
    return calcYear
  }


  //Calculates annual benefits (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
  calculateAnnualBenefitAmountsCouple(personA:Person, personB:Person, calcYear:CalculationYear, debugTable:boolean){

      //Calculate annual retirement amounts
      calcYear = this.calculateAnnualRetirementBenefit(personA, calcYear)
      calcYear = this.calculateAnnualRetirementBenefit(personB, calcYear)

      //Calculate annual spousal benefit amounts
      calcYear.personAannualSpousalBenefit =
          calcYear.monthsOfPersonAspousalWithoutRetirement * personA.spousalBenefitWithoutRetirement
        + calcYear.monthsOfPersonAspousalWithRetirementPreARF * personA.spousalBenefitWithRetirementPreARF
        + calcYear.monthsOfPersonAspousalWithRetirementPostARF * personA.spousalBenefitWithRetirementAfterARF
        + calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs * personA.spousalBenefitWithSuspensionDRCRetirement

      calcYear.personBannualSpousalBenefit =
          calcYear.monthsOfPersonBspousalWithoutRetirement * personB.spousalBenefitWithoutRetirement
        + calcYear.monthsOfPersonBspousalWithRetirementPreARF * personB.spousalBenefitWithRetirementPreARF
        + calcYear.monthsOfPersonBspousalWithRetirementPostARF * personB.spousalBenefitWithRetirementAfterARF
        + calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs * personB.spousalBenefitWithSuspensionDRCRetirement

      //Survivor benefits are always with ARF since we assume it doesn't even get claimed until FRA
      calcYear.personAannualSurvivorBenefit =
          calcYear.monthsOfPersonAsurvivorWithoutRetirement * personA.survivorBenefitWithoutRetirement
        + calcYear.monthsOfPersonAsurvivorWithRetirementPostARF * personA.survivorBenefitWithRetirementAfterARF
        + calcYear.monthsOfPersonAsurvivorWithRetirementwithSuspensionDRCs * personA.survivorBenefitWithSuspensionDRCRetirement
      
      calcYear.personBannualSurvivorBenefit =
          calcYear.monthsOfPersonBsurvivorWithoutRetirement * personB.survivorBenefitWithoutRetirement
        + calcYear.monthsOfPersonBsurvivorWithRetirementPostARF * personB.survivorBenefitWithRetirementAfterARF
        + calcYear.monthsOfPersonBsurvivorWithRetirementwithSuspensionDRCs * personB.survivorBenefitWithSuspensionDRCRetirement
      
      if (debugTable === true) {
        calcYear.debugTableRow = [calcYear.date.getFullYear(), Math.round(calcYear.personAannualRetirementBenefit), Math.round(calcYear.personBannualRetirementBenefit),
          Math.round(calcYear.personAannualSpousalBenefit), Math.round(calcYear.personBannualSpousalBenefit), Math.round(calcYear.personAannualSurvivorBenefit), Math.round(calcYear.personBannualSurvivorBenefit)]
        }
    return calcYear
  }


  CountSingleBenefitMonths(calcYear:CalculationYear, person:Person){
    //This function loops through individual months in a year (unless Person is over age 70, in which case it looks at the whole year at once).
    if (person.age >= 70){
          calcYear.monthsOfPersonAretirementWithSuspensionDRCs = 12
    }
    else {
      let testMonth:Date = new Date(calcYear.date)
      let endTestMonth:Date = new Date(calcYear.date.getFullYear(), 11, 1) //Dec of calcYear
      while (testMonth <= endTestMonth){
        if (testMonth >= person.retirementBenefitDate){ //if this is a retirement month...
            if (person.beginSuspensionDate > testMonth || person.endSuspensionDate <= testMonth){//If suspension does NOT eliminate that benefit...
              //Determine which type of retirementMonth it is and add 1 to appropriate count
              if (testMonth < person.FRA){
                calcYear.monthsOfPersonAretirementPreARF = calcYear.monthsOfPersonAretirementPreARF + 1
              }
              else if (testMonth < person.endSuspensionDate){
                calcYear.monthsOfPersonAretirementPostARF = calcYear.monthsOfPersonAretirementPostARF + 1
              }
              else {
                calcYear.monthsOfPersonAretirementWithSuspensionDRCs = calcYear.monthsOfPersonAretirementWithSuspensionDRCs + 1
              }
            }
            else {//i.e., if suspension DOES eliminate the benefit for this month
              person.DRCsViaSuspension = person.DRCsViaSuspension + 1
            }
        }
        testMonth.setMonth(testMonth.getMonth()+1)
      }
    }
    return calcYear
  }

  CountCoupleBenefitMonths(scenario:ClaimingScenario, calcYear:CalculationYear, personA:Person, personB:Person){
    //This function loops through individual months in a year (unless:
          //a) we're at the point where everybody is post-FRA, post-claiming, post-suspension, in which case it looks at the whole year at once), or
          //b) it's a scenario in which suspending isn't considered, in which case it looks at whole year at once
      //Not necessary to set all the month counts that are zero. Since it's a new CalculationYear every year, they are automatically set to zero.
      if (calcYear.date >= personA.FRA && calcYear.date >= personA.retirementBenefitDate && calcYear.date >= personA.spousalBenefitDate && calcYear.date >= personA.endSuspensionDate &&
          calcYear.date >= personB.FRA && calcYear.date >= personB.retirementBenefitDate && calcYear.date >= personB.spousalBenefitDate && calcYear.date >= personB.endSuspensionDate){
            calcYear.monthsOfPersonAretirementWithSuspensionDRCs = 12
            calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs = 12
            calcYear.monthsOfPersonAsurvivorWithRetirementwithSuspensionDRCs = 12
            calcYear.monthsOfPersonBretirementWithSuspensionDRCs = 12
            calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs = 12
            calcYear.monthsOfPersonBsurvivorWithRetirementwithSuspensionDRCs = 12
        }
      else if (personA.hasFiled === false && personB.hasFiled === false && personA.isDisabled === false && personB.isDisabled === false){//there's no possibility of suspension, because neither has filed or is disabled
        //Do an annual loop that runs much faster:
        let monthsOfBenefit: number
        let ARFmonths:number
        //personA retirement
            monthsOfBenefit = this.countMonthsOfABenefit(personA.retirementBenefitDate, calcYear.date)
            if (calcYear.date.getFullYear() < personA.FRA.getFullYear()){
              calcYear.monthsOfPersonAretirementPreARF = monthsOfBenefit
            }
            else if (calcYear.date.getFullYear() > personA.FRA.getFullYear()) {
              calcYear.monthsOfPersonAretirementPostARF = monthsOfBenefit
            }
            else {
              calcYear.monthsOfPersonAretirementPostARF = 12 - personA.FRA.getMonth() //If FRA is May (4), we have 8 post-ARF months
              if (calcYear.monthsOfPersonAretirementPostARF > monthsOfBenefit) {calcYear.monthsOfPersonAretirementPostARF = monthsOfBenefit}//limit PostARFmonths to monthsOfBenefit
              calcYear.monthsOfPersonAretirementPreARF = monthsOfBenefit - calcYear.monthsOfPersonAretirementPostARF
            }
        //personB retirement
            monthsOfBenefit = this.countMonthsOfABenefit(personB.retirementBenefitDate, calcYear.date)
            if (calcYear.date.getFullYear() < personB.FRA.getFullYear()){
              calcYear.monthsOfPersonBretirementPreARF = monthsOfBenefit
            }
            else if (calcYear.date.getFullYear() > personB.FRA.getFullYear()) {
              calcYear.monthsOfPersonBretirementPostARF = monthsOfBenefit
            }
            else {
              calcYear.monthsOfPersonBretirementPostARF = 12 - personB.FRA.getMonth() //If FRA is May (4), we have 8 post-ARF months
              if (calcYear.monthsOfPersonBretirementPostARF > monthsOfBenefit) {calcYear.monthsOfPersonBretirementPostARF = monthsOfBenefit}//limit PostARFmonths to monthsOfBenefit
              calcYear.monthsOfPersonBretirementPreARF = monthsOfBenefit - calcYear.monthsOfPersonBretirementPostARF
            }
        //personA spousal
            monthsOfBenefit = this.countMonthsOfABenefit(personA.spousalBenefitDate, calcYear.date)
            if (calcYear.date.getFullYear() < personA.FRA.getFullYear()) {ARFmonths = 0}
            else if (calcYear.date.getFullYear() > personA.FRA.getFullYear()) {ARFmonths = 12}
            else {ARFmonths = 12 - personA.FRA.getMonth()}
            if (calcYear.monthsOfPersonAretirementPreARF + calcYear.monthsOfPersonAretirementPostARF >= monthsOfBenefit){//If there are at least as many retirement months as spousal months, all spousal months are "withRetirement." Otherwise, find out how many more spousal months there are than retirement months.
              calcYear.monthsOfPersonAspousalWithoutRetirement = 0
            }
            else {
              calcYear.monthsOfPersonAspousalWithoutRetirement = monthsOfBenefit - (calcYear.monthsOfPersonAretirementPreARF + calcYear.monthsOfPersonAretirementPostARF)
            }
            calcYear.monthsOfPersonAspousalWithRetirementPostARF = ARFmonths - calcYear.monthsOfPersonAspousalWithoutRetirement //withRetirementPostARF" months is ARF months minus the "withoutRetirement" months
            if (calcYear.monthsOfPersonAspousalWithRetirementPostARF + calcYear.monthsOfPersonAspousalWithoutRetirement > monthsOfBenefit) {
              calcYear.monthsOfPersonAspousalWithRetirementPostARF = monthsOfBenefit - calcYear.monthsOfPersonAspousalWithoutRetirement //limit sum of "spousalWithoutRetirement" and "withRetirementPostARF" months to total spousal months
            }
            calcYear.monthsOfPersonAspousalWithRetirementPreARF = monthsOfBenefit - calcYear.monthsOfPersonAspousalWithoutRetirement - calcYear.monthsOfPersonAspousalWithRetirementPostARF//i.e., spousal months that are neither of the other types of spousal months
        //personB spousal
            monthsOfBenefit = this.countMonthsOfABenefit(personB.spousalBenefitDate, calcYear.date)
            if (calcYear.date.getFullYear() < personB.FRA.getFullYear()) {ARFmonths = 0}
            else if (calcYear.date.getFullYear() > personB.FRA.getFullYear()) {ARFmonths = 12}
            else {ARFmonths = 12 - personB.FRA.getMonth()}
            if (calcYear.monthsOfPersonBretirementPreARF + calcYear.monthsOfPersonBretirementPostARF >= monthsOfBenefit){//If there are at least as many retirement months as spousal months, all spousal months are "withRetirement." Otherwise, find out how many more spousal months there are than retirement months.
              calcYear.monthsOfPersonBspousalWithoutRetirement = 0
            }
            else {
              calcYear.monthsOfPersonBspousalWithoutRetirement = monthsOfBenefit - (calcYear.monthsOfPersonBretirementPreARF + calcYear.monthsOfPersonBretirementPostARF)
            }
            calcYear.monthsOfPersonBspousalWithRetirementPostARF = ARFmonths - calcYear.monthsOfPersonBspousalWithoutRetirement //withRetirementPostARF" months is ARF months minus the "withoutRetirement" months
            if (calcYear.monthsOfPersonBspousalWithRetirementPostARF + calcYear.monthsOfPersonBspousalWithoutRetirement > monthsOfBenefit) {
              calcYear.monthsOfPersonBspousalWithRetirementPostARF = monthsOfBenefit - calcYear.monthsOfPersonBspousalWithoutRetirement //limit sum of "spousalWithoutRetirement" and "withRetirementPostARF" months to total spousal months
            }
            calcYear.monthsOfPersonBspousalWithRetirementPreARF = monthsOfBenefit - calcYear.monthsOfPersonBspousalWithoutRetirement - calcYear.monthsOfPersonBspousalWithRetirementPostARF//i.e., spousal months that are neither of the other types of spousal months
        //personA survivor
            monthsOfBenefit = this.countMonthsOfABenefit(personA.survivorFRA, calcYear.date)
            if (calcYear.monthsOfPersonAretirementPreARF + calcYear.monthsOfPersonAretirementPostARF >= monthsOfBenefit){//If there are at least as many retirement months as survivor months, all survivor months are "withRetirement." Otherwise, find out how many more survivor months there are than retirement months.
              calcYear.monthsOfPersonAsurvivorWithoutRetirement = 0
            }
            else {
              calcYear.monthsOfPersonAsurvivorWithoutRetirement = monthsOfBenefit - (calcYear.monthsOfPersonAretirementPreARF + calcYear.monthsOfPersonAretirementPostARF)
            }
            calcYear.monthsOfPersonAsurvivorWithRetirementPostARF = monthsOfBenefit - calcYear.monthsOfPersonAsurvivorWithoutRetirement //If a survivor month isn't "withoutRetirement," it is withRetirementPostARF
        //personB survivor
            monthsOfBenefit = this.countMonthsOfABenefit(personB.survivorFRA, calcYear.date)
            if (calcYear.monthsOfPersonBretirementPreARF + calcYear.monthsOfPersonBretirementPostARF >= monthsOfBenefit){//If there are at least as many retirement months as survivor months, all survivor months are "withRetirement." Otherwise, find out how many more survivor months there are than retirement months.
              calcYear.monthsOfPersonBsurvivorWithoutRetirement = 0
            }
            else {
              calcYear.monthsOfPersonBsurvivorWithoutRetirement = monthsOfBenefit - (calcYear.monthsOfPersonBretirementPreARF + calcYear.monthsOfPersonBretirementPostARF)
            }
            calcYear.monthsOfPersonBsurvivorWithRetirementPostARF = monthsOfBenefit - calcYear.monthsOfPersonBsurvivorWithoutRetirement //If a survivor month isn't "withoutRetirement," it is withRetirementPostARF
      }
      else {//have to loop monthly
        let testMonth:Date = new Date(calcYear.date)
        let endTestMonth:Date = new Date(calcYear.date.getFullYear(), 11, 1) //Dec of calcYear
        let personAsuspended:boolean
        let personBsuspended:boolean
        while (testMonth <= endTestMonth){
          if (personA.beginSuspensionDate > testMonth || personA.endSuspensionDate <= testMonth)   {personAsuspended = false}
          else {personAsuspended = true}
          if (personB.beginSuspensionDate > testMonth || personB.endSuspensionDate <= testMonth)   {personBsuspended = false}
          else {personBsuspended = true}
          //check if personA should get a retirement benefit (and if so, what type)
          if (testMonth >= personA.retirementBenefitDate){ //if this is a retirement month...
              if (personAsuspended === false){//If suspension does NOT eliminate that benefit...
                //Determine which type of retirementMonth it is and add 1 to appropriate count
                if (testMonth < personA.FRA){
                  calcYear.monthsOfPersonAretirementPreARF = calcYear.monthsOfPersonAretirementPreARF + 1
                }
                else if (testMonth >= personA.endSuspensionDate){//if they never suspended, there's no difference between "PostARF" and "WithSuspensionDRCs." So we don't have to check whether they suspended or not.
                  calcYear.monthsOfPersonAretirementWithSuspensionDRCs = calcYear.monthsOfPersonAretirementWithSuspensionDRCs + 1
                }
                else {
                  calcYear.monthsOfPersonAretirementPostARF = calcYear.monthsOfPersonAretirementPostARF + 1
                }
              }
              else {//i.e., if suspension DOES eliminate the benefit for this month
                personA.DRCsViaSuspension = personA.DRCsViaSuspension + 1
              }
          }
          //check if personB should get a retirement benefit (and if so, what type)
          if (testMonth >= personB.retirementBenefitDate){ //if this is a retirement month...
            if (personBsuspended === false){//If suspension does NOT eliminate that benefit...
              //Determine which type of retirementMonth it is and add 1 to appropriate count
              if (testMonth < personB.FRA){
                calcYear.monthsOfPersonBretirementPreARF = calcYear.monthsOfPersonBretirementPreARF + 1
              }
              else if (testMonth >= personB.endSuspensionDate){
                calcYear.monthsOfPersonBretirementWithSuspensionDRCs = calcYear.monthsOfPersonBretirementWithSuspensionDRCs + 1
              }
              else {
                calcYear.monthsOfPersonBretirementPostARF = calcYear.monthsOfPersonBretirementPostARF + 1
              }
            }
            else {//i.e., if suspension DOES eliminate the benefit for this month
              personB.DRCsViaSuspension = personB.DRCsViaSuspension + 1
            }
          }
          //check if personA should get a spousal benefit (and if so, what type)
          if (testMonth >= personA.spousalBenefitDate){ //if this is a spousal benefit month...
            if (personAsuspended === false && (scenario.maritalStatus == "divorced" || personBsuspended === false)  )
            {
              //figure out what type of spousal benefit and add 1 to appropriate count
                if (testMonth < personA.retirementBenefitDate) {
                  calcYear.monthsOfPersonAspousalWithoutRetirement = calcYear.monthsOfPersonAspousalWithoutRetirement + 1
                }
                else if (testMonth < personA.FRA) {
                  calcYear.monthsOfPersonAspousalWithRetirementPreARF = calcYear.monthsOfPersonAspousalWithRetirementPreARF + 1
                }
                else if (testMonth >= personA.endSuspensionDate) {//if they never suspended, there's no difference between "PostARF" and "WithSuspensionDRCs." So we don't have to check whether they suspended or not.
                  calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs = calcYear.monthsOfPersonAspousalWithRetirementwithSuspensionDRCs + 1
                }
                else {
                  calcYear.monthsOfPersonAspousalWithRetirementPostARF = calcYear.monthsOfPersonAspousalWithRetirementPostARF + 1
                }
            }
          }
          //check if personB should get a spousal benefit (and if so, what type)
          if (testMonth >= personB.spousalBenefitDate){ //if this is a spousal benefit month...
            if (personBsuspended === false && (scenario.maritalStatus == "divorced" || personAsuspended === false)  )
            {
              //figure out what type of spousal benefit and add 1 to appropriate count
                if (testMonth < personB.retirementBenefitDate) {
                  calcYear.monthsOfPersonBspousalWithoutRetirement = calcYear.monthsOfPersonBspousalWithoutRetirement + 1
                }
                else if (testMonth < personB.FRA) {
                  calcYear.monthsOfPersonBspousalWithRetirementPreARF = calcYear.monthsOfPersonBspousalWithRetirementPreARF + 1
                }
                else if (testMonth >= personB.endSuspensionDate) {//if they never suspended, there's no difference between "PostARF" and "WithSuspensionDRCs." So we don't have to check whether they suspended or not.
                  calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs = calcYear.monthsOfPersonBspousalWithRetirementwithSuspensionDRCs + 1  
                }
                else {
                  calcYear.monthsOfPersonBspousalWithRetirementPostARF = calcYear.monthsOfPersonBspousalWithRetirementPostARF + 1
                }
            }
          }
          //Check if personA should get a survivor benefit (and if so, what type)
          if (testMonth >= personA.survivorFRA){ //if this is a survivor benefit month...
            if (personAsuspended === false) {
              //figure out what type of survivor benefit and add 1 to appropriate count
              if (testMonth < personA.retirementBenefitDate) {
                calcYear.monthsOfPersonAsurvivorWithoutRetirement = calcYear.monthsOfPersonAsurvivorWithoutRetirement + 1
              }
              else if (testMonth >= personA.endSuspensionDate) {//if they never suspended, there's no difference between "PostARF" and "WithSuspensionDRCs." So we don't have to check whether they suspended or not.
                calcYear.monthsOfPersonAsurvivorWithRetirementwithSuspensionDRCs = calcYear.monthsOfPersonAsurvivorWithRetirementwithSuspensionDRCs + 1
              }
              else {
                calcYear.monthsOfPersonAsurvivorWithRetirementPostARF = calcYear.monthsOfPersonAsurvivorWithRetirementPostARF + 1
              }
            }
          }
          //Check if personB should get a survivor benefit (and if so, what type)
          if (testMonth >= personB.survivorFRA){ //if this is a survivor benefit month...
            if (personBsuspended === false) {
              //figure out what type of survivor benefit and add 1 to appropriate count
              if (testMonth < personB.retirementBenefitDate) {
                calcYear.monthsOfPersonBsurvivorWithoutRetirement = calcYear.monthsOfPersonBsurvivorWithoutRetirement + 1
              }
              else if (testMonth >= personB.endSuspensionDate) {//if they never suspended, there's no difference between "PostARF" and "WithSuspensionDRCs." So we don't have to check whether they suspended or not.
                calcYear.monthsOfPersonBsurvivorWithRetirementwithSuspensionDRCs = calcYear.monthsOfPersonBsurvivorWithRetirementwithSuspensionDRCs + 1
              }
              else {
                calcYear.monthsOfPersonBsurvivorWithRetirementPostARF = calcYear.monthsOfPersonBsurvivorWithRetirementPostARF + 1
              }
            }
          }
          testMonth.setMonth(testMonth.getMonth()+1)
      }
    }
    let countCoupleBenefitMonthsResult:any[] = [calcYear, personA, personB]
    return countCoupleBenefitMonthsResult
  }


  //This function just counts how many months of a retirement/spousal/survivor benefit there are in a given year. It can't determine pre-/post-ARF, pre-/post-suspension, etc.
  countMonthsOfABenefit(benefitFilingDate:Date, currentCalculationDate:Date){
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

  //calculates family maximum on one person's work record
  calculateFamilyMaximum(person:Person){
    if (person.isDisabled === true){
      /* https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615742
      family maximum is lesser of:
      85% of the AIME (but not less than the PIA before COLAs), or
      150% of the worker's PIA before COLAs.
      ...then you add all the COLAs back.
      */
      let PIAbeforeCOLAs: number = person.PIA
      //take current disability benefit (person.PIA) and back out COLAs for every year back to (and including) year in which disability entitlement began
          let thisYear:number = new Date().getFullYear()
          let entitlementYear:number = person.fixedRetirementBenefitDate.getFullYear()
          let i: number = thisYear - 1 //Don't back out COLA for this year, because it isn't effective until next year anyway.
          while (i >= entitlementYear) {
            PIAbeforeCOLAs = PIAbeforeCOLAs / (1 + this.annualIndexedValuesArray[i - 1979].COLA)
            i = i - 1
          }
      //Use original PIA (together with bend points from year in question) to calculate their AIME
          let firstBendPoint: number = this.annualIndexedValuesArray[entitlementYear - 1979].firstPIAbendPoint
          let secondBendPoint: number = this.annualIndexedValuesArray[entitlementYear - 1979].secondPIAbendPoint
          if (PIAbeforeCOLAs <= 0.9 * firstBendPoint) {
            person.AIME = PIAbeforeCOLAs / 0.9
          }
          else if (PIAbeforeCOLAs <= ( (0.9 * firstBendPoint) + (0.32 * (secondBendPoint - firstBendPoint)))) {
            person.AIME = (PIAbeforeCOLAs / 0.32) - (1.8125 * firstBendPoint)
          }
          else {
            person.AIME = (PIAbeforeCOLAs - 0.58 * firstBendPoint - 0.17 * secondBendPoint) / 0.15
          }
      //Now we can compare 85% of AIME, PIA before COLAs, and 150% of PIA before COLAs to get family max
          if (0.85 * person.AIME >= PIAbeforeCOLAs){
            //family max is lesser of 85% of AIME or 150% of PIA before cola
            if (0.85 * person.AIME < 1.5 * PIAbeforeCOLAs){
              person.familyMaximum = 0.85 * person.AIME
            }
            else {
              person.familyMaximum = 1.5 * PIAbeforeCOLAs
            }
          }
          else {
            person.familyMaximum = PIAbeforeCOLAs
          }
      //Then we have to add COLAs back.
          person.familyMaximum = person.familyMaximum + (person.PIA - PIAbeforeCOLAs)
    }
    else {//i.e., person isn't disabled
    //Family max is 150% up to first bend point, 272% from first to second, 134% from second to third, 175% beyond that
      if (this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979]){//If bend points exist for year in which person turned 62. (Which mostly means if they turned 62 in the past, use those bend points.)
        var firstBendPoint: number = this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979].firstFamilyMaxBendPoint
        var secondBendPoint: number = this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979].secondFamilyMaxBendPoint
        var thirdBendPoint: number = this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979].thirdFamilyMaxBendPoint
      }
      else {//If they turn 62 in the future, use most recent published bend points.
        var firstBendPoint: number = this.annualIndexedValuesArray[this.annualIndexedValuesArray.length - 1].firstFamilyMaxBendPoint
        var secondBendPoint: number = this.annualIndexedValuesArray[this.annualIndexedValuesArray.length - 1].secondFamilyMaxBendPoint
        var thirdBendPoint: number = this.annualIndexedValuesArray[this.annualIndexedValuesArray.length - 1].thirdFamilyMaxBendPoint
      }
      if (person.PIA <= firstBendPoint){
        person.familyMaximum = 1.5 * person.PIA
      }
      else if (person.PIA <= secondBendPoint){
        person.familyMaximum = 1.5 * firstBendPoint + 2.72 * (person.PIA - firstBendPoint)
      }
      else if (person.PIA <= thirdBendPoint){
        person.familyMaximum = 1.5 * firstBendPoint + 2.72 * (secondBendPoint - firstBendPoint) + 1.34 * (person.PIA - secondBendPoint)
      }
      else {
        person.familyMaximum = 1.5 * firstBendPoint + 2.72 * (secondBendPoint - firstBendPoint) + 1.34 * (thirdBendPoint - secondBendPoint) + 1.75 * (person.PIA - thirdBendPoint)
      }
    }
    return person
  }

  calculateCombinedFamilyMaximum(personA:Person, personB:Person, simultaneousEntitlementYear:number){//simultaneousEntitlementDate is date on which a child first becomes eligible on two work records
    let combinedFamilyMaximum:number
    let sumOfIndividualFamilyMaximums:number = personA.familyMaximum + personB.familyMaximum
    let limitForCombinedFamilyMaximum:number = 1.75 * this.calculatePIAfromAIME(this.annualIndexedValuesArray[simultaneousEntitlementYear - 1979].MaxTaxableWages / 12, simultaneousEntitlementYear)
    if (sumOfIndividualFamilyMaximums <= limitForCombinedFamilyMaximum){
      combinedFamilyMaximum = sumOfIndividualFamilyMaximums
    }
    else {
      combinedFamilyMaximum = limitForCombinedFamilyMaximum
    }
    return combinedFamilyMaximum
  }

  calculatePIAfromAIME(AIME:number, eligibilityYear:number){
    let PIA:number = 0
    let firstBendPoint = this.annualIndexedValuesArray[eligibilityYear - 1979].firstPIAbendPoint
    let secondBendPoint = this.annualIndexedValuesArray[eligibilityYear - 1979].secondPIAbendPoint
    if (AIME <= firstBendPoint){
      PIA = 0.9 * AIME
    }
    else if (AIME <= secondBendPoint){
      PIA = 0.9 * firstBendPoint + 0.32 * (AIME - firstBendPoint)
    }
    else {
      PIA = 0.9 * firstBendPoint + 0.32 * (secondBendPoint - firstBendPoint) + 0.15 * (AIME - secondBendPoint)
    }
    return PIA
  }

  //access by, eg this.annualIndexedValuesArray[entitlementYear - 1979].secondPIAbendPoint
  //Note that these are the COLAs FOR a given year (effective January of next year)
      //https://www.ssa.gov/oact/cola/colaseries.html as compared to https://www.ssa.gov/cola/
  annualIndexedValuesArray = [
      {
        "Year": 1979,
        "firstPIAbendPoint": 180,
        "secondPIAbendPoint": 1085,
        "firstFamilyMaxBendPoint": 230,
        "secondFamilyMaxBendPoint": 332,
        "thirdFamilyMaxBendPoint": 433,
        "COLA": 0.099,
        "MaxTaxableWages": 22900
      },
      {
        "Year": 1980,
        "firstPIAbendPoint": 194,
        "secondPIAbendPoint": 1171,
        "firstFamilyMaxBendPoint": 248,
        "secondFamilyMaxBendPoint": 358,
        "thirdFamilyMaxBendPoint": 467,
        "COLA": 0.143,
        "MaxTaxableWages": 25900
      },
      {
        "Year": 1981,
        "firstPIAbendPoint": 211,
        "secondPIAbendPoint": 1274,
        "firstFamilyMaxBendPoint": 270,
        "secondFamilyMaxBendPoint": 390,
        "thirdFamilyMaxBendPoint": 508,
        "COLA": 0.112,
        "MaxTaxableWages": 29700
      },
      {
        "Year": 1982,
        "firstPIAbendPoint": 230,
        "secondPIAbendPoint": 1388,
        "firstFamilyMaxBendPoint": 294,
        "secondFamilyMaxBendPoint": 425,
        "thirdFamilyMaxBendPoint": 554,
        "COLA": 0.074,
        "MaxTaxableWages": 32400
      },
      {
        "Year": 1983,
        "firstPIAbendPoint": 254,
        "secondPIAbendPoint": 1528,
        "firstFamilyMaxBendPoint": 324,
        "secondFamilyMaxBendPoint": 468,
        "thirdFamilyMaxBendPoint": 610,
        "COLA": 0.035,
        "MaxTaxableWages": 35700
      },
      {
        "Year": 1984,
        "firstPIAbendPoint": 267,
        "secondPIAbendPoint": 1612,
        "firstFamilyMaxBendPoint": 342,
        "secondFamilyMaxBendPoint": 493,
        "thirdFamilyMaxBendPoint": 643,
        "COLA": 0.035,
        "MaxTaxableWages": 37800
      },
      {
        "Year": 1985,
        "firstPIAbendPoint": 280,
        "secondPIAbendPoint": 1691,
        "firstFamilyMaxBendPoint": 358,
        "secondFamilyMaxBendPoint": 517,
        "thirdFamilyMaxBendPoint": 675,
        "COLA": 0.031,
        "MaxTaxableWages": 39600
      },
      {
        "Year": 1986,
        "firstPIAbendPoint": 297,
        "secondPIAbendPoint": 1790,
        "firstFamilyMaxBendPoint": 379,
        "secondFamilyMaxBendPoint": 548,
        "thirdFamilyMaxBendPoint": 714,
        "COLA": 0.013,
        "MaxTaxableWages": 42000
      },
      {
        "Year": 1987,
        "firstPIAbendPoint": 310,
        "secondPIAbendPoint": 1866,
        "firstFamilyMaxBendPoint": 396,
        "secondFamilyMaxBendPoint": 571,
        "thirdFamilyMaxBendPoint": 745,
        "COLA": 0.042,
        "MaxTaxableWages": 43800
      },
      {
        "Year": 1988,
        "firstPIAbendPoint": 319,
        "secondPIAbendPoint": 1922,
        "firstFamilyMaxBendPoint": 407,
        "secondFamilyMaxBendPoint": 588,
        "thirdFamilyMaxBendPoint": 767,
        "COLA": 0.04,
        "MaxTaxableWages": 45000
      },
      {
        "Year": 1989,
        "firstPIAbendPoint": 339,
        "secondPIAbendPoint": 2044,
        "firstFamilyMaxBendPoint": 433,
        "secondFamilyMaxBendPoint": 626,
        "thirdFamilyMaxBendPoint": 816,
        "COLA": 0.047,
        "MaxTaxableWages": 48000
      },
      {
        "Year": 1990,
        "firstPIAbendPoint": 356,
        "secondPIAbendPoint": 2145,
        "firstFamilyMaxBendPoint": 455,
        "secondFamilyMaxBendPoint": 656,
        "thirdFamilyMaxBendPoint": 856,
        "COLA": 0.054,
        "MaxTaxableWages": 51300
      },
      {
        "Year": 1991,
        "firstPIAbendPoint": 370,
        "secondPIAbendPoint": 2230,
        "firstFamilyMaxBendPoint": 473,
        "secondFamilyMaxBendPoint": 682,
        "thirdFamilyMaxBendPoint": 890,
        "COLA": 0.037,
        "MaxTaxableWages": 53400
      },
      {
        "Year": 1992,
        "firstPIAbendPoint": 387,
        "secondPIAbendPoint": 2333,
        "firstFamilyMaxBendPoint": 495,
        "secondFamilyMaxBendPoint": 714,
        "thirdFamilyMaxBendPoint": 931,
        "COLA": 0.03,
        "MaxTaxableWages": 55500
      },
      {
        "Year": 1993,
        "firstPIAbendPoint": 401,
        "secondPIAbendPoint": 2420,
        "firstFamilyMaxBendPoint": 513,
        "secondFamilyMaxBendPoint": 740,
        "thirdFamilyMaxBendPoint": 966,
        "COLA": 0.026,
        "MaxTaxableWages": 57600
      },
      {
        "Year": 1994,
        "firstPIAbendPoint": 422,
        "secondPIAbendPoint": 2545,
        "firstFamilyMaxBendPoint": 539,
        "secondFamilyMaxBendPoint": 779,
        "thirdFamilyMaxBendPoint": 1016,
        "COLA": 0.028,
        "MaxTaxableWages": 60600
      },
      {
        "Year": 1995,
        "firstPIAbendPoint": 426,
        "secondPIAbendPoint": 2567,
        "firstFamilyMaxBendPoint": 544,
        "secondFamilyMaxBendPoint": 785,
        "thirdFamilyMaxBendPoint": 1024,
        "COLA": 0.026,
        "MaxTaxableWages": 61200
      },
      {
        "Year": 1996,
        "firstPIAbendPoint": 437,
        "secondPIAbendPoint": 2635,
        "firstFamilyMaxBendPoint": 559,
        "secondFamilyMaxBendPoint": 806,
        "thirdFamilyMaxBendPoint": 1052,
        "COLA": 0.029,
        "MaxTaxableWages": 62700
      },
      {
        "Year": 1997,
        "firstPIAbendPoint": 455,
        "secondPIAbendPoint": 2741,
        "firstFamilyMaxBendPoint": 581,
        "secondFamilyMaxBendPoint": 839,
        "thirdFamilyMaxBendPoint": 1094,
        "COLA": 0.021,
        "MaxTaxableWages": 65400
      },
      {
        "Year": 1998,
        "firstPIAbendPoint": 477,
        "secondPIAbendPoint": 2875,
        "firstFamilyMaxBendPoint": 609,
        "secondFamilyMaxBendPoint": 880,
        "thirdFamilyMaxBendPoint": 1147,
        "COLA": 0.013,
        "MaxTaxableWages": 68400
      },
      {
        "Year": 1999,
        "firstPIAbendPoint": 505,
        "secondPIAbendPoint": 3043,
        "firstFamilyMaxBendPoint": 645,
        "secondFamilyMaxBendPoint": 931,
        "thirdFamilyMaxBendPoint": 1214,
        "COLA": 0.025,
        "MaxTaxableWages": 72600
      },
      {
        "Year": 2000,
        "firstPIAbendPoint": 531,
        "secondPIAbendPoint": 3202,
        "firstFamilyMaxBendPoint": 679,
        "secondFamilyMaxBendPoint": 980,
        "thirdFamilyMaxBendPoint": 1278,
        "COLA": 0.035,
        "MaxTaxableWages": 76200
      },
      {
        "Year": 2001,
        "firstPIAbendPoint": 561,
        "secondPIAbendPoint": 3381,
        "firstFamilyMaxBendPoint": 717,
        "secondFamilyMaxBendPoint": 1034,
        "thirdFamilyMaxBendPoint": 1349,
        "COLA": 0.026,
        "MaxTaxableWages": 80400
      },
      {
        "Year": 2002,
        "firstPIAbendPoint": 592,
        "secondPIAbendPoint": 3567,
        "firstFamilyMaxBendPoint": 756,
        "secondFamilyMaxBendPoint": 1092,
        "thirdFamilyMaxBendPoint": 1424,
        "COLA": 0.014,
        "MaxTaxableWages": 84900
      },
      {
        "Year": 2003,
        "firstPIAbendPoint": 606,
        "secondPIAbendPoint": 3653,
        "firstFamilyMaxBendPoint": 774,
        "secondFamilyMaxBendPoint": 1118,
        "thirdFamilyMaxBendPoint": 1458,
        "COLA": 0.021,
        "MaxTaxableWages": 87000
      },
      {
        "Year": 2004,
        "firstPIAbendPoint": 612,
        "secondPIAbendPoint": 3689,
        "firstFamilyMaxBendPoint": 782,
        "secondFamilyMaxBendPoint": 1129,
        "thirdFamilyMaxBendPoint": 1472,
        "COLA": 0.027,
        "MaxTaxableWages": 87900
      },
      {
        "Year": 2005,
        "firstPIAbendPoint": 627,
        "secondPIAbendPoint": 3779,
        "firstFamilyMaxBendPoint": 801,
        "secondFamilyMaxBendPoint": 1156,
        "thirdFamilyMaxBendPoint": 1508,
        "COLA": 0.041,
        "MaxTaxableWages": 90000
      },
      {
        "Year": 2006,
        "firstPIAbendPoint": 656,
        "secondPIAbendPoint": 3955,
        "firstFamilyMaxBendPoint": 838,
        "secondFamilyMaxBendPoint": 1210,
        "thirdFamilyMaxBendPoint": 1578,
        "COLA": 0.033,
        "MaxTaxableWages": 94200
      },
      {
        "Year": 2007,
        "firstPIAbendPoint": 680,
        "secondPIAbendPoint": 4100,
        "firstFamilyMaxBendPoint": 869,
        "secondFamilyMaxBendPoint": 1255,
        "thirdFamilyMaxBendPoint": 1636,
        "COLA": 0.023,
        "MaxTaxableWages": 97500
      },
      {
        "Year": 2008,
        "firstPIAbendPoint": 711,
        "secondPIAbendPoint": 4288,
        "firstFamilyMaxBendPoint": 909,
        "secondFamilyMaxBendPoint": 1312,
        "thirdFamilyMaxBendPoint": 1711,
        "COLA": 0.058,
        "MaxTaxableWages": 102000
      },
      {
        "Year": 2009,
        "firstPIAbendPoint": 744,
        "secondPIAbendPoint": 4483,
        "firstFamilyMaxBendPoint": 950,
        "secondFamilyMaxBendPoint": 1372,
        "thirdFamilyMaxBendPoint": 1789,
        "COLA": 0,
        "MaxTaxableWages": 106800
      },
      {
        "Year": 2010,
        "firstPIAbendPoint": 761,
        "secondPIAbendPoint": 4586,
        "firstFamilyMaxBendPoint": 972,
        "secondFamilyMaxBendPoint": 1403,
        "thirdFamilyMaxBendPoint": 1830,
        "COLA": 0,
        "MaxTaxableWages": 106800
      },
      {
        "Year": 2011,
        "firstPIAbendPoint": 749,
        "secondPIAbendPoint": 4517,
        "firstFamilyMaxBendPoint": 957,
        "secondFamilyMaxBendPoint": 1382,
        "thirdFamilyMaxBendPoint": 1803,
        "COLA": 0.036,
        "MaxTaxableWages": 106800
      },
      {
        "Year": 2012,
        "firstPIAbendPoint": 767,
        "secondPIAbendPoint": 4624,
        "firstFamilyMaxBendPoint": 980,
        "secondFamilyMaxBendPoint": 1415,
        "thirdFamilyMaxBendPoint": 1845,
        "COLA": 0.017,
        "MaxTaxableWages": 110100
      },
      {
        "Year": 2013,
        "firstPIAbendPoint": 791,
        "secondPIAbendPoint": 4768,
        "firstFamilyMaxBendPoint": 1011,
        "secondFamilyMaxBendPoint": 1459,
        "thirdFamilyMaxBendPoint": 1903,
        "COLA": 0.015,
        "MaxTaxableWages": 113700
      },
      {
        "Year": 2014,
        "firstPIAbendPoint": 816,
        "secondPIAbendPoint": 4917,
        "firstFamilyMaxBendPoint": 1042,
        "secondFamilyMaxBendPoint": 1505,
        "thirdFamilyMaxBendPoint": 1962,
        "COLA": 0.017,
        "MaxTaxableWages": 117000
      },
      {
        "Year": 2015,
        "firstPIAbendPoint": 826,
        "secondPIAbendPoint": 4980,
        "firstFamilyMaxBendPoint": 1056,
        "secondFamilyMaxBendPoint": 1524,
        "thirdFamilyMaxBendPoint": 1987,
        "COLA": 0,
        "MaxTaxableWages": 118500
      },
      {
        "Year": 2016,
        "firstPIAbendPoint": 856,
        "secondPIAbendPoint": 5157,
        "firstFamilyMaxBendPoint": 1093,
        "secondFamilyMaxBendPoint": 1578,
        "thirdFamilyMaxBendPoint": 2058,
        "COLA": 0.003,
        "MaxTaxableWages": 118500
      },
      {
        "Year": 2017,
        "firstPIAbendPoint": 885,
        "secondPIAbendPoint": 5336,
        "firstFamilyMaxBendPoint": 1131,
        "secondFamilyMaxBendPoint": 1633,
        "thirdFamilyMaxBendPoint": 2130,
        "COLA": 0.02,
        "MaxTaxableWages": 127200
      },
      {
        "Year": 2018,
        "firstPIAbendPoint": 895,
        "secondPIAbendPoint": 5397,
        "firstFamilyMaxBendPoint": 1144,
        "secondFamilyMaxBendPoint": 1651,
        "thirdFamilyMaxBendPoint": 2154,
        "COLA": null,
        "MaxTaxableWages": 128400
      }
     ]

    }
