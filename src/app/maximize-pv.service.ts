import {Injectable} from '@angular/core'
import {SolutionSetService} from './solutionset.service'
import {SolutionSet} from './data model classes/solutionset'
import {Range} from './data model classes/range'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"
import {FamilyMaximumService} from './familymaximum.service'
import {BirthdayService} from './birthday.service'
import { ClaimStrategy } from './data model classes/claimStrategy'
import { CalculatePvService } from './calculate-PV.service'

@Injectable({
  providedIn: 'root'
})
export class MaximizePVService {
  today: MonthYearDate = new MonthYearDate()
  sixMonthsAgo:MonthYearDate
  twelveMonthsAgo:MonthYearDate

  constructor(private calculatePVservice:CalculatePvService, private birthdayService:BirthdayService, private familyMaximumService:FamilyMaximumService,
    private solutionSetService: SolutionSetService) {
      this.setToday(new MonthYearDate())
    }

    setToday(today:MonthYearDate){
      this.today = new MonthYearDate(today)
      this.sixMonthsAgo = new MonthYearDate(today)
      this.sixMonthsAgo.setMonth(this.sixMonthsAgo.getMonth()-6)
      this.twelveMonthsAgo = new MonthYearDate(today)
      this.twelveMonthsAgo.setFullYear(this.twelveMonthsAgo.getFullYear()-1)
      this.calculatePVservice.setToday(today)
      this.solutionSetService.setToday(today)
    }

    maximizeSinglePersonPV(person:Person, scenario:CalculationScenario) : SolutionSet{

      scenario.restrictedApplicationPossible = false;
  
      //find earliest retirementBenefitDate
      person.retirementBenefitDate = this.findEarliestPossibleRetirementBenefitDate(person)
  
      //If user has already filed or is on disability, initialize begin/end suspension dates as their FRA (but no earlier than this month), and set person's retirementBenefitDate using fixedRetirementBenefitDate field 
      person = this.initializeBeginEndSuspensionDates(person)
  
      //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
      person = this.familyMaximumService.calculateFamilyMaximum(person, this.today)
  
      //Initialize savedStrategy, with zero PV, using person's current dates
      let savedStrategy: ClaimStrategy = new ClaimStrategy(person)
      savedStrategy.PV = 0
  
      //Set endingTestDate equal to the month they turn 70
        let endingTestDate:MonthYearDate = this.findLatestRetirementBenefitDate(person)
  
      //Create new range object, with earliest start date and endingTestDate
      let earliestStart: MonthYearDate = new MonthYearDate(person.retirementBenefitDate)
      if (person.beginSuspensionDate > earliestStart) {
        earliestStart = person.beginSuspensionDate;
      }
      scenario.range = new Range(earliestStart, endingTestDate);
        
      while (person.retirementBenefitDate <= endingTestDate && person.endSuspensionDate <= endingTestDate){
        //run PV calc (again) and compare results. 
        let currentTest:ClaimStrategy = this.calculatePVservice.calculateSinglePersonPV(person, scenario, false) //TODO: maybe this has to be two lines? first is constructor instantiating the ClaimStrategy, and second runs PV calc function?
            // store data for this combination of claim dates
            scenario.range.processPVs(currentTest)
            //Save better of the two. (If they're literally the same, save the second one tested, because it gives better longevity insurance)
            if (currentTest.PV >= savedStrategy.PV){
            savedStrategy = new ClaimStrategy(person)
            savedStrategy.PV = currentTest.PV
        }
        //Increment claiming date (or suspension date)
        person = this.incrementRetirementORendSuspensionDate(person)
      }
  
      //after loop is finished, set Person's retirementBenefitDate and suspension dates to the saved dates, for sake of running PV calc again for outputTable
      person.retirementBenefitDate = new MonthYearDate(savedStrategy.personARetirementDate)
      person.beginSuspensionDate = new MonthYearDate(savedStrategy.personABeginSuspensionDate)
      person.endSuspensionDate = new MonthYearDate(savedStrategy.personAEndSuspensionDate)
      savedStrategy = this.calculatePVservice.calculateSinglePersonPV(person, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable
  
      //Generate solution set (for sake of output) from saved values
      let solutionSet:SolutionSet = this.solutionSetService.generateSingleSolutionSet(scenario, person, savedStrategy)
  
      // console.log(solutionSet)
  
      scenario.range.initFracsAndColors();
  
      return solutionSet
    }


    maximizeCouplePViterateBothPeople(personA:Person, personB:Person, scenario:CalculationScenario) : SolutionSet{

      let deemedFilingCutoff: Date = new Date(1954, 0, 1); 
      scenario.restrictedApplicationPossible = 
        ((personA.actualBirthDate < deemedFilingCutoff) || (personB.actualBirthDate < deemedFilingCutoff))
  
      //find earliest retirementBenefitDate for personA and personB
        personA.retirementBenefitDate = this.findEarliestPossibleRetirementBenefitDate(personA)
        personB.retirementBenefitDate = this.findEarliestPossibleRetirementBenefitDate(personB)
  
  
      //If either person has already filed or is on disability, initialize that person's begin&end suspension date as their FRA (but no earlier than this month), and set that person's retirementBenefitDate using fixedRetirementBenefitDate field 
        personA = this.initializeBeginEndSuspensionDates(personA)
        personB = this.initializeBeginEndSuspensionDates(personB)
  
      //Set initial spousalBenefitDates based on initial retirementBenefitDates
        personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
        personB = this.adjustSpousalBenefitDate(personB, personA, scenario)
  
      //Set survivorBenefitDate fields to survivorFRA. (We're just assuming here that nobody files for survivor benefits early.)
        personA.survivorBenefitDate = new MonthYearDate(personA.survivorFRA)
        personB.survivorBenefitDate = new MonthYearDate(personB.survivorFRA)
  
      //Initialize savedStrategy, with zero PV, using personA's and personB's current dates
        let savedStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
        savedStrategy.PV = 0
  
      //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
        personA = this.familyMaximumService.calculateFamilyMaximum(personA, this.today)
        personB = this.familyMaximumService.calculateFamilyMaximum(personB, this.today)
  
      //Set endingTestDate for each spouse equal to the month they turn 70. (Or if they have PIA=0, set to point at which their spousal would be maximized -- ie they have reached FRA and other person is 70) If using fixed-death-age-assumption younger than 70, don't let it be later than assumed month of death
        let spouseAendTestDate = new MonthYearDate(this.findLastDateForPersonToStoreInRange(personA, personB))
        let spouseBendTestDate = new MonthYearDate(this.findLastDateForPersonToStoreInRange(personB, personA))
  
      // get limits for storage of PV for range of claim options
        let earliestStartA: MonthYearDate = new MonthYearDate(this.findEarliestDateForPersonToStoreInRange(personA))
        let earliestStartB: MonthYearDate = new MonthYearDate(this.findEarliestDateForPersonToStoreInRange(personB))
  
      //Create new range object for storage of data
      scenario.range = new Range(earliestStartA, spouseAendTestDate, earliestStartB, spouseBendTestDate);
      let solutionSet: SolutionSet;
  
      while (personA.retirementBenefitDate <= spouseAendTestDate && personA.endSuspensionDate <= spouseAendTestDate) {
          //Reset personB.retirementBenefitDate to earliest possible (i.e., their "age 62 for whole month" month, or today's month if they're currently older than 62, or earliest retroactive date if they're older than FRA)
            personB.retirementBenefitDate = this.findEarliestPossibleRetirementBenefitDate(personB)
  
          //If personB is disabled or already filed, reset suspension begin/end dates, and set retirementBenefitDate using fixedRetirementBenefitDate field
            if (personB.isOnDisability === true || personB.hasFiled === true) {
              if (this.today > personB.FRA){
                personB.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
                personB.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
              }
              else {
                personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
                personB.endSuspensionDate = new MonthYearDate(personB.FRA)
              }
              personB.retirementBenefitDate = new MonthYearDate(personB.fixedRetirementBenefitDate)
            }
  
          //After personB's retirementBenefitDate has been reset, reset spousal dates as necessary for personA and personB
            personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
            personB = this.adjustSpousalBenefitDate(personB, personA, scenario)
  
          while (personB.retirementBenefitDate <= spouseBendTestDate && personB.endSuspensionDate <= spouseBendTestDate) {
            //Calculate PV using current testDates
              let currentTest: ClaimStrategy = this.calculatePVservice.calculateCouplePV(personA, personB, scenario, false)
              
               // store data for this combination of claim dates
              scenario.range.processPVs(currentTest)
  
              //If PV is greater than saved PV, save new PV and save new testDates.
              if (currentTest.PV >= savedStrategy.PV) {
                savedStrategy = new ClaimStrategy(personA, personB)
                savedStrategy.PV = currentTest.PV
              }
  
            //Find next possible claiming combination for spouseB
              personB = this.incrementRetirementORendSuspensionDate(personB)
              personB = this.adjustSpousalBenefitDate(personB, personA, scenario)
  
            //After personB's retirement/spousal dates have been incremented, adjust personA's spousal date as necessary
              personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
  
          }
          //Increment personA's retirementBenefitDate
            personA = this.incrementRetirementORendSuspensionDate(personA)
          
        }
      //after loop is finished, set person objects' benefit dates to the saved dates, for sake of running PV calc again for outputTable
        personA.retirementBenefitDate = new MonthYearDate(savedStrategy.personARetirementDate)
        personA.spousalBenefitDate = new MonthYearDate(savedStrategy.personASpousalDate)
        if (savedStrategy.personAchildInCareSpousalDate) {personA.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personAchildInCareSpousalDate)}
        personA.beginSuspensionDate = new MonthYearDate(savedStrategy.personABeginSuspensionDate)
        personA.endSuspensionDate = new MonthYearDate(savedStrategy.personAEndSuspensionDate)
        personB.retirementBenefitDate = new MonthYearDate(savedStrategy.personBRetirementDate)
        personB.spousalBenefitDate = new MonthYearDate(savedStrategy.personBSpousalDate)
        if (savedStrategy.personBchildInCareSpousalDate) {personB.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personBchildInCareSpousalDate)}
        personB.beginSuspensionDate = new MonthYearDate(savedStrategy.personBBeginSuspensionDate)
        personB.endSuspensionDate = new MonthYearDate(savedStrategy.personBEndSuspensionDate)
        savedStrategy = this.calculatePVservice.calculateCouplePV(personA, personB, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable
  
        //Generate solution set (for sake of output) from saved values
        solutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, personA, personB, savedStrategy)
        
        // console.log(solutionSet);
  
        scenario.range.initFracsAndColors();
  
        return solutionSet
    }


//This function is for when one spouse is over 70 (and therefore has no retirement age or suspension age to iterate).
//Also is the function for a divorcee, because we take the ex-spouse's filing date as a given (i.e., as an input)
maximizeCouplePViterateOnePerson(scenario:CalculationScenario, flexibleSpouse:Person, fixedSpouse:Person) : SolutionSet{

  let deemedFilingCutoff: Date = new Date(1954, 0, 1); 
  scenario.restrictedApplicationPossible = (flexibleSpouse.actualBirthDate < deemedFilingCutoff);

    fixedSpouse.retirementBenefitDate = new MonthYearDate(fixedSpouse.fixedRetirementBenefitDate)

    //find initial retirementBenefitDate for flexibleSpouse
    flexibleSpouse.retirementBenefitDate = new MonthYearDate(this.findEarliestPossibleRetirementBenefitDate(flexibleSpouse))

    //If flexibleSpouse has already filed or is on disability, initialize their begin&end suspension date as their FRA (but no earlier than this month). And set retirementBenefitDate to fixedRetirementBenefitDate
      flexibleSpouse = this.initializeBeginEndSuspensionDates(flexibleSpouse)

    //Set initial spousalBenefitDate for flexibleSpouse and fixed spouse
      flexibleSpouse = this.adjustSpousalBenefitDate(flexibleSpouse, fixedSpouse, scenario)
      fixedSpouse = this.adjustSpousalBenefitDate(fixedSpouse, flexibleSpouse, scenario)

    //Set survivorBenefitDate fields to survivorFRA. (We're just assuming here that nobody files for survivor benefits early.)
      flexibleSpouse.survivorBenefitDate = new MonthYearDate(flexibleSpouse.survivorFRA)
      fixedSpouse.survivorBenefitDate = new MonthYearDate(fixedSpouse.survivorFRA)

    //Initialize savedStrategy, with zero PV, using each spouse's current dates
    let savedStrategy:ClaimStrategy
    if (flexibleSpouse.id == "A"){
      savedStrategy = new ClaimStrategy(flexibleSpouse, fixedSpouse)
    }
    else {
      savedStrategy = new ClaimStrategy(fixedSpouse, flexibleSpouse)
    }
    savedStrategy.PV = 0

    //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
      flexibleSpouse = this.familyMaximumService.calculateFamilyMaximum(flexibleSpouse, this.today)
      fixedSpouse = this.familyMaximumService.calculateFamilyMaximum(fixedSpouse, this.today)

    //Set endTestDate equal to the month flexibleSpouse turns 70. (Or if they have PIA=0, set to point at which their spousal would be maximized -- ie they have reached FRA and other person is 70) If using fixed-death-age-assumption younger than 70, don't let it be later than assumed month of death
      let endTestDate = new MonthYearDate(this.findLastDateForPersonToStoreInRange(flexibleSpouse, fixedSpouse))

    //Create new range object for storage of data   
      scenario.range = new Range(flexibleSpouse.retirementBenefitDate, endTestDate);      

    while (flexibleSpouse.retirementBenefitDate <= endTestDate && flexibleSpouse.endSuspensionDate <= endTestDate) {
      //Calculate PV using current test dates for flexibleSpouse and fixed dates for fixedSpouse
      //and call processPVs to store data for this combination of claim dates
      if (flexibleSpouse.id == "A"){
        var currentTest: ClaimStrategy = this.calculatePVservice.calculateCouplePV(flexibleSpouse, fixedSpouse, scenario, false)
        scenario.range.processPVs(currentTest)
      }
      else {
        var currentTest: ClaimStrategy = this.calculatePVservice.calculateCouplePV(fixedSpouse, flexibleSpouse, scenario, false)
        scenario.range.processPVs(currentTest)
      }



      //If PV is greater than or equal to saved PV, save new PV and save new testDates
      if (currentTest.PV >= savedStrategy.PV) {
        if (flexibleSpouse.id == "A"){
          savedStrategy = new ClaimStrategy(flexibleSpouse, fixedSpouse)
        }
        else {
          savedStrategy = new ClaimStrategy(fixedSpouse, flexibleSpouse)
        }
        savedStrategy.PV = currentTest.PV
        }
      
      //Increment flexibleSpouse's dates (and fixedSpouse's spousal date, which is usually just set to be same as flexible spouse's retirement date)
        flexibleSpouse = this.incrementRetirementORendSuspensionDate(flexibleSpouse)
        flexibleSpouse = this.adjustSpousalBenefitDate(flexibleSpouse, fixedSpouse, scenario)
        fixedSpouse = this.adjustSpousalBenefitDate(fixedSpouse, flexibleSpouse, scenario)

    }

      //after loop is finished, set person objects' benefit dates to the saved dates, for sake of running PV calc again for outputTable
      if (flexibleSpouse.id == "A"){
        flexibleSpouse.retirementBenefitDate = new MonthYearDate(savedStrategy.personARetirementDate)
        flexibleSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personASpousalDate)
        flexibleSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personAchildInCareSpousalDate)
        flexibleSpouse.beginSuspensionDate = new MonthYearDate(savedStrategy.personABeginSuspensionDate)
        flexibleSpouse.endSuspensionDate = new MonthYearDate(savedStrategy.personAEndSuspensionDate)
        fixedSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personBSpousalDate)
        fixedSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personBchildInCareSpousalDate)
        savedStrategy = this.calculatePVservice.calculateCouplePV(flexibleSpouse, fixedSpouse, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable
      }
      else {//flexible spouse is personB
        flexibleSpouse.retirementBenefitDate = new MonthYearDate(savedStrategy.personBRetirementDate)
        flexibleSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personBSpousalDate)
        flexibleSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personBchildInCareSpousalDate)
        flexibleSpouse.beginSuspensionDate = new MonthYearDate(savedStrategy.personBBeginSuspensionDate)
        flexibleSpouse.endSuspensionDate = new MonthYearDate(savedStrategy.personBEndSuspensionDate)
        fixedSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personASpousalDate)
        fixedSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personAchildInCareSpousalDate)
        savedStrategy = this.calculatePVservice.calculateCouplePV(fixedSpouse, flexibleSpouse, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable
      }
  
      //generate solutionSet
      if (flexibleSpouse.id == "A"){
        var solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, flexibleSpouse, fixedSpouse, savedStrategy)
      }
      else {
        var solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, fixedSpouse, flexibleSpouse, savedStrategy)
      }

      // console.log(solutionSet)

      scenario.range.initFracsAndColors();

      return solutionSet
  }


    //this function is used to iterate combinations of retirement/survivor benefit dates for a person who is already widow(er) when using calculator
    maximizeSurvivorPV(personA:Person, personB:Person, scenario:CalculationScenario) : SolutionSet{

      //find initial retirementBenefitDate for personA
      personA.retirementBenefitDate = this.findEarliestPossibleRetirementBenefitDate(personA)
  
      //find initial survivorBenefitDate for personA.
      if (personA.hasFiledAsSurvivor === false){personA.survivorBenefitDate = this.findEarliestSurvivorBenefitDate(personA, personB)}
      else {personA.survivorBenefitDate = new MonthYearDate(personA.fixedSurvivorBenefitDate)}
  
      //find motherFatherBenefitDate for personA. Doesn't have to be iterated at all. Doesn't depend on anybody's various filing dates.
        //(Don't want to do this if they've already filed. If they've already filed we go get the applicable fixed date in home component.)
      if (personA.hasFiledAsMotherFather === false){personA.motherFatherBenefitDate = this.findEarliestMotherFatherBenefitDate(personB, scenario)}


      //set personB.retirementBenefitDate (date they actually filed if applicable; if they hadn't filed then FRA if they died prior to FRA or date of death if they died after FRA)
        if (personB.hasFiled === true){
          personB.retirementBenefitDate = new MonthYearDate(personB.fixedRetirementBenefitDate)
        }
        else {//personB had not filed as of date of death
          if (personB.dateOfDeath < personB.FRA){
            personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
          }
          else {
            personB.retirementBenefitDate = new MonthYearDate(personB.dateOfDeath)
          }
        }
  
      //If personA has already filed or is on disability, initialize their begin&end suspension date as their FRA (but no earlier than this month), and set that person's retirementBenefitDate using fixedRetirementBenefitDate field 
          personA = this.initializeBeginEndSuspensionDates(personA)
  
      //Set initial spousalBenefitDates based on initial retirementBenefitDates. (This date doesn't really matter in survivor scenario, but we need some value there.)
          personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
          personB = this.adjustSpousalBenefitDate(personB, personA, scenario)
  
      //Initialize savedStrategy, with zero PV, using personA's and personB's current dates
        let savedStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
        savedStrategy.PV = 0
  
      //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
        personA = this.familyMaximumService.calculateFamilyMaximum(personA, this.today)
        personB = this.familyMaximumService.calculateFamilyMaximum(personB, this.today)
  
      //Set endingTestDate for each type of benefit.
        //For retirement, the month personA turns 70.
        let retirementBenefitEndTestDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+70, personA.SSbirthDate.getMonth())
        //For survivor, earliest possible survivorBenefitDate that is not before survivorFRA
        let survivorBenefitEndTestDate = this.findLatestSurvivorBenefitDate(personA, personB)
  
      //Get limits for storage of PV for range of claim options
        let earliestStartRetirement: MonthYearDate = new MonthYearDate(personA.retirementBenefitDate)
        if (personA.endSuspensionDate > earliestStartRetirement) {
          earliestStartRetirement = new MonthYearDate(personA.endSuspensionDate)
        }
        let earliestStartSurvivor: MonthYearDate = new MonthYearDate(personA.survivorBenefitDate)
  
  
      //Create new range object for storage of data
        scenario.range = new Range(earliestStartRetirement, retirementBenefitEndTestDate, earliestStartSurvivor, survivorBenefitEndTestDate)
        let solutionSet: SolutionSet
  
      while (personA.retirementBenefitDate <= retirementBenefitEndTestDate && personA.endSuspensionDate <= retirementBenefitEndTestDate) {
          //Reset personA.survivorBenefitDate to earliest possible
            personA.survivorBenefitDate = this.findEarliestSurvivorBenefitDate(personA, personB)
  
          while (personA.survivorBenefitDate <= survivorBenefitEndTestDate) {
            //Calculate PV using current testDates
              let currentTest: ClaimStrategy = this.calculatePVservice.calculateCouplePV(personA, personB, scenario, false)
              
               //Store data for this combination of claim dates
              scenario.range.processPVs(currentTest)
  
              //If PV is greater than saved PV, save new PV and save new testDates.
              if (currentTest.PV >= savedStrategy.PV) {
                savedStrategy = new ClaimStrategy(personA, personB)
                savedStrategy.PV = currentTest.PV
              }
  
            //Increment personA.survivorBenefitDate
              personA.survivorBenefitDate.setMonth(personA.survivorBenefitDate.getMonth()+1)
          } 
          //Increment personA's retirementBenefitDate, and reset spousal benefit dates as necessary. (Spousal dates shouldn't matter really...)
            personA = this.incrementRetirementORendSuspensionDate(personA)
            personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
            personB = this.adjustSpousalBenefitDate(personB, personA, scenario)
      }
      //after loop is finished, set person objects' benefit dates to the saved dates, for sake of running PV calc again for outputTable
        personA.retirementBenefitDate = new MonthYearDate(savedStrategy.personARetirementDate)
        personA.spousalBenefitDate = new MonthYearDate(savedStrategy.personASpousalDate)
        personA.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personAchildInCareSpousalDate)
        personA.beginSuspensionDate = new MonthYearDate(savedStrategy.personABeginSuspensionDate)
        personA.endSuspensionDate = new MonthYearDate(savedStrategy.personAEndSuspensionDate)
        personA.survivorBenefitDate = new MonthYearDate(savedStrategy.personAsurvivorDate)
        //No need to set personA.motherFatherBenefitDate again, since it was never varied.
        personB.retirementBenefitDate = new MonthYearDate(savedStrategy.personBRetirementDate)
        personB.spousalBenefitDate = new MonthYearDate(savedStrategy.personBSpousalDate)
        personB.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personBchildInCareSpousalDate)
        personB.beginSuspensionDate = new MonthYearDate(savedStrategy.personBBeginSuspensionDate)
        personB.endSuspensionDate = new MonthYearDate(savedStrategy.personBEndSuspensionDate)
        savedStrategy = this.calculatePVservice.calculateCouplePV(personA, personB, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable
  
        //Generate solution set (for sake of output) from saved values
        solutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, personA, personB, savedStrategy)
        
        // console.log(solutionSet);
  
        scenario.range.initFracsAndColors();
  
        return solutionSet
    }



  //Adjusts spousal date as necessary. Is used after new retirement date is selected for either person.
  //Regarding retroactive applications, they are generally handled by the fact that person's retirementBenefitDate could be a retroactive date, with appropriate limitations.
    //In case of restricted application though (where person's spousalBenefitDate is set without regard to person's retirementBenefitDate) we have to check and make sure it's no more than 6 (or 12) months ago
    adjustSpousalBenefitDate(person:Person, otherPerson:Person, scenario:CalculationScenario) : Person {
      let deemedFilingCutoff: Date = new Date(1954, 0, 1)
      let otherPersonsLimitingDate: MonthYearDate
  
      //Determine "otherPerson's Limiting Date" (i.e., the date -- based on otherPerson -- before which "Person" cannot file a spousal benefit)
        if (scenario.maritalStatus == "married") {
          otherPersonsLimitingDate = new MonthYearDate(otherPerson.retirementBenefitDate)
        }
        else if (scenario.maritalStatus == "divorced"){//If divorced, otherPersonsLimitingDate is first month for which otherPerson is age 62 all month
          otherPersonsLimitingDate = new MonthYearDate(otherPerson.actualBirthDate.getFullYear()+62, otherPerson.actualBirthDate.getMonth())
          if (otherPerson.actualBirthDate.getDate() > 1) {//i.e., if they are born after 2nd of month ("1" is second of month)
            otherPersonsLimitingDate.setMonth(otherPersonsLimitingDate.getMonth()+1)
          }
        }
        if (otherPerson.isOnDisability === true){//If otherPerson is disabled, there is no "otherPersonsLimitingDate." So just make this own "age 62 all month" month
        //Also, this check has to come last since it overrides others.
          otherPersonsLimitingDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth())
          if (person.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
            otherPersonsLimitingDate.setMonth(otherPersonsLimitingDate.getMonth()+1)
          }
        }
  
      if (person.actualBirthDate >= deemedFilingCutoff) {//i.e., if person has new deemed filing rules
        //set spousalBenefitDate to own retirementBenefitDate, but no earlier than otherPersonsLimitingDate
        if (person.retirementBenefitDate > otherPersonsLimitingDate) {
          person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
        }
        else {
          person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
        }
      }
      else {//i.e., if person has old deemed filing rules
        if (person.retirementBenefitDate < person.FRA) {
          //set spousalBenefitDate to own retirementBenefitDate, but no earlier than otherPersonsLimitingDate
          if (person.retirementBenefitDate > otherPersonsLimitingDate) {
            person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
          }
          else {
            person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
          }
        }
        else {//i.e., if person's retirementBenefitDate currently after his/her FRA
          //Set person's spousalBenefitDate to earliest possible restricted application date (i.e., later of FRA or otherPersonsLimitingDate)
            //...but no earlier than 6 months ago (or 12 months ago if otherPerson is disabled)
          if (person.FRA > otherPersonsLimitingDate) {
            person.spousalBenefitDate = new MonthYearDate(person.FRA)
          }
          else {
            person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
          }
          if (otherPerson.isOnDisability === false){
            if (person.spousalBenefitDate < this.sixMonthsAgo){
              person.spousalBenefitDate = new MonthYearDate(this.sixMonthsAgo)
            }
          }
          else {//i.e., otherPerson is on disability
            if (person.spousalBenefitDate < this.twelveMonthsAgo){
              person.spousalBenefitDate = new MonthYearDate(this.twelveMonthsAgo)
            }
          }
        }
      }
      //If person has already filed for retirement or is on disability, don't let spousalBenefitDate be before retirementBenefitDate (otherwise it will try retroactive spousal appplications in some cases where they can't actually happen)
        if ( (person.hasFiled === true || person.isOnDisability) && person.spousalBenefitDate < person.retirementBenefitDate){
          person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
        }
  
      //If there are minor or disabled children, spousalBenefitDate represents date on which regular spousal benefit (as opposed to child-in-care spousal benefit) begins.
        if (scenario.children.length > 0){
          //if there is a disabled child or a child under 16 when otherPerson begins retirement benefit, don't let spousalBenefitDate be before own FRA.
            //In other words, we're assuming here that person doesn't file Form SSA-25. We're letting them claim child-in-care spousal benefits, then letting it stop when youngest child reaches 16 (if not yet FRA and no disabled child), then start again at FRA.
          if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, otherPerson.retirementBenefitDate)=== true){
            if (person.spousalBenefitDate < person.FRA){
              person.spousalBenefitDate = new MonthYearDate(person.FRA)
            }
            //Unless person files for own retirement benefit before FRA and after child-in-care spousal was suspended, in which case they'd be deemed to file for regular spousal benefits at that time as well.
            if (person.retirementBenefitDate < person.FRA && person.retirementBenefitDate >= scenario.youngestChildTurns16date && scenario.disabledChild === false){
              person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
            }
          }
          //Find date on which child-in-care spousal benefit begins
            //If married, is otherPerson.retirementBenefitDate, but no earlier than 6 months ago (12 months if otherPerson is disabled). Can be retroactive before FRA because spousal would not be reduced for age because it's child-in-care.
            if (scenario.maritalStatus == "married"){
              person.childInCareSpousalBenefitDate = new MonthYearDate(otherPerson.retirementBenefitDate)
              if (otherPerson.isOnDisability === false){//otherPerson is NOT on disability
                if (person.childInCareSpousalBenefitDate < this.sixMonthsAgo){
                  person.childInCareSpousalBenefitDate = new MonthYearDate(this.sixMonthsAgo)
                }
              }
              else {//i.e., otherPerson IS on disability
                if (person.childInCareSpousalBenefitDate < this.twelveMonthsAgo){
                  person.childInCareSpousalBenefitDate = new MonthYearDate(this.twelveMonthsAgo)
                }
              }
            }
            //If divorced, we aren't concerned with when otherPerson files. Also, deemed filing applies here.
                //That is, the exception to deemed filing for child-in-care spousal only applies to still-married couples. So an application for child-in-care spousal benefits would also be an application for retirement benefits.
                //As such, childInCareSpousalBenefitDate is own retirementBenefitDate, but no earlier than when otherPerson turns age 62
            if (scenario.maritalStatus == "divorced"){
              person.childInCareSpousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
              let otherPersonAge62Date:MonthYearDate = new MonthYearDate(otherPerson.SSbirthDate.getFullYear()+62, otherPerson.SSbirthDate.getMonth())
              if (person.childInCareSpousalBenefitDate < otherPersonAge62Date){
                person.childInCareSpousalBenefitDate = new MonthYearDate(otherPersonAge62Date)
              }
            }
        }  
  
      return person
    }

    incrementRetirementORendSuspensionDate(person:Person) : Person {
      if (person.isOnDisability === true) {
        person.endSuspensionDate.setMonth(person.endSuspensionDate.getMonth()+1)
      }
      else if (person.hasFiled === true){
        person.endSuspensionDate.setMonth(person.endSuspensionDate.getMonth()+1)
      }
      else {//i.e., person hasn't filed and isn't disabled
      person.retirementBenefitDate.setMonth(person.retirementBenefitDate.getMonth()+1)
      }
      return person
    }

    findEarliestPossibleRetirementBenefitDate(person:Person):MonthYearDate{
      let earliestRetirementBenefitDate:MonthYearDate
          //begin with first month for which they are considered 62 for entire month
          earliestRetirementBenefitDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth())
          if (person.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
            earliestRetirementBenefitDate.setMonth(earliestRetirementBenefitDate.getMonth() + 1)
          }
          //If person is currently over age 62 when filling out form, adjust their initial retirementBenefitDate to today's month/year instead of their age 62 month/year.
          if (person.initialAge > 62){
            earliestRetirementBenefitDate = new MonthYearDate(this.today)
          }
          //If person is currently beyond FRA when filling out form, set their initial retirementBenefitDate to earliest retroactive date (6 months ago but no earlier than FRA)
          if (this.today > person.FRA){
            earliestRetirementBenefitDate = new MonthYearDate(this.sixMonthsAgo)
            if (earliestRetirementBenefitDate < person.FRA){
              earliestRetirementBenefitDate = new MonthYearDate(person.FRA)
            }
          }
      return earliestRetirementBenefitDate
    }

    findLatestRetirementBenefitDate(person:Person):MonthYearDate{
      //the month they turn 70, or if using fixed-death-age-assumption younger than 70, set to assumed month of death
      let latestRetirementBenefitDate:MonthYearDate
      latestRetirementBenefitDate = new MonthYearDate(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth())
      if (person.mortalityTable[70] == 0) {
        let deceasedByAge:number = person.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69. But we want last possible filing date suggested to be 68, so we subtract 1 in following line.
        latestRetirementBenefitDate = new MonthYearDate(person.SSbirthDate.getFullYear()+deceasedByAge-1, person.SSbirthDate.getMonth())
      }
      return latestRetirementBenefitDate
    }

    findEarliestSurvivorBenefitDate(livingPerson:Person, deceasedPerson:Person):MonthYearDate{
      let earliestSurvivorBenefitDate:MonthYearDate
      if (livingPerson.hasFiledAsSurvivor === false){
        if (livingPerson.isOnDisability === false){
          //Begin with month in which person turns 60. (Note, it's not "60 all month." See CFR 404.337 as opposed to 404.311)
          earliestSurvivorBenefitDate = new MonthYearDate(livingPerson.SSbirthDate.getFullYear()+60, livingPerson.SSbirthDate.getMonth())
          //If person is already over 60, adjust to today's month/year instead of their age 60 month/year.
          if (livingPerson.initialAge > 60){
            earliestSurvivorBenefitDate = new MonthYearDate(this.today)
          }
          //If person is already beyond survivorFRA, adjust to earliest retroactive date (6 months ago, but no earlier than survivorFRA)
          if (this.today > livingPerson.survivorFRA){
            earliestSurvivorBenefitDate = new MonthYearDate(this.sixMonthsAgo)
            if (earliestSurvivorBenefitDate < livingPerson.survivorFRA){
              earliestSurvivorBenefitDate = new MonthYearDate(livingPerson.survivorFRA)
            }
          }
        }
        else {//i.e., person is disabled
            //Begin with earliest retroactive date (12 months ago)
            earliestSurvivorBenefitDate = new MonthYearDate(this.twelveMonthsAgo)
            //But don't let be earlier than age 50
            if (earliestSurvivorBenefitDate < new MonthYearDate(livingPerson.SSbirthDate.getFullYear()+50, livingPerson.SSbirthDate.getMonth())){
              earliestSurvivorBenefitDate = new MonthYearDate(livingPerson.SSbirthDate.getFullYear()+50, livingPerson.SSbirthDate.getMonth())
            }
        }
        //Regardless of above, do not let survivorBenefitDate be earlier than deceasedPerson.dateOfDeath
        if (earliestSurvivorBenefitDate < deceasedPerson.dateOfDeath){
          earliestSurvivorBenefitDate = new MonthYearDate(deceasedPerson.dateOfDeath)
        }
      }
      else {//i.e., livingPerson has already filed for survivorBenefit
        earliestSurvivorBenefitDate = new MonthYearDate(livingPerson.fixedSurvivorBenefitDate)
      }
      return earliestSurvivorBenefitDate
    }

    findLatestSurvivorBenefitDate(livingPerson:Person, deceasedPerson:Person):MonthYearDate{
      let latestSurvivorBenefitDate:MonthYearDate
      if (livingPerson.hasFiledAsSurvivor === false){
        //Basically, find the earliest date that is an option and no earlier than survivorFRA
        latestSurvivorBenefitDate = new MonthYearDate(this.findEarliestSurvivorBenefitDate(livingPerson, deceasedPerson))
        if (latestSurvivorBenefitDate < livingPerson.survivorFRA){latestSurvivorBenefitDate = new MonthYearDate(livingPerson.survivorFRA)}
      }
      else {//i.e., livingPerson has already filed for survivorBenefit
        latestSurvivorBenefitDate = new MonthYearDate(livingPerson.fixedSurvivorBenefitDate)
      }
      return latestSurvivorBenefitDate
    }

    findEarliestMotherFatherBenefitDate(deceasedPerson:Person, scenario:CalculationScenario):MonthYearDate{
      let motherFatherBenefitDate:MonthYearDate
      //return undefined if childUnder16orDisabled === false as of date calculator is being used
      if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, this.today) === false){
        return undefined
      }
      //Per 404.621, retroactivity up to 6 months allowed (but no earlier than date of death). Doesn't matter if mother/father is disabled or not. Doesn't matter if FRA or not.
      motherFatherBenefitDate = new MonthYearDate(this.sixMonthsAgo)
      if (motherFatherBenefitDate < deceasedPerson.dateOfDeath){
        motherFatherBenefitDate = new MonthYearDate(deceasedPerson.dateOfDeath)
      }
      return motherFatherBenefitDate
    }

    initializeBeginEndSuspensionDates(person:Person):Person{
      //If user has already filed or is on disability, initialize begin/end suspension dates as later of their FRA or today, and set person's retirementBenefitDate using fixedRetirementBenefitDate field 
      if (person.isOnDisability === true || person.hasFiled === true) {
        if (this.today > person.FRA){
          person.beginSuspensionDate = new MonthYearDate(this.today)
          person.endSuspensionDate = new MonthYearDate(this.today)
        }
        else {
          person.beginSuspensionDate = new MonthYearDate(person.FRA)
          person.endSuspensionDate = new MonthYearDate(person.FRA)
        }
        person.retirementBenefitDate = new MonthYearDate(person.fixedRetirementBenefitDate)
      }
      return person
    }

    findEarliestDateForPersonToStoreInRange(person:Person):MonthYearDate{
      let earliestDate:MonthYearDate
      if (person.spousalBenefitDate){
        earliestDate = new MonthYearDate(person.spousalBenefitDate)
      }
      if (person.childInCareSpousalBenefitDate){
        earliestDate = new MonthYearDate(person.childInCareSpousalBenefitDate)
      }
      if (earliestDate > person.retirementBenefitDate && person.PIA > 0) {
        earliestDate = new MonthYearDate(person.retirementBenefitDate)
      }
      if (person.endSuspensionDate > earliestDate) {
        earliestDate = new MonthYearDate(person.endSuspensionDate)
      }
      return earliestDate
    }
  
    findLastDateForPersonToStoreInRange(person:Person, otherPerson:Person):MonthYearDate{
      let lastDate:MonthYearDate
      let personAge70Date:MonthYearDate = new MonthYearDate(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth())
      let otherPersonAge70Date:MonthYearDate = new MonthYearDate(otherPerson.SSbirthDate.getFullYear()+70, otherPerson.SSbirthDate.getMonth())
  
      if (person.PIA == 0){//person has no PIA, so we're looking at spousal dates, so latest date is point at which they have reached FRA and otherPerson has reached age 70
        if (person.FRA > otherPersonAge70Date){
          lastDate = new MonthYearDate(person.FRA)
        }
        else {
          lastDate = new MonthYearDate(otherPersonAge70Date)
        }
      }
      else {//person has their own PIA, so it's their age 70 date
        lastDate = new MonthYearDate(personAge70Date)
      }
      //If using fixed-death-age-assumption younger than 70, don't let lastDate be later than assumed month of death
      if (person.mortalityTable[70] == 0) {
        let deceasedByAge:number = person.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69. But we want last possible filing date suggested to be 68, so we subtract 1 in following line.
        let noLaterThanThisDate = new MonthYearDate(person.SSbirthDate.getFullYear()+deceasedByAge-1, person.SSbirthDate.getMonth())
        if (lastDate > noLaterThanThisDate){
          lastDate = new MonthYearDate(noLaterThanThisDate)
        }
      }
      return lastDate
    }

}
