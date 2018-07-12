import { Injectable } from '@angular/core';
import {Person} from './data model classes/person';
import { CalculationYear } from './data model classes/calculationyear';
import { ClaimingScenario } from './data model classes/claimingscenario';


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


  //for counting benefit months when you only have to check if that person is currently suspended (e..g, A's retirement benefit only requires checking if A is suspended)
  countMonthsOfaBenefitOtherThanMarriedSpousal(benefitFilingDate:Date, calcYear:CalculationYear, person:Person) {
    let monthsOfBenefit: number = 0
    if (benefitFilingDate.getFullYear() < calcYear.date.getFullYear()){//filed in previous year
      monthsOfBenefit = 12
    } 
    else if (benefitFilingDate.getFullYear() == calcYear.date.getFullYear()){//filing this year
      monthsOfBenefit = 12 - benefitFilingDate.getMonth() //e.g. if filing in June, benefitFilingDate.getMonth is 5, so we want 7 months of benefit
    }
    else {//filing in future year
      monthsOfBenefit = 0
    }

    //adjust for voluntary suspension
    if (person.beginSuspensionDate.getFullYear() > calcYear.date.getFullYear() || person.endSuspensionDate.getFullYear() < calcYear.date.getFullYear()){
      //benefit not suspended at all. Math above doesn't need adjustment. (Only reason this "if" is here is to avoid having to do the math below in most years.)
    }
    else if (person.beginSuspensionDate < calcYear.date && person.endSuspensionDate.getFullYear() > calcYear.date.getFullYear()) {//Benefit is suspended for entire year
      monthsOfBenefit = 0
    }
    else if (person.beginSuspensionDate.getFullYear() == calcYear.date.getFullYear() || person.endSuspensionDate.getFullYear() == calcYear.date.getFullYear()) {//Benefit suspended for part of year.
      monthsOfBenefit = 0 //start new benefit count
      let testMonth:Date = new Date(calcYear.date)
      let endTestMonth:Date = new Date(calcYear.date.getFullYear()+1, 0, 1)
      //Loop monthly to check: is this month a benefit month and if so is it also a suspension month?
      while (testMonth < endTestMonth){
        if (benefitFilingDate <= testMonth) {//If testMonth is a benefit month...
          if (person.beginSuspensionDate > testMonth || person.endSuspensionDate <= testMonth) {//...and it's not a suspension month...
            monthsOfBenefit = monthsOfBenefit + 1
          }
        }
        testMonth.setMonth(testMonth.getMonth()+1)
      }
    }
    return Number(monthsOfBenefit)
  }

  //this function is different from above, because always have to check if either person is currently suspended
  countMonthsOfaMarriedSpousalBenefit(benefitFilingDate:Date, calcYear:CalculationYear, personA:Person, personB:Person){
    let monthsOfBenefit: number = 0
    if (benefitFilingDate.getFullYear() < calcYear.date.getFullYear()){//filed in previous year
      monthsOfBenefit = 12
    } 
    else if (benefitFilingDate.getFullYear() == calcYear.date.getFullYear()){//filing this year
      monthsOfBenefit = 12 - benefitFilingDate.getMonth() //e.g. if filing in June, benefitFilingDate.getMonth is 5, so we want 7 months of benefit
    }
    else {//filing in future year
      monthsOfBenefit = 0
    }
        //adjust for voluntary suspension
        if (
          (personA.beginSuspensionDate.getFullYear() > calcYear.date.getFullYear() || personA.endSuspensionDate.getFullYear() < calcYear.date.getFullYear())
        &&(personB.beginSuspensionDate.getFullYear() > calcYear.date.getFullYear() || personB.endSuspensionDate.getFullYear() < calcYear.date.getFullYear())
        ){
          //Neither person is suspended this year at all. Math above doesn't need adjustment. (Only reason this "if" is here is to avoid having to do the math below in most years.)
        }
        else if (
          (personA.beginSuspensionDate < calcYear.date && personA.endSuspensionDate.getFullYear() > calcYear.date.getFullYear())
         || (personB.beginSuspensionDate < calcYear.date && personB.endSuspensionDate.getFullYear() > calcYear.date.getFullYear())
        ) {//One person is suspended all year, which means spousal benefit is suspended all year.
          monthsOfBenefit = 0
        }
        else if (
            (personA.beginSuspensionDate.getFullYear() == calcYear.date.getFullYear() || personA.endSuspensionDate.getFullYear() == calcYear.date.getFullYear())
          ||(personB.beginSuspensionDate.getFullYear() == calcYear.date.getFullYear() || personB.endSuspensionDate.getFullYear() == calcYear.date.getFullYear())
        ) {//At least one person is suspended for part of year, which means spousal benefit will be suspended for part of year.
          monthsOfBenefit = 0 //start new benefit count
          let testMonth:Date = new Date(calcYear.date)
          let endTestMonth:Date = new Date(calcYear.date.getFullYear()+1, 0, 1)
          //Loop monthly to check: is this month a benefit month and if so is it also a suspension month?
          while (testMonth < endTestMonth){
            if (benefitFilingDate <= testMonth) {//If testMonth is a benefit month...
              if (personA.beginSuspensionDate > testMonth || personA.endSuspensionDate <= testMonth) {//...and it's not a suspension month for personA...
                if (personB.beginSuspensionDate > testMonth || personB.endSuspensionDate <= testMonth) {//..and it's not a suspension month for personB...
                  monthsOfBenefit = monthsOfBenefit + 1
                }
              }
            }
            testMonth.setMonth(testMonth.getMonth()+1)
          }
        }
        return Number(monthsOfBenefit)
  }


  countAllBenefitMonthsSingle(calcYear:CalculationYear, person:Person){
    calcYear.monthsOfPersonAretirement = this.countMonthsOfaBenefitOtherThanMarriedSpousal(person.retirementBenefitDate, calcYear, person)
    return calcYear
  }

  countAllBenefitMonthsCouple(calcYear:CalculationYear, scenario:ClaimingScenario, personA:Person, personB:Person){
        //Calculate number of months of retirement benefit for each spouse
        calcYear.monthsOfPersonAretirement = this.countMonthsOfaBenefitOtherThanMarriedSpousal(personA.retirementBenefitDate, calcYear, personA)
        calcYear.monthsOfPersonBretirement = this.countMonthsOfaBenefitOtherThanMarriedSpousal(personB.retirementBenefitDate, calcYear, personB)

        //Calculate number of months of spouseA spousalBenefit w/ retirementBenefit and number of months of spouseA spousalBenefit w/o retirementBenefit
        if (scenario.maritalStatus == "married") {calcYear.monthsOfPersonAspousal = this.countMonthsOfaMarriedSpousalBenefit(personA.spousalBenefitDate, calcYear, personA, personB)}
        if (scenario.maritalStatus == "divorced") {calcYear.monthsOfPersonAspousal = this.countMonthsOfaBenefitOtherThanMarriedSpousal(personA.spousalBenefitDate, calcYear, personA)}
        if (calcYear.monthsOfPersonAretirement >= calcYear.monthsOfPersonAspousal) {
          calcYear.monthsOfPersonAspousalWithRetirement = calcYear.monthsOfPersonAspousal
          calcYear.monthsOfPersonAspousalWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonAspousalWithRetirement = calcYear.monthsOfPersonAretirement
          calcYear.monthsOfPersonAspousalWithoutRetirement = calcYear.monthsOfPersonAspousal - calcYear.monthsOfPersonAretirement
        }

        //Calculate number of months of spouseB spousalBenefit w/ retirementBenefit and number of months of spouseB spousalBenefit w/o retirementBenefit
        if (scenario.maritalStatus == "married") {calcYear.monthsOfPersonBspousal = this.countMonthsOfaMarriedSpousalBenefit(personB.spousalBenefitDate, calcYear, personB, personA)}
        if (scenario.maritalStatus == "divorced"){calcYear.monthsOfPersonBspousal = this.countMonthsOfaBenefitOtherThanMarriedSpousal(personB.spousalBenefitDate, calcYear, personB)}
        if (calcYear.monthsOfPersonBretirement >= calcYear.monthsOfPersonBspousal) {
          calcYear.monthsOfPersonBspousalWithRetirement = calcYear.monthsOfPersonBspousal
          calcYear.monthsOfPersonBspousalWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonBspousalWithRetirement = calcYear.monthsOfPersonBretirement
          calcYear.monthsOfPersonBspousalWithoutRetirement = calcYear.monthsOfPersonBspousal - calcYear.monthsOfPersonBretirement
        }

        //Calculate number of months of spouseA survivorBenefit w/ retirementBenefit and number of months of spouseA survivorBenefit w/o retirementBenefit
        calcYear.monthsOfPersonAsurvivor = this.countMonthsOfaBenefitOtherThanMarriedSpousal(personA.survivorFRA, calcYear, personA)
        if (calcYear.monthsOfPersonAretirement >= calcYear.monthsOfPersonAsurvivor) {
          calcYear.monthsOfPersonAsurvivorWithRetirement = calcYear.monthsOfPersonAsurvivor
          calcYear.monthsOfPersonAsurvivorWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonAsurvivorWithRetirement = calcYear.monthsOfPersonAretirement
          calcYear.monthsOfPersonAsurvivorWithoutRetirement = calcYear.monthsOfPersonAsurvivor - calcYear.monthsOfPersonAretirement
        }

        //Calculate number of months of spouseB survivorBenefit w/ retirementBenefit and number of months of spouseB survivorBenefit w/o retirementBenefit
        calcYear.monthsOfPersonBsurvivor = this.countMonthsOfaBenefitOtherThanMarriedSpousal(personB.survivorFRA, calcYear, personB)
        if (calcYear.monthsOfPersonBretirement >= calcYear.monthsOfPersonBsurvivor) {
          calcYear.monthsOfPersonBsurvivorWithRetirement = calcYear.monthsOfPersonBsurvivor
          calcYear.monthsOfPersonBsurvivorWithoutRetirement = 0
        } else {
          calcYear.monthsOfPersonBsurvivorWithRetirement = calcYear.monthsOfPersonBretirement
          calcYear.monthsOfPersonBsurvivorWithoutRetirement = calcYear.monthsOfPersonBsurvivor - calcYear.monthsOfPersonBretirement
        }
        
    return calcYear
  }
  

  //Calculates annual benefit (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
  //We have 3 "retirementBenefit" amounts. Have to decide how many months of each there are, out of the total "months of retirement" figure
      //preARFmonths + ARFmonths + DRCmonths = "monthsOfPersonAretirement"
  calculateAnnualRetirementBenefit(person:Person, calcYear:CalculationYear){
    if (person.id == 'A') {
      var retirementMonths:number = calcYear.monthsOfPersonAretirement
    }
    else {
      var retirementMonths:number = calcYear.monthsOfPersonBretirement
    }
    let ARFmonths: number
    let preARFmonths: number
    let DRCmonths: number
    let annualRetirementBenefit:number
    if (person.DRCsViaSuspension == 0) {
        if (calcYear.date.getFullYear() > person.FRA.getFullYear()) {//if whole year is after FRA, all months are ARF months 
          annualRetirementBenefit = retirementMonths * person.retirementBenefitAfterARF
        }
        else if (calcYear.date.getFullYear() < person.FRA.getFullYear()) {//if whole year is before FRA, all months are preARFmonths
          annualRetirementBenefit = retirementMonths * person.initialRetirementBenefit
        }
        else if (calcYear.date.getFullYear() == person.FRA.getFullYear()){//if year includes FRA, ARF months = 12 - FRA.getmonth, limited to monthsofretirement. And preARFmonths = months of retirement - ARFmonths
            ARFmonths = 12 - person.FRA.getMonth()
            if (ARFmonths > retirementMonths) {ARFmonths = retirementMonths}
            annualRetirementBenefit = ARFmonths * person.retirementBenefitAfterARF + (retirementMonths - ARFmonths) * person.initialRetirementBenefit
        }
    }
    else {//i.e., if DRC > 0
        if (calcYear.date > person.endSuspensionDate) {//if calcYear.date is after endSuspensionDate, all months are DRCmonths
          annualRetirementBenefit = retirementMonths * person.retirementBenefitWithDRCsfromSuspension
        }
        else if (calcYear.date.getFullYear() < person.FRA.getFullYear()) {//if whole year is before FRA, all months are preARFmonths
          annualRetirementBenefit = retirementMonths * person.initialRetirementBenefit
        }
        else if (calcYear.date.getFullYear() == person.FRA.getFullYear() && calcYear.date.getFullYear() < person.endSuspensionDate.getFullYear()) {//This is year of FRA, but suspension doesn't end until later year
          //some months are preARF months; some are ARFmonths
          ARFmonths = 12 - person.FRA.getMonth()
          if (ARFmonths > retirementMonths) {ARFmonths = retirementMonths}
          annualRetirementBenefit = ARFmonths * person.retirementBenefitAfterARF + (retirementMonths - ARFmonths) * person.initialRetirementBenefit
        }
        else if (calcYear.date.getFullYear() == person.FRA.getFullYear() && calcYear.date.getFullYear() == person.endSuspensionDate.getFullYear()){//This is year of FRA, and year in which suspension ends
          //some months are preARF, some are ARF, some are DRC
          DRCmonths = 12 - person.endSuspensionDate.getMonth()
            if (DRCmonths > retirementMonths) {DRCmonths = retirementMonths}//limit DRCmonths to total months of retirement benefit
          ARFmonths = person.endSuspensionDate.getMonth() - person.FRA.getMonth()
            if (DRCmonths + ARFmonths > retirementMonths) {ARFmonths = retirementMonths - DRCmonths} //limit sum of ARFmonths and DRCmonths to monthsOfPersonAretirement
          preARFmonths = retirementMonths - DRCmonths - ARFmonths
          annualRetirementBenefit = preARFmonths * person.initialRetirementBenefit + ARFmonths * person.retirementBenefitAfterARF + DRCmonths * person.retirementBenefitWithDRCsfromSuspension
        }
        else if (calcYear.date.getFullYear() > person.FRA.getFullYear() && calcYear.date.getFullYear() < person.endSuspensionDate.getFullYear()){//FRA was in prior year, suspension ends in later year
          //all months are ARF months
          annualRetirementBenefit = retirementMonths * person.retirementBenefitAfterARF
        }
        else if (calcYear.date.getFullYear() > person.FRA.getFullYear() && calcYear.date.getFullYear() == person.endSuspensionDate.getFullYear()){//FRA was in prior year, suspension ends this year
          //some months are ARF months; some are DRC months
          DRCmonths = 12 - person.endSuspensionDate.getMonth()
          if (DRCmonths > retirementMonths) {DRCmonths = retirementMonths}
          annualRetirementBenefit = DRCmonths * person.retirementBenefitWithDRCsfromSuspension + (retirementMonths - DRCmonths) * person.retirementBenefitAfterARF
        }
    }

    //Set appropriate field on calcYear and add back overwithholding
    if (person.id == 'A') {
      calcYear.personAannualRetirementBenefit = annualRetirementBenefit
      calcYear.personAannualRetirementBenefit = calcYear.personAannualRetirementBenefit + calcYear.personAoverWithholding
    }
    else {
      calcYear.personBannualRetirementBenefit = annualRetirementBenefit
      calcYear.personBannualRetirementBenefit = calcYear.personBannualRetirementBenefit + calcYear.personBoverWithholding
    }

    return calcYear
  }

  
  //Calculates annual benefit (including withholding for earnings test and including Adjustment Reduction Factor, but before probability-weighting and discounting)
  calculateAnnualBenefitAmountsCouple(personA:Person, personB:Person, calcYear:CalculationYear){
      //Calculate annual retirement amounts
      //calcYear = this.calculateAnnualRetirementBenefit(personA, calcYear)
      //calcYear = this.calculateAnnualRetirementBenefit(personB, calcYear)


      //Spouse A spousal
      if (calcYear.date.getFullYear() < personA.FRA.getFullYear()) {
        calcYear.personAannualRetirementBenefit = calcYear.monthsOfPersonAretirement * personA.initialRetirementBenefit
        calcYear.personAannualSpousalBenefit = (calcYear.monthsOfPersonAspousalWithoutRetirement * personA.spousalBenefitWithoutRetirement) + (calcYear.monthsOfPersonAspousalWithRetirement * personA.spousalBenefitWithRetirement)
      } else if (calcYear.date.getFullYear() == personA.FRA.getFullYear()){
          //Calculate number of ARF months (e.g., 10 if FRA is March)
          let ARFmonths = 12 - personA.FRA.getMonth()
          if (ARFmonths > calcYear.monthsOfPersonAretirement) {
            ARFmonths = calcYear.monthsOfPersonAretirement //Limit ARFmonths to number of months of retirement benefit
          }
          calcYear.personAannualRetirementBenefit = ARFmonths * personA.retirementBenefitAfterARF + (calcYear.monthsOfPersonAretirement - ARFmonths) * personA.initialRetirementBenefit
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
        calcYear.personBannualRetirementBenefit = calcYear.monthsOfPersonBretirement * personB.initialRetirementBenefit
        calcYear.personBannualSpousalBenefit = (calcYear.monthsOfPersonBspousalWithoutRetirement * personB.spousalBenefitWithoutRetirement) + (calcYear.monthsOfPersonBspousalWithRetirement * personB.spousalBenefitWithRetirement)
      } else if (calcYear.date.getFullYear() == personB.FRA.getFullYear()){
          //Calculate number of ARF months (e.g., 10 if FRA is March)
          let ARFmonths = 12 - personB.FRA.getMonth()
          if (ARFmonths > calcYear.monthsOfPersonBretirement) {
            ARFmonths = calcYear.monthsOfPersonBretirement //Limit ARFmonths to number of months of retirement benefit
          }
          calcYear.personBannualRetirementBenefit = ARFmonths * personB.retirementBenefitAfterARF + (calcYear.monthsOfPersonBretirement - ARFmonths) * personB.initialRetirementBenefit
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
