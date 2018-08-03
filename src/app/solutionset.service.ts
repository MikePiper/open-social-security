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
  generateCoupleIterateBothSolutionSet(scenario:ClaimingScenario, personA:Person, personB:Person,
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

        let solutionSet: SolutionSet = {
          "solutionPV":savedPV,
          solutionsArray: []
        }
        //Create claimingSolution objects
          //personA retirement solution object
            if (personA.isDisabled === true || scenario.personAhasFiled === true){//create suspension-related objects
              if (personAsavedBeginSuspensionDate.getTime() == personA.FRA.getTime()){
                var personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personA, personAsavedBeginSuspensionDate, personAsavedRetirementBenefit, 0, 0)
                var personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personAsavedEndSuspensionDate, personAsavedRetirementBenefit, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
              else {
                var personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personA, personAsavedBeginSuspensionDate, personAsavedRetirementBenefit, 0, 0)
                var personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personAsavedEndSuspensionDate, personAsavedRetirementBenefit, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
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
                var personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personB, personBsavedBeginSuspensionDate, personBsavedRetirementBenefit, 0, 0)
                var personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personBsavedEndSuspensionDate, personBsavedRetirementBenefit, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }
              else {
                var personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personB, personBsavedBeginSuspensionDate, personBsavedRetirementBenefit, 0, 0)
                var personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personBsavedEndSuspensionDate, personBsavedRetirementBenefit, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
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

        //Push claimingSolution objects to solutionSet.solutionsArray (But don't push them if the benefit amount is zero.)
        if (personAbeginSuspensionSolution) {//If suspension solution, only push if begin/end suspension dates are different
          if (personAsavedBeginSuspensionDate.getTime() != personAsavedEndSuspensionDate.getTime()){
            solutionSet.solutionsArray.push(personAbeginSuspensionSolution)
            solutionSet.solutionsArray.push(personAendSuspensionSolution)
          }
        }
        else if (personAsavedRetirementBenefit > 0) {//There's only a retirement solution if there isn't a suspension solution. And we only save it if benefit is > 0.
          solutionSet.solutionsArray.push(personAretirementSolution)
        }
        if (personBbeginSuspensionSolution) {//If suspension solution, only push if begin/end suspension dates are different
          if (personBsavedBeginSuspensionDate.getTime() != personBsavedEndSuspensionDate.getTime()){
            solutionSet.solutionsArray.push(personBbeginSuspensionSolution)
            solutionSet.solutionsArray.push(personBendSuspensionSolution)
          }
        }
        else if (personBsavedRetirementBenefit > 0) {//There's only a retirement solution if there isn't a suspension solution. And we only save it if benefit is > 0.
          solutionSet.solutionsArray.push(personBretirementSolution)
        }
        if (personAsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(personAspousalSolution)}
        if (personBsavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(personBspousalSolution)}
    
        //Sort array by date
        solutionSet.solutionsArray.sort(function(a,b){
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return a.date.getTime() - b.date.getTime()
        })
        return solutionSet
  }

  //For divorce scenarios and married scenarios where one person is over 70
  generateCoupleIterateOneSolutionSet(flexibleSpouse:Person, fixedSpouse:Person, scenario:ClaimingScenario,
    flexibleSpouseSavedRetirementDate:Date, flexibleSpouseSavedSpousalDate:Date, fixedSpouseRetirementBenefitDate:Date, fixedSpouseSavedSpousalDate:Date,
    flexibleSpouseSavedBeginSuspensionDate:Date, flexibleSpouseSavedEndSuspensionDate:Date, savedPV:number){
        let fixedSpouseRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(fixedSpouse, fixedSpouseRetirementBenefitDate)
        //flexible spouse retirement age/benefitAmount
          if (flexibleSpouse.isDisabled === true || (flexibleSpouse.id =="A" && scenario.personAhasFiled === true) || (flexibleSpouse.id =="B" && scenario.personBhasFiled === true)){
            //retirement benefit solution is a suspension solution
            flexibleSpouse.DRCsViaSuspension = flexibleSpouseSavedEndSuspensionDate.getMonth() - flexibleSpouseSavedBeginSuspensionDate.getMonth() + (12 * (flexibleSpouseSavedEndSuspensionDate.getFullYear() - flexibleSpouseSavedBeginSuspensionDate.getFullYear()))
            var flexibleSpouseSavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(flexibleSpouse, flexibleSpouse.fixedRetirementBenefitDate)
            var flexibleSpouseSavedEndSuspensionAge: number = flexibleSpouseSavedEndSuspensionDate.getFullYear() - flexibleSpouse.SSbirthDate.getFullYear() + (flexibleSpouseSavedEndSuspensionDate.getMonth() - flexibleSpouse.SSbirthDate.getMonth())/12
            var flexibleSpouseSavedEndSuspensionAgeYears: number = Math.floor(flexibleSpouseSavedEndSuspensionAge)
            var flexibleSpouseSavedEndSuspensionAgeMonths: number = Math.round((flexibleSpouseSavedEndSuspensionAge%1)*12)
          }
          else {
            //normal retirement benefit solution
            var flexibleSpouseSavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(flexibleSpouse, flexibleSpouseSavedRetirementDate)
            var flexibleSpouseSavedRetirementAge: number = flexibleSpouseSavedRetirementDate.getFullYear() - flexibleSpouse.SSbirthDate.getFullYear() + (flexibleSpouseSavedRetirementDate.getMonth() - flexibleSpouse.SSbirthDate.getMonth())/12
            var flexibleSpouseSavedRetirementAgeYears: number = Math.floor(flexibleSpouseSavedRetirementAge)
            var flexibleSpouseSavedRetirementAgeMonths: number = Math.round((flexibleSpouseSavedRetirementAge%1)*12)
          }
        //flexible spouse spousal age/benefitAmount
        let flexibleSpouseSavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(flexibleSpouse, fixedSpouse, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedSpousalDate)
        if (flexibleSpouseSavedSpousalBenefit == 0 && flexibleSpouseSavedSpousalDate < flexibleSpouseSavedRetirementDate) {//In case of restricted application, recalculate spousal benefit with zero as retirement benefit amount
          flexibleSpouseSavedSpousalBenefit = this.benefitService.calculateSpousalBenefit(flexibleSpouse, fixedSpouse, 0, flexibleSpouseSavedSpousalDate)
        }
        let flexibleSpouseSavedSpousalAge: number = flexibleSpouseSavedSpousalDate.getFullYear() - flexibleSpouse.SSbirthDate.getFullYear() + (flexibleSpouseSavedSpousalDate.getMonth() - flexibleSpouse.SSbirthDate.getMonth())/12
        let flexibleSpouseSavedSpousalAgeYears: number = Math.floor(flexibleSpouseSavedSpousalAge)
        let flexibleSpouseSavedSpousalAgeMonths: number = Math.round((flexibleSpouseSavedSpousalAge%1)*12)

        //fixed spouse spousal age/benefitAmount (no need to consider restricted app scenario, because this person has already filed for retirement benefit)
        let fixedSpouseSavedSpousalBenefit: number = this.benefitService.calculateSpousalBenefit(fixedSpouse, flexibleSpouse, fixedSpouseRetirementBenefit, fixedSpouseSavedSpousalDate)
        let fixedSpouseSavedSpousalAge: number = fixedSpouseSavedSpousalDate.getFullYear() - fixedSpouse.SSbirthDate.getFullYear() + (fixedSpouseSavedSpousalDate.getMonth() - fixedSpouse.SSbirthDate.getMonth())/12
        let fixedSpouseSavedSpousalAgeYears: number = Math.floor(fixedSpouseSavedSpousalAge)
        let fixedSpouseSavedSpousalAgeMonths: number = Math.round((fixedSpouseSavedSpousalAge%1)*12)

        let solutionSet: SolutionSet = {
          "solutionPV":savedPV,
          solutionsArray: []
        }

        //create ClaimingSolution objects
          //flexibleSpouse retirement solution object
            if (flexibleSpouse.isDisabled === true || (flexibleSpouse.id =="A" && scenario.personAhasFiled === true) || (flexibleSpouse.id =="B" && scenario.personBhasFiled === true)){//create suspension-related objects
              if (flexibleSpouseSavedBeginSuspensionDate.getTime() == flexibleSpouse.FRA.getTime()){
                var flexibleSpouseBeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", flexibleSpouse, flexibleSpouseSavedBeginSuspensionDate, flexibleSpouseSavedRetirementBenefit, 0, 0)
                var flexibleSpouseEndSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", flexibleSpouse, flexibleSpouseSavedEndSuspensionDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedEndSuspensionAgeYears, flexibleSpouseSavedEndSuspensionAgeMonths)
              }
              else {
                var flexibleSpouseBeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", flexibleSpouse, flexibleSpouseSavedBeginSuspensionDate, flexibleSpouseSavedRetirementBenefit, 0, 0)
                var flexibleSpouseEndSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", flexibleSpouse, flexibleSpouseSavedEndSuspensionDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedEndSuspensionAgeYears, flexibleSpouseSavedEndSuspensionAgeMonths)
              }
            }
            else {//create normal retirement solution object
              if (flexibleSpouseSavedRetirementDate > flexibleSpouseSavedSpousalDate) {
                var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementReplacingSpousal", flexibleSpouse, flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
              } else {
                var flexibleSpouseRetirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirementAlone", flexibleSpouse, flexibleSpouseSavedRetirementDate, flexibleSpouseSavedRetirementBenefit, flexibleSpouseSavedRetirementAgeYears, flexibleSpouseSavedRetirementAgeMonths)
              }
            }
          //flexibleSpouse spousalSolution object
            if (flexibleSpouseSavedSpousalDate < flexibleSpouseSavedRetirementDate) {
              var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalAlone", flexibleSpouse, flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
            } else {
              var flexibleSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", flexibleSpouse, flexibleSpouseSavedSpousalDate, flexibleSpouseSavedSpousalBenefit, flexibleSpouseSavedSpousalAgeYears, flexibleSpouseSavedSpousalAgeMonths)
            }

          //fixedSpouse spousal solution object
            if (scenario.maritalStatus == "married"){//if this is not a divorce scenario, set claimingSolution objects for fixed spouse's spousal and survivor benefit (doesn't have one for retirement, because already filed)
            //fixedSpouseSpousalSolution: new claiming solution as spouseB ("with retirement" because already filed for retirement)
              var fixedSpouseSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousalWithRetirement", fixedSpouse, fixedSpouseSavedSpousalDate, fixedSpouseSavedSpousalBenefit, fixedSpouseSavedSpousalAgeYears, fixedSpouseSavedSpousalAgeMonths)
            }

        //Push claimingSolution objects to array, if amounts are greater than zero
          if (flexibleSpouseBeginSuspensionSolution) {//If suspension solution, only push if begin/end suspension dates are different
            if (flexibleSpouseSavedBeginSuspensionDate.getTime() != flexibleSpouseSavedEndSuspensionDate.getTime()){
              solutionSet.solutionsArray.push(flexibleSpouseBeginSuspensionSolution)
              solutionSet.solutionsArray.push(flexibleSpouseEndSuspensionSolution)
            }
          }
          else if (flexibleSpouseSavedRetirementBenefit > 0) {//Only want to push retirement solution if there is no suspension solution
            solutionSet.solutionsArray.push(flexibleSpouseRetirementSolution)
          }
          if (flexibleSpouseSavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(flexibleSpouseSpousalSolution)}
          if (scenario.maritalStatus == "married"){
            if ( (flexibleSpouse.id == "A" && scenario.personAhasFiled === false) || (flexibleSpouse.id == "B" && scenario.personBhasFiled === false) ) {
            //regarding above logic: fixed spouse is over 70. If flexible spouse already filed for retirement (and we're just testing suspension options) we don't want a fixed spouse spousal solution, because fixed spouse already filed for spousal
              if (fixedSpouseSavedSpousalBenefit > 0) {solutionSet.solutionsArray.push(fixedSpouseSpousalSolution)}
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
