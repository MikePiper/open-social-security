import { Injectable } from '@angular/core'
import { Person } from './data model classes/person'
import { CalculationScenario } from './data model classes/calculationscenario'
import { CalculationYear } from './data model classes/calculationyear'
import { ClaimStrategy } from './data model classes/claimStrategy'

@Injectable({
  providedIn: 'root'
})
export class OutputTableService {

  constructor() { }

  generateOutputTableSingle(person:Person, claimStrategy:ClaimStrategy, scenario:CalculationScenario, calcYear:CalculationYear) : ClaimStrategy {
    if (calcYear.date.getFullYear() >= person.retirementBenefitDate.getFullYear()){//no need to make a table row if this year has no benefits
        //Find whether there is a non-disabled child age 18 or under (we need to include up to year after 18, because that will be first full year with no child benefits)
          let childUnder19:boolean = false
          if (scenario.children.length > 0) {
            for (let child of scenario.children){
              if (child.age < 18.99 && child.isOnDisability === false){
                childUnder19 = true
              }
            }
          }
      //Add row to table
        //need year-by year row if...
        if (person.age <= 71 || //person is younger than 70
          (childUnder19 === true) || //or there is a child who is not disabled and they are younger than 19
          (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) || //or user has chosen an assumed benefit cut and that year has not yet arrived
          (person.eligibleForNonCoveredPension === true && person.entitledToNonCoveredPension === false) ){ //or person is eligible for noncovered pension but it hasn't yet begun
            if (scenario.children.length > 0){
              claimStrategy.outputTable.push([
                calcYear.date.getFullYear(),
                calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
                calcYear.tableTotalAnnualChildBenefitsSingleParentAlive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
                (calcYear.tablePersonAannualRetirementBenefit + calcYear.tableTotalAnnualChildBenefitsSingleParentAlive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
              ])
            }
            else {
              claimStrategy.outputTable.push([
                calcYear.date.getFullYear(),
                calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
              ])
            }
        }
        else if (claimStrategy.outputTableComplete === false) {
          if (scenario.children.length > 0){
            claimStrategy.outputTable.push([
              calcYear.date.getFullYear().toString() + " and beyond",
              calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
              calcYear.tableTotalAnnualChildBenefitsSingleParentAlive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
              (calcYear.tablePersonAannualRetirementBenefit + calcYear.tableTotalAnnualChildBenefitsSingleParentAlive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
            ])
            claimStrategy.outputTable.push([
              "After your death",
              "$0",
              calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
              calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
            ])
          }
          else {
            claimStrategy.outputTable.push([
              calcYear.date.getFullYear().toString() + " and beyond",
              calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
            ])
          }
          claimStrategy.outputTableComplete = true
        }
    }
    return claimStrategy
  }


  generateOutputTableDivorced(person:Person, claimStrategy:ClaimStrategy, scenario:CalculationScenario, calcYear:CalculationYear) : ClaimStrategy{
    //first line: no need to make a table row if this year has no benefits
    if (calcYear.date.getFullYear() >= person.retirementBenefitDate.getFullYear() || calcYear.date.getFullYear() >= person.spousalBenefitDate.getFullYear()){
        //Find whether there is a non-disabled child age 18 or under (we need to include up to year after 18, because that will be first full year with no child benefits)
        let childUnder19:boolean = false
        if (scenario.children.length > 0) {
          for (let child of scenario.children){
            if (child.age < 18.99 && child.isOnDisability === false){
              childUnder19 = true
            }
          }
        }
      //Need another year-by-year row if...
      if (person.age <= 71 || //person is not 70 for entire year
          childUnder19 === true || //there is a non-disabled children under 19
          (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) || //there's a benefit cut assumption and cutyear hasn't yet been reached
          (person.eligibleForNonCoveredPension === true && person.entitledToNonCoveredPension === false) //person is eligible for noncovered pension but it hasn't yet begun
          ){
        if (scenario.children.length > 0){
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear(),
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tableTotalAnnualChildBenefitsBothParentsAlive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tableTotalAnnualChildBenefitsBothParentsAlive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
        else {
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear(),
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
      }
      else if (claimStrategy.outputTableComplete === false) {
        if (scenario.children.length > 0){
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear().toString() + " and beyond",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tableTotalAnnualChildBenefitsBothParentsAlive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tableTotalAnnualChildBenefitsBothParentsAlive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "If you outlive your ex-spouse",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSurvivorBenefit + calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "If your ex-spouse outlives you",
            "$0",
            "$0",
            "$0",
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "After both you and your ex-spouse are deceased",
            "$0",
            "$0",
            "$0",
            calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
        else {
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear().toString() + " and beyond",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "If you outlive your ex-spouse",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
      claimStrategy.outputTableComplete = true
      }
    }
    return claimStrategy
  }

  generateOutputTableCouple(personA:Person, personB:Person, claimStrategy:ClaimStrategy, scenario:CalculationScenario, calcYear:CalculationYear) : ClaimStrategy {
    //first line: no need to make a table row if this year has no benefits
    if (calcYear.date.getFullYear() >= personA.retirementBenefitDate.getFullYear() || calcYear.date.getFullYear() >= personA.spousalBenefitDate.getFullYear() || calcYear.date.getFullYear() >= personB.retirementBenefitDate.getFullYear() || calcYear.date.getFullYear() >= personB.spousalBenefitDate.getFullYear()){
      //Find whether there is a non-disabled child age 18 or under (we need to include up to year after 18, because that will be first full year with no child benefits)
      let childUnder19:boolean = false
      if (scenario.children.length > 0) {
        for (let child of scenario.children){
          if (child.age < 18.99 && child.isOnDisability === false){
            childUnder19 = true
          }
        }
      }
      //Need another year-by-year row if...
      if (personA.age <= 71 || personB.age <= 71 || //personA or personB is not yet 70 for whole year
        childUnder19 === true || //or there is a non-disabled child who isn't yet 18 for whole year
        (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) || //or there's a benefit cut assumption and cutyear has not yet been reached
        (personA.eligibleForNonCoveredPension === true && personA.entitledToNonCoveredPension === false) || //or somebody is eligible for a noncovered pension and it hasn't yet begun
        (personB.eligibleForNonCoveredPension === true && personB.entitledToNonCoveredPension === false)
        ){
        if (scenario.children.length > 0){
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear(),
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonBannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tableTotalAnnualChildBenefitsBothParentsAlive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSpousalBenefit + calcYear.tableTotalAnnualChildBenefitsBothParentsAlive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
        else {
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear(),
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonBannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
      }
      else if (claimStrategy.outputTableComplete === false){
        if (scenario.children.length > 0){
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear().toString() + " and beyond",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonBannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tableTotalAnnualChildBenefitsBothParentsAlive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSpousalBenefit + calcYear.tableTotalAnnualChildBenefitsBothParentsAlive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "If you outlive your spouse",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            "$0",
            "$0",
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSurvivorBenefit + calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "If your spouse outlives you",
            "$0",
            "$0",
            "$0",
            calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonBannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSurvivorBenefit + calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "After both you and your spouse are deceased",
            "$0",
            "$0",
            "$0",
            "$0",
            "$0",
            "$0",
            calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
        else {//i.e., no children
          claimStrategy.outputTable.push([
            calcYear.date.getFullYear().toString() + " and beyond",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            calcYear.tablePersonBannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "If you outlive your spouse",
            calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            "$0",
            "$0",
            (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
          claimStrategy.outputTable.push([
            "If your spouse outlives you",
            "$0",
            "$0",
            "$0",
            calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            "$0",
            calcYear.tablePersonBannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            (calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
          ])
        }
       claimStrategy.outputTableComplete = true
      }
    }
    return claimStrategy
  }


  generateOutputTableSurvivor(personA:Person, claimStrategy:ClaimStrategy, scenario:CalculationScenario, calcYear:CalculationYear) : ClaimStrategy {
    //first line: no need to make a table row if this year has no benefits
    if (calcYear.date.getFullYear() >= personA.retirementBenefitDate.getFullYear() || calcYear.date.getFullYear() >= personA.survivorBenefitDate.getFullYear()){
      //Find whether there is a non-disabled child age 18 or under (we need to include up to year after 18, because that will be first full year with no child benefits)
      let childUnder19:boolean = false
      if (scenario.children.length > 0) {
        for (let child of scenario.children){
          if (child.age < 18.99 && child.isOnDisability === false){
            childUnder19 = true
          }
        }
      }
    //Need another year-by-year row if...
    if (personA.age <= 71 || //person is not 70 for entire year
        childUnder19 === true || //there is a non-disabled children under 19
        (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) || //there's a benefit cut assumption and cutyear hasn't yet been reached
        (personA.eligibleForNonCoveredPension === true && personA.entitledToNonCoveredPension === false) //person is eligible for noncovered pension but it hasn't yet begun
        ){
      if (scenario.children.length > 0){
        claimStrategy.outputTable.push([
          calcYear.date.getFullYear(),
          calcYear.tablePersonAannualRetirementBenefitOnlyAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.tablePersonAannualRetirementBenefitOnlyAalive + calcYear.tablePersonAannualSurvivorBenefit + calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      else {
        claimStrategy.outputTable.push([
          calcYear.date.getFullYear(),
          calcYear.tablePersonAannualRetirementBenefitOnlyAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.tablePersonAannualRetirementBenefitOnlyAalive + calcYear.tablePersonAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
    }
    else if (claimStrategy.outputTableComplete === false) {
      if (scenario.children.length > 0){
        claimStrategy.outputTable.push([
          calcYear.date.getFullYear().toString() + " and beyond",
          calcYear.tablePersonAannualRetirementBenefitOnlyAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.tablePersonAannualRetirementBenefitOnlyAalive + calcYear.tablePersonAannualSurvivorBenefit + calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
        claimStrategy.outputTable.push([
          "After you are deceased",
          "$0",
          "$0",
          calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      else {
        claimStrategy.outputTable.push([
          calcYear.date.getFullYear().toString() + " and beyond",
          calcYear.tablePersonAannualRetirementBenefitOnlyAalive.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.tablePersonAannualRetirementBenefitOnlyAalive + calcYear.tablePersonAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
    claimStrategy.outputTableComplete = true
    }
  }
    return claimStrategy
  }
}
