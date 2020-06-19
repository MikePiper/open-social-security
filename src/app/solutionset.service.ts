import {Injectable} from '@angular/core'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './data model classes/solutionset'
import {ClaimingSolution} from './data model classes/claimingsolution'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"
import { BirthdayService } from './birthday.service';
import { ClaimStrategy } from './data model classes/claimStrategy'


@Injectable({
  providedIn: 'root'
})
export class SolutionSetService {

  constructor(private benefitService: BenefitService, private birthdayService:BirthdayService) { }

  today: MonthYearDate = new MonthYearDate()

  generateSingleSolutionSet(scenario:CalculationScenario, person:Person, claimStrategy:ClaimStrategy){
    let solutionSet:SolutionSet = {
      "claimStrategy":claimStrategy,
      "solutionsArray": [],
      "computationComplete": false // this property added to hide previous results while calculating
    }
    if (person.isOnDisability === true) {
      //create disability-converts-to-retirement solution object
      var disabilityConversionDate = new MonthYearDate(person.FRA)
      var disabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", person, disabilityConversionDate, 0, 0)//ageYears/ageMonths can be zero because not used in output
      solutionSet.solutionsArray.push(disabilityConversionSolution)
    }
    if (person.isOnDisability === true || person.hasFiled === true){//there may be a suspension solution
      person.DRCsViaSuspension = person.endSuspensionDate.getMonth() - person.beginSuspensionDate.getMonth() + (12 * (person.endSuspensionDate.getFullYear() - person.beginSuspensionDate.getFullYear()))
      var savedEndSuspensionAge: number = this.birthdayService.findAgeOnDate(person, person.endSuspensionDate)
      var savedEndSuspensionAgeYears: number = Math.floor(savedEndSuspensionAge)
      var savedEndSuspensionAgeMonths: number = Math.round((savedEndSuspensionAge%1)*12)
      //Create begin/end suspension solution objects
      if (person.beginSuspensionDate.valueOf() == person.FRA.valueOf()){
        var beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", person, person.beginSuspensionDate, 0, 0)
        var endSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", person, person.endSuspensionDate, savedEndSuspensionAgeYears, savedEndSuspensionAgeMonths)
      }
      else if (person.beginSuspensionDate.valueOf() == this.today.valueOf()){
        var beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", person, person.beginSuspensionDate, 0, 0)
        var endSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", person, person.endSuspensionDate, savedEndSuspensionAgeYears, savedEndSuspensionAgeMonths)
      }
      else {//person is suspending at some date other than FRA or today
        var beginSuspensionAge: number = this.birthdayService.findAgeOnDate(person, person.beginSuspensionDate)
        var beginSuspensionAgeYears: number = Math.floor(beginSuspensionAge)
        var beginSuspensionAgeMonths: number = Math.round((beginSuspensionAge%1)*12)
        var beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtSomeOtherDate", person, person.beginSuspensionDate, beginSuspensionAgeYears, beginSuspensionAgeMonths)
        var endSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", person, person.endSuspensionDate, savedEndSuspensionAgeYears, savedEndSuspensionAgeMonths)
      }
      if (person.beginSuspensionDate.valueOf() != person.endSuspensionDate.valueOf()){//If suspension solution, only push if begin/end suspension dates are different
        solutionSet.solutionsArray.push(beginSuspensionSolution)
        solutionSet.solutionsArray.push(endSuspensionSolution)
      }
    }
    else {//normal retirement solution
        let savedClaimingAge: number = this.birthdayService.findAgeOnDate(person, person.retirementBenefitDate)
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
      //Determine if there are any children who have not yet filed and who are under 18 or disabled as of their childBenefitDate
      var childWhoNeedsToFile:boolean = false
      for (let child of scenario.children){
        child.childBenefitDate = this.benefitService.determineChildBenefitDate(scenario, child, person)
        let ageOnChildBenefitDate:number = this.birthdayService.findAgeOnDate(child, child.childBenefitDate)
        if ( (ageOnChildBenefitDate < 17.99 || child.isOnDisability === true) && child.hasFiled === false ){
          childWhoNeedsToFile = true
        }
      }
      //If there's a child who needs to file, find earliest childBenefitDate (of children who haven't filed) and find whether it is prior to today
      if (childWhoNeedsToFile === true){
        let childBenefitDates:MonthYearDate[] = []
        for (let child of scenario.children){
          if (child.hasFiled === false){
            childBenefitDates.push(child.childBenefitDate)
          }
        }
          childBenefitDates.sort(function(a,b){
            return a.valueOf() - b.valueOf()
          })
        //now we have an array of the childBenefitDates of the children who haven't filed, and it's sorted earliest to latest
        if (childBenefitDates[0] < this.today){
          var childBenefitSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", person, childBenefitDates[0], 0, 0)
        }
        else {
          var childBenefitSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "child", person, childBenefitDates[0], 0, 0)
        }
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

  //In this method first we create all the possible solution objects, but then only push the ones we want into the solutionsArray.
    //For example if personB can't actually qualify for spousal benefits at any time, we don't push personBspousalSolution
  generateCoupleSolutionSet(scenario:CalculationScenario, personA:Person, personB:Person, claimStrategy:ClaimStrategy){
    let solutionSet: SolutionSet = {
      "claimStrategy":claimStrategy,
      solutionsArray: [],
      "computationComplete": false      
    }

    //declare solution object variables
    let personAdisabilityConversionSolution:ClaimingSolution
    let personAretirementSolution:ClaimingSolution
    let personAbeginSuspensionSolution:ClaimingSolution
    let personAendSuspensionSolution:ClaimingSolution
    let personAchildInCareSpousalSolution:ClaimingSolution
    let personAchildInCareSpousalSuspensionSolution:ClaimingSolution
    let personAautomaticSpousalUnsuspensionSolution:ClaimingSolution
    let personAspousalSolution:ClaimingSolution

    let personBdisabilityConversionSolution:ClaimingSolution
    let personBretirementSolution:ClaimingSolution
    let personBbeginSuspensionSolution:ClaimingSolution
    let personBendSuspensionSolution:ClaimingSolution
    let personBchildInCareSpousalSolution:ClaimingSolution
    let personBchildInCareSpousalSuspensionSolution:ClaimingSolution
    let personBautomaticSpousalUnsuspensionSolution:ClaimingSolution
    let personBspousalSolution:ClaimingSolution

    let childBenefitSolution:ClaimingSolution
    let secondChildBenefitSolution:ClaimingSolution

        //personA retirement stuff
          if (personA.isOnDisability === true || personA.hasFiled === true){//retirement benefit solution is a suspension solution
              personA.DRCsViaSuspension = personA.endSuspensionDate.getMonth() - personA.beginSuspensionDate.getMonth() + (12 * (personA.endSuspensionDate.getFullYear() - personA.beginSuspensionDate.getFullYear()))
              var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.fixedRetirementBenefitDate)
              var personAsavedEndSuspensionAge: number = this.birthdayService.findAgeOnDate(personA, personA.endSuspensionDate)
              var personAsavedEndSuspensionAgeYears: number = Math.floor(personAsavedEndSuspensionAge)
              var personAsavedEndSuspensionAgeMonths: number = Math.round((personAsavedEndSuspensionAge%1)*12)
              //Create begin/end suspension solution objects
              if (personA.beginSuspensionDate.valueOf() == personA.FRA.valueOf()){
                personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personA, personA.beginSuspensionDate, 0, 0)
                personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personA.endSuspensionDate, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
              else if (personA.beginSuspensionDate.valueOf() == this.today.valueOf()) {
                personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personA, personA.beginSuspensionDate, 0, 0)
                personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personA.endSuspensionDate, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
              else {//personA is suspending at some date other than FRA or today
                var personAbeginSuspensionAge: number = this.birthdayService.findAgeOnDate(personA, personA.beginSuspensionDate)
                var personAbeginSuspensionAgeYears: number = Math.floor(personAbeginSuspensionAge)
                var personAbeginSuspensionAgeMonths: number = Math.round((personAbeginSuspensionAge%1)*12)
                personAbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtSomeOtherDate", personA, personA.beginSuspensionDate, personAbeginSuspensionAgeYears, personAbeginSuspensionAgeMonths)
                personAendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personA, personA.endSuspensionDate, personAsavedEndSuspensionAgeYears, personAsavedEndSuspensionAgeMonths)
              }
          }
          else {//normal retirement benefit solution
              var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
              var personAsavedRetirementAge: number = this.birthdayService.findAgeOnDate(personA, personA.retirementBenefitDate)
              var personAsavedRetirementAgeYears: number = Math.floor(personAsavedRetirementAge)
              var personAsavedRetirementAgeMonths: number = Math.round((personAsavedRetirementAge%1)*12)
              //Create retirement solution object
              if (personA.retirementBenefitDate < this.today){
                personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveRetirement", personA, personA.retirementBenefitDate, personAsavedRetirementAgeYears, personAsavedRetirementAgeMonths)
              }
              else {
                personAretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirement", personA, personA.retirementBenefitDate, personAsavedRetirementAgeYears, personAsavedRetirementAgeMonths)
              }
          }

        //personB retirement stuff
          if (personB.isOnDisability === true || personB.hasFiled === true){//retirement benefit solution is a suspension solution
              personB.DRCsViaSuspension = personB.endSuspensionDate.getMonth() - personB.beginSuspensionDate.getMonth() + (12 * (personB.endSuspensionDate.getFullYear() - personB.beginSuspensionDate.getFullYear()))
              var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.fixedRetirementBenefitDate)
              var personBsavedEndSuspensionAge: number = this.birthdayService.findAgeOnDate(personB, personB.endSuspensionDate)
              var personBsavedEndSuspensionAgeYears: number = Math.floor(personBsavedEndSuspensionAge)
              var personBsavedEndSuspensionAgeMonths: number = Math.round((personBsavedEndSuspensionAge%1)*12)
              //create begin/end suspension solution objects      
              if (personB.beginSuspensionDate.valueOf() == personB.FRA.valueOf()){
                personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", personB, personB.beginSuspensionDate, 0, 0)
                personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personB.endSuspensionDate, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }
              else if (personB.beginSuspensionDate.valueOf() == this.today.valueOf()) {
                personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", personB, personB.beginSuspensionDate, 0, 0)
                personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personB.endSuspensionDate, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }
              else {//personB is suspending at some date other than FRA or today
                var personBbeginSuspensionAge: number = this.birthdayService.findAgeOnDate(personB, personB.beginSuspensionDate)
                var personBbeginSuspensionAgeYears: number = Math.floor(personBbeginSuspensionAge)
                var personBbeginSuspensionAgeMonths: number = Math.round((personBbeginSuspensionAge%1)*12)
                personBbeginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtSomeOtherDate", personB, personB.beginSuspensionDate, personBbeginSuspensionAgeYears, personBbeginSuspensionAgeMonths)
                personBendSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", personB, personB.endSuspensionDate, personBsavedEndSuspensionAgeYears, personBsavedEndSuspensionAgeMonths)
              }
          }
          else {//normal retirement benefit solution
              var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
              var personBsavedRetirementAge: number = this.birthdayService.findAgeOnDate(personB, personB.retirementBenefitDate)
              var personBsavedRetirementAgeYears: number = Math.floor(personBsavedRetirementAge)
              var personBsavedRetirementAgeMonths: number = Math.round((personBsavedRetirementAge%1)*12)
              //create retirement solution object
              if (personB.retirementBenefitDate < this.today){
                personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveRetirement", personB, personB.retirementBenefitDate, personBsavedRetirementAgeYears, personBsavedRetirementAgeMonths)
              }
              else {
                personBretirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirement", personB, personB.retirementBenefitDate, personBsavedRetirementAgeYears, personBsavedRetirementAgeMonths)
              }
          }

        //personA spousal stuff
          let personAsavedSpousalAge: number = this.birthdayService.findAgeOnDate(personA, personA.spousalBenefitDate)
          let personAsavedSpousalAgeYears: number = Math.floor(personAsavedSpousalAge)
          let personAsavedSpousalAgeMonths: number = Math.round((personAsavedSpousalAge%1)*12)
          //create personAchildInCareSpousalSolution if necessary (and related suspension/endsuspension objects if necessary)
          if (scenario.children.length > 0){
            if (personA.childInCareSpousal === true){
              if (!(personA.retirementBenefitDate <= personB.retirementBenefitDate && personA.PIA >= 0.5 * personB.PIA)) {//Won't be any spousal benefit for personA if they have already started retirement with PIA > 50% of personB.PIA
                  //create childInCareSpousal solution object
                  let personAageOnChildInCareSpousalDate:number = this.birthdayService.findAgeOnDate(personA, personB.retirementBenefitDate)
                  let personAageYearsOnChildInCareSpousalDate:number = Math.floor(personAageOnChildInCareSpousalDate)
                  let personAageMonthsOnChildInCareSpousalDate:number = Math.round((personAageOnChildInCareSpousalDate%1)*12)
                  personAchildInCareSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "childInCareSpousal", personA, personB.retirementBenefitDate, personAageYearsOnChildInCareSpousalDate, personAageMonthsOnChildInCareSpousalDate)
                  //see if need to create spousal suspension/endsuspension solution objects
                    if (scenario.youngestChildTurns16date < personA.FRA && scenario.disabledChild === false){
                        //create childInCareSpousalSuspension
                        let personAageOnYoungest16Date:number = this.birthdayService.findAgeOnDate(personA, scenario.youngestChildTurns16date)
                        let personAageYearsOnYoungest16Date:number = Math.floor(personAageOnYoungest16Date)
                        let personAageMonthsOnYoungest16Date:number = Math.round((personAageOnYoungest16Date%1)*12)
                        personAchildInCareSpousalSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "childInCareSpousalSuspension", personA, scenario.youngestChildTurns16date, personAageYearsOnYoungest16Date, personAageMonthsOnYoungest16Date)
                        //create automaticSpousalUnsuspension
                        personAautomaticSpousalUnsuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "automaticSpousalUnsuspension", personA, personA.FRA, 0, 0)//message doesn't include age, so no need to calculate it
                    }
              } 
            }
          }
          //Create personA regular spousal solution object
            if (personA.spousalBenefitDate < this.today){
              personAspousalSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveSpousal", personA, personA.spousalBenefitDate, personAsavedSpousalAgeYears, personAsavedSpousalAgeMonths)
            }
            else {
              personAspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousal", personA, personA.spousalBenefitDate, personAsavedSpousalAgeYears, personAsavedSpousalAgeMonths)
            }
            

        //personB spousal stuff
          let personBsavedSpousalAge: number = this.birthdayService.findAgeOnDate(personB, personB.spousalBenefitDate)
          let personBsavedSpousalAgeYears: number = Math.floor(personBsavedSpousalAge)
          let personBsavedSpousalAgeMonths: number = Math.round((personBsavedSpousalAge%1)*12)
          //create personBchildInCareSpousalSolution if necessary (and related suspension/endsuspension objects if necessary)
          if (scenario.children.length > 0){
            if (personB.childInCareSpousal === true){
              if (!(personB.retirementBenefitDate <= personA.retirementBenefitDate && personB.PIA >= 0.5 * personA.PIA)) {//Won't be any spousal benefit for personB if they have already started retirement with PIA > 50% of personA.PIA
                  //create childInCareSpousal solution object
                  let personBageOnChildInCareSpousalDate:number = this.birthdayService.findAgeOnDate(personB, personA.retirementBenefitDate)
                  let personBageYearsOnChildInCareSpousalDate:number = Math.floor(personBageOnChildInCareSpousalDate)
                  let personBageMonthsOnChildInCareSpousalDate:number = Math.round((personBageOnChildInCareSpousalDate%1)*12)
                  personBchildInCareSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "childInCareSpousal", personB, personA.retirementBenefitDate, personBageYearsOnChildInCareSpousalDate, personBageMonthsOnChildInCareSpousalDate)
                  //see if need to create spousal suspension/endsuspension solution objects
                    if (scenario.youngestChildTurns16date < personB.FRA && scenario.disabledChild === false){
                        //create childInCareSpousalSuspension
                        let personBageOnYoungest16Date:number = this.birthdayService.findAgeOnDate(personB, scenario.youngestChildTurns16date)
                        let personBageYearsOnYoungest16Date:number = Math.floor(personBageOnYoungest16Date)
                        let personBageMonthsOnYoungest16Date:number = Math.round((personBageOnYoungest16Date%1)*12)
                        personBchildInCareSpousalSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "childInCareSpousalSuspension", personB, scenario.youngestChildTurns16date, personBageYearsOnYoungest16Date, personBageMonthsOnYoungest16Date)
                        //create automaticSpousalUnsuspension
                        personBautomaticSpousalUnsuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "automaticSpousalUnsuspension", personB, personB.FRA, 0, 0)//message doesn't include age, so no need to calculate it
                    }
              } 
            }
          }
          //Create personB regular spousal solution object
          if (personB.spousalBenefitDate < this.today){
            personBspousalSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveSpousal", personB, personB.spousalBenefitDate, personBsavedSpousalAgeYears, personBsavedSpousalAgeMonths)
          }
          else {
            personBspousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousal", personB, personB.spousalBenefitDate, personBsavedSpousalAgeYears, personBsavedSpousalAgeMonths)
          }

        //personA disability stuff
          if (personA.isOnDisability === true) {
            //create disability-converts-to-retirement solution object
            var personAdisabilityConversionDate = new MonthYearDate(personA.FRA)
            personAdisabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", personA, personAdisabilityConversionDate, 0, 0)//ageYears/ageMonths can be zero because not used in output
            solutionSet.solutionsArray.push(personAdisabilityConversionSolution)
          }

        //personB disability stuff
          if (personB.isOnDisability === true) {
            //create disability-converts-to-retirement solution object
            var personBdisabilityConversionDate = new MonthYearDate(personB.FRA)
            personBdisabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", personB, personBdisabilityConversionDate, 0, 0)//ageYears/ageMonths can be zero because not used in output
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

            //personA spousal-related solution(s)
              //We don't want regular spousal solution object if there are child-in-care spousal solutions
              if (personAchildInCareSpousalSuspensionSolution) {solutionSet.solutionsArray.push(personAchildInCareSpousalSuspensionSolution)}
              if (personAautomaticSpousalUnsuspensionSolution) {solutionSet.solutionsArray.push(personAautomaticSpousalUnsuspensionSolution)}
              if (personAchildInCareSpousalSolution) {solutionSet.solutionsArray.push(personAchildInCareSpousalSolution)}
              else {
                //We also don't want a spousal solution if (A is older than 70 or A has filed) AND (B is over 70, B has filed, or B is on disability) -- because in that case we know they've already filed for spousal, if applicable
                if ( (personA.initialAge >= 70 || personA.hasFiled === true) && (personB.initialAge >= 70 || personB.hasFiled === true || personB.isOnDisability === true) ) {
                  //no spousal solution for personA
                }
                else {
                  //If personA will get spousal because their PIA is less than 50% of other PIA or because of restricted application, push regular spousal solution
                  if (personA.PIA < 0.5 * personB.PIA || personA.spousalBenefitDate < personA.retirementBenefitDate) {
                    solutionSet.solutionsArray.push(personAspousalSolution)
                  }
                }
              }

            //personB spousal-related solution(s)
              //We don't want personB solutions in divorce scenario
              if (scenario.maritalStatus == "married"){
                //We don't want regular spousal solution object if there are child-in-care spousal solutions
                if (personBchildInCareSpousalSuspensionSolution) {solutionSet.solutionsArray.push(personBchildInCareSpousalSuspensionSolution)}
                if (personBautomaticSpousalUnsuspensionSolution) {solutionSet.solutionsArray.push(personBautomaticSpousalUnsuspensionSolution)}
                if (personBchildInCareSpousalSolution) {solutionSet.solutionsArray.push(personBchildInCareSpousalSolution)}
                else {
                  //We also don't want a spousal solution if (B is older than 70 or B has filed) AND (A is over 70, A has filed, or A is on disability)  -- because in that case we know they've already filed for spousal, if applicable
                  if ( (personB.initialAge >= 70 || personB.hasFiled === true) && (personA.initialAge >= 70 || personA.hasFiled === true || personA.isOnDisability === true)  ) {
                    //no spousal solution for personB
                  }
                  else {
                    //If personB will get spousal because their PIA is less than 50% of other PIA or because of restricted application, push regular spousal solution
                    if (personB.PIA < 0.5 * personA.PIA || personB.spousalBenefitDate < personB.retirementBenefitDate) {
                      solutionSet.solutionsArray.push(personBspousalSolution)
                    }
                  }
                }
              }


        //Child Benefit Solution
        if (scenario.children.length > 0){
          //Determine if there are any children who have not yet filed and who are under 18 or disabled as of their childBenefitDate
          var childWhoNeedsToFile:boolean = false
          for (let child of scenario.children){
            child.childBenefitDate = this.benefitService.determineChildBenefitDate(scenario, child, personA, personB)
            let ageOnChildBenefitDate:number = this.birthdayService.findAgeOnDate(child, child.childBenefitDate)
            if ( (ageOnChildBenefitDate < 17.99 || child.isOnDisability === true) && child.hasFiled === false ){
              childWhoNeedsToFile = true
            }
          }
          //If there's a child who needs to file, find earliest childBenefitDate (of children who haven't filed) and find whether it is prior to today
          if (childWhoNeedsToFile === true){
            let childBenefitDates:MonthYearDate[] = []
            for (let child of scenario.children){
              if (child.hasFiled === false){
                childBenefitDates.push(child.childBenefitDate)
              }
            }
              childBenefitDates.sort(function(a,b){
                return a.valueOf() - b.valueOf()
              })
            //now we have an array of the childBenefitDates of the children who haven't filed, and it's sorted earliest to latest
            if (childBenefitDates[0] < this.today){//if there's a retroactive application for child benefits (meaning at least one parent has been entitled for some time now)
              if ( (personA.retirementBenefitDate < this.today || personA.isOnDisability === true) && (personB.retirementBenefitDate >= this.today && personB.isOnDisability === false) ){//if personA is currently entitled and personB isn't
                childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personA, childBenefitDates[0], 0, 0)
              }
              else if ( (personB.retirementBenefitDate < this.today || personB.isOnDisability === true) && (personA.retirementBenefitDate >= this.today && personA.isOnDisability === false) ){//if personB is currently entitled and personA isn't
                childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personB, childBenefitDates[0], 0, 0)
              }
              else {//i.e., if both are entitled
                if (personA.PIA > personB.PIA){
                  childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personA, childBenefitDates[0], 0, 0)
                }
                else {
                  childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personB, childBenefitDates[0], 0, 0)
                }
              }
            }
            else {//i.e., no retroactive application for child benefits (meaning neither parent is already entitled when using calculator)
              if (personA.retirementBenefitDate < personB.retirementBenefitDate){
                childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "child", personA, childBenefitDates[0], 0, 0)
              }
              else if (personB.retirementBenefitDate < personA.retirementBenefitDate){
                childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "child", personB, childBenefitDates[0], 0, 0)
              }
              else {//i.e., they have same retirement benefit date
                if (personA.PIA > personB.PIA){
                  childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "child", personA, childBenefitDates[0], 0, 0)
                }
                else {
                  childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "child", personB, childBenefitDates[0], 0, 0)
                }
              }
            }
            solutionSet.solutionsArray.push(childBenefitSolution)
            //Do we need a second child benefit solution? (i.e., because entitlement on second parent begins at later date?)
            if (personA.retirementBenefitDate > childBenefitSolution.date && personA.PIA > personB.PIA &&
              (this.birthdayService.checkForChildUnder18onGivenDate(scenario, personA.retirementBenefitDate) === true || scenario.disabledChild === true)){
              let secondChildBenefitSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "child", personA, personA.retirementBenefitDate, 0, 0)
              solutionSet.solutionsArray.push(secondChildBenefitSolution)
            }
            else if (personB.retirementBenefitDate > childBenefitSolution.date && personB.PIA > personA.PIA &&
              (this.birthdayService.checkForChildUnder18onGivenDate(scenario, personB.retirementBenefitDate) === true || scenario.disabledChild === true)){
              let secondChildBenefitSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "child", personB, personB.retirementBenefitDate, 0, 0)
              solutionSet.solutionsArray.push(secondChildBenefitSolution)
            }
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
