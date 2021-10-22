import { Injectable } from '@angular/core'
import { Person } from './data model classes/person'
import { CalculationScenario } from './data model classes/calculationscenario'
import { CalculationYear } from './data model classes/calculationyear'
import { ClaimStrategy } from './data model classes/claimStrategy'


//This is defined here as explicit options so that if something is ever input as a typo elsewhere it will throw an error
type typeOfRow = "year" | "yearAndBeyond" | "singleOrSurvivorPersonAdeceased" | "personAalivePersonBdeceased" | "personAdeceasedPersonBalive" | "personAandPersonBdeceased"

@Injectable({
  providedIn: 'root'
})
export class OutputTableService {

  constructor() { }

  asString(number:number):string{
    return number.toLocaleString('en-US', {style: 'currency',currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0})
  }


  checkForChildUnder19(scenario:CalculationScenario):boolean{
    let childUnder19:boolean = false
    if (scenario.children.length > 0) {
      for (let child of scenario.children){
        if (child.age < 18.99 && child.isOnDisability === false){
          childUnder19 = true
        }
      }
    }
    return childUnder19
  }

  checkIfAnotherYearByYearRowIsNeeded(childUnder19:boolean, scenario:CalculationScenario, calcYear:CalculationYear, person:Person, otherPerson?:Person):boolean{
    let anotherRowNeeded:boolean = false
    //Need another row if there is a non-disabled child age 18 or under (we need to include up to year after 18, because that will be first full year with no child benefits)
    if (childUnder19 === true) {anotherRowNeeded = true}
    //Need another row if user has chosen an assumed benefit cut and that year has not yet arrived
    if (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear) {anotherRowNeeded = true}

    //If person is under 70, we need another row
    if (person.age <= 71) {anotherRowNeeded = true}
    //If person is eligible for noncovered pension but it hasn't begun yet, we need another row
    if (person.eligibleForNonCoveredPension === true && person.entitledToNonCoveredPension === false) {anotherRowNeeded = true}
    //If person has an assumed age at death, we need another row until we have reached that age + 1.
    if (person.mortalityTable[0] == 1 && calcYear.probabilityAalive > 0) {//person is using an assumed age at death and they're still alive
        anotherRowNeeded = true
    }

    //same checks for otherPerson
    if (otherPerson !== undefined) {
      if (otherPerson.age <= 71) {anotherRowNeeded = true}
      if (otherPerson.eligibleForNonCoveredPension === true && otherPerson.entitledToNonCoveredPension === false) {anotherRowNeeded = true}
      if (otherPerson.mortalityTable[0] == 1 && calcYear.probabilityBalive > 0) {//otherPerson is using an assumed age at death and they're still alive
          anotherRowNeeded = true
      }
    }

    return anotherRowNeeded
  }

  addRowToOutputTable(claimStrategy:ClaimStrategy, scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personB?:Person):ClaimStrategy{
    let arrayForCalcYear:any[] = []
    let typeOfRow:typeOfRow
    let anotherYearByYearRowNeeded:boolean
    let childUnder19:boolean = this.checkForChildUnder19(scenario)
    if (personB) {anotherYearByYearRowNeeded = this.checkIfAnotherYearByYearRowIsNeeded(childUnder19, scenario, calcYear, personA, personB)}
    else {anotherYearByYearRowNeeded = this.checkIfAnotherYearByYearRowIsNeeded(childUnder19, scenario, calcYear, personA)}

    //No need to make a table row if this year has no benefits
    if (scenario.maritalStatus == "single"){
      if (calcYear.date.getFullYear() < personA.retirementBenefitDate.getFullYear()) {
        return claimStrategy
      }
    }
    if (scenario.maritalStatus == "married"){
      if (calcYear.date.getFullYear() < personA.retirementBenefitDate.getFullYear() && calcYear.date.getFullYear() < personA.spousalBenefitDate.getFullYear() && calcYear.date.getFullYear() < personB.retirementBenefitDate.getFullYear() && calcYear.date.getFullYear() < personB.spousalBenefitDate.getFullYear()){
        return claimStrategy
      }
    }
    if (scenario.maritalStatus == "divorced"){
      if (calcYear.date.getFullYear() < personA.retirementBenefitDate.getFullYear() && calcYear.date.getFullYear() < personA.spousalBenefitDate.getFullYear()){
        return claimStrategy
      }
    }
    if (scenario.maritalStatus == "survivor"){
      if (calcYear.date.getFullYear() < personA.retirementBenefitDate.getFullYear() && calcYear.date.getFullYear() < personA.survivorBenefitDate.getFullYear() && scenario.children.length == 0){
        return claimStrategy
      }
    }


    if (claimStrategy.outputTableComplete === false) {
      if (anotherYearByYearRowNeeded === true) {
        //Push label string
        arrayForCalcYear.push(calcYear.date.getFullYear())
        //Generate the amounts and add them to row
        typeOfRow = "year"
        this.generateAmountsForRow(arrayForCalcYear, scenario, calcYear, typeOfRow)
        //Add row to output table
        claimStrategy.outputTable.push(arrayForCalcYear)
      }

      else {//i.e., anotherYearByYearRowNeeded === false
        claimStrategy.outputTableComplete = true
        //Do "yearAndBeyond"
          //Push label string
          arrayForCalcYear.push(calcYear.date.getFullYear() + " and beyond")
          //Generate the amounts and add them to row
          typeOfRow = "yearAndBeyond"
          this.generateAmountsForRow(arrayForCalcYear, scenario, calcYear, typeOfRow)
          //Add row to output table, then reset arrayForCalcYear
          claimStrategy.outputTable.push(arrayForCalcYear)
          arrayForCalcYear = []

        //Then do the other types as needed: "singleOrSurvivorPersonAdeceased" | "personAalivePersonBdeceased" | "personAdeceasedPersonBalive" | "personAandPersonBdeceased"
        if ((scenario.maritalStatus == "single" || scenario.maritalStatus == "survivor") && scenario.children.length > 0) {
          //Do "singleOrSurvivorPersonAdeceased"
            //Push label string
            arrayForCalcYear.push("After your death")
            //Generate the amounts and add them to row
            typeOfRow = "singleOrSurvivorPersonAdeceased"
            this.generateAmountsForRow(arrayForCalcYear, scenario, calcYear, typeOfRow)
            //Add row to output table, then reset arrayForCalcYear
            claimStrategy.outputTable.push(arrayForCalcYear)
            arrayForCalcYear = []
        }
        else if (scenario.maritalStatus == "married" || scenario.maritalStatus == "divorced") {//scenario is married or divorced
          //Do "personAalivePersonBdeceased"
            //Push label string
            if (scenario.maritalStatus == "married") {arrayForCalcYear.push("If you outlive your spouse")}
            else {arrayForCalcYear.push("If you outlive your ex-spouse")}
            //Generate the amounts and add them to row
            typeOfRow = "personAalivePersonBdeceased"
            this.generateAmountsForRow(arrayForCalcYear, scenario, calcYear, typeOfRow)
            //Add row to output table, then reset arrayForCalcYear
            claimStrategy.outputTable.push(arrayForCalcYear)
            arrayForCalcYear = []
          //Do "personAdeceasedPersonBalive"
            //Push label string
            if (scenario.maritalStatus == "married") {arrayForCalcYear.push("If your spouse outlives you")}
            else {arrayForCalcYear.push("If your ex-spouse outlives you")}
            //Generate the amounts and add them to row
            typeOfRow = "personAdeceasedPersonBalive"
            this.generateAmountsForRow(arrayForCalcYear, scenario, calcYear, typeOfRow)
            //Add row to output table, then reset arrayForCalcYear
            claimStrategy.outputTable.push(arrayForCalcYear)
            arrayForCalcYear = []
          //Do "personAandPersonBdeceased"
            if (scenario.children.length > 0) {
              //Push label string
              if (scenario.maritalStatus == "married") {arrayForCalcYear.push("After both you and your spouse are deceased")}
              else {arrayForCalcYear.push("After both you and your ex-spouse are deceased")}
              //Generate the amounts and add them to row
              typeOfRow = "personAandPersonBdeceased"
              this.generateAmountsForRow(arrayForCalcYear, scenario, calcYear, typeOfRow)
              //Add row to output table, then reset arrayForCalcYear
              claimStrategy.outputTable.push(arrayForCalcYear)
              arrayForCalcYear = []
            }
        }
      }
  }
    return claimStrategy
  }

  generateAmountsForRow(arrayForCalcYear:string[], scenario:CalculationScenario, calcYear:CalculationYear, typeOfRow:typeOfRow):string[]{
    //For each benefit, find if it is included in the table. If so, find the amount to include, then add appropriate string to the array, and add the amount to the total.

      let runningTotalBenefit:number = 0

      //PersonA retirement benefit (always included)
      let personAretirement:number = this.findPersonARetirementAmountForTable(scenario, calcYear, typeOfRow)
      arrayForCalcYear.push(this.asString(personAretirement))
      runningTotalBenefit = runningTotalBenefit + personAretirement

      //PersonA mother/father benefit
      if (scenario.maritalStatus == 'survivor' && scenario.children.length > 0) {
        let personAmotherFather:number = this.findPersonAMotherFatherAmountForTable(calcYear, typeOfRow)
        arrayForCalcYear.push(this.asString(personAmotherFather))
        runningTotalBenefit = runningTotalBenefit + personAmotherFather
      }

      //PersonA spousal benefit
      if (scenario.maritalStatus == 'married' || scenario.maritalStatus == 'divorced'){
        let personAspousal:number = this.findPersonASpousalAmountForTable(calcYear, typeOfRow)
        arrayForCalcYear.push(this.asString(personAspousal))
        runningTotalBenefit = runningTotalBenefit + personAspousal
      }

      //PersonA survivor benefit
      if (scenario.maritalStatus !== 'single'){
        let personAsurvivor:number = this.findPersonASurvivorAmountForTable(calcYear, typeOfRow)
        arrayForCalcYear.push(this.asString(personAsurvivor))
        runningTotalBenefit = runningTotalBenefit + personAsurvivor
      }

      //PersonB retirement, spousal, and survivor benefits
      if (scenario.maritalStatus == 'married'){
        let personBretirement:number = this.findPersonBRetirementAmountForTable(calcYear, typeOfRow)
        arrayForCalcYear.push(this.asString(personBretirement))
        runningTotalBenefit = runningTotalBenefit + personBretirement
        let personBspousal:number = this.findPersonBSpousalAmountForTable(calcYear, typeOfRow)
        arrayForCalcYear.push(this.asString(personBspousal))
        runningTotalBenefit = runningTotalBenefit + personBspousal
        let personBsurvivor:number = this.findPersonBSurvivorAmountForTable(calcYear, typeOfRow)
        arrayForCalcYear.push(this.asString(personBsurvivor))
        runningTotalBenefit = runningTotalBenefit + personBsurvivor
      }

      //Child benefit
      if (scenario.children.length > 0) {
        let child:number = this.findChildAmountForTable(scenario, calcYear, typeOfRow)
        arrayForCalcYear.push(this.asString(child))
        runningTotalBenefit = runningTotalBenefit + child
      }

      //Add the total to the array (unless it's a single scenario with no kids)
      if (scenario.maritalStatus !== 'single' || scenario.children.length > 0) {
      arrayForCalcYear.push(this.asString(runningTotalBenefit))
      }

    return arrayForCalcYear
  }


  //Note that all of these "find some amount" functions below only get called when we *want* to include some number in the table for that type of benefit. (Sometimes the number is zero.)
  //If the column itself is not included in the table (i.e., this type of benefit will never be received), these functions will not be called.
  //Overall idea is: check marital status, check what the row assumes as far as who is alive, then for anybody who is assumed alive, check their mortality table to see if we have to override that assumption.
  findPersonARetirementAmountForTable(scenario:CalculationScenario, calcYear:CalculationYear, typeOfRow:typeOfRow){
    //return 0 any time personA is deceased
    if (typeOfRow == 'singleOrSurvivorPersonAdeceased' || typeOfRow =='personAdeceasedPersonBalive' || typeOfRow == 'personAandPersonBdeceased' || calcYear.probabilityAalive == 0){
      return 0
    }
    //If none of the above is true (i.e., personA is alive) return calcYear.tablePersonAannualRetirementBenefitOnlyAalive if it's a survivor scenario
    else if (scenario.maritalStatus == 'survivor'){
      return calcYear.tablePersonAannualRetirementBenefitOnlyAalive
    }
    //If it's none of the above cases, return calcYear.tablePersonAannualRetirementBenefit
    return calcYear.tablePersonAannualRetirementBenefit
  }

  findPersonAMotherFatherAmountForTable(calcYear:CalculationYear, typeOfRow:typeOfRow){
    //return 0 any time personA is deceased
    //Only have to check for singleOrSurvivorPersonAdeceased type of row, because Mother/Father benefits for personA only appear in maritalStatus == 'survivor' scenarios
    if (typeOfRow == 'singleOrSurvivorPersonAdeceased' || calcYear.probabilityAalive == 0){
      return 0
    }
    //If it's none of the above cases, return calcYear.tablePersonAannualMotherFatherBenefit
    return calcYear.tablePersonAannualMotherFatherBenefit
  }

  findPersonASpousalAmountForTable(calcYear:CalculationYear, typeOfRow:typeOfRow){
    //return 0 any time either personA or personB is deceased (because spousal is only possible if both are alive)
    if (calcYear.probabilityAalive == 0 || calcYear.probabilityBalive == 0 || typeOfRow =='personAdeceasedPersonBalive' || typeOfRow == 'personAalivePersonBdeceased' || typeOfRow == 'personAandPersonBdeceased'){
      return 0
    }
    //If it's none of the above cases, return calcYear.tablePersonAannualSpousalBenefit
    return calcYear.tablePersonAannualSpousalBenefit
  }

  findPersonASurvivorAmountForTable(calcYear:CalculationYear, typeOfRow:typeOfRow){
    //return 0 any time personA is deceased
    if (calcYear.probabilityAalive == 0 || typeOfRow == 'singleOrSurvivorPersonAdeceased' || typeOfRow == 'personAdeceasedPersonBalive' || typeOfRow == 'personAandPersonBdeceased'){
        return 0
    }
    //return 0 any time personB is alive
    if (calcYear.probabilityBalive > 0 && (typeOfRow == 'year' || typeOfRow == 'yearAndBeyond')){
      //Note that we don't have to check for scenario.maritalStatus == survivor, because if that's true calcYear.probabilityBalive is already set to zero.
      //Also, we don't have to check for tyypeOfRow == personAdeceasedPersonBalive, beacuse we already checked that above, in this function.
      return 0
    }
    //If it's none of the above cases, return calcYear.tablePersonAannualSurvivorBenefit
    return calcYear.tablePersonAannualSurvivorBenefit
  }
  
  findPersonBRetirementAmountForTable(calcYear:CalculationYear, typeOfRow:typeOfRow){
    //return 0 any time personB is deceased
    if (calcYear.probabilityBalive == 0 || typeOfRow == 'personAalivePersonBdeceased' || typeOfRow == 'personAandPersonBdeceased'){
        return 0
    }
    //If it's none of the above cases, return calcYear.tablePersonBannualRetirementBenefit
    return calcYear.tablePersonBannualRetirementBenefit
  }

  findPersonBSpousalAmountForTable(calcYear:CalculationYear, typeOfRow:typeOfRow){
    //return 0 any time either personA or personB is deceased (because spousal is only possible if both are alive)
    if (calcYear.probabilityAalive == 0 || calcYear.probabilityBalive == 0 || typeOfRow =='personAdeceasedPersonBalive' || typeOfRow == 'personAalivePersonBdeceased' || typeOfRow == 'personAandPersonBdeceased'){
      return 0
    }
    //If it's none of the above cases, return calcYear.tablePersonBannualSpousalBenefit
    return calcYear.tablePersonBannualSpousalBenefit
  }

  findPersonBSurvivorAmountForTable(calcYear:CalculationYear, typeOfRow:typeOfRow){
    //return 0 any time personB is deceased
    if (calcYear.probabilityBalive == 0 || typeOfRow == 'personAalivePersonBdeceased' || typeOfRow == 'personAandPersonBdeceased'){
        return 0
    }
    //return 0 any time personA is alive
    if (calcYear.probabilityAalive > 0 && (typeOfRow == 'year' || typeOfRow == 'yearAndBeyond')){
      //Note that we don't have to check for tyypeOfRow == personAalivePersonBdeceased, beacuse we already checked that above, in this function.
      return 0
    }
    //If none of the above cases apply, return calcYear.tablePersonBannualSurvivorBenefit
    return calcYear.tablePersonBannualSurvivorBenefit
  }

  findChildAmountForTable(scenario:CalculationScenario, calcYear:CalculationYear, typeOfRow:typeOfRow){
    if (scenario.maritalStatus == 'single'){
      //if personA is deceased, return calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased
      if (typeOfRow == 'singleOrSurvivorPersonAdeceased' || calcYear.probabilityAalive == 0){
        return calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased
      }
      //Otherwise return calcYear.tableTotalAnnualChildBenefitsSingleParentAlive
      else {
        return calcYear.tableTotalAnnualChildBenefitsSingleParentAlive
      }
    }
    else {//i.e., it's either a married, divorced, or survivor scenario
      //if both personA and personB are deceased, return calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased
        if ( typeOfRow == 'personAandPersonBdeceased'
          || (calcYear.probabilityAalive == 0 && typeOfRow == 'personAalivePersonBdeceased')
          || (calcYear.probabilityBalive == 0 && typeOfRow == 'personAdeceasedPersonBalive')
          || (calcYear.probabilityAalive == 0 && calcYear.probabilityBalive == 0)
        ){
          return calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased
        }
      //If personA is alive and personB is deceased, return calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive
      if (typeOfRow == 'personAalivePersonBdeceased' || calcYear.probabilityBalive == 0){
        //No need to check that calcYear.probabilityAalive > 0, because if it wasn't, we would have triggered a return statement above (both deceased). 
        return calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive
      }
      //If personA is deceased and personB is alive, return calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive
      if (typeOfRow == 'personAdeceasedPersonBalive' || calcYear.probabilityAalive == 0){
        //Again, no need to check that calcYear.probabilityBalive > 0, because if it wasn't, we would have triggered a return statement above (both deceased).
        return calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive
      }
      //If none of the above cases have applied (i.e., both are alive), return calcYear.tableTotalAnnualChildBenefitsBothParentsAlive
      return calcYear.tableTotalAnnualChildBenefitsBothParentsAlive
    }
  }


}
