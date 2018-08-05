import { Injectable } from '@angular/core'
import { Person } from './data model classes/person'
import { ClaimingScenario } from './data model classes/claimingscenario'
import { CalculationYear } from './data model classes/calculationyear'

@Injectable({
  providedIn: 'root'
})
export class OutputTableService {

  constructor() { }

  generateOutputTableSingle(person:Person, scenario:ClaimingScenario, calcYear:CalculationYear){
    if (person.age <= 70){
      scenario.outputTable.push([calcYear.date.getFullYear(), calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}) ])
    }
    else if (scenario.outputTableComplete === false) {
      scenario.outputTable.push([calcYear.date.getFullYear().toString() + " and beyond", calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}) ])
      scenario.outputTableComplete = true
    }
    return scenario
  }

  generateOutputTableDivorced(person:Person, scenario:ClaimingScenario, calcYear:CalculationYear){
    if (person.age <= 70){
      scenario.outputTable.push([
        calcYear.date.getFullYear(),
        calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        calcYear.personAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        "$0",
        (calcYear.personAannualRetirementBenefit + calcYear.personAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
      ])
    }
    else if (person.age > 70 && person.age < 71) {
      scenario.outputTable.push([
        calcYear.date.getFullYear().toString() + " and beyond",
        calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        calcYear.personAannualSpousalBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        "$0",
        (calcYear.personAannualRetirementBenefit + calcYear.personAannualSpousalBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
      ])
    }
    if (person.age > 71 && scenario.outputTableComplete === false){
      scenario.outputTable.push([
        "If you outlive your ex-spouse*",
        calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        "$0",
        calcYear.personAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        (calcYear.personAannualRetirementBenefit + calcYear.personAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
    ] )
    scenario.outputTableComplete = true
    }
    return scenario
  }

  generateOutputTableCouple(personA:Person, personB:Person, scenario:ClaimingScenario, calcYear:CalculationYear){
    

    if (personA.age <= 70 || personB.age <= 70){
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
    else if ( (personA.age > 70 && personB.age > 70) && !(personA.age > 71 && personB.age > 71) ){//first year in which both ages are greater than 70
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
    if (personA.age > 71 && personB.age > 71 && scenario.outputTableComplete === false){
      scenario.outputTable.push([
        "If you outlive your spouse*",
        calcYear.personAannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        "$0",
        calcYear.personAannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        "$0",
        "$0",
        "$0",
        (calcYear.personAannualRetirementBenefit + calcYear.personAannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
      ])
      scenario.outputTable.push([
        "If your spouse outlives you*",
        "$0",
        "$0",
        "$0",
        calcYear.personBannualRetirementBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        "$0",
        calcYear.personBannualSurvivorBenefit.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0}),
        (calcYear.personBannualRetirementBenefit + calcYear.personBannualSurvivorBenefit).toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})      ])
      scenario.outputTableComplete = true
    }

    return scenario
  }


}
