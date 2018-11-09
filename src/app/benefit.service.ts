import { Injectable } from '@angular/core';
import {Person} from './data model classes/person';
import { CalculationYear } from './data model classes/calculationyear';
import { CalculationScenario } from './data model classes/calculationscenario';
import {MonthYearDate} from "./data model classes/monthyearDate"


@Injectable()
export class BenefitService {

  constructor() { }

  today: MonthYearDate = new MonthYearDate()

  calculateRetirementBenefit(person:Person, benefitDate: MonthYearDate) {
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

    if (person.isOnDisability === true) {//set retirement benefit (before DRCs from suspension) to PIA if person is disabled
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

  calculateSpousalBenefit(person:Person, otherPerson:Person, retirementBenefit: number, spousalStartDate: MonthYearDate)
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

  calculateSurvivorBenefit(survivingPerson:Person, survivorRetirementBenefit: number,  survivorSurvivorBenefitDate: MonthYearDate,
    deceasedPerson:Person, dateOfDeath: MonthYearDate, deceasedClaimingDate: MonthYearDate)
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
    else { //i.e., if deceased spouse had NOT filed as of date of death...
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


  determineChildBenefitDate(scenario:CalculationScenario, child:Person, personA:Person, personB?:Person):MonthYearDate{
    let childBenefitDate:MonthYearDate
    if (scenario.maritalStatus == "single"){
      if (child.hasFiled === true){
        //assume child filed as early as possible (parent retirementBenefitDate)
        childBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
      }
      else {//If child hasn't filed, find earliest retroactive childBenefitDate
        //If parent is not disabled, it's 6 months before today
        if (personA.isOnDisability === false){
          childBenefitDate = new MonthYearDate(this.today)
          childBenefitDate.setMonth(childBenefitDate.getMonth()-6)
        }
        else {//If parent is disabled, it's 12 months before today
        childBenefitDate = new MonthYearDate(this.today)
        childBenefitDate.setMonth(childBenefitDate.getMonth()-12)
        }
        //But no earlier than parent's retirementBenefitDate
        if (childBenefitDate < personA.retirementBenefitDate){
          childBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
        }
      }
    }
    else {//i.e., it's a married or divorced scenario
      if (child.hasFiled === true){
        //assume they filed as early as possible (first retirementBenefitDate)
        childBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
        if (personB.retirementBenefitDate < childBenefitDate){
          childBenefitDate = new MonthYearDate(personB.retirementBenefitDate)
        }
      }
      else {//If child hasn't filed, find earliest retroactive childBenefitDate based on each parent
        //find earliest date based on parentA
          if (personA.isOnDisability === false){//if personA is not disabled, it's 6 months ago. But no earlier than personA's retirementBenefitDate
            var earliestChildBenefitDateFromPersonA:MonthYearDate = new MonthYearDate(this.today)
            earliestChildBenefitDateFromPersonA.setMonth(earliestChildBenefitDateFromPersonA.getMonth()-6)
            if (earliestChildBenefitDateFromPersonA < personA.retirementBenefitDate){
              earliestChildBenefitDateFromPersonA = new MonthYearDate(personA.retirementBenefitDate)
            }
          }
          else {//if personA is disabled, it's 12 months ago. But no earlier than personA's fixedRetirementBenefitDate (i.e., their disability date)
            var earliestChildBenefitDateFromPersonA:MonthYearDate = new MonthYearDate(this.today)
            earliestChildBenefitDateFromPersonA.setMonth(earliestChildBenefitDateFromPersonA.getMonth()-12)
            if (earliestChildBenefitDateFromPersonA < personA.fixedRetirementBenefitDate){
              earliestChildBenefitDateFromPersonA = new MonthYearDate(personA.fixedRetirementBenefitDate)
            }
          }
        //find earliest date based on parentB
          if (personB.isOnDisability === false){//if personB is not disabled, it's 6 months ago. But no earlier than personB's retirementBenefitDate
            var earliestChildBenefitDateFromPersonB:MonthYearDate = new MonthYearDate(this.today)
            earliestChildBenefitDateFromPersonB.setMonth(earliestChildBenefitDateFromPersonB.getMonth()-6)
            if (earliestChildBenefitDateFromPersonB < personB.retirementBenefitDate){
              earliestChildBenefitDateFromPersonB = new MonthYearDate(personB.retirementBenefitDate)
            }
          }
          else {//if personB is disabled, it's 12 months ago. But no earlier than personB's fixedRetirementBenefitDate (i.e., their disability date)
            var earliestChildBenefitDateFromPersonB:MonthYearDate = new MonthYearDate(this.today)
            earliestChildBenefitDateFromPersonB.setMonth(earliestChildBenefitDateFromPersonB.getMonth()-12)
            if (earliestChildBenefitDateFromPersonB < personB.fixedRetirementBenefitDate){
              earliestChildBenefitDateFromPersonB = new MonthYearDate(personB.fixedRetirementBenefitDate)
            }
          }
        //childBenefitDate is earlier of those two dates
          if (earliestChildBenefitDateFromPersonA < earliestChildBenefitDateFromPersonB){
            childBenefitDate = new MonthYearDate(earliestChildBenefitDateFromPersonA)
          }
          else {
            childBenefitDate = new MonthYearDate(earliestChildBenefitDateFromPersonB)
          }
      }
    }
    //Don't let childBenefitDate be earlier than child's SSbirthDate
      if (childBenefitDate < child.SSbirthDate){
        childBenefitDate = new MonthYearDate(child.SSbirthDate)
      }
    return childBenefitDate
  }

  applyAssumedBenefitCut(scenario:CalculationScenario, calcYear:CalculationYear){
    if (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() >= scenario.benefitCutYear) {
      //Apply cut to sums included in PV calculation
      calcYear.annualBenefitSinglePersonAlive = calcYear.annualBenefitSinglePersonAlive * (1 - scenario.benefitCutPercentage/100)
      calcYear.annualBenefitSinglePersonDeceased = calcYear.annualBenefitSinglePersonDeceased * (1 - scenario.benefitCutPercentage/100)
      calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive * (1 - scenario.benefitCutPercentage/100)
      calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive * (1 - scenario.benefitCutPercentage/100)
      calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive * (1 - scenario.benefitCutPercentage/100)
      //Apply cut to sums included in output table
      calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit * (1 - scenario.benefitCutPercentage/100)
      calcYear.tablePersonAannualSpousalBenefit = calcYear.tablePersonAannualSpousalBenefit * (1 - scenario.benefitCutPercentage/100)
      calcYear.tablePersonAannualSurvivorBenefit = calcYear.tablePersonAannualSurvivorBenefit * (1 - scenario.benefitCutPercentage/100)
      calcYear.tablePersonBannualRetirementBenefit = calcYear.tablePersonBannualRetirementBenefit * (1 - scenario.benefitCutPercentage/100)
      calcYear.tablePersonBannualSpousalBenefit = calcYear.tablePersonBannualSpousalBenefit * (1 - scenario.benefitCutPercentage/100)
      calcYear.tablePersonBannualSurvivorBenefit = calcYear.tablePersonBannualSurvivorBenefit * (1 - scenario.benefitCutPercentage/100)
      calcYear.tableTotalAnnualChildBenefitsSingleParentAlive = calcYear.tableTotalAnnualChildBenefitsSingleParentAlive * (1 - scenario.benefitCutPercentage/100)
      calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased = calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased * (1 - scenario.benefitCutPercentage/100)
      calcYear.tableTotalAnnualChildBenefitsBothParentsAlive = calcYear.tableTotalAnnualChildBenefitsBothParentsAlive * (1 - scenario.benefitCutPercentage/100)
      calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased = calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased * (1 - scenario.benefitCutPercentage/100)
      calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive = calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive * (1 - scenario.benefitCutPercentage/100)
      calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive = calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive * (1 - scenario.benefitCutPercentage/100)
    }
  }

  
  calculateMonthlyPaymentsSingle(scenario:CalculationScenario, calcYear:CalculationYear, person:Person, personAliveBoolean:boolean){
    //Reset monthlyPayment fields
    person.monthlyRetirementPayment = 0
    for (let child of scenario.children){
      child.monthlyChildPayment = 0
    }

    let personSuspended:boolean

    if (personAliveBoolean === true){
      //determine if person is suspended
      if (person.beginSuspensionDate > calcYear.date || person.endSuspensionDate <= calcYear.date){
        personSuspended = false
      }
      else {
        personSuspended = true
      }
      if (calcYear.date >= person.retirementBenefitDate) {//if person has filed for benefits...
        if (personSuspended === true){//if person has suspended benefits...
          person.DRCsViaSuspension = person.DRCsViaSuspension + 1
          person.monthlyRetirementPayment = 0
          for (let child of scenario.children){
            child.monthlyChildPayment = 0
          }
        }
        else {//i.e., person isn't suspended
          person.monthlyRetirementPayment = person.retirementBenefit
          for (let child of scenario.children){
            if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
              if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                child.monthlyChildPayment = person.PIA * 0.5
              }
            }
          }
        }
      }
    }
    else {//if we're assuming person is deceased
      for (let child of scenario.children){
        if (child.age < 17.99 || child.isOnDisability === true){//Use 17.99 as the cutoff because sometimes when child is actually 18 javascript value will be 17.9999999
          child.monthlyChildPayment = person.PIA * 0.75
        }
      }
    }
  }

  calculateMonthlyPaymentsCouple(scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personAaliveBoolean:boolean, personB:Person, personBaliveBoolean:boolean){
    //Note that we're making no distinction in this function for whether it's a married or divorced scenario.

    //Set all benefits to zero to begin
      personA.monthlyRetirementPayment = 0
      personA.monthlySpousalPayment = 0
      personA.monthlySurvivorPayment = 0
      personB.monthlyRetirementPayment = 0
      personB.monthlySpousalPayment = 0
      personB.monthlySurvivorPayment = 0
      for (let child of scenario.children){child.monthlyChildPayment = 0}

    //determine if personA and/or personB are suspended
      let personAsuspended:boolean
      let personBsuspended:boolean
      if (personA.beginSuspensionDate > calcYear.date || personA.endSuspensionDate <= calcYear.date) {personAsuspended = false}
        else {personAsuspended = true}
      if (personB.beginSuspensionDate > calcYear.date || personB.endSuspensionDate <= calcYear.date) {personBsuspended = false}
        else {personBsuspended = true}

    //calculate payments
      //both personA and personB alive
      if (personAaliveBoolean === true && personBaliveBoolean === true){
          if (personAsuspended === true && personBsuspended === true){//if both people are suspended
              personA.DRCsViaSuspension = personA.DRCsViaSuspension + 1//We only add to this field in the "assuming both are alive" section. Could do it in any of the mortality assumption sections, but we only want to do it once for a given month.
              personB.DRCsViaSuspension = personB.DRCsViaSuspension + 1//We only add to this field in the "assuming both are alive" section. Could do it in any of the mortality assumption sections, but we only want to do it once for a given month.
              //Nobody gets any payments. Don't have to set to zero though because that's already done.
          }
          else if (personAsuspended === true && personBsuspended === false){//if only personA is suspended
            personA.DRCsViaSuspension = personA.DRCsViaSuspension + 1
            //if entitled to benefits in question: personB gets retirement benefit, children each get child benefit on personB (personA gets nothing)
            if (calcYear.date >= personB.retirementBenefitDate){
              personB.monthlyRetirementPayment = personB.retirementBenefit
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    child.monthlyChildPayment = personB.PIA * 0.5
                  }
                }
              }
            }
          }
          else if (personAsuspended === false && personBsuspended === true){//if only personB is suspended
            personB.DRCsViaSuspension = personB.DRCsViaSuspension + 1
            //if entitled to benefits in question: personA gets retirement benefit, children each get child benefit on personA (personB gets nothing)
            if (calcYear.date >= personA.retirementBenefitDate){
              personA.monthlyRetirementPayment = personA.retirementBenefit
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    child.monthlyChildPayment = personA.PIA * 0.5
                  }
                }
              }
            }
          }
          else {//if neither person is suspended
            //if entitled to benefits in question: personA gets retirement and spousal, personB gets retirement and spousal and children each get benefit on personA or personB
            if (calcYear.date >= personA.retirementBenefitDate){
              personA.monthlyRetirementPayment = personA.retirementBenefit
            }
            if (calcYear.date >= personA.spousalBenefitDate){
              personA.monthlySpousalPayment = personA.spousalBenefit
            }
            if (calcYear.date >= personB.retirementBenefitDate){
              personB.monthlyRetirementPayment = personB.retirementBenefit
            }
            if (calcYear.date >= personB.spousalBenefitDate){
              personB.monthlySpousalPayment = personB.spousalBenefit
            }
            for (let child of scenario.children){
              if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (calcYear.date >= personA.retirementBenefitDate && calcYear.date >= personB.retirementBenefitDate){//If both spouses have started benefits, it's 50% of higher PIA
                      child.monthlyChildPayment = (personA.PIA > personB.PIA) ? personA.PIA * 0.5 : personB.PIA * 0.5
                    }
                    else if (calcYear.date >= personA.retirementBenefitDate){//both hadn't been met, but personA's date has been met
                      child.monthlyChildPayment = personA.PIA * 0.5
                    }
                    else {//i.e., childBenefitDate has been met (which means at least one spouse's retirementBenefitDate has been met, but it wasn't personA's date)
                      child.monthlyChildPayment = personB.PIA * 0.5
                    }
                }
              }
            }
          }
      }
      //personA alive, personB deceased
      else if (personAaliveBoolean === true && personBaliveBoolean === false){
          if (personAsuspended === true){//if personA is suspended
              //if entitled to benefits in question: children get survivor benefit on personB (personA gets nothing)
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    child.monthlyChildPayment = personB.PIA * 0.75//No need to do any check based on personB dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                  }
                }
              }
          }
          else {//if personA is not suspended
              //if entitled to benefits in question: personA gets retirement and survivor, children get benefit on personA or survivor benefit on personB
              if (calcYear.date >= personA.retirementBenefitDate){
                personA.monthlyRetirementPayment = personA.retirementBenefit
              }
              if (calcYear.date >= personA.survivorFRA){
                personA.monthlySurvivorPayment = personA.survivorBenefit
              }
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (calcYear.date >= personA.retirementBenefitDate){
                      child.monthlyChildPayment = (personA.PIA * 0.5 > personB.PIA * 0.75) ? personA.PIA * 0.5 : personB.PIA * 0.75
                    }
                    else {
                      child.monthlyChildPayment = personB.PIA * 0.75//No need to do any check based on personB dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                    }
                  }
                }
              }
          }
      }
      //personA deceased, personB alive
      else if (personAaliveBoolean === false && personBaliveBoolean === true){
          if (personBsuspended === true){//if personB is suspended
              //if entitled to benefits in question: children get survivor benefit on personA (personB gets nothing)
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    child.monthlyChildPayment = personA.PIA * 0.75//No need to do any check based on personA dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                  }
                }
              }
          }
          else{//if personB is not suspended
              //if entitled to benefits in question: personB gets retirement and survivor, children get benefit on personB or survivor benefit on personA
              if (calcYear.date >= personB.retirementBenefitDate){
                personB.monthlyRetirementPayment = personB.retirementBenefit
              }
              if (calcYear.date >= personB.survivorFRA){
                personB.monthlySurvivorPayment = personB.survivorBenefit
              }
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (calcYear.date >= personB.retirementBenefitDate){
                      child.monthlyChildPayment = (personA.PIA * 0.75 > personB.PIA * 0.5) ? personA.PIA * 0.75 : personB.PIA * 0.5
                    }
                    else {
                      child.monthlyChildPayment = personA.PIA * 0.75//No need to do any check based on personA dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                    }
                  }
                }
              }
          }
        }
      else {//both deceased
          //if entitled to benefits in question: children get survivor benefit on personA or personB
          for (let child of scenario.children){
            if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
              if (calcYear.date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                child.monthlyChildPayment = (personA.PIA > personB.PIA) ? personA.PIA * 0.75 : personB.PIA * 0.75
                //No need to do any check based on parent dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
              }
            }
          }
      }
  }

  monthlyCheckForBenefitRecalculationsSingle(person:Person, calcYear:CalculationYear){
    //Recalculate using adjusted date at FRA. Then recalculate using DRCs at endSuspensionDate
    if (calcYear.date.valueOf() == person.FRA.valueOf()){
      person.adjustedRetirementBenefitDate.setMonth(person.retirementBenefitDate.getMonth()+person.monthsRetirementWithheld)
      person.retirementBenefit = this.calculateRetirementBenefit(person, person.adjustedRetirementBenefitDate)
    }
    if (calcYear.date.valueOf() == person.endSuspensionDate.valueOf()){
      person.retirementBenefit = this.calculateRetirementBenefit(person, person.adjustedRetirementBenefitDate)
    }
  }


  monthlyCheckForBenefitRecalculationsCouple(personA:Person, personB:Person, calcYear:CalculationYear){
        //Calculate a person's spousal and survivor benefits on entitlement date (if this is before person's retirementBenefitDate, retirementBenefit field will be zero, which is what we want)
        if (calcYear.date.valueOf() == personA.spousalBenefitDate.valueOf()){
          personA.spousalBenefit = this.calculateSpousalBenefit(personA, personB, personA.retirementBenefit, personA.spousalBenefitDate)
        }
        if (calcYear.date.valueOf() == personA.survivorFRA.valueOf()){
          personA.survivorBenefit = this.calculateSurvivorBenefit(personA, personA.retirementBenefit, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
        }
        if (calcYear.date.valueOf() == personB.spousalBenefitDate.valueOf()){
          personB.spousalBenefit = this.calculateSpousalBenefit(personB, personA, personB.retirementBenefit, personB.spousalBenefitDate)
        }
        if (calcYear.date.valueOf() == personB.survivorFRA.valueOf()){
          personB.survivorBenefit = this.calculateSurvivorBenefit(personB, personB.retirementBenefit, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
        }

        //Calculate a person's retirement benefit when it starts, and recalculate their spousal and survivor benefits. (Use >= rather than == to handle situation in which person started benefit in year in past, so PV calc never actually includes the year in which they start benefit.)
        if (calcYear.date.valueOf() >= personA.retirementBenefitDate.valueOf() && personA.retirementBenefit == 0){
          personA.retirementBenefit = this.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
          personA.spousalBenefit = this.calculateSpousalBenefit(personA, personB, personA.retirementBenefit, personA.spousalBenefitDate)
          personA.survivorBenefit = this.calculateSurvivorBenefit(personA, personA.retirementBenefit, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
        }
        if (calcYear.date.valueOf() >= personB.retirementBenefitDate.valueOf() && personB.retirementBenefit == 0){
          personB.retirementBenefit = this.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
          personB.spousalBenefit = this.calculateSpousalBenefit(personB, personA, personB.retirementBenefit, personB.spousalBenefitDate)
          personB.survivorBenefit = this.calculateSurvivorBenefit(personB, personB.retirementBenefit, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
        }
        //Recalculate person's own retirement and spousal benefits using adjusted date at FRA. (Spousal benefit also affected by retirement benefit being larger, and both people's survivor benefits must be recalculated for same reason.)
        if (calcYear.date.valueOf() == personA.FRA.valueOf() && personA.retirementBenefitDate < personA.FRA){//Second conditional is because we only want to calculate these things at FRA if person filed prior to FRA. If person hasn't hit retirementBenefitDate yet, we don't want to calculate it yet.
          personA.adjustedRetirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+personA.monthsRetirementWithheld)
          personA.adjustedSpousalBenefitDate.setMonth(personA.adjustedSpousalBenefitDate.getMonth()+personA.monthsSpousalWithheld)
          personA.retirementBenefit = this.calculateRetirementBenefit(personA, personA.adjustedRetirementBenefitDate)
          personA.spousalBenefit = this.calculateSpousalBenefit(personA, personB, personA.retirementBenefit, personA.adjustedSpousalBenefitDate)
            //Should line below involve personB's adjustedRetirementBenefitDate instead of retirementBenefitDate? Yes, I think. Reasoning below. (Same question applied when personB reaches FRA and when end suspension dates are reached.)
              //survivor benefit calculation uses deceased claiming date to calculate amount of deceased's retirement benefit. So it does have to be the adjusted version.
              //adjustedRetirementBenefitDate is initialized as same value as retirementBenefitDate. Then it gets set a few lines above here, at the person's own FRA.
              //So using adjustedRetirementBenefitDate won't be wrong, even if this calculation happens before the person's FRA, because then the value is just their initial retirementBenefitDate
          personA.survivorBenefit = this.calculateSurvivorBenefit(personA, personA.retirementBenefit, personA.survivorFRA, personB, personB.adjustedRetirementBenefitDate, personB.adjustedRetirementBenefitDate)
          personB.survivorBenefit = this.calculateSurvivorBenefit(personB, personB.retirementBenefit, personB.survivorFRA, personA, personA.adjustedRetirementBenefitDate, personA.adjustedRetirementBenefitDate) //Have to recalculate personB survivor benefit to account for personA's ARF-adjusted retirement benefit date
        }
        if (calcYear.date.valueOf() == personB.FRA.valueOf() && personB.retirementBenefitDate < personB.FRA){//Second conditional is because we only want to calculate these things at FRA if person filed prior to FRA. If person hasn't hit retirementBenefitDate yet, we don't want to calculate it yet.
          personB.adjustedRetirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+personB.monthsRetirementWithheld)
          personB.adjustedSpousalBenefitDate.setMonth(personB.adjustedSpousalBenefitDate.getMonth()+personB.monthsSpousalWithheld)
          personB.retirementBenefit = this.calculateRetirementBenefit(personB, personB.adjustedRetirementBenefitDate)
          personB.spousalBenefit = this.calculateSpousalBenefit(personB, personA, personB.retirementBenefit, personB.adjustedSpousalBenefitDate)
          personB.survivorBenefit = this.calculateSurvivorBenefit(personB, personB.retirementBenefit, personB.survivorFRA, personA, personA.adjustedRetirementBenefitDate, personA.adjustedRetirementBenefitDate)
          personA.survivorBenefit = this.calculateSurvivorBenefit(personA, personA.retirementBenefit, personA.survivorFRA, personB, personB.adjustedRetirementBenefitDate, personB.adjustedRetirementBenefitDate)//Have to recalculate personA survivor benefit to account for personB's ARF-adjusted retirement benefit date
        }
        //Recalculate retirement benefit using DRCs at endSuspensionDate (And therefore recalculate own spousal benefit and both people's survivor benefits as well.)
        if (calcYear.date.valueOf() == personA.endSuspensionDate.valueOf()){
          personA.retirementBenefit = this.calculateRetirementBenefit(personA, personA.adjustedRetirementBenefitDate)
          personA.spousalBenefit = this.calculateSpousalBenefit(personA, personB, personA.retirementBenefit, personA.spousalBenefitDate)
          personA.survivorBenefit = this.calculateSurvivorBenefit(personA, personA.retirementBenefit, personA.survivorFRA, personB, personB.adjustedRetirementBenefitDate, personB.adjustedRetirementBenefitDate)
          personB.survivorBenefit = this.calculateSurvivorBenefit(personB, personB.retirementBenefit, personB.survivorFRA, personA, personA.adjustedRetirementBenefitDate, personA.adjustedRetirementBenefitDate)
        }
        if (calcYear.date.valueOf() == personB.endSuspensionDate.valueOf()){
          personB.retirementBenefit = this.calculateRetirementBenefit(personB, personB.adjustedRetirementBenefitDate)
          personB.spousalBenefit = this.calculateSpousalBenefit(personB, personA, personB.retirementBenefit, personB.spousalBenefitDate)
          personB.survivorBenefit = this.calculateSurvivorBenefit(personB, personB.retirementBenefit, personB.survivorFRA, personA, personA.adjustedRetirementBenefitDate, personA.adjustedRetirementBenefitDate)
          personA.survivorBenefit = this.calculateSurvivorBenefit(personA, personA.retirementBenefit, personA.survivorFRA, personB, personB.adjustedRetirementBenefitDate, personB.adjustedRetirementBenefitDate)
        }
  }


  //calculates family maximum on one person's work record
  calculateFamilyMaximum(person:Person):Person{
    if (person.isOnDisability === true){
      /* https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615742
      family maximum is lesser of:
      85% of the AIME (but not less than the PIA before COLAs), or
      150% of the worker's PIA before COLAs.
      ...then you add all the COLAs back.
      */
      let PIAbeforeCOLAs: number = person.PIA
      //take current disability benefit (person.PIA) and back out COLAs for every year back to (and including) year in which disability entitlement began
          let thisYear:number = new MonthYearDate().getFullYear()
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

  calculateCombinedFamilyMaximum(personA:Person, personB:Person, simultaneousEntitlementYear:number):number{//simultaneousEntitlementDate is date on which a child first becomes eligible on two work records
    let combinedFamilyMaximum:number
    let sumOfIndividualFamilyMaximums:number = personA.familyMaximum + personB.familyMaximum
    if (simultaneousEntitlementYear > this.today.getFullYear()){//if simultaneousEntitlementYear is in the future (which it usually will be) we won't have MaxTaxableWage figure for that year. So we have to use this year's.
      simultaneousEntitlementYear = this.today.getFullYear()
    }
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

  applyFamilyMaximumSingle(scenario:CalculationScenario, amountLeftForRestOfFamiliy:number){
      let numberOfAxilliaries:number = 0
      for (let child of scenario.children){
        if (child.isOnDisability === true || child.age < 17.99){
          numberOfAxilliaries = numberOfAxilliaries + 1
        }
      }
      let maxAuxilliaryBenefitPerAuxilliary:number = amountLeftForRestOfFamiliy / numberOfAxilliaries
      for (let child of scenario.children){
        if (child.monthlyChildPayment > maxAuxilliaryBenefitPerAuxilliary){
          child.monthlyChildPayment = maxAuxilliaryBenefitPerAuxilliary
        }
      }
    return scenario
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
