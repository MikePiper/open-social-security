import {Injectable} from '@angular/core'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './data model classes/solutionset'
import {ClaimingSolution} from './data model classes/claimingsolution'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"


@Injectable({
  providedIn: 'root'
})
export class SolutionSetService {

  constructor(private benefitService: BenefitService) { }

  today: MonthYearDate = new MonthYearDate()

  generateSingleSolutionSet(scenario:CalculationScenario, person:Person, savedPV:number){
    let solutionSet:SolutionSet = {
      "solutionPV":savedPV,
      "solutionsArray": []
    }
    if (person.isOnDisability === true) {
      //create disability-converts-to-retirement solution object
      var disabilityConversionDate = new MonthYearDate(person.FRA)
      var disabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", person, disabilityConversionDate, 0, 0)//ageYears/ageMonths can be zero because not used in output
      solutionSet.solutionsArray.push(disabilityConversionSolution)
    }
    if (person.isOnDisability === true || person.hasFiled === true){//there may be a suspension solution
      person.DRCsViaSuspension = person.endSuspensionDate.getMonth() - person.beginSuspensionDate.getMonth() + (12 * (person.endSuspensionDate.getFullYear() - person.beginSuspensionDate.getFullYear()))
      var savedEndSuspensionAge: number = person.endSuspensionDate.getFullYear() - person.SSbirthDate.getFullYear() + (person.endSuspensionDate.getMonth() - person.SSbirthDate.getMonth())/12
      var savedEndSuspensionAgeYears: number = Math.floor(savedEndSuspensionAge)
      var savedEndSuspensionAgeMonths: number = Math.round((savedEndSuspensionAge%1)*12)
      //Create begin/end suspension solution objects
      if (person.beginSuspensionDate.valueOf() == person.FRA.valueOf()){
        var beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", person, person.beginSuspensionDate, 0, 0)
        var endSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", person, person.endSuspensionDate, savedEndSuspensionAgeYears, savedEndSuspensionAgeMonths)
      }
      else {
        var beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", person, person.beginSuspensionDate, 0, 0)
        var endSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", person, person.endSuspensionDate, savedEndSuspensionAgeYears, savedEndSuspensionAgeMonths)
      }
      if (person.beginSuspensionDate.valueOf() != person.endSuspensionDate.valueOf()){//If suspension solution, only push if begin/end suspension dates are different
        solutionSet.solutionsArray.push(beginSuspensionSolution)
        solutionSet.solutionsArray.push(endSuspensionSolution)
      }
    }
    else {//normal retirement solution
        let savedClaimingAge: number = person.retirementBenefitDate.getFullYear() - person.SSbirthDate.getFullYear() + (person.retirementBenefitDate.getMonth() - person.SSbirthDate.getMonth())/12
        let savedClaimingAgeYears: number = Math.floor(savedClaimingAge)
        let savedClaimingAgeMonths: number = Math.round((savedClaimingAge%1)*12)
        if (person.retirementBenefitDate < this.today){
          var retirementSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveRetirement", person, person.retirementBenefitDate, savedClaimingAgeYears, savedClaimingAgeMonths)
        }
        else {
          var retirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirement", person, person.retirementBenefitDate, savedClaimingAgeYears, savedClaimingAgeMonths)
        }
        solutionSet.solutionsArray.push(retirementSolution)
    }
    //Child Benefit Solution
    if (scenario.children.length > 0){
      //Determine childBenefitDate -> later of person.retirementBenefitDate or today (But can be earlier than today in retroactive filing...)
      var childBenefitDate: MonthYearDate = new MonthYearDate(person.retirementBenefitDate)
      if (childBenefitDate < this.today) {
        childBenefitDate = new MonthYearDate(this.today)
      }
      //Determine if there is at least one child who a) is disabled or under 18 as of childBenefitDate and b) has not yet filed for child benefits
      var childBenefitBoolean:boolean = false
      for (let child of scenario.children){
        child.age = ( 12 * (childBenefitDate.getFullYear() - child.SSbirthDate.getFullYear()) + (childBenefitDate.getMonth()) - child.SSbirthDate.getMonth()  )/12
        if ( (child.age < 17.99 || child.isOnDisability === true) && child.hasFiled === false ){
          childBenefitBoolean = true
        }
      }
      //create child benefit solution object, if necessary
      if (childBenefitBoolean === true){
        var childBenefitSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "child", person, childBenefitDate, 0, 0)
        solutionSet.solutionsArray.push(childBenefitSolution)
      }
    }
    //Sort array by date
    solutionSet.solutionsArray.sort(function(a,b){
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return a.date.valueOf() - b.date.valueOf()
    })
    if (solutionSet.solutionsArray.length == 0){
      var doNothingSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "doNothing", person, this.today, 0, 0)
      solutionSet.solutionsArray.push(doNothingSolution)
    }
    return solutionSet
  }

  //For two-person scenarios, other than a) divorce or b) one person being over 70
  generateCoupleSolutionSet(scenario:CalculationScenario, personA:Person, personB:Person, savedPV: number){
    let solutionSet: SolutionSet = {
      "solutionPV":savedPV,
      solutionsArray: []
    }

        //personA retirement stuff
          if (personA.isOnDisability === true || personA.hasFiled === true){//retirement benefit solution is a suspension solution
              personA.DRCsViaSuspension = personA.endSuspensionDate.getMonth() - personA.beginSuspensionDate.getMonth() + (12 * (personA.endSuspensionDate.getFullYear() - personA.beginSuspensionDate.getFullYear()))
              var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.fixedRetirementBenefitDate)
              var personAsavedEndSuspensionAge: number = personA.endSuspensionDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personA.endSuspensionDate.getMonth() - personA.SSbirthDate.getMonth())/12
              var personAsavedEndSuspensionAgeYears: number = Math.floor(personAsavedEndSuspensionAge)
              var personAsavedEndSuspensionAgeMonths: number = Math.round((personAsavedEndSuspensionAge%1)*12)
              //Create begin/end suspension solution objects
              if (personA.beginSuspensionDate.valueOf() == personA.FRA.valueOf()){
                var personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personA, personA.beginSuspensionDate, 0, 0)
                var personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personA.endSuspensionDate, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
              else {
                var personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personA, personA.beginSuspensionDate, 0, 0)
                var personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personA.endSuspensionDate, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
          }
          else {//normal retirement benefit solution
              var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
              var personAsavedRetirementAge: number = personA.retirementBenefitDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personA.retirementBenefitDate.getMonth() - personA.SSbirthDate.getMonth())/12
              var personAsavedRetirementAgeYears: number = Math.floor(personAsavedRetirementAge)
              var personAsavedRetirementAgeMonths: number = Math.round((personAsavedRetirementAge%1)*12)
              //Create retirement solution object
                var personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirement", personA, personA.retirementBenefitDate, personAsavedRetirementAgeYears, personAsavedRetirementAgeMonths)
          }

        //personB retirement stuff
          if (personB.isOnDisability === true || personB.hasFiled === true){//retirement benefit solution is a suspension solution
              personB.DRCsViaSuspension = personB.endSuspensionDate.getMonth() - personB.beginSuspensionDate.getMonth() + (12 * (personB.endSuspensionDate.getFullYear() - personB.beginSuspensionDate.getFullYear()))
              var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.fixedRetirementBenefitDate)
              var personBsavedEndSuspensionAge: number = personB.endSuspensionDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personB.endSuspensionDate.getMonth() - personB.SSbirthDate.getMonth())/12
              var personBsavedEndSuspensionAgeYears: number = Math.floor(personBsavedEndSuspensionAge)
              var personBsavedEndSuspensionAgeMonths: number = Math.round((personBsavedEndSuspensionAge%1)*12)
              //create begin/end suspension solution objects      
              if (personB.beginSuspensionDate.valueOf() == personB.FRA.valueOf()){
                var personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personB, personB.beginSuspensionDate, 0, 0)
                var personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personB.endSuspensionDate, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }
              else {
                var personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personB, personB.beginSuspensionDate, 0, 0)
                var personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personB.endSuspensionDate, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }      
          }
          else {//normal retirement benefit solution
              var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
              var personBsavedRetirementAge: number = personB.retirementBenefitDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personB.retirementBenefitDate.getMonth() - personB.SSbirthDate.getMonth())/12
              var personBsavedRetirementAgeYears: number = Math.floor(personBsavedRetirementAge)
              var personBsavedRetirementAgeMonths: number = Math.round((personBsavedRetirementAge%1)*12)
              //create retirement solution object
                var personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirement", personB, personB.retirementBenefitDate, personBsavedRetirementAgeYears, personBsavedRetirementAgeMonths)
          }

        //personA spousal stuff
          let personAsavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(personA, personB, personAsavedRetirementBenefit, personA.spousalBenefitDate)
            if (personAsavedSpousalBenefit == 0 && personA.spousalBenefitDate < personA.retirementBenefitDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
              personAsavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(personA, personB, 0, personA.spousalBenefitDate)
            }
          let personAsavedSpousalAge: number = personA.spousalBenefitDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personA.spousalBenefitDate.getMonth() - personA.SSbirthDate.getMonth())/12
          let personAsavedSpousalAgeYears: number = Math.floor(personAsavedSpousalAge)
          let personAsavedSpousalAgeMonths: number = Math.round((personAsavedSpousalAge%1)*12)
          //create spousal solution object
            var personAspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousal", personA, personA.spousalBenefitDate, personAsavedSpousalAgeYears, personAsavedSpousalAgeMonths)

        //personB spousal stuff
          let personBsavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(personB, personA, personBsavedRetirementBenefit, personB.spousalBenefitDate)
          if (personBsavedSpousalBenefit == 0 && personB.spousalBenefitDate < personB.retirementBenefitDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
            personBsavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(personB, personA, 0, personB.spousalBenefitDate)
          }
          let personBsavedSpousalAge: number = personB.spousalBenefitDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personB.spousalBenefitDate.getMonth() - personB.SSbirthDate.getMonth())/12
          let personBsavedSpousalAgeYears: number = Math.floor(personBsavedSpousalAge)
          let personBsavedSpousalAgeMonths: number = Math.round((personBsavedSpousalAge%1)*12)
          //personB spousal solution object
            var personBspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousal", personB, personB.spousalBenefitDate, personBsavedSpousalAgeYears, personBsavedSpousalAgeMonths)

        //personA disability stuff
          if (personA.isOnDisability === true) {
            //create disability-converts-to-retirement solution object
            var personAdisabilityConversionDate = new MonthYearDate(personA.FRA)
            var personAdisabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", personA, personAdisabilityConversionDate, 0, 0)//ageYears/ageMonths can be zero because not used in output
            solutionSet.solutionsArray.push(personAdisabilityConversionSolution)
          }

        //personB disability stuff
          if (personB.isOnDisability === true) {
            //create disability-converts-to-retirement solution object
            var personBdisabilityConversionDate = new MonthYearDate(personB.FRA)
            var personBdisabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", personB, personBdisabilityConversionDate, 0, 0)//ageYears/ageMonths can be zero because not used in output
            solutionSet.solutionsArray.push(personBdisabilityConversionSolution)
          }

        //Push claimingSolution objects to solutionSet.solutionsArray (But don't push them if the benefit amount is zero.)

            //personA retirement/suspension
            if (personA.initialAge <= 70){//we don't want to push retirement/suspension solutions if the person is over 70 when filling out calculator
              if (personAbeginSuspensionSolution) {//If suspension solution, only push if begin/end suspension dates are different
                if (personA.beginSuspensionDate.valueOf() != personA.endSuspensionDate.valueOf()){
                  solutionSet.solutionsArray.push(personAbeginSuspensionSolution)
                  solutionSet.solutionsArray.push(personAendSuspensionSolution)
                }
              }
              else if (personAsavedRetirementBenefit > 0) {//There's only a retirement solution if there isn't a suspension solution. And we only save it if benefit is > 0.
                solutionSet.solutionsArray.push(personAretirementSolution)
              }
            }

            //personB retirement/suspension
            if (personB.initialAge <= 70 && scenario.maritalStatus == "married") {//We don't want to push retirement/suspension solutions if personB is over 70 or if it's a divorce scenario
              if (personBbeginSuspensionSolution) {//If suspension solution, only push if begin/end suspension dates are different
                if (personB.beginSuspensionDate.valueOf() != personB.endSuspensionDate.valueOf()){
                  solutionSet.solutionsArray.push(personBbeginSuspensionSolution)
                  solutionSet.solutionsArray.push(personBendSuspensionSolution)
                }
              }
              else if (personBsavedRetirementBenefit > 0) {//There's only a retirement solution if there isn't a suspension solution. And we only save it if benefit is > 0.
                solutionSet.solutionsArray.push(personBretirementSolution)
              }
            }

            //personA spousal solution. We don't want a spousal solution if (A is older than 70 or A has filed) AND (B is over 70, B has filed, or B is on disability)
            if (  (personA.initialAge >= 70 || personA.hasFiled === true) && (personB.initialAge >= 70 || personB.hasFiled === true || personB.isOnDisability === true)  ) {
              //no spousal solution for personA
            } else{
              if (personAsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(personAspousalSolution)}
            }

            //personB spousal solution. We don't want a spousal solution if (B is older than 70 or B has filed) AND (A is over 70, A has filed, or A is on disability). Also, not if divorce scenario
            if (scenario.maritalStatus == "married"){
              if ( (personB.initialAge >= 70 || personB.hasFiled === true) && (personA.initialAge >= 70 || personA.hasFiled === true || personA.isOnDisability === true)  ) {
                //no spousal solution for personB
              }
              else {
                if (personBsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(personBspousalSolution)}
              }
            }
    

        //Sort array by date
        solutionSet.solutionsArray.sort(function(a,b){
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return a.date.valueOf() - b.date.valueOf()
        })
        if (solutionSet.solutionsArray.length == 0){
          var doNothingSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "doNothing", personA, this.today, 0, 0)
          solutionSet.solutionsArray.push(doNothingSolution)
        }
        return solutionSet
  }

}
