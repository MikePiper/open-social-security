import {Injectable} from '@angular/core'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './data model classes/solutionset'
import {ClaimingSolution} from './data model classes/claimingsolution'
import {Person} from './data model classes/person'
import {ClaimingScenario} from './data model classes/claimingscenario'


@Injectable({
  providedIn: 'root'
})
export class SolutionSetService {

  constructor(private benefitService: BenefitService) { }

  generateSingleSolutionSet(scenario:ClaimingScenario, SSbirthDate:Date, person:Person, savedPV:number, savedClaimingDate:Date){
        //Find age and monthly benefit amount at savedClaimingDate, for sake of output statement.
        let savedClaimingAge: number = savedClaimingDate.getFullYear() - SSbirthDate.getFullYear() + (savedClaimingDate.getMonth() - SSbirthDate.getMonth())/12
        let savedClaimingAgeYears: number = Math.floor(savedClaimingAge)
        let savedClaimingAgeMonths: number = Math.round((savedClaimingAge%1)*12)
        let savedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(person, savedClaimingDate)

        //Create "solutionSet" object and claimingSolution object to populate it
        let solutionSet:SolutionSet = {
          "solutionPV":savedPV,
          "solutionsArray": []
        }
        let retirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", person, savedClaimingDate, savedRetirementBenefit, savedClaimingAgeYears, savedClaimingAgeMonths)
        solutionSet.solutionsArray.push(retirementSolution)
        return solutionSet
  }

  //For two-person scenarios, other than a) divorce or b) one person being over 70
  generateCoupleSolutionSet(scenario:ClaimingScenario, personA:Person, personB:Person, savedPV: number){
    let solutionSet: SolutionSet = {
      "solutionPV":savedPV,
      solutionsArray: []
    }

        //personA retirement stuff
          if (personA.isDisabled === true || scenario.personAhasFiled === true){//retirement benefit solution is a suspension solution
              personA.DRCsViaSuspension = personA.endSuspensionDate.getMonth() - personA.beginSuspensionDate.getMonth() + (12 * (personA.endSuspensionDate.getFullYear() - personA.beginSuspensionDate.getFullYear()))
              var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.fixedRetirementBenefitDate)
              var personAsavedEndSuspensionAge: number = personA.endSuspensionDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personA.endSuspensionDate.getMonth() - personA.SSbirthDate.getMonth())/12
              var personAsavedEndSuspensionAgeYears: number = Math.floor(personAsavedEndSuspensionAge)
              var personAsavedEndSuspensionAgeMonths: number = Math.round((personAsavedEndSuspensionAge%1)*12)
              //Create begin/end suspension solution objects
              if (personA.beginSuspensionDate.getTime() == personA.FRA.getTime()){
                var personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personA, personA.beginSuspensionDate, personAsavedRetirementBenefit, 0, 0)
                var personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personA.endSuspensionDate, personAsavedRetirementBenefit, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
              else {
                var personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personA, personA.beginSuspensionDate, personAsavedRetirementBenefit, 0, 0)
                var personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personA.endSuspensionDate, personAsavedRetirementBenefit, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
          }
          else {//normal retirement benefit solution
              var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
              var personAsavedRetirementAge: number = personA.retirementBenefitDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personA.retirementBenefitDate.getMonth() - personA.SSbirthDate.getMonth())/12
              var personAsavedRetirementAgeYears: number = Math.floor(personAsavedRetirementAge)
              var personAsavedRetirementAgeMonths: number = Math.round((personAsavedRetirementAge%1)*12)
              //Create retirement solution object
              if (personA.retirementBenefitDate > personA.spousalBenefitDate) {
                var personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", personA, personA.retirementBenefitDate, personAsavedRetirementBenefit, personAsavedRetirementAgeYears, personAsavedRetirementAgeMonths)
              }
              else {
                var personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", personA, personA.retirementBenefitDate, personAsavedRetirementBenefit, personAsavedRetirementAgeYears, personAsavedRetirementAgeMonths)
              }
          }

        //personB retirement stuff
          if (personB.isDisabled === true || scenario.personBhasFiled === true){//retirement benefit solution is a suspension solution
              personB.DRCsViaSuspension = personB.endSuspensionDate.getMonth() - personB.beginSuspensionDate.getMonth() + (12 * (personB.endSuspensionDate.getFullYear() - personB.beginSuspensionDate.getFullYear()))
              var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.fixedRetirementBenefitDate)
              var personBsavedEndSuspensionAge: number = personB.endSuspensionDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personB.endSuspensionDate.getMonth() - personB.SSbirthDate.getMonth())/12
              var personBsavedEndSuspensionAgeYears: number = Math.floor(personBsavedEndSuspensionAge)
              var personBsavedEndSuspensionAgeMonths: number = Math.round((personBsavedEndSuspensionAge%1)*12)
              //create begin/end suspension solution objects      
              if (personB.beginSuspensionDate.getTime() == personB.FRA.getTime()){
                var personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personB, personB.beginSuspensionDate, personBsavedRetirementBenefit, 0, 0)
                var personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personB.endSuspensionDate, personBsavedRetirementBenefit, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }
              else {
                var personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personB, personB.beginSuspensionDate, personBsavedRetirementBenefit, 0, 0)
                var personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personB.endSuspensionDate, personBsavedRetirementBenefit, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }      
          }
          else {//normal retirement benefit solution
              var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
              var personBsavedRetirementAge: number = personB.retirementBenefitDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personB.retirementBenefitDate.getMonth() - personB.SSbirthDate.getMonth())/12
              var personBsavedRetirementAgeYears: number = Math.floor(personBsavedRetirementAge)
              var personBsavedRetirementAgeMonths: number = Math.round((personBsavedRetirementAge%1)*12)
              //create retirement solution object
              if (personB.retirementBenefitDate > personB.spousalBenefitDate) {
                var personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", personB, personB.retirementBenefitDate, personBsavedRetirementBenefit, personBsavedRetirementAgeYears, personBsavedRetirementAgeMonths)
              }
              else {
                var personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", personB, personB.retirementBenefitDate, personBsavedRetirementBenefit, personBsavedRetirementAgeYears, personBsavedRetirementAgeMonths)
              }
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
          if (personA.spousalBenefitDate < personA.retirementBenefitDate) {
            var personAspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", personA, personA.spousalBenefitDate, personAsavedSpousalBenefit, personAsavedSpousalAgeYears, personAsavedSpousalAgeMonths)
          } else {
            var personAspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", personA, personA.spousalBenefitDate, personAsavedSpousalBenefit, personAsavedSpousalAgeYears, personAsavedSpousalAgeMonths)
          }

        //personB spousal stuff
          let personBsavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(personB, personA, personBsavedRetirementBenefit, personB.spousalBenefitDate)
          if (personBsavedSpousalBenefit == 0 && personB.spousalBenefitDate < personB.retirementBenefitDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
            personBsavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(personB, personA, 0, personB.spousalBenefitDate)
          }
          let personBsavedSpousalAge: number = personB.spousalBenefitDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personB.spousalBenefitDate.getMonth() - personB.SSbirthDate.getMonth())/12
          let personBsavedSpousalAgeYears: number = Math.floor(personBsavedSpousalAge)
          let personBsavedSpousalAgeMonths: number = Math.round((personBsavedSpousalAge%1)*12)
          //personB spousal solution object
          if (personB.spousalBenefitDate < personB.retirementBenefitDate) {
            var personBspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", personB, personB.spousalBenefitDate, personBsavedSpousalBenefit, personBsavedSpousalAgeYears, personBsavedSpousalAgeMonths)
          } else {
            var personBspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", personB, personB.spousalBenefitDate, personBsavedSpousalBenefit, personBsavedSpousalAgeYears, personBsavedSpousalAgeMonths)
          }


        //Push claimingSolution objects to solutionSet.solutionsArray (But don't push them if the benefit amount is zero.)

            //personA retirement/suspension
            if (personA.initialAge <= 70){//we don't want to push retirement/suspension solutions if the person is over 70 when filling out calculator
              if (personAbeginSuspensionSolution) {//If suspension solution, only push if begin/end suspension dates are different
                if (personA.beginSuspensionDate.getTime() != personA.endSuspensionDate.getTime()){
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
                if (personB.beginSuspensionDate.getTime() != personB.endSuspensionDate.getTime()){
                  solutionSet.solutionsArray.push(personBbeginSuspensionSolution)
                  solutionSet.solutionsArray.push(personBendSuspensionSolution)
                }
              }
              else if (personBsavedRetirementBenefit > 0) {//There's only a retirement solution if there isn't a suspension solution. And we only save it if benefit is > 0.
                solutionSet.solutionsArray.push(personBretirementSolution)
              }
            }

            //personA spousal solution. We don't want a spousal solution if (A is older than 70 or A has filed) AND (B is over 70, B has filed, or B is on disability)
            if (  (personA.initialAge >= 70 || scenario.personAhasFiled === true) && (personB.initialAge >= 70 || scenario.personBhasFiled === true || personB.isDisabled === true)  ) {
              //no spousal solution for personA
            } else{
              if (personAsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(personAspousalSolution)}
            }

            //personB spousal solution. We don't want a spousal solution if (B is older than 70 or B has filed) AND (A is over 70, A has filed, or A is on disability). Also, not if divorce scenario
            if (scenario.maritalStatus == "married"){
              if ( (personB.initialAge >= 70 || scenario.personBhasFiled === true) && (personA.initialAge >= 70 || scenario.personAhasFiled === true || personA.isDisabled === true)  ) {
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
          return a.date.getTime() - b.date.getTime()
        })
        return solutionSet
  }

}
