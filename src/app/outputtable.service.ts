import { Injectable } from '@angular/core'
import { Person } from './data model classes/person'
import { CalculationScenario } from './data model classes/calculationscenario'
import { CalculationYear } from './data model classes/calculationyear'

@Injectable({
  providedIn: 'root'
})
export class OutputTableService {

  constructor() { }

  generateOutputTableSingleMonthly(person:Person, scenario:CalculationScenario, calcYear:CalculationYear){
    if (calcYear.date.getFullYear() >= person.retirementBenefitDate.getFullYear()){//no need to make a table row if this year has no benefits
      //Find annual benefit amounts, and whether there is a non-disabled child under age 18
      let childUnder18:boolean = false
      calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit + person.monthlyPayment
      if (scenario.children.length > 0) {
        for (let child of scenario.children){
         calcYear.tableTotalAnnualChildBenefits = calcYear.tableTotalAnnualChildBenefits + child.monthlyPayment
         if (child.age < 17.99 && child.isOnDisability === false){
           childUnder18 = true
         }
        }
      }
      //If it's december...
      if (calcYear.date.getMonth() == 11){
        //Add back any overwithholding to person's annual retirement amount total
          if (calcYear.personAoverWithholding > 0) {
            calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit + calcYear.personAoverWithholding
          }
        //Add row to table
        //need year-by year row if...
        if (person.age <= 70 || //person is younger than 70
          (childUnder18 === true) || //there is a child who is not disabled and they are younger than 18
          (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear)){ //person has chosen an assumed benefit cut and that year has not yet arrived
            if (scenario.children.length > 0){
              scenario.outputTable.push([
                calcYear.date.getFullYear(),
                calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
                calcYear.tableTotalAnnualChildBenefits.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
                (calcYear.tablePersonAannualRetirementBenefit + calcYear.tableTotalAnnualChildBenefits).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
              ])
            }
            else {
              scenario.outputTable.push([
                calcYear.date.getFullYear(),
                calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
              ])
            }
        }
        else if (scenario.outputTableComplete === false) {
          if (scenario.children.length > 0){
            scenario.outputTable.push([
              calcYear.date.getFullYear().toString() + " and beyond",
              calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
              calcYear.tableTotalAnnualChildBenefits.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
              (calcYear.tablePersonAannualRetirementBenefit + calcYear.tableTotalAnnualChildBenefits).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
            ])
          }
          else {
            scenario.outputTable.push([
              calcYear.date.getFullYear().toString() + " and beyond",
              calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
            ])
          }
          scenario.outputTableComplete = true
        }
      }
    }
    return scenario
  }

  generateOutputTableSingle(person:Person, scenario:CalculationScenario, calcYear:CalculationYear){
    //first line: no need to make a table row if this year has no benefits
    if (calcYear.date.getFullYear() >= person.retirementBenefitDate.getFullYear()){
      if (person.age <= 70 || (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) ){//Provide year-by-year amounts at least until person is 70 (or at least until assumed benefit cut date, if one is provided)
        scenario.outputTable.push([calcYear.date.getFullYear(), calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}) ])
      }
      else if (scenario.outputTableComplete === false) {
        scenario.outputTable.push([calcYear.date.getFullYear().toString() + " and beyond", calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}) ])
        scenario.outputTableComplete = true
      }
    }
    return scenario
  }

  generateOutputTableDivorced(person:Person, scenario:CalculationScenario, calcYear:CalculationYear){
    //first line: no need to make a table row if this year has no benefits
    if (calcYear.date.getFullYear() >= person.retirementBenefitDate.getFullYear() || calcYear.date.getFullYear() >= person.spousalBenefitDate.getFullYear()){
      if (person.age <= 70 || (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) ){//Provide year-by-year amounts at least until person is 70 (or at least until assumed benefit cut date, if one is provided)
        scenario.outputTable.push([
          calcYear.date.getFullYear(),
          calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      else if ( (person.age > 70 && person.age < 71) || (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() == scenario.benefitCutYear) ) {
        scenario.outputTable.push([
          calcYear.date.getFullYear().toString() + " and beyond",
          calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      if (person.age > 71 && scenario.outputTableComplete === false && (scenario.benefitCutAssumption === false || calcYear.date.getFullYear() > scenario.benefitCutYear) ){
        scenario.outputTable.push([
          "If you outlive your ex-spouse",
          calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
      ] )
      scenario.outputTableComplete = true
      }
    }
    return scenario
  }

  generateOutputTableCouple(personA:Person, personB:Person, scenario:CalculationScenario, calcYear:CalculationYear){
    //first line: no need to make a table row if this year has no benefits
    if (calcYear.date.getFullYear() >= personA.retirementBenefitDate.getFullYear() || calcYear.date.getFullYear() >= personA.spousalBenefitDate.getFullYear() || calcYear.date.getFullYear() >= personB.retirementBenefitDate.getFullYear() || calcYear.date.getFullYear() >= personB.spousalBenefitDate.getFullYear()){
      if (personA.age <= 70 || personB.age <= 70 || (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) ){//Provide year-by-year amounts at least until both people are 70 (or at least until assumed benefit cut date, if one is provided)
        scenario.outputTable.push([
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
      else if ( ((personA.age > 70 && personB.age > 70) && !(personA.age > 71 && personB.age > 71)) ||
                (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() == scenario.benefitCutYear) ){//first year in which both ages are greater than 70, or year in which assumed benefit cut takes place
        scenario.outputTable.push([
          calcYear.date.getFullYear().toString() + " and beyond",
          calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.tablePersonBannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      if (personA.age > 71 && personB.age > 71 && scenario.outputTableComplete === false &&
          (scenario.benefitCutAssumption === false || calcYear.date.getFullYear() > scenario.benefitCutYear)){
        scenario.outputTable.push([
          "If you outlive your spouse",
          calcYear.tablePersonAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.tablePersonAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          "$0",
          "$0",
          (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
        scenario.outputTable.push([
          "If your spouse outlives you",
          "$0",
          "$0",
          "$0",
          calcYear.tablePersonBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.tablePersonBannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})      ])
        scenario.outputTableComplete = true
      }
    }
    return scenario
  }


}
