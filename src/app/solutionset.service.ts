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

  generateSingleSolutionSet(maritalStatus: string, SSbirthDate:Date, person:Person, savedPV:number, savedClaimingDate:Date){
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
        let retirementSolution = new ClaimingSolution(maritalStatus, "retirementAlone", "spouseA", savedClaimingDate, savedRetirementBenefit, savedClaimingAgeYears, savedClaimingAgeMonths)
        solutionSet.solutionsArray.push(retirementSolution)
        return solutionSet
  }

  generateCoupleSolutionSet(maritalStatus:string, personA:Person, personB:Person,
    spouseAsavedRetirementDate: Date, spouseBsavedRetirementDate: Date, spouseAsavedSpousalDate: Date, spouseBsavedSpousalDate: Date, savedPV: number){
        //Find monthly benefit amounts and ages at saved claiming dates, for sake of output statement.
        //spouseA retirement stuff
        let spouseAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, spouseAsavedRetirementDate)
        let spouseAsavedRetirementAge: number = spouseAsavedRetirementDate.getFullYear() - personA.SSbirthDate.getFullYear() + (spouseAsavedRetirementDate.getMonth() - personA.SSbirthDate.getMonth())/12
        let spouseAsavedRetirementAgeYears: number = Math.floor(spouseAsavedRetirementAge)
        let spouseAsavedRetirementAgeMonths: number = Math.round((spouseAsavedRetirementAge%1)*12)
        //spouseB retirement stuff
        let spouseBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, spouseBsavedRetirementDate)
        let spouseBsavedRetirementAge: number = spouseBsavedRetirementDate.getFullYear() - personB.SSbirthDate.getFullYear() + (spouseBsavedRetirementDate.getMonth() - personB.SSbirthDate.getMonth())/12
        let spouseBsavedRetirementAgeYears: number = Math.floor(spouseBsavedRetirementAge)
        let spouseBsavedRetirementAgeMonths: number = Math.round((spouseBsavedRetirementAge%1)*12)
        //spouseA spousal stuff
        let spouseAsavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(personA, personB, spouseAsavedRetirementBenefit, spouseAsavedSpousalDate)
          if (spouseAsavedSpousalBenefit == 0 && spouseAsavedSpousalDate < spouseAsavedRetirementDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
            spouseAsavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(personA, personB, 0, spouseAsavedSpousalDate)
          }
        let spouseAsavedSpousalAge: number = spouseAsavedSpousalDate.getFullYear() - personA.SSbirthDate.getFullYear() + (spouseAsavedSpousalDate.getMonth() - personA.SSbirthDate.getMonth())/12
        let spouseAsavedSpousalAgeYears: number = Math.floor(spouseAsavedSpousalAge)
        let spouseAsavedSpousalAgeMonths: number = Math.round((spouseAsavedSpousalAge%1)*12)
        //spouseB spousal stuff
        let spouseBsavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(personB, personA, spouseBsavedRetirementBenefit, spouseBsavedSpousalDate)
        if (spouseBsavedSpousalBenefit == 0 && spouseBsavedSpousalDate < spouseBsavedRetirementDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
          spouseBsavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(personB, personA, 0, spouseBsavedSpousalDate)
        }
        let spouseBsavedSpousalAge: number = spouseBsavedSpousalDate.getFullYear() - personB.SSbirthDate.getFullYear() + (spouseBsavedSpousalDate.getMonth() - personB.SSbirthDate.getMonth())/12
        let spouseBsavedSpousalAgeYears: number = Math.floor(spouseBsavedSpousalAge)
        let spouseBsavedSpousalAgeMonths: number = Math.round((spouseBsavedSpousalAge%1)*12)
        //spouseA survivor stuff
        if (spouseAsavedRetirementBenefit >= spouseBsavedRetirementBenefit) {
          var spouseAsavedSurvivorBenefitOutput: number = 0
        } else {
          var spouseAsavedSurvivorBenefitOutput: number =
          spouseAsavedRetirementBenefit + this.benefitService.calculateSurvivorBenefit(personA, spouseAsavedRetirementBenefit, personA.survivorFRA, personB, spouseBsavedRetirementDate, spouseBsavedRetirementDate)
        }
        //spouseB survivor stuff
        if (spouseBsavedRetirementBenefit >= spouseAsavedRetirementBenefit) {
          var spouseBsavedSurvivorBenefitOutput: number = 0
        } else {
          var spouseBsavedSurvivorBenefitOutput: number =
          spouseBsavedRetirementBenefit + this.benefitService.calculateSurvivorBenefit(personB, spouseBsavedRetirementBenefit, personB.survivorFRA, personA, spouseAsavedRetirementDate, spouseAsavedRetirementDate)
        }

        let solutionSet: SolutionSet = {
          "solutionPV":savedPV,
          solutionsArray: []
        }
        //Determine claimingSolution objects
        if (spouseAsavedRetirementDate > spouseAsavedSpousalDate) {
          var spouseAretirementSolution = new ClaimingSolution(maritalStatus, "retirementReplacingSpousal", "spouseA", spouseAsavedRetirementDate, spouseAsavedRetirementBenefit, spouseAsavedRetirementAgeYears, spouseAsavedRetirementAgeMonths)
        } else {
          var spouseAretirementSolution = new ClaimingSolution(maritalStatus, "retirementAlone", "spouseA", spouseAsavedRetirementDate, spouseAsavedRetirementBenefit, spouseAsavedRetirementAgeYears, spouseAsavedRetirementAgeMonths)
        }
        if (spouseBsavedRetirementDate > spouseBsavedSpousalDate) {
          var spouseBretirementSolution = new ClaimingSolution(maritalStatus, "retirementReplacingSpousal", "spouseB", spouseBsavedRetirementDate, spouseBsavedRetirementBenefit, spouseBsavedRetirementAgeYears, spouseBsavedRetirementAgeMonths)
        } else {
          var spouseBretirementSolution = new ClaimingSolution(maritalStatus, "retirementAlone", "spouseB", spouseBsavedRetirementDate, spouseBsavedRetirementBenefit, spouseBsavedRetirementAgeYears, spouseBsavedRetirementAgeMonths)
        }
        if (spouseAsavedSpousalDate < spouseAsavedRetirementDate) {
          var spouseAspousalSolution = new ClaimingSolution(maritalStatus, "spousalAlone", "spouseA", spouseAsavedSpousalDate, spouseAsavedSpousalBenefit, spouseAsavedSpousalAgeYears, spouseAsavedSpousalAgeMonths)
        } else {
          var spouseAspousalSolution = new ClaimingSolution(maritalStatus, "spousalWithRetirement", "spouseA", spouseAsavedSpousalDate, spouseAsavedSpousalBenefit, spouseAsavedSpousalAgeYears, spouseAsavedSpousalAgeMonths)
        }
        if (spouseBsavedSpousalDate < spouseBsavedRetirementDate) {
          var spouseBspousalSolution = new ClaimingSolution(maritalStatus, "spousalAlone", "spouseB", spouseBsavedSpousalDate, spouseBsavedSpousalBenefit, spouseBsavedSpousalAgeYears, spouseBsavedSpousalAgeMonths)
        } else {
          var spouseBspousalSolution = new ClaimingSolution(maritalStatus, "spousalWithRetirement", "spouseB", spouseBsavedSpousalDate, spouseBsavedSpousalBenefit, spouseBsavedSpousalAgeYears, spouseBsavedSpousalAgeMonths)
        }
        var spouseAsurvivorSolution = new ClaimingSolution(maritalStatus, "survivor", "spouseA", new Date(9999,0,1), spouseAsavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
        var spouseBsurvivorSolution = new ClaimingSolution(maritalStatus, "survivor", "spouseB", new Date(9999,0,1), spouseBsavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output


        //Push claimingSolution objects to solutionSet.solutionsArray (But don't push them if the benefit amount is zero.)
        if (spouseAsavedRetirementBenefit > 0) {solutionSet.solutionsArray.push(spouseAretirementSolution)}
        if (spouseBsavedRetirementBenefit > 0) {solutionSet.solutionsArray.push(spouseBretirementSolution)}
        if (spouseAsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(spouseAspousalSolution)}
        if (spouseBsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(spouseBspousalSolution)}
        if (spouseAsavedSurvivorBenefitOutput > spouseAsavedRetirementBenefit) {solutionSet.solutionsArray.push(spouseAsurvivorSolution)} //Since survivorBenefitOutput is really "own retirement benefit plus own survivor benefit" we only want to include in array if that output is greater than own retirement (i.e., if actual survivor benefit is greater than 0)
        if (spouseBsavedSurvivorBenefitOutput > spouseBsavedRetirementBenefit) {solutionSet.solutionsArray.push(spouseBsurvivorSolution)}
    
        //Sort array by date
        solutionSet.solutionsArray.sort(function(a,b){
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return a.date.getTime() - b.date.getTime()
        })
        return solutionSet
  }

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

        if (scenario.maritalStatus == "divorced" || scenario.personBhasFiled === true){//i.e., if "flexibleSpouse" is spouseA
            if (flexibleSpouseSavedRetirementDate > flexibleSpouseSavedSpousalDate) {
              var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", "spouseA", flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
            } else {
              var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", "spouseA", flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
            }
            if (flexibleSpouseSavedSpousalDate < flexibleSpouseSavedRetirementDate) {
              var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", "spouseA", flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
            } else {
              var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", "spouseA", flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
            }
            var flexibleSpouseSurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", "spouseA", new Date(9999,0,1), flexibleSpouseSavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
           
            if (scenario.maritalStatus == "married"){//if this is not a divorce scenario, set claimingSolution objects for fixed spouse's spousal and survivor benefit (doesn't have one for retirement, because already filed)
             //fixedSpouseSpousalSolution: new claiming solution as spouseB ("with retirement" because already filed for retirement)
            var fixedSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", "spouseB", fixedSpouseSavedSpousalDate, fixedSpouseSavedSpousalBenefit, fixedSpouseSavedSpousalAgeYears, fixedSpouseSavedSpousalAgeMonths)
            //fixedSpouseSurvivorSolution is a new claiming solution as spouseB
            var fixedSpouseSurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", "spouseB", new Date(9999,0,1), fixedSpouseSavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
            }
            
          } else if (scenario.personAhasFiled === true) {//i.e., if "flexibleSpouse" is spouseB
            if (flexibleSpouseSavedRetirementDate > flexibleSpouseSavedSpousalDate) {
              var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", "spouseB", flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
            } else {
              var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", "spouseB", flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
            }
            if (flexibleSpouseSavedSpousalDate < flexibleSpouseSavedRetirementDate) {
              var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", "spouseB", flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
            } else {
              var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", "spouseB", flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
            }
            var flexibleSpouseSurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", "spouseB", new Date(9999,0,1), flexibleSpouseSavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
            if (scenario.maritalStatus == "married"){//if this is not a divorce scenario, set claimingSolution objects for fixed spouse's spousal and survivor benefit (doesn't have one for retirement, because already filed)
             //fixedSpouseSpousalSolution: new claiming solution as spouseA ("with retirement" because already filed for retirement)
            var fixedSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", "spouseA", fixedSpouseSavedSpousalDate, fixedSpouseSavedSpousalBenefit, fixedSpouseSavedSpousalAgeYears, fixedSpouseSavedSpousalAgeMonths)
            //fixedSpouseSurvivorSolution is a new claiming solution as spouseA
            var fixedSpouseSurvivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", "spouseA", new Date(9999,0,1), fixedSpouseSavedSurvivorBenefitOutput, 0, 0) //Date isn't output, but we want it last in array. Ages aren't output
            }
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
