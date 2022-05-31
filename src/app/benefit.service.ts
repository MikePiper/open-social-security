import { Injectable } from '@angular/core';
import {Person} from './data model classes/person';
import { CalculationYear } from './data model classes/calculationyear';
import { CalculationScenario } from './data model classes/calculationscenario';
import {MonthYearDate} from "./data model classes/monthyearDate"
import { BirthdayService } from './birthday.service';
import { FamilyMaximumService } from './familymaximum.service';


@Injectable()
export class BenefitService {

  today: MonthYearDate
  sixMonthsAgo:MonthYearDate
  twelveMonthsAgo:MonthYearDate
  deemedFilingCutoff: Date = new Date(1954, 0, 1)//January 2, 1954. If date is LESS than cutoff, old rules. If greater than OR EQUAL TO cutoff, new rules.

  constructor(private birthdayService: BirthdayService, private familyMaximumService: FamilyMaximumService) {
    this.setToday(new MonthYearDate())
  }

  setToday(today:MonthYearDate){
    this.today = new MonthYearDate(today)
    this.sixMonthsAgo = new MonthYearDate(today)
    this.sixMonthsAgo.setMonth(this.sixMonthsAgo.getMonth()-6)
    this.twelveMonthsAgo = new MonthYearDate(today)
    this.twelveMonthsAgo.setFullYear(this.twelveMonthsAgo.getFullYear()-1)
  }



  //For people who will be getting pension from noncovered employment, at any given time we have to know whether to use WEP_PIA or nonWEP_PIA
  checkWhichPIAtoUse(person:Person, date:MonthYearDate){
    if (person.eligibleForNonCoveredPension === true){
        if (person.nonCoveredPensionDate <= date){//i.e., noncovered pension has begun
          person.entitledToNonCoveredPension = true
          person.PIA = person.WEP_PIA
        }
        else {//i..e, noncovered pension has not begun yet
          person.entitledToNonCoveredPension = false
          person.PIA = person.nonWEP_PIA
        }
    }
  }

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
    
    //Any time this function is called, if person is receiving pension from noncovered employment, also recalculate their nonWEPretirementBenefit
    if (person.eligibleForNonCoveredPension === true){
      person.nonWEPretirementBenefit = retirementBenefit / person.PIA * person.nonWEP_PIA
    }
    return Number(retirementBenefit)
  }

  //This calculates initial retirement benefit, accounting for the fact that DRCs aren't applicable until each January or age 70
  calculateInitialRetirementBenefit(person:Person, benefitDate:MonthYearDate):number{
    let initialRetirementBenefit:number
    let age70date:MonthYearDate = new MonthYearDate(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth())
    if (benefitDate > person.FRA){
      if (benefitDate.getFullYear() == person.FRA.getFullYear()){//i.e., they filed in year of FRA, but after FRA. So we use FRA as date for initial benefit
        initialRetirementBenefit = this.calculateRetirementBenefit(person, person.FRA)
      }
      else if (benefitDate.valueOf() >= age70date.valueOf()){//i.e., they filed at age 70 (or later), so we use age 70 date because DRCs are immediately applicable.
        initialRetirementBenefit = this.calculateRetirementBenefit(person, age70date)
      }
      else {//i.e., they filed after year of FRA, but prior to age 70, so we use January of filing year
        initialRetirementBenefit = this.calculateRetirementBenefit(person, new MonthYearDate(benefitDate.getFullYear(), 0))
      }
    }
    else {//No DRCs, so we just use their filing date
      initialRetirementBenefit = this.calculateRetirementBenefit(person, benefitDate)
    }
    return initialRetirementBenefit
  }

  //calculates "original benefit" for use in family max formula (i.e., before reduction for family max, before reduction for own entitlement, before reduction for age, before reduction for GPO)
  calculateSpousalOriginalBenefit(otherPerson:Person):number{
    let spousalOriginalBenefit:number = otherPerson.PIA * 0.5
    return spousalOriginalBenefit
  }

  //calculates "original benefit" for use in family max formula (i.e., before reduction for family max, before reduction for own entitlement...
    //before reduction for age, before reduction for deceased's early entitlement, before reduction for GPO)
    //See FamilyMax.txt for more information.
  calculateSurvivorOriginalBenefit(deceasedPerson:Person):number{
    let survivorOriginalBenefit:number
    if (deceasedPerson.eligibleForNonCoveredPension === false) {
      if (deceasedPerson.retirementBenefit > deceasedPerson.PIA){
        survivorOriginalBenefit = deceasedPerson.retirementBenefit
      }
      else {
        survivorOriginalBenefit = deceasedPerson.PIA
      }
    }
    else {//if deceased person was subject to WEP, we have to calculate survivor benefits using non-WEP PIA (and non-WEP retirement benefit, which is based on non-WEP PIA)
      if (deceasedPerson.nonWEPretirementBenefit > deceasedPerson.nonWEP_PIA){
        survivorOriginalBenefit = deceasedPerson.nonWEPretirementBenefit
      }
      else {
        survivorOriginalBenefit = deceasedPerson.nonWEP_PIA
      }
    }
    return survivorOriginalBenefit
  }

  calculateMotherFatherOriginalBenefit(deceasedPerson:Person):number{
    let originalBenefit:number
    originalBenefit = 0.75 * deceasedPerson.PIA
    return originalBenefit
  }

  adjustSpousalBenefitsForAge(scenario:CalculationScenario, personA:Person, personB:Person){
  //Key point via CFR 404.410: spousal benefits not reduced for month in which there is a child in care (under 16 or disabled) who is entitled to child benefits on worker's record.
    let monthsOfPersonAearlySpousalEntitlement:number
    let monthsOfPersonBearlySpousalEntitlement:number
    let dateForCountingPersonAearlyEntitlement:MonthYearDate = new MonthYearDate(personA.spousalBenefitDate)
    let dateForCountingPersonBearlyEntitlement:MonthYearDate = new MonthYearDate(personB.spousalBenefitDate)
  
    if (personA.adjustedSpousalBenefitDate > personA.spousalBenefitDate){//if ARF has happened, use adjusted date
      dateForCountingPersonAearlyEntitlement = new MonthYearDate(personA.adjustedSpousalBenefitDate)
    }
    if (personB.adjustedSpousalBenefitDate > personB.spousalBenefitDate){//if ARF has happened, use adjusted date
      dateForCountingPersonBearlyEntitlement = new MonthYearDate(personB.adjustedSpousalBenefitDate)
    }

    //Check if there is *currently* a child under 16 or disabled
    let childUnder16orDisabled:boolean = this.birthdayService.checkForChildUnder16orDisabled(scenario)

    if (childUnder16orDisabled === false){//We only reduce spousal benefits for age if there is no child who is disabled and/or *currently* under 16.
      //personA
        monthsOfPersonAearlySpousalEntitlement = personA.FRA.getMonth() - dateForCountingPersonAearlyEntitlement.getMonth() + 12 * (personA.FRA.getFullYear() - dateForCountingPersonAearlyEntitlement.getFullYear())
        if (monthsOfPersonAearlySpousalEntitlement > 0 && monthsOfPersonAearlySpousalEntitlement <= 36) {
          personA.monthlySpousalPayment = personA.monthlySpousalPayment - (personA.monthlySpousalPayment * 25/36/100 * monthsOfPersonAearlySpousalEntitlement)
        }
        else if (monthsOfPersonAearlySpousalEntitlement > 36) {
          personA.monthlySpousalPayment = personA.monthlySpousalPayment - (personA.monthlySpousalPayment * 25/36/100 * 36) - (personA.monthlySpousalPayment * 5/12/100 * (monthsOfPersonAearlySpousalEntitlement-36))
        }
      //personB
        monthsOfPersonBearlySpousalEntitlement = personB.FRA.getMonth() - dateForCountingPersonBearlyEntitlement.getMonth() + 12 * (personB.FRA.getFullYear() - dateForCountingPersonBearlyEntitlement.getFullYear())
        if (monthsOfPersonBearlySpousalEntitlement > 0 && monthsOfPersonBearlySpousalEntitlement <= 36) {
          personB.monthlySpousalPayment = personB.monthlySpousalPayment - (personB.monthlySpousalPayment * 25/36/100 * monthsOfPersonBearlySpousalEntitlement)
        }
        else if (monthsOfPersonBearlySpousalEntitlement > 36) {
          personB.monthlySpousalPayment = personB.monthlySpousalPayment - (personB.monthlySpousalPayment * 25/36/100 * 36) - (personB.monthlySpousalPayment * 5/12/100 * (monthsOfPersonBearlySpousalEntitlement-36))
        }
    }
  }

  adjustSurvivorBenefitsForAge(scenario:CalculationScenario, livingPerson:Person):number{
    let survivorBenefit:number = livingPerson.monthlySurvivorPayment
    //per CFR 404.410: survivor benefits not reduced for month in which there is a child in care (under 16 or disabled) who is entitled to child benefits on worker's record.
    //per RS 00615.310: If survivor is disabled, can claim survivor benefits as early as 50 instead of 60. And if so, for sake of calculation, they are "deemed" to be age 60 on the date they file.
    let monthsEarly:number
    let dateForCountingEarlyEntitlement:MonthYearDate = new MonthYearDate(livingPerson.survivorBenefitDate)
    if (livingPerson.isOnDisability === true && livingPerson.initialAge < 60){
      dateForCountingEarlyEntitlement = new MonthYearDate(livingPerson.SSbirthDate.getFullYear()+60, livingPerson.SSbirthDate.getMonth())
    }

    //if ARF has happened, use adjusted date
    //If person is receiving disabled widow(er) benefits (pre-60), adjustedSurvivorBenefitDate is [age-60 month + ARF crediting months] rather than [survivorBenefitDate + ARF months]
      if (livingPerson.age >= this.birthdayService.findAgeOnDate(livingPerson, livingPerson.survivorFRA)){
        dateForCountingEarlyEntitlement = new MonthYearDate(livingPerson.adjustedSurvivorBenefitDate)
      }

    //Check if there is *currently* a child under 16 or disabled
      let childUnder16orDisabled:boolean = this.birthdayService.checkForChildUnder16orDisabled(scenario)

    //Reduce survivor benefits for age if there is no child who is disabled and/or *currently* under 16.
      if (childUnder16orDisabled === false){
        if (dateForCountingEarlyEntitlement < livingPerson.survivorFRA){
          //Find how many months prior to survivorFRA
            monthsEarly = livingPerson.survivorFRA.getMonth() - dateForCountingEarlyEntitlement.getMonth() + 12 * (livingPerson.survivorFRA.getFullYear() - dateForCountingEarlyEntitlement.getFullYear())
          //Find how many months between age 60 and survivorFRA
            let monthsBetween60andSurvivorFRA:number
            monthsBetween60andSurvivorFRA = livingPerson.survivorFRA.getMonth() - livingPerson.SSbirthDate.getMonth() + 12 * (livingPerson.survivorFRA.getFullYear() - (livingPerson.SSbirthDate.getFullYear()+60))
          //Apply reduction
            let reductionPercentage:number = monthsEarly / monthsBetween60andSurvivorFRA * 0.285
            survivorBenefit = livingPerson.monthlySurvivorPayment * (1 - reductionPercentage)
        }
      }
    return survivorBenefit
  }

  adjustSurvivorBenefitsForRIB_LIM(livingPerson:Person, deceasedPerson:Person):number{
    let survivorBenefit:number = livingPerson.monthlySurvivorPayment
    //Determine whether RIB-LIM limit is 82.5% of deceased's PIA or amount deceased was receiving
      let RIB_LIMlimit:number = 0
      if (deceasedPerson.eligibleForNonCoveredPension === false){
        if (deceasedPerson.retirementBenefit > 0.825 * deceasedPerson.PIA){
          RIB_LIMlimit = deceasedPerson.retirementBenefit
        }
        else {
          RIB_LIMlimit = 0.825 * deceasedPerson.PIA
        }
      }
      else {//Use non-WEP PIA and retirement benefit if deceased person was subject to WEP during life.
        if (deceasedPerson.nonWEPretirementBenefit > 0.825 * deceasedPerson.nonWEP_PIA){
          RIB_LIMlimit = deceasedPerson.nonWEPretirementBenefit
        }
        else {
          RIB_LIMlimit = 0.825 * deceasedPerson.nonWEP_PIA
        }
      }
    //Limit survivor's monthlySurvivorPayment to RIB-LIM limit
      if (survivorBenefit > RIB_LIMlimit){
        survivorBenefit = RIB_LIMlimit
      }
      return survivorBenefit
  }

  adjustSpousalSurvivorMotherFatherBenefitsForGPO(personA:Person, personB:Person){
    if (personA.entitledToNonCoveredPension === true){
      personA.monthlySpousalPayment = personA.monthlySpousalPayment - (2/3 * personA.governmentPension)
      personA.monthlySurvivorPayment = personA.monthlySurvivorPayment - (2/3 * personA.governmentPension)
      personA.monthlyMotherFatherPayment = personA.monthlyMotherFatherPayment - (2/3 * personA.governmentPension)
    }
    if (personB.entitledToNonCoveredPension === true){
      personB.monthlySpousalPayment = personB.monthlySpousalPayment - (2/3 * personB.governmentPension)
      personB.monthlySurvivorPayment = personB.monthlySurvivorPayment - (2/3 * personB.governmentPension)
      personB.monthlyMotherFatherPayment = personB.monthlyMotherFatherPayment - (2/3 * personB.governmentPension)
    }
    //Don't let benefits be negative.
    if (personA.monthlySpousalPayment < 0) {personA.monthlySpousalPayment = 0}
    if (personA.monthlySurvivorPayment < 0) {personA.monthlySurvivorPayment = 0}
    if (personA.monthlyMotherFatherPayment < 0) {personA.monthlyMotherFatherPayment = 0}
    if (personB.monthlySpousalPayment < 0) {personB.monthlySpousalPayment = 0}
    if (personB.monthlySurvivorPayment < 0) {personB.monthlySurvivorPayment = 0}
    if (personB.monthlyMotherFatherPayment < 0) {personB.monthlyMotherFatherPayment = 0}
  }

  adjustSpousalSurvivorMotherFatherBenefitsForOwnEntitlement(personA:Person, personB:Person){
    //If personA has a retirement payment
    if (personA.monthlyRetirementPayment > 0){
      //Reduce personA's spousal benefit by greater of personA's PIA or retirement benefit
      if (personA.retirementBenefit > personA.PIA){
        personA.monthlySpousalPayment = personA.monthlySpousalPayment - personA.retirementBenefit
      }
      else {
        personA.monthlySpousalPayment = personA.monthlySpousalPayment - personA.PIA
      }
      //Reduce personA's survivor or mother/father benefit by personA's retirement benefit
      personA.monthlySurvivorPayment = personA.monthlySurvivorPayment - personA.retirementBenefit
      personA.monthlyMotherFatherPayment = personA.monthlyMotherFatherPayment - personA.retirementBenefit
    }
    //If personB has a retirement payment
    if (personB.monthlyRetirementPayment > 0){
      //Reduce personB's spousal benefit by greater of personB's PIA or retirement benefit
      if (personB.retirementBenefit > personB.PIA){
        personB.monthlySpousalPayment = personB.monthlySpousalPayment - personB.retirementBenefit
      }
      else {
        personB.monthlySpousalPayment = personB.monthlySpousalPayment - personB.PIA
      }
      //Reduce personB's survivor or mother/father benefit by personB's retirement benefit
      personB.monthlySurvivorPayment = personB.monthlySurvivorPayment - personB.retirementBenefit
      personB.monthlyMotherFatherPayment = personB.monthlyMotherFatherPayment - personB.retirementBenefit
    }
    //Don't let benefits be negative.
    if (personA.monthlySpousalPayment < 0) {personA.monthlySpousalPayment = 0}
    if (personA.monthlySurvivorPayment < 0) {personA.monthlySurvivorPayment = 0}
    if (personA.monthlyMotherFatherPayment < 0){personA.monthlyMotherFatherPayment = 0}
    if (personB.monthlySpousalPayment < 0) {personB.monthlySpousalPayment = 0}
    if (personB.monthlySurvivorPayment < 0) {personB.monthlySurvivorPayment = 0}
    if (personB.monthlyMotherFatherPayment < 0){personB.monthlyMotherFatherPayment = 0}
  }

  determineChildBenefitDate(scenario:CalculationScenario, child:Person, personA:Person, personB?:Person):MonthYearDate{
    let childBenefitDate:MonthYearDate
    let sixMonthsAgo:MonthYearDate = new MonthYearDate(this.today)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6)
    let twelveMonthsAgo:MonthYearDate = new MonthYearDate(this.today)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12)

    if (scenario.maritalStatus == "single"){
      if (child.hasFiled === true){
        //assume child filed as early as possible (parent retirementBenefitDate)
        childBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
      }
      else {//If child hasn't filed, find earliest retroactive childBenefitDate
        //If parent is not disabled, it's 6 months before today
        if (personA.isOnDisability === false){
          childBenefitDate = new MonthYearDate(sixMonthsAgo)
        }
        else {//If parent is disabled, it's 12 months before today
        childBenefitDate = new MonthYearDate(twelveMonthsAgo)
        }
        //But no earlier than parent's retirementBenefitDate
        if (childBenefitDate < personA.retirementBenefitDate){
          childBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
        }
      }
    }
    else { //married, divorced, or survivor scenario
      if (child.hasFiled === true){
        //assume they filed as early as possible -- earliest of personA.retirementBenefitDate, personB.retirementBenefitDate, or (in survivor scenario) personB.dateOfDeath
        childBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
        if (personB.retirementBenefitDate < childBenefitDate){
          childBenefitDate = new MonthYearDate(personB.retirementBenefitDate)
        }
        if (scenario.maritalStatus == "survivor" && personB.dateOfDeath < childBenefitDate){
          childBenefitDate = new MonthYearDate(personB.dateOfDeath)
        }
      }
      else {//If child hasn't filed, find earliest retroactive childBenefitDate based on each parent
        //find earliest date based on parentA
          if (personA.isOnDisability === false){//if personA is not disabled, it's 6 months ago. But no earlier than personA's retirementBenefitDate
            var earliestChildBenefitDateFromPersonA:MonthYearDate = new MonthYearDate(sixMonthsAgo)
            if (earliestChildBenefitDateFromPersonA < personA.retirementBenefitDate){
              earliestChildBenefitDateFromPersonA = new MonthYearDate(personA.retirementBenefitDate)
            }
          }
          else {//if personA is disabled, it's 12 months ago. But no earlier than personA's fixedRetirementBenefitDate (i.e., their disability date)
            var earliestChildBenefitDateFromPersonA:MonthYearDate = new MonthYearDate(twelveMonthsAgo)
            if (earliestChildBenefitDateFromPersonA < personA.fixedRetirementBenefitDate){
              earliestChildBenefitDateFromPersonA = new MonthYearDate(personA.fixedRetirementBenefitDate)
            }
          }
        //find earliest date based on parentB
          if (personB.isOnDisability === false){//if personB is not disabled, it's 6 months ago. But no earlier than personB's retirementBenefitDate
            var earliestChildBenefitDateFromPersonB:MonthYearDate = new MonthYearDate(sixMonthsAgo)
            if (earliestChildBenefitDateFromPersonB < personB.retirementBenefitDate){
              earliestChildBenefitDateFromPersonB = new MonthYearDate(personB.retirementBenefitDate)
            }
          }
          else {//if personB is disabled, it's 12 months ago. But no earlier than personB's fixedRetirementBenefitDate (i.e., their disability date)
            var earliestChildBenefitDateFromPersonB:MonthYearDate = new MonthYearDate(twelveMonthsAgo)
            if (earliestChildBenefitDateFromPersonB < personB.fixedRetirementBenefitDate){
              earliestChildBenefitDateFromPersonB = new MonthYearDate(personB.fixedRetirementBenefitDate)
            }
          }
          if (scenario.maritalStatus == "survivor"){//If it's a survivor scenario, find later of dateOfDeath or 6 months ago. If that's prior to current earliestChildBenefitDateFromPersonB, use this new date instead
            let earliestChildSurvivorBenefitDate:MonthYearDate
            earliestChildSurvivorBenefitDate = personB.dateOfDeath > sixMonthsAgo ? new MonthYearDate(personB.dateOfDeath) : new MonthYearDate(sixMonthsAgo)
            if (earliestChildSurvivorBenefitDate < earliestChildBenefitDateFromPersonB){earliestChildBenefitDateFromPersonB = new MonthYearDate(earliestChildSurvivorBenefitDate)}
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
    if (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() >= scenario.benefitCutYear && calcYear.date.getMonth() === 11) {
    //If there's a benefit cut assumption...
    //...and we've reached the year in question...
    //...and it's December (because we only want to apply this cut at the end of the year, given that it's a multiplication to annual sums)

    let cutFactor: number = scenario.cutFactor; // pre-calculate and use *= operation to simplify calculations
    //Apply cut to sums included in PV calculation
    calcYear.annualBenefitSinglePersonAlive *= cutFactor
    calcYear.annualBenefitSinglePersonDeceased *= cutFactor
    calcYear.annualBenefitBothAlive *= cutFactor
    calcYear.annualBenefitOnlyPersonAalive *= cutFactor
    calcYear.annualBenefitOnlyPersonBalive *= cutFactor
    calcYear.annualBenefitBothDeceased *= cutFactor
    //Apply cut to sums included in output table
    calcYear.tablePersonAannualRetirementBenefit *= cutFactor
    calcYear.tablePersonAannualSpousalBenefit *= cutFactor
    calcYear.tablePersonAannualSurvivorBenefit *= cutFactor
    calcYear.tablePersonBannualRetirementBenefit *= cutFactor
    calcYear.tablePersonBannualSpousalBenefit *= cutFactor
    calcYear.tablePersonBannualSurvivorBenefit *= cutFactor
    calcYear.tableTotalAnnualChildBenefitsSingleParentAlive *= cutFactor
    calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased *= cutFactor
    calcYear.tableTotalAnnualChildBenefitsBothParentsAlive *= cutFactor
    calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased *= cutFactor
    calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive *= cutFactor
    calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive *= cutFactor
	}
  }

  
  calculateMonthlyPaymentsSingle(scenario:CalculationScenario, calcYear:CalculationYear, person:Person, personAliveBoolean:boolean){
    //Reset monthlyPayment fields
    person.monthlyRetirementPayment = 0
    for (let child of scenario.children){
      child.monthlyChildPayment = 0
    }

    //Check whether person is entitled to noncovered pension
    if (person.entitledToNonCoveredPension === false){
      if (calcYear.date >= person.nonCoveredPensionDate){
        person.entitledToNonCoveredPension = true
      }
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
          if (person.eligibleForNonCoveredPension === false){
            child.monthlyChildPayment = person.PIA * 0.75
          }
          else {
            child.monthlyChildPayment = person.nonWEP_PIA * 0.75
          }
        }
      }
    }
  }



  //Calculates "original benefit" amounts (i.e., amounts that go into family max math -- so spousal/survivor benefits not yet reduced for family max, own entitlement, age, or GPO)
  calculateMonthlyPaymentsCouple(scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personAaliveBoolean:boolean, personB:Person, personBaliveBoolean:boolean){
    //Note that we're making no distinction in this function for whether it's a married, divorced, or widow/widower scenario.

    let date:MonthYearDate = new MonthYearDate(calcYear.date) //pre-calculate and use in multiple places. (In theory that's faster than accessing field on an object.)

    //Set all benefits to zero to begin
      personA.monthlyRetirementPayment = 0
      personA.monthlySpousalPayment = 0
      personA.monthlySurvivorPayment = 0
      personA.monthlyMotherFatherPayment = 0
      personB.monthlyRetirementPayment = 0
      personB.monthlySpousalPayment = 0
      personB.monthlySurvivorPayment = 0
      personB.monthlyMotherFatherPayment = 0
      for (let child of scenario.children){child.monthlyChildPayment = 0}

    //Check if there is a childUnder16orDisabled
      let childUnder16orDisabled:boolean = this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, date)

    //Check whether a person's retirement benefit begins this month
      if (personA.entitledToRetirement === false){
        if (date >= personA.retirementBenefitDate){
          personA.entitledToRetirement = true
        }
      }
      if (personB.entitledToRetirement === false){
        if (date >= personB.retirementBenefitDate){
          personB.entitledToRetirement = true
        }
      }

    //determine if personA and/or personB are suspended
      let personAsuspended:boolean = false
      let personBsuspended:boolean = false
      if (personA.suspendingBenefits === true){
        if (personA.endSuspensionDate <= date || personA.beginSuspensionDate > date) {personAsuspended = false}
        else {personAsuspended = true}
      }
      if (personB.suspendingBenefits === true){
        if (personB.endSuspensionDate <= date || personB.beginSuspensionDate > date) {personBsuspended = false}
        else {personBsuspended = true}
      }

    //Check whether personA or personB entitled to noncovered pension
      if (personA.entitledToNonCoveredPension === false){
        if (date >= personA.nonCoveredPensionDate){
          personA.entitledToNonCoveredPension = true
        }
      }
      if (personB.entitledToNonCoveredPension === false){
        if (date >= personB.nonCoveredPensionDate){
          personB.entitledToNonCoveredPension = true
        }
      }

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
            if (personB.entitledToRetirement === true){
              personB.monthlyRetirementPayment = personB.retirementBenefit
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    child.monthlyChildPayment = personB.PIA * 0.5
                  }
                }
              }
            }
          }
          else if (personAsuspended === false && personBsuspended === true){//if only personB is suspended
            personB.DRCsViaSuspension = personB.DRCsViaSuspension + 1
            //if entitled to benefits in question: personA gets retirement benefit, children each get child benefit on personA (personB gets nothing)
            if (personA.entitledToRetirement === true){
              personA.monthlyRetirementPayment = personA.retirementBenefit
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    child.monthlyChildPayment = personA.PIA * 0.5
                  }
                }
              }
            }
          }
          else {//if neither person is suspended
            //if entitled to benefits in question: personA gets retirement and spousal, personB gets retirement and spousal and children each get benefit on personA or personB
            let childUnder16orDisabled:boolean = this.birthdayService.checkForChildUnder16orDisabled(scenario)
            //personA
            if (personA.entitledToRetirement === true){
              personA.monthlyRetirementPayment = personA.retirementBenefit
            }
            if( (personA.PIA < 0.5 * personB.PIA || personA.entitledToRetirement === false) && //if personA has PIA less than 50% of personB's PIA or is not yet entitled to a retirement benefit, AND
                ( date >= personA.spousalBenefitDate  //personA has reached spousalBenefitDate (i.e., they're getting normal spousal benefits)
                  || (childUnder16orDisabled === true && personA.childInCareSpousal === true && date >= personA.childInCareSpousalBenefitDate) //OR personA is getting child-in-care spousal
                )
              ){
                personA.monthlySpousalPayment = this.calculateSpousalOriginalBenefit(personB)
            }
            //personB
            if (personB.entitledToRetirement === true){
              personB.monthlyRetirementPayment = personB.retirementBenefit
            }
            if( (personB.PIA < 0.5 * personA.PIA || personB.entitledToRetirement === false) && //if personB has PIA less than 50% of personA's PIA or is not yet entitled to a retirement benefit, AND
                ( date >= personB.spousalBenefitDate //personB has reached spousalBenefitDate (i.e., they're getting normal spousal benefits)
                  || (childUnder16orDisabled === true && personB.childInCareSpousal === true && date >= personB.childInCareSpousalBenefitDate) //OR personB is getting child-in-care spousal
                )
              ){
              personB.monthlySpousalPayment = this.calculateSpousalOriginalBenefit(personA)
            }
            //children
            for (let child of scenario.children){
              if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (personA.entitledToRetirement === true && personB.entitledToRetirement === true){//If both spouses have started benefits, it's 50% of higher PIA
                      child.monthlyChildPayment = (personA.PIA > personB.PIA) ? personA.PIA * 0.5 : personB.PIA * 0.5
                    }
                    else if (personA.entitledToRetirement === true){//both hadn't been met, but personA's date has been met
                      child.monthlyChildPayment = personA.PIA * 0.5
                    }
                    else {//i.e., childBenefitDate has been met (which means at least one spouse's retirementBenefitDate has been met), but it wasn't personA's date
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
                  if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (personB.eligibleForNonCoveredPension === false){
                      child.monthlyChildPayment = personB.PIA * 0.75//No need to do any check based on personB dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                    }
                    else {
                      child.monthlyChildPayment = personB.nonWEP_PIA * 0.75
                    }
                  }
                }
              }
          }
          else {//if personA is not suspended
              //if entitled to benefits in question: a) personA gets retirement, survivor, mother/father; b) children get benefit on personA or survivor benefit on personB
              if (personA.entitledToRetirement === true){
                personA.monthlyRetirementPayment = personA.retirementBenefit
              }
              if (date >= personA.survivorBenefitDate){
                personA.monthlySurvivorPayment = this.calculateSurvivorOriginalBenefit(personB)
              }
              else if (childUnder16orDisabled === true && date >= personA.motherFatherBenefitDate){
                //^^personA is NOT entitled to survivor, there is a child under 16 or disabled, and personA has filed for mother/father
                personA.monthlyMotherFatherPayment = this.calculateMotherFatherOriginalBenefit(personB)
              }
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (personA.entitledToRetirement === true){
                      if (personB.eligibleForNonCoveredPension === false){
                        child.monthlyChildPayment = (personA.PIA * 0.5 > personB.PIA * 0.75) ? personA.PIA * 0.5 : personB.PIA * 0.75
                      }
                      else {
                        child.monthlyChildPayment = (personA.PIA * 0.5 > personB.nonWEP_PIA * 0.75) ? personA.PIA * 0.5 : personB.nonWEP_PIA * 0.75
                      }
                    }
                    else {
                      if (personB.eligibleForNonCoveredPension === false){
                        child.monthlyChildPayment = personB.PIA * 0.75//No need to do any check based on personB dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                      }
                      else {
                        child.monthlyChildPayment = personB.nonWEP_PIA
                      }
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
                  if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (personA.eligibleForNonCoveredPension === false){
                      child.monthlyChildPayment = personA.PIA * 0.75//No need to do any check based on personA dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                    }
                    else {
                      child.monthlyChildPayment = personA.nonWEP_PIA * 0.75
                    }
                  }
                }
              }
          }
          else{//if personB is not suspended
              //if entitled to benefits in question: personB gets retirement and survivor, children get benefit on personB or survivor benefit on personA
              if (personB.entitledToRetirement === true){
                personB.monthlyRetirementPayment = personB.retirementBenefit
              }
              if (date >= personB.survivorBenefitDate){
                personB.monthlySurvivorPayment = this.calculateSurvivorOriginalBenefit(personA)
              }
              else if (childUnder16orDisabled === true && date >= personB.motherFatherBenefitDate){
                //^^personB is NOT entitled to survivor, there is a child under 16 or disabled, and personB has filed for mother/father
                personB.monthlyMotherFatherPayment = this.calculateMotherFatherOriginalBenefit(personA)
              }
              for (let child of scenario.children){
                if (child.age < 17.99 || child.isOnDisability === true){//if child is eligible for a benefit...
                  if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                    if (personB.entitledToRetirement === true){
                      if (personA.eligibleForNonCoveredPension === false){
                        child.monthlyChildPayment = (personA.PIA * 0.75 > personB.PIA * 0.5) ? personA.PIA * 0.75 : personB.PIA * 0.5
                      }
                      else {
                        child.monthlyChildPayment = (personA.nonWEP_PIA * 0.75 > personB.PIA * 0.5) ? personA.nonWEP_PIA * 0.75 : personB.PIA * 0.5
                      }
                    }
                    else {
                      if (personA.eligibleForNonCoveredPension === false){
                        child.monthlyChildPayment = personA.PIA * 0.75//No need to do any check based on personA dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
                      }
                      else {
                        child.monthlyChildPayment = personA.nonWEP_PIA * 0.75
                      }
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
              if (date >= child.childBenefitDate){//child gets a benefit if we have reached his/her childBenefitDate
                if (personA.eligibleForNonCoveredPension === false && personB.eligibleForNonCoveredPension === false){
                  child.monthlyChildPayment = (personA.PIA > personB.PIA) ? personA.PIA * 0.75 : personB.PIA * 0.75
                }
                else if (personA.eligibleForNonCoveredPension === true && personB.eligibleForNonCoveredPension === false){
                  child.monthlyChildPayment = (personA.nonWEP_PIA > personB.PIA) ? personA.nonWEP_PIA * 0.75 : personB.PIA * 0.75
                }
                else if (personA.eligibleForNonCoveredPension === false && personB.eligibleForNonCoveredPension === true){
                  child.monthlyChildPayment = (personA.PIA > personB.nonWEP_PIA) ? personA.PIA * 0.75 : personB.nonWEP_PIA * 0.75
                }
                else {
                  child.monthlyChildPayment = (personA.nonWEP_PIA > personB.nonWEP_PIA) ? personA.nonWEP_PIA * 0.75 : personB.nonWEP_PIA * 0.75
                }
                //No need to do any check based on parent dates. If we're assuming they're deceased, children are eligible (assuming <18 or disabled)
              }
            }
          }
      }
      //Save currently payment amounts as child.originalBenefit field, for sake of making sure family max never results in benefit greater than original benefit
      for (let child of scenario.children){
        child.originalBenefit = child.monthlyChildPayment
      }
  }

  monthlyCheckForBenefitRecalculationsSingle(person:Person, calcYear:CalculationYear){
    this.checkIfWEPbeginsThisMonthAndRecalcAsNecessary(person, calcYear.date)
    //At FRA, recalculate retirementBenefit using adjusted date
    if (calcYear.date.valueOf() == person.FRA.valueOf()){
      person.adjustedRetirementBenefitDate.setMonth(person.retirementBenefitDate.getMonth()+person.retirementARFcreditingMonths)
      person.retirementBenefit = this.calculateRetirementBenefit(person, person.adjustedRetirementBenefitDate)
      //Also at FRA, if person is disabled, recalculate family maximum using normal retirement family maximum rules rather than disability ("DMAX") rules. (See https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615742)
      if (person.isOnDisability === true){
        this.familyMaximumService.calculateFamilyMaximum(person, calcYear.date)
      }
    }
    //Recalculate retirementBenefit using DRCs at endSuspensionDate
    if (calcYear.date.valueOf() == person.endSuspensionDate.valueOf()){
      person.retirementBenefit = this.calculateRetirementBenefit(person, person.adjustedRetirementBenefitDate)
    }
  }

  monthlyCheckForBenefitRecalculationsCouple(personA:Person, personB:Person, calcYear:CalculationYear){
    this.checkIfWEPbeginsThisMonthAndRecalcAsNecessary(personA, calcYear.date)
    this.checkIfWEPbeginsThisMonthAndRecalcAsNecessary(personB, calcYear.date)
    //Calculate retirementBenefit field if it hasn't been done yet
    if (personA.retirementBenefit == 0 && personA.PIA > 0) {
      personA.retirementBenefit = this.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
    }
    if (personB.retirementBenefit == 0 && personB.PIA > 0) {
      personB.retirementBenefit = this.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
    }

    //At personA's FRA...
    if (calcYear.date.valueOf() == personA.FRA.valueOf()){
      //Recalculate person's own retirement benefit using adjusted date at FRA. Also set adjustedSpousalBenefitDate field.
      if (personA.retirementBenefitDate < personA.FRA){//This conditional is because we only want to calculate these things at FRA if person filed prior to FRA. If person hasn't hit retirementBenefitDate yet, we don't want to calculate it yet.
        personA.adjustedRetirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+personA.retirementARFcreditingMonths)
        personA.adjustedSpousalBenefitDate.setMonth(personA.adjustedSpousalBenefitDate.getMonth()+personA.spousalARFcreditingMonths)
        personA.retirementBenefit = this.calculateRetirementBenefit(personA, personA.adjustedRetirementBenefitDate)
      }
      //If personA is disabled, recalculate family maximum using normal retirement family maximum rules rather than disability ("DMAX") rules. (See https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615742)
      if (personA.isOnDisability === true){
        this.familyMaximumService.calculateFamilyMaximum(personA, calcYear.date)
      }
    }
    //Same idea, for personA's survivorFRA (i.e., recalculate survivor benefit to account for ARF, if they filed for survivor benefit early)
    if (calcYear.date.valueOf() == personA.survivorFRA.valueOf()){
      if (personA.survivorBenefitDate < personA.survivorFRA){//if personA filed early for survivor benefits
        if (personA.isOnDisability === false || personA.survivorBenefitDate >= new MonthYearDate(personA.SSbirthDate.getFullYear()+60, personA.SSbirthDate.getMonth())){
          personA.adjustedSurvivorBenefitDate.setMonth(personA.adjustedSurvivorBenefitDate.getMonth()+personA.survivorARFcreditingMonths)//add ARF crediting months to survivorBenefitDate to get adjustedSurvivorBenefitDate
        }
        else {//i.e., if personA is on disability AND filed for widow(er) benefit before reaching age 60 (i.e., disabled widow/widower benefits)
          //Then since they were deemed to be age 60 for purpose of calculating early reduction, we have to add ARF months to age-60 date rather than to survivorBenefitDate
          personA.adjustedSurvivorBenefitDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+60, personA.SSbirthDate.getMonth())
          personA.adjustedSurvivorBenefitDate.setMonth(personA.adjustedSurvivorBenefitDate.getMonth()+personA.survivorARFcreditingMonths)
        }
      }
    }
    //At personB's FRA...
    if (calcYear.date.valueOf() == personB.FRA.valueOf()){
      //Recalculate person's own retirement benefit using adjusted date at FRA. Also set adjustedSpousalBenefitDate field.
      if (personB.retirementBenefitDate < personB.FRA){//Second conditional is because we only want to calculate these things at FRA if person filed prior to FRA. If person hasn't hit retirementBenefitDate yet, we don't want to calculate it yet.
        personB.adjustedRetirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+personB.retirementARFcreditingMonths)
        personB.adjustedSpousalBenefitDate.setMonth(personB.adjustedSpousalBenefitDate.getMonth()+personB.spousalARFcreditingMonths)
        personB.retirementBenefit = this.calculateRetirementBenefit(personB, personB.adjustedRetirementBenefitDate)
      }
      //If personB is disabled, recalculate family maximum using normal retirement family maximum rules rather than disability ("DMAX") rules. (See https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615742)
      if (personB.isOnDisability === true){
        this.familyMaximumService.calculateFamilyMaximum(personB, calcYear.date)
      }
    }
    //Same idea, for personB's survivorFRA (i.e., recalculate survivor benefit to account for ARF, if they filed for survivor benefit early).
        //This should never actually get triggered given the application's current assumption that in "both alive" scenario neither person files for survivor benefits before survivorFRA. Including it anyway though in case that changes in future for some reason.
        if (calcYear.date.valueOf() == personB.survivorFRA.valueOf()){
          if (personB.survivorBenefitDate < personB.survivorFRA){//if personB filed early for survivor benefits
            if (personB.isOnDisability === false || personB.survivorBenefitDate >= new MonthYearDate(personB.SSbirthDate.getFullYear()+60, personB.SSbirthDate.getMonth())){
              personB.adjustedSurvivorBenefitDate.setMonth(personB.adjustedSurvivorBenefitDate.getMonth()+personB.survivorARFcreditingMonths)//add ARF crediting months to survivorBenefitDate to get adjustedSurvivorBenefitDate
            }
            else {//i.e., if personB is on disability AND filed for widow(er) benefit before reaching age 60 (i.e., disabled widow/widower benefits)
              //Then since they were deemed to be age 60 for purpose of calculating early reduction, we have to add ARF months to age-60 date rather than to survivorBenefitDate
              personB.adjustedSurvivorBenefitDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+60, personB.SSbirthDate.getMonth())
              personB.adjustedSurvivorBenefitDate.setMonth(personB.adjustedSurvivorBenefitDate.getMonth()+personB.survivorARFcreditingMonths)
            }
          }
        }

    //Recalculate retirement benefit using DRCs at endSuspensionDate
    if (calcYear.date.valueOf() == personA.endSuspensionDate.valueOf()){
      personA.retirementBenefit = this.calculateRetirementBenefit(personA, personA.adjustedRetirementBenefitDate)
    }
    if (calcYear.date.valueOf() == personB.endSuspensionDate.valueOf()){
      personB.retirementBenefit = this.calculateRetirementBenefit(personB, personB.adjustedRetirementBenefitDate)
    }
  }

  checkIfWEPbeginsThisMonthAndRecalcAsNecessary(person:Person, date:MonthYearDate){
    //Do same "entitled" check as in checkWhichPIAtoUse(), and set PIA in same way
    if (person.eligibleForNonCoveredPension === true && person.entitledToNonCoveredPension === false){//We do "entitled = false" check because we don't want to keep running this for no reason every month after pension has begun
      if (person.nonCoveredPensionDate <= date){//i.e., noncovered pension has begun
        person.entitledToNonCoveredPension = true
        //set person.PIA equal to their WEP PIA (until now, PIA field was equal to non-WEP PIA)
        person.PIA = person.WEP_PIA
        //If we haven't reached FRA, do regular retirementBenefit recalculation. If we have, recalculate using ARF-adjusted benefit date.
        if (date < person.FRA){
          person.retirementBenefit = this.calculateRetirementBenefit(person, person.retirementBenefitDate)
        }
        else {
          person.retirementBenefit = this.calculateRetirementBenefit(person, person.adjustedRetirementBenefitDate)
          //If we have reached endSuspensionDate, this will automatically include person's DRCs from suspension
        }
        //Recalculate family maximum with new PIA
        this.familyMaximumService.calculateFamilyMaximum(person, date)
      }
    }
  }

  checkIfRIBLIMisApplicableForRetroactiveSurvivorApplication(scenario:CalculationScenario, livingPerson:Person, deceasedPerson:Person, survivorBenefitDate:MonthYearDate):boolean{
    //This function is not actually called for any benefit calculations. It's just for the sake of applying POMS GN 00204.030.D,
      //which says that a person can file for widow(er) benefit up to 6 months retroactively, even before FRA, if their benefit is being limited by RIB-LIM (i.e., reduction for age isn't relevant)
    //Note that we're ignoring family max here. It's possible that this would return true when it shouldn't (indicating that RIB-LIM is limiting this person's widow(er) benefit when that's not actually the case).
    
    //Have to make a clone of livingPerson, because we're about to change their survivorBenefitDate field, so that we can use adjustSurvivorBenefitsForAge() based on the survivorBenefitDate input.
    //And we don't *actually* want to change the survivorBenefitDate field on the real person object.
    let cloneLivingPerson:Person = Object.assign(new Person("A"), livingPerson)
    cloneLivingPerson.survivorBenefitDate = new MonthYearDate(survivorBenefitDate)
    let isApplicable:boolean = false

    if (deceasedPerson.hasFiled === true){
      let PIAforRIBLIM:number = deceasedPerson.entitledToNonCoveredPension ? deceasedPerson.nonWEP_PIA : deceasedPerson.PIA
      let retirementBenefitforRIBLIM:number = deceasedPerson.entitledToNonCoveredPension ? deceasedPerson.nonWEPretirementBenefit : deceasedPerson.retirementBenefit
      let RIBLIMlimit:number = PIAforRIBLIM * 0.825 > retirementBenefitforRIBLIM ? PIAforRIBLIM * 0.825 : retirementBenefitforRIBLIM
      cloneLivingPerson.monthlySurvivorPayment = this.calculateSurvivorOriginalBenefit(deceasedPerson)
      cloneLivingPerson.monthlySurvivorPayment = this.adjustSurvivorBenefitsForAge(scenario, cloneLivingPerson)
      if (cloneLivingPerson.monthlySurvivorPayment > RIBLIMlimit){
        isApplicable = true
      }
    }
    return isApplicable
  }

}
