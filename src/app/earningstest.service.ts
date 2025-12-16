import {Injectable} from '@angular/core'
import {CalculationYear} from './data model classes/calculationyear'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"
import { BirthdayService } from './birthday.service';

@Injectable({
  providedIn: 'root'
})
export class EarningsTestService {
  today: MonthYearDate

  constructor(private birthdayService:BirthdayService) {
    this.setToday(new MonthYearDate())
  }

  setToday(today:MonthYearDate){
    this.today = new MonthYearDate(today)
  }
 


  calculateWithholding(currentCalculationDate:MonthYearDate, person:Person){
      //Determine annual earnings subject to earnings test
      let annualEarnings: number = 0
      if (currentCalculationDate.getFullYear() > person.quitWorkDate.getFullYear() || currentCalculationDate.getFullYear() > person.FRA.getFullYear()) {//If current calc year after FRAyear or quitYear, zero earnings to consider
        annualEarnings = 0            
      } else if (currentCalculationDate.getFullYear() < person.quitWorkDate.getFullYear() && currentCalculationDate.getFullYear() < person.FRA.getFullYear()) {//If current calc year before FRAyear AND before quitYear, 12 months of earnings to consider
        annualEarnings = 12 * person.monthlyEarnings
      } else {//Annual earnings is equal to monthlyEarnings, times number of months before earlier of FRAmonth or quitMonth
        if (person.FRA < person.quitWorkDate) {
          annualEarnings = person.monthlyEarnings * person.FRA.getMonth() //e.g,. if FRA is in March, "getMonth" returns 2, which is how many months of earnings we want to consider
        } else {
          annualEarnings = person.monthlyEarnings * person.quitWorkDate.getMonth() //e.g,. if quitWorkDate is in March, "getMonth" returns 2, which is how many months of earnings we want to consider
        }
      }
      //determine withholdingAmount
      let withholdingAmount:number = 0
      if (currentCalculationDate.getFullYear() < person.FRA.getFullYear()) {
        //withhold using before-year-of-FRA threshold, $1 per $2 excess
        withholdingAmount = (annualEarnings - this.earningsTestThresholds[this.today.getFullYear()-2018].beforeFRAthreshold) / 2
      } else if (currentCalculationDate.getFullYear() == person.FRA.getFullYear()) {
        //withhold using higher (year of FRA) threshold, $1 per $3 excess
        withholdingAmount = (annualEarnings - this.earningsTestThresholds[this.today.getFullYear()-2018].FRAyearThreshold) / 3
      }
      //Don't let withholdingAmount be negative
      if (withholdingAmount < 0) {
        withholdingAmount = 0
      }
      return Number(withholdingAmount)
  }

  isGraceYear(person:Person, currentCalculationDate: MonthYearDate):boolean {
    //If quitWorkDate has already happened (or happens this year) and at least one benefit has started (or starts this year) it's a grace year
    //Assumption: in the year they quit work, following months are non-service months.
    let graceYear:boolean = false
    if (person.hasHadGraceYear === true) { //if graceyear was true before, set it to false, so it's only true once
      graceYear = false
    }
    else if (person.quitWorkDate.getFullYear() <= currentCalculationDate.getFullYear()) {
      if (person.retirementBenefitDate.getFullYear() <= currentCalculationDate.getFullYear()) {
        graceYear = true
      }
      if (person.spousalBenefitDate && person.spousalBenefitDate.getFullYear() <= currentCalculationDate.getFullYear()) {//i.e., if spousalBenefitDate exists, and it is this year or a prior year
      graceYear = true
      }
      if (person.survivorBenefitDate && person.survivorBenefitDate.getFullYear() <= currentCalculationDate.getFullYear()) {//i.e., if survivorBenefitDate exists, and it is this year or a prior year
      graceYear = true
      }
    }
    return graceYear
  }

  applyEarningsTestSingle(scenario:CalculationScenario, person:Person, calcYear:CalculationYear){
    //If it's the beginning of a year, calculate earnings test withholding and determine if this is a grace year
    if (calcYear.date.getMonth() == 0){
      calcYear.annualWithholdingDuetoSinglePersonEarnings = this.calculateWithholding(calcYear.date, person)
      calcYear.personAgraceYear = this.isGraceYear(person, calcYear.date)
      if (calcYear.personAgraceYear === true) {person.hasHadGraceYear = true}
    }

    if (calcYear.annualWithholdingDuetoSinglePersonEarnings > 0){//If more withholding is necessary...
      if (calcYear.date >= person.retirementBenefitDate  //And they've started retirement benefit...
      && !(calcYear.personAgraceYear === true && calcYear.date >= person.quitWorkDate) //And it isn't a nonservice month in grace year...
      && calcYear.date < person.FRA){//And they are younger than FRA...
          //count how much is available for withholding
          let availableForWithholding:number = person.monthlyRetirementPayment
          for (let child of scenario.children){
            availableForWithholding = availableForWithholding + child.monthlyChildPayment
          }
          //Set everybody's monthlyPayment to zero to reflect benefits being withheld this month
          person.monthlyRetirementPayment = 0
          for (let child of scenario.children){
            child.monthlyChildPayment = 0
          }
          //Add to tally of months withheld
          person.retirementARFcreditingMonths = person.retirementARFcreditingMonths + 1
          //Reduce necessary withholding by amount that was withheld this month
          calcYear.annualWithholdingDuetoSinglePersonEarnings = calcYear.annualWithholdingDuetoSinglePersonEarnings - availableForWithholding
      }
    }
  }

  applyEarningsTestCouple(scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personAaliveBoolean:Boolean, personB:Person, personBaliveBoolean:Boolean){
      let availableForWithholding:number = 0

        //Check if there is *currently* a child under 16 or disabled. (We have to do this because we only want to give spousal/survivor ARFcreditingMonths for earnings test in months in which there isn't a child in care, because child-in-care months are already not being counted toward total of early entitlement months.)
        let childUnder16orDisabled:boolean = this.birthdayService.checkForChildUnder16orDisabled(scenario)

        //If it's the beginning of a year, calculate earnings test withholding and determine if this is a grace year
        if (calcYear.date.getMonth() == 0 && personAaliveBoolean === true && personBaliveBoolean === true){//Check for "alive booleans" to be true because we only want to do this once each January.
          calcYear.annualWithholdingDueToPersonAearningsBothAlive = this.calculateWithholding(calcYear.date, personA)
          calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive = calcYear.annualWithholdingDueToPersonAearningsBothAlive
          calcYear.annualWithholdingDueToPersonBearningsBothAlive = this.calculateWithholding(calcYear.date, personB)
          calcYear.annuannualWithholdingDueToPersonBearningsOnlyBalive = calcYear.annualWithholdingDueToPersonBearningsBothAlive
          //If divorced, withholding due to spouseB's earnings is zero
          if (scenario.maritalStatus == "divorced"){
            calcYear.annualWithholdingDueToPersonBearningsBothAlive = 0
          }
          calcYear.personAgraceYear = this.isGraceYear(personA, calcYear.date)
          if (calcYear.personAgraceYear === true) {personA.hasHadGraceYear = true}
          calcYear.personBgraceYear = this.isGraceYear(personB, calcYear.date)
          if (calcYear.personBgraceYear === true) {personB.hasHadGraceYear = true}
        }

        //Key point with all of the below is that A's earnings first reduce A's retirement benefit and B's spousal benefit. *Then* B's earnings reduce B's spousal benefit. See CFR 404.434
        if (personAaliveBoolean === true && personBaliveBoolean === true){
          //Counting A's excess earnings against A's retirement and B's benefit as spouse
          if (calcYear.annualWithholdingDueToPersonAearningsBothAlive > 0){//If more withholding is necessary...
            if (calcYear.date >= personA.retirementBenefitDate  //And personA has started retirement benefit...
            && !(calcYear.personAgraceYear === true && calcYear.date >= personA.quitWorkDate) //And it isn't a nonservice month in grace year for personA...
            && calcYear.date < personA.FRA){//And they are younger than FRA...
                //Go through each person to see what can be withheld on personA's record. Add that amount to availableForWithholding, set applicable monthlyPayment to zero, and add 1 to monthsWithheld tally
                  availableForWithholding = personA.monthlyRetirementPayment
                  personA.monthlyRetirementPayment = 0
                  personA.retirementARFcreditingMonths = personA.retirementARFcreditingMonths + 1
                  if (scenario.maritalStatus == "married"){//Only make spouse B's benefit as a spouse available for withholding if they're currently married (as opposed to divorced)
                    if (calcYear.date >= personB.spousalBenefitDate || (calcYear.date >= personA.retirementBenefitDate && childUnder16orDisabled === true)){ //If it's a spousalBenefit month for personB
                        availableForWithholding = availableForWithholding + personB.monthlySpousalPayment
                        personB.monthlySpousalPayment = 0
                        if (childUnder16orDisabled === false) {personB.spousalARFcreditingMonths = personB.spousalARFcreditingMonths + 1}
                    }       
                  }   
                  for (let child of scenario.children){
                      if ((child.age < 17.99 || child.isOnDisability === true) && calcYear.date >= child.childBenefitDate ){//if child is entitled to a child's benefit
                        availableForWithholding = availableForWithholding + child.monthlyChildPayment
                        child.monthlyChildPayment = 0
                        //If child is entitled on both parents' work records, their benefit will get used toward A's excess earnings until those are satisfied. Then counted toward B's. This could potentially throw off the table (with personA receiving more than personA), but it won't throw off PV calc.
                      }
                  }
                //Reduce necessary withholding by amount that was withheld this month
                calcYear.annualWithholdingDueToPersonAearningsBothAlive = calcYear.annualWithholdingDueToPersonAearningsBothAlive - availableForWithholding
            }
          }

          //Counting B's excess earnings against B's retirement and A's benefit as spouse
          if (calcYear.annualWithholdingDueToPersonBearningsBothAlive > 0){//If more withholding is necessary...
            if (calcYear.date >= personB.retirementBenefitDate  //And personB has started retirement benefit...
            && !(calcYear.personBgraceYear === true && calcYear.date >= personB.quitWorkDate) //And it isn't a nonservice month in grace year for personB...
            && calcYear.date < personB.FRA){//And they are younger than FRA...
                //Go through each person to see what can be withheld on personA's record. Add that amount to availableForWithholding, set applicable monthlyPayment to zero, and add 1 to monthsWithheld tally
                  availableForWithholding = personB.monthlyRetirementPayment
                  personB.monthlyRetirementPayment = 0
                  personB.retirementARFcreditingMonths = personB.retirementARFcreditingMonths + 1
                  if (calcYear.date >= personA.spousalBenefitDate || (calcYear.date >= personB.retirementBenefitDate && childUnder16orDisabled === true)){ //If it's a spousalBenefit month for personA
                      availableForWithholding = availableForWithholding + personA.monthlySpousalPayment
                      personA.monthlySpousalPayment = 0
                      if (childUnder16orDisabled === false) {personA.spousalARFcreditingMonths = personA.spousalARFcreditingMonths + 1}
                  }       
                  for (let child of scenario.children){
                      if ((child.age < 17.99 || child.isOnDisability === true) && calcYear.date >= child.childBenefitDate ){//if child is entitled to a child's benefit
                        availableForWithholding = availableForWithholding + child.monthlyChildPayment
                        child.monthlyChildPayment = 0
                      }
                  }
                //Reduce necessary withholding by amount that was withheld this month
                calcYear.annualWithholdingDueToPersonBearningsBothAlive = calcYear.annualWithholdingDueToPersonBearningsBothAlive - availableForWithholding
            }
          }

          //If A still has excess earnings, count those against A's benefit as a spouse. (Don't have to check for withholding against benefit as survivor, because we assume no survivor application until survivorFRA.)
            if (calcYear.annualWithholdingDueToPersonAearningsBothAlive > 0) {
                //Check if personA gets spousal benefit this month
                if ((calcYear.date >= personA.spousalBenefitDate || (calcYear.date >= personB.retirementBenefitDate && childUnder16orDisabled === true))
                  && !(calcYear.personAgraceYear === true && calcYear.date >= personA.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                  && (calcYear.date < personA.FRA) //Make sure current month is prior to FRA
                ) {
                calcYear.annualWithholdingDueToPersonAearningsBothAlive = calcYear.annualWithholdingDueToPersonAearningsBothAlive - personA.monthlySpousalPayment
                personA.monthlySpousalPayment = 0
                if (childUnder16orDisabled === false) {personA.spousalARFcreditingMonths = personA.spousalARFcreditingMonths + 1}
                }
            }
            
          //If B still has excess earnings, count those against B's benefit as a spouse. (Don't have to check for withholding against benefit as survivor, because we assume no survivor application until survivorFRA.)
            if (calcYear.annualWithholdingDueToPersonBearningsBothAlive > 0) {
              //Check if personB gets spousal benefit this month
              if ((calcYear.date >= personB.spousalBenefitDate || (calcYear.date >= personA.retirementBenefitDate && childUnder16orDisabled === true))
                && !(calcYear.personBgraceYear === true && calcYear.date >= personB.quitWorkDate) //Make sure it's not a nonservice month in a grace year
                && (calcYear.date < personB.FRA) //Make sure current month is prior to FRA
              ) {
              calcYear.annualWithholdingDueToPersonBearningsBothAlive = calcYear.annualWithholdingDueToPersonBearningsBothAlive - personB.monthlySpousalPayment
              personB.monthlySpousalPayment = 0
              if (childUnder16orDisabled === false) {personB.spousalARFcreditingMonths = personB.spousalARFcreditingMonths + 1}
              }
          }
        }
        else if (personAaliveBoolean === true && personBaliveBoolean === false){
          if (calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive > 0){//If more withholding is necessary...
            if (calcYear.date < personA.FRA //If personA is younger than FRA...
              && !(calcYear.personAgraceYear === true && calcYear.date >= personA.quitWorkDate)){//And it isn't a nonservice month in grace year...
                if (calcYear.date >= personA.retirementBenefitDate){ //And personA has started retirement benefit...
                  //withhold A's excess earnings from A's retirement benefit and any child benefits
                  availableForWithholding = personA.monthlyRetirementPayment
                  personA.monthlyRetirementPayment = 0
                  //Don't need to add to tally of months of retirement benefit withheld, because we're doing that in the "both alive" calculation, and we don't want to double count.
                  for (let child of scenario.children){
                    if ((child.age < 17.99 || child.isOnDisability === true) && calcYear.date >= child.childBenefitDate ){//if child is entitled to a child's benefit
                      availableForWithholding = availableForWithholding + child.monthlyChildPayment
                      child.monthlyChildPayment = 0
                    }
                  }
                }
                if (calcYear.date >= personA.survivorBenefitDate){//if personA has started survivor benefit
                    //withhold A's excess earnings from A's survivor benefit
                    availableForWithholding = availableForWithholding + personA.monthlySurvivorPayment
                    personA.monthlySurvivorPayment = 0
                    //Add to tally of months of survivor benefit withheld
                    if (childUnder16orDisabled === false) {personA.survivorARFcreditingMonths = personA.survivorARFcreditingMonths + 1}
                }
                if (childUnder16orDisabled === true && calcYear.date >= personA.motherFatherBenefitDate){//if personA would be receiving a mother/father benefit
                  //withhold A's excess earnings from A's mother/father benefit
                  availableForWithholding = availableForWithholding + personA.monthlyMotherFatherPayment
                  personA.monthlyMotherFatherPayment = 0
                  //No need to tally ARF months for mother/father benefit, because that benefit isn't reduced for age. So it won't get an ARF at FRA.
                }
              calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive = calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive - availableForWithholding
            }
          }
        }
        else if (personAaliveBoolean === false && personBaliveBoolean === true){
          if (calcYear.annuannualWithholdingDueToPersonBearningsOnlyBalive > 0){//If more withholding is necessary...
            if (calcYear.date < personB.FRA //If personB is younger than FRA...
              && !(calcYear.personBgraceYear === true && calcYear.date >= personB.quitWorkDate)){//And it isn't a nonservice month in grace year...
                if (calcYear.date >= personB.retirementBenefitDate){ //And personB has started retirement benefit...
                  //withhold B's excess earnings from B's retirement benefit and any child benefits
                  availableForWithholding = personB.monthlyRetirementPayment
                  personB.monthlyRetirementPayment = 0
                  //Don't need to add to tally of months of retirement benefit withheld, because we're doing that in the "both alive" calculation, and we don't want to double count.
                  for (let child of scenario.children){
                    if ((child.age < 17.99 || child.isOnDisability === true) && calcYear.date >= child.childBenefitDate ){//if child is entitled to a child's benefit
                      availableForWithholding = availableForWithholding + child.monthlyChildPayment
                      child.monthlyChildPayment = 0
                    }
                  }
                }
                if (calcYear.date >= personB.survivorBenefitDate){//if personB has started survivor benefit
                    //withhold B's excess earnings from B's survivor benefit
                    availableForWithholding = availableForWithholding + personB.monthlySurvivorPayment
                    personB.monthlySurvivorPayment = 0
                    //Add to tally of months of survivor benefit withheld
                    if (childUnder16orDisabled === false) {personB.survivorARFcreditingMonths = personB.survivorARFcreditingMonths + 1}
                }
                if (childUnder16orDisabled === true && calcYear.date >= personB.motherFatherBenefitDate){//if personB would be receiving a mother/father benefit
                  //withhold B's excess earnings from B's mother/father benefit
                  availableForWithholding = availableForWithholding + personB.monthlyMotherFatherPayment
                  personB.monthlyMotherFatherPayment = 0
                  //No need to tally ARF months for mother/father benefit, because that benefit isn't reduced for age. So it won't get an ARF at FRA.
                }
              calcYear.annuannualWithholdingDueToPersonBearningsOnlyBalive = calcYear.annuannualWithholdingDueToPersonBearningsOnlyBalive - availableForWithholding
            }
          }
        }
  }


  addBackOverwithholding(calcYear:CalculationYear, scenario:CalculationScenario, personA:Person){
    if (scenario.maritalStatus == "single"){
      if (calcYear.annualWithholdingDuetoSinglePersonEarnings < 0) {//If annualWithholding is negative due to overwithholding...
        calcYear.annualBenefitSinglePersonAlive = calcYear.annualBenefitSinglePersonAlive - calcYear.annualWithholdingDuetoSinglePersonEarnings//add back for PV-related sum
        calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit - calcYear.annualWithholdingDuetoSinglePersonEarnings//add back for table-related sum
      }
    }
    else if (scenario.maritalStatus == "married" || scenario.maritalStatus == "divorced") {
      if (calcYear.annualWithholdingDueToPersonAearningsBothAlive < 0){//If annualWithholding is negative due to overwithholding...
        calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive - calcYear.annualWithholdingDueToPersonAearningsBothAlive //add back for PV-related sum
        calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit - calcYear.annualWithholdingDueToPersonAearningsBothAlive //add back for table-related sum
      }
      if (calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive < 0){//If annualWithholding is negative due to overwithholding...
        calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive - calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive //add back for PV-related sum
      }
      if (calcYear.annualWithholdingDueToPersonBearningsBothAlive < 0){//If annualWithholding is negative due to overwithholding...
        calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive - calcYear.annualWithholdingDueToPersonBearningsBothAlive //add back for PV-related sum
        calcYear.tablePersonBannualRetirementBenefit = calcYear.tablePersonBannualRetirementBenefit - calcYear.annualWithholdingDueToPersonBearningsBothAlive //add back for table-related sum
      }
      if (calcYear.annuannualWithholdingDueToPersonBearningsOnlyBalive < 0){//If annualWithholding is negative due to overwithholding...
        calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive - calcYear.annuannualWithholdingDueToPersonBearningsOnlyBalive //add back for PV-related sum
      }
    }
    else if (scenario.maritalStatus == "survivor"){
      if (calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive < 0){//If annualWithholding is negative due to overwithholding...
        calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive - calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive //add back for PV-related sum
        //add back to appropriate table-related sum based on which benefit they have filed for
        if (calcYear.date >= personA.retirementBenefitDate){
          calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit - calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive //add back for table-related sum
        }
        else if (calcYear.date >= personA.survivorBenefitDate){
          calcYear.tablePersonAannualSurvivorBenefit = calcYear.tablePersonAannualSurvivorBenefit - calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive //add back for table-related sum
        }
        else if (calcYear.date >= personA.motherFatherBenefitDate){
          calcYear.tablePersonAannualMotherFatherBenefit = calcYear.tablePersonAannualMotherFatherBenefit - calcYear.annuannualWithholdingDueToPersonAearningsOnlyAalive //add back for table-related sum
        }
      }
    }
  }

  earningsTestThresholds = [
    {
      "Year": 2018,
      "beforeFRAthreshold": 17040,
      "FRAyearThreshold": 45360
    },
    {
      "Year": 2019,
      "beforeFRAthreshold": 17640,
      "FRAyearThreshold": 46920
    },
    {
      "Year": 2020,
      "beforeFRAthreshold": 18240,
      "FRAyearThreshold": 48600
    },
    {
      "Year": 2021,
      "beforeFRAthreshold": 18960,
      "FRAyearThreshold": 50520
    },
    {
      "Year": 2022,
      "beforeFRAthreshold": 19560,
      "FRAyearThreshold": 51960
    },
    {
      "Year": 2023,
      "beforeFRAthreshold": 21240,
      "FRAyearThreshold": 56520
    },
    {
      "Year": 2024,
      "beforeFRAthreshold": 22320,
      "FRAyearThreshold": 59520
    },
    {
      "Year": 2025,
      "beforeFRAthreshold": 23400,
      "FRAyearThreshold": 62160
    },
    {
      "Year": 2026,
      "beforeFRAthreshold": 24480,
      "FRAyearThreshold": 65160
    }
  ]
}
