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

  today: MonthYearDate = new MonthYearDate()

  constructor(private benefitService: BenefitService, private birthdayService:BirthdayService) {
    this.setToday(new MonthYearDate())
  }

  setToday(today:MonthYearDate){
    this.today = new MonthYearDate(today)
  }

  generateSingleSolutionSet(scenario:CalculationScenario, person:Person, claimStrategy:ClaimStrategy){
    let solutionSet:SolutionSet = {
      "claimStrategy":claimStrategy,
      "solutionsArray": [],
      "computationComplete": false // this property added to hide previous results while calculating
    }
    if (person.isOnDisability === true) {
      //create disability-converts-to-retirement solution object
      var disabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", person, person.FRA, 0, 0)//ageYears/ageMonths can be zero because not used in output
      solutionSet.solutionsArray.push(disabilityConversionSolution)
    }
    if (person.isOnDisability === true || person.hasFiled === true){//there may be a suspension solution
      person.DRCsViaSuspension = person.endSuspensionDate.getMonth() - person.beginSuspensionDate.getMonth() + (12 * (person.endSuspensionDate.getFullYear() - person.beginSuspensionDate.getFullYear()))
      let beginSuspensionSolution:ClaimingSolution = this.generateBeginSuspensionClaimingSolution(person, scenario)
      let endSuspensionSolution:ClaimingSolution = this.generateEndSuspensionClaimingSolution(person, scenario)
      if (beginSuspensionSolution) {solutionSet.solutionsArray.push(beginSuspensionSolution)}
      if (endSuspensionSolution) {solutionSet.solutionsArray.push(endSuspensionSolution)}
    }
    else {//normal retirement solution
        let retirementSolution:ClaimingSolution = this.generateRetirementClaimingSolution(person, scenario)
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
    let personAsurvivorSolution:ClaimingSolution
    let personAmotherFatherSolution:ClaimingSolution

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
              personAbeginSuspensionSolution = this.generateBeginSuspensionClaimingSolution(personA, scenario)
              personAendSuspensionSolution = this.generateEndSuspensionClaimingSolution(personA, scenario)
          }
          else {//normal retirement benefit solution
             personAretirementSolution = this.generateRetirementClaimingSolution(personA, scenario)
             var personAsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
          }

        //personB retirement stuff
          if (personB.isOnDisability === true || personB.hasFiled === true){//retirement benefit solution is a suspension solution
              personB.DRCsViaSuspension = personB.endSuspensionDate.getMonth() - personB.beginSuspensionDate.getMonth() + (12 * (personB.endSuspensionDate.getFullYear() - personB.beginSuspensionDate.getFullYear()))
              var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.fixedRetirementBenefitDate)
              personBbeginSuspensionSolution = this.generateBeginSuspensionClaimingSolution(personB, scenario)
              personBendSuspensionSolution = this.generateEndSuspensionClaimingSolution(personB, scenario)
          }
          else {//normal retirement benefit solution
            personBretirementSolution = this.generateRetirementClaimingSolution(personB, scenario)
            var personBsavedRetirementBenefit: number = this.benefitService.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
          }

        //personA spousal stuff
          //create personAchildInCareSpousalSolution if necessary (and related suspension/endsuspension objects if necessary)
            personAchildInCareSpousalSolution = this.generateChildInCareSpousalClaimingSolution(personA, personB, scenario)
            personAchildInCareSpousalSuspensionSolution = this.generateChildInCareSpousalSuspensionClaimingSolution(personA, scenario)
            personAautomaticSpousalUnsuspensionSolution = this.generateAutomaticSpousalUnsuspensionClaimingSolution(personA, personB, scenario)
          //Create personA regular spousal solution object
            personAspousalSolution = this.generateSpousalClaimingSolution(personA, scenario)

            

        //personB spousal stuff
          //create personBchildInCareSpousalSolution if necessary (and related suspension/endsuspension objects if necessary)
            personBchildInCareSpousalSolution = this.generateChildInCareSpousalClaimingSolution(personB, personA, scenario)
            personBchildInCareSpousalSuspensionSolution = this.generateChildInCareSpousalSuspensionClaimingSolution(personB, scenario)
            personBautomaticSpousalUnsuspensionSolution = this.generateAutomaticSpousalUnsuspensionClaimingSolution(personB, personA, scenario)
          //Create personB regular spousal solution object
            personBspousalSolution = this.generateSpousalClaimingSolution(personB, scenario)


        //personA survivor stuff
          personAsurvivorSolution = this.generateSurvivorClaimingSolution(personA, personB, scenario)
          if (personAsurvivorSolution) {solutionSet.solutionsArray.push(personAsurvivorSolution)}

        //personA mother/father stuff
          personAmotherFatherSolution = this.generateMotherFatherClaimingSolution(personA, personB, scenario)
          if (personAmotherFatherSolution){solutionSet.solutionsArray.push(personAmotherFatherSolution)}

        //personA disability stuff
          if (personA.isOnDisability === true) {
            //create disability-converts-to-retirement solution object
            personAdisabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", personA, personA.FRA, 0, 0)//ageYears/ageMonths can be zero because not used in output
            solutionSet.solutionsArray.push(personAdisabilityConversionSolution)
          }

        //personB disability stuff
          if (personB.isOnDisability === true) {
            //create disability-converts-to-retirement solution object
            personBdisabilityConversionSolution = new ClaimingSolution(scenario.maritalStatus, "disabilityConversion", personB, personB.FRA, 0, 0)//ageYears/ageMonths can be zero because not used in output
            solutionSet.solutionsArray.push(personBdisabilityConversionSolution)
          }

        //Push claimingSolution objects to solutionSet.solutionsArray (But don't push them if the benefit amount is zero.)

            //personA retirement/suspension
            if (personAbeginSuspensionSolution) {solutionSet.solutionsArray.push(personAbeginSuspensionSolution)}
            if (personAendSuspensionSolution) {solutionSet.solutionsArray.push(personAendSuspensionSolution)}
            if (!personAbeginSuspensionSolution && personAsavedRetirementBenefit > 0) {//There's only a retirement solution if there isn't a suspension solution. And we only save it if benefit is > 0.
                if (personAretirementSolution) {solutionSet.solutionsArray.push(personAretirementSolution)}
            }

            //personB retirement/suspension
            if (scenario.maritalStatus == "married"){
              if (personBbeginSuspensionSolution) {solutionSet.solutionsArray.push(personBbeginSuspensionSolution)}
              if (personBendSuspensionSolution) {solutionSet.solutionsArray.push(personBendSuspensionSolution)}
              if (!personBbeginSuspensionSolution && personBsavedRetirementBenefit > 0) {//There's only a retirement solution if there isn't a suspension solution. And we only save it if benefit is > 0.
                  if (personBretirementSolution) {solutionSet.solutionsArray.push(personBretirementSolution)}
              }
            }

            //personA spousal-related solution(s)
              //We don't want spousal solutions in survivor scenario
              if (scenario.maritalStatus == "married" || scenario.maritalStatus == "divorced"){
                if (personAchildInCareSpousalSolution) {solutionSet.solutionsArray.push(personAchildInCareSpousalSolution)}
                if (personAchildInCareSpousalSuspensionSolution) {solutionSet.solutionsArray.push(personAchildInCareSpousalSuspensionSolution)}
                if (personAautomaticSpousalUnsuspensionSolution) {solutionSet.solutionsArray.push(personAautomaticSpousalUnsuspensionSolution)}
                //We only want regular spousal solution object if there is no child-in-care spousal solution, or if there was an automatic child-in-care suspension, but no unsuspension
                    //(i.e., didn't unsuspend automatically at FRA, because the person had filed for regular spousal already before then, due to deemed filing when they filed for retirement)
                if (!personAchildInCareSpousalSolution || (personAchildInCareSpousalSuspensionSolution && !personAautomaticSpousalUnsuspensionSolution)) {
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
              }

            //personB spousal-related solution(s)
              //We don't want personB solutions in divorce scenario or survivor scenario
              if (scenario.maritalStatus == "married"){
                if (personBchildInCareSpousalSolution) {solutionSet.solutionsArray.push(personBchildInCareSpousalSolution)}
                if (personBchildInCareSpousalSuspensionSolution) {solutionSet.solutionsArray.push(personBchildInCareSpousalSuspensionSolution)}
                if (personBautomaticSpousalUnsuspensionSolution) {solutionSet.solutionsArray.push(personBautomaticSpousalUnsuspensionSolution)}
                //We only want regular spousal solution object if there is no child-in-care spousal solution, or if there was an automatic child-in-care suspension, but no unsuspension
                  //(i.e., didn't unsuspend automatically at FRA, because the person had filed for regular spousal already before then, due to deemed filing when they filed for retirement)
                if (!personAchildInCareSpousalSolution || (personAchildInCareSpousalSuspensionSolution && !personAautomaticSpousalUnsuspensionSolution)) {
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
            if (childBenefitDates[0] < this.today){//if there's a retroactive application for child benefits (meaning at least one parent has been entitled for some time now -- or it's a survivor scenario)
              //if personA is currently entitled and personB isn't (and personB is not deceased)
              if ( (personA.retirementBenefitDate < this.today || personA.isOnDisability === true) && (personB.retirementBenefitDate >= this.today && personB.isOnDisability === false) && scenario.maritalStatus !== "survivor"){
                childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personA, childBenefitDates[0], 0, 0)
              }
              //if personB is currently entitled (or deceased) and personA isn't entitled
              else if ( (personB.retirementBenefitDate < this.today || personB.isOnDisability === true || scenario.maritalStatus=="survivor") && (personA.retirementBenefitDate >= this.today && personA.isOnDisability === false) ){
                childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personB, childBenefitDates[0], 0, 0)
              }
              else {//i.e., if both are entitled (or it's survivor scenario and personA is already entitled)
                if (personA.PIA > personB.PIA){
                  childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personA, childBenefitDates[0], 0, 0)
                }
                else {
                  childBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveChild", personB, childBenefitDates[0], 0, 0)
                }
              }
            }
            else {//i.e., no retroactive application for child benefits (meaning neither parent is already entitled when using calculator and there's no retroactive child-survivor benefit to claim)
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
            if (personA.retirementBenefitDate > childBenefitSolution.date &&
              ( (personA.PIA > personB.PIA && scenario.maritalStatus !== "survivor") || (personA.PIA * 0.5 > personB.PIA * 0.75 && scenario.maritalStatus=="survivor") ) &&
              (this.birthdayService.checkForChildUnder18onGivenDate(scenario, personA.retirementBenefitDate) === true || scenario.disabledChild === true)){
              secondChildBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "child", personA, personA.retirementBenefitDate, 0, 0)
              solutionSet.solutionsArray.push(secondChildBenefitSolution)
            }
            else if (personB.retirementBenefitDate > childBenefitSolution.date && personB.PIA > personA.PIA && scenario.maritalStatus !=="survivor" &&
              (this.birthdayService.checkForChildUnder18onGivenDate(scenario, personB.retirementBenefitDate) === true || scenario.disabledChild === true)){
              secondChildBenefitSolution = new ClaimingSolution(scenario.maritalStatus, "child", personB, personB.retirementBenefitDate, 0, 0)
              solutionSet.solutionsArray.push(secondChildBenefitSolution)
            }
          }
        }

        //If array is empty, make a doNothing solution
        if (solutionSet.solutionsArray.length == 0){
          var doNothingSolution:ClaimingSolution = new ClaimingSolution(scenario.maritalStatus, "doNothing", personA, this.today, 0, 0)
          solutionSet.solutionsArray.push(doNothingSolution)
        }
        //sort array by date
        else {
            solutionSet.solutionsArray.sort(function(a,b){
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return a.date.valueOf() - b.date.valueOf()
          })
        }
        return solutionSet
  }

  generateRetirementClaimingSolution(person:Person, scenario:CalculationScenario):ClaimingSolution{
    let retirementSolution:ClaimingSolution
    let filingAge: number = this.birthdayService.findAgeOnDate(person, person.retirementBenefitDate)
    let filingAgeYears: number = Math.floor(filingAge)
    let filingAgeMonths: number = Math.round((filingAge%1)*12)
    if (person.initialAge <= 70){//if person is already age 70+ when using calculator, we don't want a retirement ClaimingSolution
      if (person.retirementBenefitDate < this.today){
        retirementSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveRetirement", person, person.retirementBenefitDate, filingAgeYears, filingAgeMonths)
      }
      else {
        retirementSolution = new ClaimingSolution(scenario.maritalStatus, "retirement", person, person.retirementBenefitDate, filingAgeYears, filingAgeMonths)
      }
    }
    if (retirementSolution) {return retirementSolution}
    else {return undefined}
  }

  generateBeginSuspensionClaimingSolution(person:Person, scenario:CalculationScenario):ClaimingSolution{
    let beginSuspensionSolution:ClaimingSolution
    if (person.initialAge <= 70 && person.beginSuspensionDate.valueOf() != person.endSuspensionDate.valueOf() ){//We only want suspension solutions if person is < 70 when using calculator and begin/end suspension dates aren't the same
      if (person.beginSuspensionDate.valueOf() == person.FRA.valueOf()){
        beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtFRA", person, person.beginSuspensionDate, 0, 0)
      }
      else if (person.beginSuspensionDate.valueOf() == this.today.valueOf()) {
        beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendToday", person, person.beginSuspensionDate, 0, 0)
      }
      else {//person is suspending at some date other than FRA or today
        let beginSuspensionAge: number = this.birthdayService.findAgeOnDate(person, person.beginSuspensionDate)
        let beginSuspensionAgeYears: number = Math.floor(beginSuspensionAge)
        let beginSuspensionAgeMonths: number = Math.round((beginSuspensionAge%1)*12)
        beginSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "suspendAtSomeOtherDate", person, person.beginSuspensionDate, beginSuspensionAgeYears, beginSuspensionAgeMonths)
      }
    }
    if (beginSuspensionSolution){return beginSuspensionSolution}
    else {return undefined}
  }

  generateEndSuspensionClaimingSolution(person:Person, scenario:CalculationScenario):ClaimingSolution{
    let endSuspensionSolution:ClaimingSolution
    let endSuspensionAge: number = this.birthdayService.findAgeOnDate(person, person.endSuspensionDate)
    var endSuspensionAgeYears: number = Math.floor(endSuspensionAge)
    var endSuspensionAgeMonths: number = Math.round((endSuspensionAge%1)*12)
    if (person.initialAge <= 70 && person.beginSuspensionDate.valueOf() != person.endSuspensionDate.valueOf() ){//We only want suspension solutions if person is < 70 when using calculator and begin/end suspension dates aren't the same
      endSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "unsuspend", person, person.endSuspensionDate, endSuspensionAgeYears, endSuspensionAgeMonths)
    }
    if (endSuspensionAge){return endSuspensionSolution}
    else {return undefined}
  }

  generateSpousalClaimingSolution(person:Person, scenario:CalculationScenario):ClaimingSolution{
    let spousalSolution:ClaimingSolution
    let filingAge: number = this.birthdayService.findAgeOnDate(person, person.spousalBenefitDate)
    let filingAgeYears: number = Math.floor(filingAge)
    let filingAgeMonths: number = Math.round((filingAge%1)*12)
    if (person.spousalBenefitDate < this.today){
      spousalSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveSpousal", person, person.spousalBenefitDate, filingAgeYears, filingAgeMonths)
    }
    else {
      spousalSolution = new ClaimingSolution(scenario.maritalStatus, "spousal", person, person.spousalBenefitDate, filingAgeYears, filingAgeMonths)
    }
    return spousalSolution
  }

  generateChildInCareSpousalClaimingSolution(person:Person, otherPerson:Person, scenario:CalculationScenario):ClaimingSolution{
    let childInCareSpousalSolution:ClaimingSolution
    if (scenario.children.length > 0){
      if (person.childInCareSpousal === true){
        if (!(person.retirementBenefitDate <= otherPerson.retirementBenefitDate && person.PIA >= 0.5 * otherPerson.PIA)) {//Won't be any spousal benefit for person if they have already started retirement with PIA > 50% of otherPerson.PIA
            //create childInCareSpousal solution object
              //Find age on date that child-in-care spousal benefits begin
              let ageOnChildInCareSpousalDate:number = this.birthdayService.findAgeOnDate(person, person.childInCareSpousalBenefitDate)
              let ageYearsOnChildInCareSpousalDate:number = Math.floor(ageOnChildInCareSpousalDate)
              let ageMonthsOnChildInCareSpousalDate:number = Math.round((ageOnChildInCareSpousalDate%1)*12)
              //Create solution object
              childInCareSpousalSolution = new ClaimingSolution(scenario.maritalStatus, "childInCareSpousal", person, person.childInCareSpousalBenefitDate, ageYearsOnChildInCareSpousalDate, ageMonthsOnChildInCareSpousalDate)
        } 
      }
    }
    if (childInCareSpousalSolution){return childInCareSpousalSolution}
    else {return undefined}
  }

  generateChildInCareSpousalSuspensionClaimingSolution(person:Person, scenario:CalculationScenario):ClaimingSolution{
    let childInCareSpousalSuspensionSolution:ClaimingSolution
    if (person.childInCareSpousal === true){
      if (scenario.youngestChildTurns16date < person.FRA && scenario.disabledChild === false && person.childInCareSpousalBenefitDate < person.FRA){
        //create childInCareSpousalSuspension
        let ageOnYoungest16Date:number = this.birthdayService.findAgeOnDate(person, scenario.youngestChildTurns16date)
        let ageYearsOnYoungest16Date:number = Math.floor(ageOnYoungest16Date)
        let ageMonthsOnYoungest16Date:number = Math.round((ageOnYoungest16Date%1)*12)
        childInCareSpousalSuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "childInCareSpousalSuspension", person, scenario.youngestChildTurns16date, ageYearsOnYoungest16Date, ageMonthsOnYoungest16Date)
      }
    }
    if (childInCareSpousalSuspensionSolution) {return childInCareSpousalSuspensionSolution}
    else{return undefined}
  }


  generateAutomaticSpousalUnsuspensionClaimingSolution(person:Person, otherPerson:Person, scenario:CalculationScenario):ClaimingSolution{
    let automaticSpousalUnsuspensionSolution:ClaimingSolution
    if (person.childInCareSpousal === true){
      if (scenario.youngestChildTurns16date < person.FRA && scenario.disabledChild === false && person.childInCareSpousalBenefitDate < person.FRA){//if there was a suspension solution to begin with...
        //create automaticSpousalUnsuspension. But only do so if:
        //a) person.PIA < 50% of otherPerson.PIA or at person.FRA they would not be entitled to a retirement benefit, AND
        //b) their regular spousalBenefitDate is not before FRA (i.e., they haven't started regular spousal benefits yet by FRA. They would have started regular spousal if they have applied for retirement benefits by FRA, because deemed filing would happen.)
        if ((person.PIA < 0.5 * otherPerson.PIA || person.retirementBenefitDate > person.FRA) && person.spousalBenefitDate >= person.FRA){
          automaticSpousalUnsuspensionSolution = new ClaimingSolution(scenario.maritalStatus, "automaticSpousalUnsuspension", person, person.FRA, 0, 0)//message doesn't include age, so no need to calculate it
        }
      }
    }
    if (automaticSpousalUnsuspensionSolution){return automaticSpousalUnsuspensionSolution}
    else {return undefined}
  }

  generateSurvivorClaimingSolution(livingPerson:Person, deceasedPerson:Person, scenario:CalculationScenario):ClaimingSolution{
    let survivorSolution:ClaimingSolution
    if (scenario.maritalStatus == "survivor" && livingPerson.hasFiledAsSurvivor === false){
      let survivorFilingAge: number = this.birthdayService.findAgeOnDate(livingPerson, livingPerson.survivorBenefitDate)
      let personAsavedSurvivorAgeYears: number = Math.floor(survivorFilingAge)
      let personAsavedSurvivorAgeMonths: number = Math.round((survivorFilingAge%1)*12)
      //Create survivor solution object
      if (livingPerson.survivorBenefitDate < this.today){
        survivorSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveSurvivor", livingPerson, livingPerson.survivorBenefitDate, personAsavedSurvivorAgeYears, personAsavedSurvivorAgeMonths)
      }
      else {
        survivorSolution = new ClaimingSolution(scenario.maritalStatus, "survivor", livingPerson, livingPerson.survivorBenefitDate, personAsavedSurvivorAgeYears, personAsavedSurvivorAgeMonths)
      }
    }
    //Check if there's actually going to be a survivor benefit at SOME point, given selected filing dates
      //Basically, if they will never have a survivor benefit (because they filed for retirement already and because after various reductions survivor benefit is zero) then we don't want the solution object
    livingPerson.monthlySurvivorPayment = this.benefitService.calculateSurvivorOriginalBenefit(deceasedPerson)
    livingPerson = this.benefitService.adjustSurvivorBenefitsForAge(scenario, livingPerson)
    livingPerson = this.benefitService.adjustSurvivorBenefitsForRIB_LIM(livingPerson, deceasedPerson)
    livingPerson.monthlySurvivorPayment = livingPerson.monthlySurvivorPayment - this.benefitService.calculateRetirementBenefit(livingPerson, livingPerson.retirementBenefitDate)
    if (survivorSolution && (livingPerson.monthlySurvivorPayment > 0 || livingPerson.survivorBenefitDate < livingPerson.retirementBenefitDate)){
      return survivorSolution
    }
    else {return undefined}
  }

  generateMotherFatherClaimingSolution(livingPerson:Person, deceasedPerson:Person, scenario:CalculationScenario):ClaimingSolution{
    let motherFatherSolution:ClaimingSolution
    if (livingPerson.motherFatherBenefitDate && livingPerson.hasFiledAsMotherFather === false){
      let filingAge: number = this.birthdayService.findAgeOnDate(livingPerson, livingPerson.motherFatherBenefitDate)
      let filingAgeYears: number = Math.floor(filingAge)
      let filingAgeMonths: number = Math.round((filingAge%1)*12)
      if (livingPerson.motherFatherBenefitDate < this.today){
        motherFatherSolution = new ClaimingSolution(scenario.maritalStatus, "retroactiveMotherFather", livingPerson, livingPerson.motherFatherBenefitDate, filingAgeYears, filingAgeMonths)
      }
      else {
        motherFatherSolution = new ClaimingSolution(scenario.maritalStatus, "motherFather", livingPerson, livingPerson.motherFatherBenefitDate, filingAgeYears, filingAgeMonths)
      }
    }
    //Check if there's a childUnder16orDisabled
    let childUnder16orDisabled:boolean = this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, this.today)
    //Check if there's actually going to be a mother/father benefit at SOME point, given selected filing dates
      //Basically, if they will never have a mother/father benefit (because they filed for retirement already and because such would reduce mother/father to zero) then we don't want the solution object
    let motherFatherBenefit:number = this.benefitService.calculateMotherFatherOriginalBenefit(deceasedPerson)
    motherFatherBenefit = motherFatherBenefit - this.benefitService.calculateRetirementBenefit(livingPerson, livingPerson.retirementBenefitDate)
    if (childUnder16orDisabled && motherFatherSolution && (motherFatherBenefit > 0 || livingPerson.motherFatherBenefitDate < livingPerson.retirementBenefitDate)){
      return motherFatherSolution
    }
    else {return undefined}
  }

}
