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
  generateCoupleSolutionSet(scenario:ClaimingScenario, personA:Person, personB:Person,
    personAsavedRetirementDate: Date, personBsavedRetirementDate: Date, personAsavedSpousalDate: Date, personBsavedSpousalDate: Date,
    personAsavedBeginSuspensionDate:Date, personAsavedEndSuspensionDate:Date, personBsavedBeginSuspensionDate:Date, personBsavedEndSuspensionDate:Date, savedPV: number){
        //Find monthly benefit amounts and ages at saved claiming dates, for sake of output statement.
        //personA retirement stuff
          if (personA.isDisabled === true || scenario.personAhasFiled === true){
            //retirement benefit solution is a suspension solution
            personA.DRCsViaSuspension = personAsavedEndSuspensionDate.getMonth() - personAsavedBeginSuspensionDate.getMonth() + (12 * (personAsavedEndSuspensionDate.getFullYear() - personAsavedBeginSuspensionDate.getFullYear()))
            var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.fixedRetirementBenefitDate)
            var personAsavedEndSuspensionAge: number = personAsavedEndSuspensionDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personAsavedEndSuspensionDate.getMonth() - personA.SSbirthDate.getMonth())/12
            var personAsavedEndSuspensionAgeYears: number = Math.floor(personAsavedEndSuspensionAge)
            var personAsavedEndSuspensionAgeMonths: number = Math.round((personAsavedEndSuspensionAge%1)*12)
          }
          else {
            //normal retirement benefit solution
            var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personAsavedRetirementDate)
            var personAsavedRetirementAge: number = personAsavedRetirementDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personAsavedRetirementDate.getMonth() - personA.SSbirthDate.getMonth())/12
            var personAsavedRetirementAgeYears: number = Math.floor(personAsavedRetirementAge)
            var personAsavedRetirementAgeMonths: number = Math.round((personAsavedRetirementAge%1)*12)
          }
        //personB retirement stuff
          if (personB.isDisabled === true || scenario.personBhasFiled === true){
            //retirement benefit solution is a suspension solution
            personB.DRCsViaSuspension = personBsavedEndSuspensionDate.getMonth() - personBsavedBeginSuspensionDate.getMonth() + (12 * (personBsavedEndSuspensionDate.getFullYear() - personBsavedBeginSuspensionDate.getFullYear()))
            var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.fixedRetirementBenefitDate)
            var personBsavedEndSuspensionAge: number = personBsavedEndSuspensionDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personBsavedEndSuspensionDate.getMonth() - personB.SSbirthDate.getMonth())/12
            var personBsavedEndSuspensionAgeYears: number = Math.floor(personBsavedEndSuspensionAge)
            var personBsavedEndSuspensionAgeMonths: number = Math.round((personBsavedEndSuspensionAge%1)*12)
          }
          else {
            //normal retirement benefit solution
            var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personBsavedRetirementDate)
            var personBsavedRetirementAge: number = personBsavedRetirementDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personBsavedRetirementDate.getMonth() - personB.SSbirthDate.getMonth())/12
            var personBsavedRetirementAgeYears: number = Math.floor(personBsavedRetirementAge)
            var personBsavedRetirementAgeMonths: number = Math.round((personBsavedRetirementAge%1)*12)
          }
        //personA spousal stuff
        let personAsavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(personA, personB, personAsavedRetirementBenefit, personAsavedSpousalDate)
          if (personAsavedSpousalBenefit == 0 && personAsavedSpousalDate < personAsavedRetirementDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
            personAsavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(personA, personB, 0, personAsavedSpousalDate)
          }
        let personAsavedSpousalAge: number = personAsavedSpousalDate.getFullYear() - personA.SSbirthDate.getFullYear() + (personAsavedSpousalDate.getMonth() - personA.SSbirthDate.getMonth())/12
        let personAsavedSpousalAgeYears: number = Math.floor(personAsavedSpousalAge)
        let personAsavedSpousalAgeMonths: number = Math.round((personAsavedSpousalAge%1)*12)
        //personB spousal stuff
        let personBsavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(personB, personA, personBsavedRetirementBenefit, personBsavedSpousalDate)
        if (personBsavedSpousalBenefit == 0 && personBsavedSpousalDate < personBsavedRetirementDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
          personBsavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(personB, personA, 0, personBsavedSpousalDate)
        }
        let personBsavedSpousalAge: number = personBsavedSpousalDate.getFullYear() - personB.SSbirthDate.getFullYear() + (personBsavedSpousalDate.getMonth() - personB.SSbirthDate.getMonth())/12
        let personBsavedSpousalAgeYears: number = Math.floor(personBsavedSpousalAge)
        let personBsavedSpousalAgeMonths: number = Math.round((personBsavedSpousalAge%1)*12)
        //personA survivor stuff
        if (personAsavedRetirementBenefit >= personBsavedRetirementBenefit) {
          var personAsavedSurvivorBenefitOutput: number = 0
        } else {
          var personAsavedSurvivorBenefitOutput: number =
          personAsavedRetirementBenefit + this.benefitService.calculateSurvivorBenefit(personA, personAsavedRetirementBenefit, personA.survivorFRA, personB, personBsavedRetirementDate, personBsavedRetirementDate)
        }
        //personB survivor stuff
        if (personBsavedRetirementBenefit >= personAsavedRetirementBenefit) {
          var personBsavedSurvivorBenefitOutput: number = 0
        } else {
          var personBsavedSurvivorBenefitOutput: number =
          personBsavedRetirementBenefit + this.benefitService.calculateSurvivorBenefit(personB, personBsavedRetirementBenefit, personB.survivorFRA, personA, personAsavedRetirementDate, personAsavedRetirementDate)
        }

        let solutionSet: SolutionSet = {
          "solutionPV":savedPV,
          solutionsArray: []
        }
        //Create claimingSolution objects
          //personA retirement solution object
            if (personA.isDisabled === true || scenario.personAhasFiled === true){//create suspension-related object
              if (personAsavedBeginSuspensionDate.getTime() == personA.FRA.getTime()){
                var personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personA, personAsavedBeginSuspensionDate, personAsavedRetirementBenefit, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths, personAsavedEndSuspensionDate)
              }
              else {
                var personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personA, personAsavedBeginSuspensionDate, personAsavedRetirementBenefit, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths, personAsavedEndSuspensionDate)
              }
            }
            else {//create normal retirement solution object
              if (personAsavedRetirementDate > personAsavedSpousalDate) {
                var personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", personA, personAsavedRetirementDate, personAsavedRetirementBenefit, personAsavedRetirementAgeYears, personAsavedRetirementAgeMonths)
              } else {
                var personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", personA, personAsavedRetirementDate, personAsavedRetirementBenefit, personAsavedRetirementAgeYears, personAsavedRetirementAgeMonths)
              }
            }
          //personB retirement solution object
            if (personB.isDisabled === true || scenario.personBhasFiled === true){
              if (personBsavedBeginSuspensionDate.getTime() == personB.FRA.getTime()){
                var personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personB, personBsavedBeginSuspensionDate, personBsavedRetirementBenefit, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths, personBsavedEndSuspensionDate)
              }
              else {
                var personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personB, personBsavedBeginSuspensionDate, personBsavedRetirementBenefit, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths, personBsavedEndSuspensionDate)
              }
            }
            else{//create normal retirement solution object
              if (personBsavedRetirementDate > personBsavedSpousalDate) {
                var personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", personB, personBsavedRetirementDate, personBsavedRetirementBenefit, personBsavedRetirementAgeYears, personBsavedRetirementAgeMonths)
              } else {
                var personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", personB, personBsavedRetirementDate, personBsavedRetirementBenefit, personBsavedRetirementAgeYears, personBsavedRetirementAgeMonths)
              }
            }
          //personA spousal solution object
            if (personAsavedSpousalDate < personAsavedRetirementDate) {
              var personAspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", personA, personAsavedSpousalDate, personAsavedSpousalBenefit, personAsavedSpousalAgeYears, personAsavedSpousalAgeMonths)
            } else {
              var personAspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", personA, personAsavedSpousalDate, personAsavedSpousalBenefit, personAsavedSpousalAgeYears, personAsavedSpousalAgeMonths)
            }
          //personB spousal solution object
            if (personBsavedSpousalDate < personBsavedRetirementDate) {
              var personBspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", personB, personBsavedSpousalDate, personBsavedSpousalBenefit, personBsavedSpousalAgeYears, personBsavedSpousalAgeMonths)
            } else {
              var personBspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", personB, personBsavedSpousalDate, personBsavedSpousalBenefit, personBsavedSpousalAgeYears, personBsavedSpousalAgeMonths)
            }
          //personA and personB survivor solution objects
            var personAsurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", personA, new Date(9999,0,1), personAsavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
            var personBsurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", personA, new Date(9999,0,1), personBsavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output


        //Push claimingSolution objects to solutionSet.solutionsArray (But don't push them if the benefit amount is zero.)
        if (personAretirementSolution.benefitType == "suspendAtFRA" || personAretirementSolution.benefitType == "suspendToday") {//If suspension solution, only push if begin/end suspension dates are different
          if (personAsavedBeginSuspensionDate != personAsavedEndSuspensionDate){
            solutionSet.solutionsArray.push(personAretirementSolution)
          }
        }
        else if (personAsavedRetirementBenefit > 0) {solutionSet.solutionsArray.push(personAretirementSolution)}
        
        if (personBretirementSolution.benefitType == "suspendAtFRA" || personBretirementSolution.benefitType == "suspendToday") {//If suspension solution, only push if begin/end suspension dates are different
          if (personBsavedBeginSuspensionDate != personBsavedEndSuspensionDate){
            solutionSet.solutionsArray.push(personBretirementSolution)
          }
        }
        else if (personBsavedRetirementBenefit > 0) {solutionSet.solutionsArray.push(personBretirementSolution)}

        if (personAsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(personAspousalSolution)}
        if (personBsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(personBspousalSolution)}
        if (personAsavedSurvivorBenefitOutput > personAsavedRetirementBenefit) {solutionSet.solutionsArray.push(personAsurvivorSolution)} //Since survivorBenefitOutput is really "own retirement benefit plus own survivor benefit" we only want to include in array if that output is greater than own retirement (i.e., if actual survivor benefit is greater than 0)
        if (personBsavedSurvivorBenefitOutput > personBsavedRetirementBenefit) {solutionSet.solutionsArray.push(personBsurvivorSolution)}
    
        //Sort array by date
        solutionSet.solutionsArray.sort(function(a,b){
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return a.date.getTime() - b.date.getTime()
        })
        return solutionSet
  }

  //For divorce scenarios and married scenarios where one person is over 70
  generateCoupleOneHasFiledSolutionSet(flexibleSpouse:Person, fixedSpouse:Person, scenario:ClaimingScenario,
    flexibleSpouseSavedRetirementDate:Date, flexibleSpouseSavedSpousalDate:Date, fixedSpouseRetirementBenefitDate:Date, fixedSpouseSavedSpousalDate:Date, savedPV:number){
        let fixedSpouseRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(fixedSpouse, fixedSpouseRetirementBenefitDate)
        //flexible spouse retirement age/benefitAmount
        let flexibleSpouseSavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(flexibleSpouse, flexibleSpouseSavedRetirementDate)
        let flexibleSpouseSavedRetirementAge: number = flexibleSpouseSavedRetirementDate.getFullYear() - flexibleSpouse.SSbirthDate.getFullYear() + (flexibleSpouseSavedRetirementDate.getMonth() - flexibleSpouse.SSbirthDate.getMonth())/12
        let flexibleSpouseSavedRetirementAgeYears: number = Math.floor(flexibleSpouseSavedRetirementAge)
        let flexibleSpouseSavedRetirementAgeMonths: number = Math.round((flexibleSpouseSavedRetirementAge%1)*12)
        //flexible spouse spousal age/benefitAmount
        let flexibleSpouseSavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(flexibleSpouse, fixedSpouse, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedSpousalDate)
        if (flexibleSpouseSavedSpousalBenefit == 0 && flexibleSpouseSavedSpousalDate < flexibleSpouseSavedRetirementDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
          flexibleSpouseSavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(flexibleSpouse, fixedSpouse, 0, flexibleSpouseSavedSpousalDate)
        }
        let flexibleSpouseSavedSpousalAge: number = flexibleSpouseSavedSpousalDate.getFullYear() - flexibleSpouse.SSbirthDate.getFullYear() + (flexibleSpouseSavedSpousalDate.getMonth() - flexibleSpouse.SSbirthDate.getMonth())/12
        let flexibleSpouseSavedSpousalAgeYears: number = Math.floor(flexibleSpouseSavedSpousalAge)
        let flexibleSpouseSavedSpousalAgeMonths: number = Math.round((flexibleSpouseSavedSpousalAge%1)*12)
        //flexible spouse survivor
        if (flexibleSpouseSavedRetirementBenefit >= fixedSpouseRetirementBenefit) {
          var flexibleSpouseSavedSurvivorBenefitOutput: number = 0
        } else {
          var flexibleSpouseSavedSurvivorBenefitOutput: number =
          flexibleSpouseSavedRetirementBenefit + this.benefitService.calculateSurvivorBenefit(flexibleSpouse, flexibleSpouseSavedRetirementBenefit, flexibleSpouse.survivorFRA, fixedSpouse, fixedSpouseRetirementBenefitDate, fixedSpouseRetirementBenefitDate)
        }
        //fixed spouse spousal age/benefitAmount (no need to consider restricted app scenario, because this person has already filed for retirement benefit)
        let fixedSpouseSavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(fixedSpouse, flexibleSpouse, fixedSpouseRetirementBenefit, fixedSpouseSavedSpousalDate)
        let fixedSpouseSavedSpousalAge: number = fixedSpouseSavedSpousalDate.getFullYear() - fixedSpouse.SSbirthDate.getFullYear() + (fixedSpouseSavedSpousalDate.getMonth() - fixedSpouse.SSbirthDate.getMonth())/12
        let fixedSpouseSavedSpousalAgeYears: number = Math.floor(fixedSpouseSavedSpousalAge)
        let fixedSpouseSavedSpousalAgeMonths: number = Math.round((fixedSpouseSavedSpousalAge%1)*12)
        //fixed spouse survivor benefitAmount
        if (fixedSpouseRetirementBenefit >= flexibleSpouseSavedRetirementBenefit) {
          var fixedSpouseSavedSurvivorBenefitOutput: number = 0
        } else {
          var fixedSpouseSavedSurvivorBenefitOutput: number =
          fixedSpouseRetirementBenefit + this.benefitService.calculateSurvivorBenefit(fixedSpouse, fixedSpouseRetirementBenefit, fixedSpouse.survivorFRA, flexibleSpouse, flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementDate)
        }

        let solutionSet: SolutionSet = {
          "solutionPV":savedPV,
          solutionsArray: []
        }

        //create ClaimingSolution objects
        if (flexibleSpouseSavedRetirementDate > flexibleSpouseSavedSpousalDate) {
          var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", flexibleSpouse, flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
        } else {
          var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", flexibleSpouse, flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
        }
        if (flexibleSpouseSavedSpousalDate < flexibleSpouseSavedRetirementDate) {
          var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", flexibleSpouse, flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
        } else {
          var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", flexibleSpouse, flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
        }
        var flexibleSpouseSurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", flexibleSpouse, new Date(9999,0,1), flexibleSpouseSavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
        
        if (scenario.maritalStatus == "married"){//if this is not a divorce scenario, set claimingSolution objects for fixed spouse's spousal and survivor benefit (doesn't have one for retirement, because already filed)
        //fixedSpouseSpousalSolution: new claiming solution as spouseB ("with retirement" because already filed for retirement)
          var fixedSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", fixedSpouse, fixedSpouseSavedSpousalDate, fixedSpouseSavedSpousalBenefit, fixedSpouseSavedSpousalAgeYears, fixedSpouseSavedSpousalAgeMonths)
        //fixedSpouseSurvivorSolution is a new claiming solution as spouseB
          var fixedSpouseSurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", fixedSpouse, new Date(9999,0,1), fixedSpouseSavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
        }

        //push claimingSolution objects to array
        if (flexibleSpouseSavedRetirementBenefit > 0) {solutionSet.solutionsArray.push(flexibleSpouseRetirementSolution)}
        if (flexibleSpouseSavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(flexibleSpouseSpousalSolution)}
        if (flexibleSpouseSavedSurvivorBenefitOutput > flexibleSpouseSavedRetirementBenefit) {solutionSet.solutionsArray.push(flexibleSpouseSurvivorSolution)}//Since survivorBenefitOutput is really "own retirement benefit plus own survivor benefit" we only want to include in array if that output is greater than own retirement (i.e., if actual survivor benefit is greater than 0)
        if (scenario.maritalStatus == "married"){
          if (fixedSpouseSavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(fixedSpouseSpousalSolution)}
          if (fixedSpouseSavedSurvivorBenefitOutput > fixedSpouseRetirementBenefit) {solutionSet.solutionsArray.push(fixedSpouseSurvivorSolution)}//Since survivorBenefitOutput is really "own retirement benefit plus own survivor benefit" we only want to include in array if that output is greater than own retirement (i.e., if actual survivor benefit is greater than 0)
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
