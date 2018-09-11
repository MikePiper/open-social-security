import { Injectable } from '@angular/core'
import { Person } from './data model classes/person'
import { CalculationScenario } from './data model classes/calculationscenario'
import { CalculationYear } from './data model classes/calculationyear'

@Injectable({
  providedIn: 'root'
})
export class OutputTableService {

  constructor() { }

  generateOutputTableSingle(person:Person, scenario:CalculationScenario, calcYear:CalculationYear){
    //first line: no need to make a table row if this year has no benefits
    if (calcYear.date.getFullYear() >= person.retirementBenefitDate.getFullYear()){
      if (person.age <= 70 || (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) ){//Provide year-by-year amounts at least until person is 70 (or at least until assumed benefit cut date, if one is provided)
        scenario.outputTable.push([calcYear.date.getFullYear(), calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}) ])
      }
      else if (scenario.outputTableComplete === false) {
        scenario.outputTable.push([calcYear.date.getFullYear().toString() + " and beyond", calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}) ])
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
          calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.personAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          (calcYear.personAannualRetirementBenefit + calcYear.personAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      else if ( (person.age > 70 && person.age < 71) || (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() == scenario.benefitCutYear) ) {
        scenario.outputTable.push([
          calcYear.date.getFullYear().toString() + " and beyond",
          calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.personAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          (calcYear.personAannualRetirementBenefit + calcYear.personAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      if (person.age > 71 && scenario.outputTableComplete === false && (scenario.benefitCutAssumption === false || calcYear.date.getFullYear() > scenario.benefitCutYear) ){
        scenario.outputTable.push([
          "If you outlive your ex-spouse",
          calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.personAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.personAannualRetirementBenefit + calcYear.personAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
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
          calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.personAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.personBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.personBannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          (calcYear.personAannualRetirementBenefit + calcYear.personAannualSpousalBenefit + calcYear.personBannualRetirementBenefit + calcYear.personBannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      else if ( ((personA.age > 70 && personB.age > 70) && !(personA.age > 71 && personB.age > 71)) ||
                (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() == scenario.benefitCutYear) ){//first year in which both ages are greater than 70, or year in which assumed benefit cut takes place
        scenario.outputTable.push([
          calcYear.date.getFullYear().toString() + " and beyond",
          calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.personAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.personBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          calcYear.personBannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          (calcYear.personAannualRetirementBenefit + calcYear.personAannualSpousalBenefit + calcYear.personBannualRetirementBenefit + calcYear.personBannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
      }
      if (personA.age > 71 && personB.age > 71 && scenario.outputTableComplete === false &&
          (scenario.benefitCutAssumption === false || calcYear.date.getFullYear() > scenario.benefitCutYear)){
        scenario.outputTable.push([
          "If you outlive your spouse",
          calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.personAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          "$0",
          "$0",
          (calcYear.personAannualRetirementBenefit + calcYear.personAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
        ])
        scenario.outputTable.push([
          "If your spouse outlives you",
          "$0",
          "$0",
          "$0",
          calcYear.personBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          "$0",
          calcYear.personBannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
          (calcYear.personBannualRetirementBenefit + calcYear.personBannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})      ])
        scenario.outputTableComplete = true
      }
    }
    return scenario
  }


}
