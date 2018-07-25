import { Injectable } from '@angular/core';
import {Person} from './data model classes/person';
import { CalculationYear } from './data model classes/calculationyear';
import { ClaimingScenario } from './data model classes/claimingscenario';
import { TabHeadingDirective } from '../../node_modules/ngx-bootstrap';


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
  calculateAnnualBenefitAmountsCouple(personA:Person, personB:Person, calcYear:CalculationYear, tableOutput:boolean){

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
      
      if (tableOutput === true) {
        calcYear.tableOutputRow = [calcYear.date.getFullYear(), Math.round(calcYear.personAannualRetirementBenefit), Math.round(calcYear.personBannualRetirementBenefit),
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
      else if (scenario.maritalStatus == "divorced" || (scenario.personAhasFiled === false && scenario.personBhasFiled === false) ){//there's no possibility of suspension, because it's a divorce scenario or a neither-has-filed scenario
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
    return calcYear
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
}
