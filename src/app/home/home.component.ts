import {Component, OnInit} from '@angular/core'
import {BirthdayService} from '../birthday.service'
import {PresentValueService} from '../presentvalue.service'
import {MortalityService} from '../mortality.service'
import {Person} from '../data model classes/person'
import {SolutionSet} from '../data model classes/solutionset'
import {FREDresponse} from '../data model classes/fredresponse'
import {HttpClient} from '@angular/common/http'
import {CalculationScenario} from '../data model classes/calculationscenario'
import {ErrorCollection} from '../data model classes/errorcollection'
import {InputValidationService} from '../inputvalidation.service'
import {MonthYearDate} from "../data model classes/monthyearDate"


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private inputValidationService:InputValidationService, private birthdayService: BirthdayService, private presentvalueService: PresentValueService, private mortalityService: MortalityService,
    private http: HttpClient) { }

  ngOnInit() {
    this.http.get<FREDresponse>("https://www.quandl.com/api/v3/datasets/FRED/DFII20.json?limit=1&api_key=iuEbMEnRuZzmUpzMYgx3")
    .subscribe(
      data => {this.scenario.discountRate = data.dataset.data[0][1]},
      error => {this.scenario.discountRate = 1}
    )
  }

  personA:Person = new Person("A")
  personB:Person = new Person("B")
  scenario:CalculationScenario = new CalculationScenario()
  customDateScenario:CalculationScenario
  errorCollection:ErrorCollection = new ErrorCollection()
  today:MonthYearDate = new MonthYearDate()
  deemedFilingCutoff: Date = new Date(1954, 0, 1)
  statusMessage:string = ""
  primaryFormHasChanged: boolean = false
        /*
        This is set to true when they change an input in the primary form. Then set to false after onSubmit() has been run. Point is that we want the whole maximize function to be run when
        they use the "submit" button on alternative date form if they changed a primary form input. But we don't want to do all that math if they just provided new custom dates.
        */

//Variables to make form work
  inputMonths: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  inputDays: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
              16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
  inputYears = [1925, 1926, 1927, 1928, 1929,
              1930, 1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939,
              1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949,
              1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
              1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969,
              1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
              1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
              1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
              2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
              2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018]

  inputBenefitYears = [1979, //Can't go earlier than 1979 or calculation rules are different. Tough luck to anybody older.
                    1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
                    1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
                    2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
                    2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
                    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
                    2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
                    2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049,
                    2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059,
                    2060]

  quitWorkYears = [ 2018, 2019,
    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
    2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
    2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049,
    2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059,
    2060, 2061, 2062, 2063, 2065, 2065, 2066, 2067, 2069, 2070 ]


//Inputs from form
  personAinputMonth: number = 4
  personAinputDay: number = 15
  personAinputYear: number = 1960
  personAfixedRetirementBenefitMonth: number
  personAfixedRetirementBenefitYear: number
  personBfixedRetirementBenefitMonth: number
  personBfixedRetirementBenefitYear: number
  personAgender: string = "male"
  personAassumedDeathAge: number = 0
  personAmortalityInput: string = "SSA"
  personBinputMonth: number = 4
  personBinputDay: number = 15
  personBinputYear: number = 1960
  personBgender: string = "female"
  personBmortalityInput: string = "SSA"
  personBassumedDeathAge: number = 0
  advanced: boolean = false

    //earnings test inputs
    personAworking: boolean = false
    personAquitWorkYear: number
    personAquitWorkMonth: number
    personBworking: boolean = false
    personBquitWorkYear: number
    personBquitWorkMonth: number

  //Inputs from custom date form
  customPersonAretirementBenefitMonth: number
  customPersonAretirementBenefitYear: number
  customPersonAspousalBenefitMonth: number
  customPersonAspousalBenefitYear: number
  customPersonBretirementBenefitMonth: number
  customPersonBretirementBenefitYear: number
  customPersonBspousalBenefitMonth: number
  customPersonBspousalBenefitYear: number
  customPersonAbeginSuspensionMonth: number
  customPersonAbeginSuspensionYear: number
  customPersonAendSuspensionMonth: number
  customPersonAendSuspensionYear: number
  customPersonBbeginSuspensionMonth: number
  customPersonBbeginSuspensionYear: number
  customPersonBendSuspensionMonth: number
  customPersonBendSuspensionYear: number


  //solution variables
  customPV: number
  differenceInPV: number
  solutionSet: SolutionSet = {
    "solutionPV":null,
    "solutionsArray": []
  }


  onSubmit() {
    this.waitCursor()
    setTimeout( () => {//whole rest of this function is in a setTimeout statement, to have 10 millisecond delay, to give DOM time to update with status message from waitCursor()
    let startTime = performance.now() //for testing performance
    console.log("-------------")
    this.getPrimaryFormInputs()
    this.scenario.outputTableComplete = false //set this to false to begin with, in case it had been true from prior runs of function
    this.errorCollection = this.inputValidationService.checkForFixedRetirementDateErrors(this.errorCollection, this.scenario, this.personA, this.personB)
    this.focusError()

    //If there are no fixedRetirementDate errors, call appropriate "maximizePV" function to find best solution
    if (this.errorCollection.hasErrors === false){
      if (this.scenario.maritalStatus == "single") {
        this.solutionSet = this.presentvalueService.maximizeSinglePersonPV(this.personA, this.scenario)
      }
      else if (this.scenario.maritalStatus == "married"){
            if (this.personA.initialAge < 70 && this.personB.initialAge < 70) {//i.e., if both spouses are under 70 (and we therefore need to iterate ages for both)
              this.solutionSet = this.presentvalueService.maximizeCouplePViterateBothPeople(this.personA, this.personB, this.scenario)
            }
            else if (this.personA.initialAge >= 70){//if personA is over 70, we only need to iterate ages for B
              this.solutionSet = this.presentvalueService.maximizeCouplePViterateOnePerson(this.scenario, this.personB, this.personA)
            }
            else if (this.personB.initialAge >= 70){//if personB is over 70, we only need to iterate ages for A
              this.solutionSet = this.presentvalueService.maximizeCouplePViterateOnePerson(this.scenario, this.personA, this.personB)
            }
      }
      else if (this.scenario.maritalStatus == "divorced") {
            this.solutionSet = this.presentvalueService.maximizeCouplePViterateOnePerson(this.scenario, this.personA, this.personB)
      }
    }
    this.normalCursor()
    this.primaryFormHasChanged = false//Set this to false so that customDates() doesn't rerun onSubmit() next time it is run, unless another change is made to primary inputs
    if (this.customPersonAretirementBenefitMonth || this.customPersonAspousalBenefitMonth || this.customPersonBretirementBenefitMonth || this.customPersonBspousalBenefitMonth){//If custom date inputs have been provided (and this function is being rerun via top submit button after having changed a primary input), rerun the PV calc with custom dates and new primary inputs
      this.customDates()
    }
    //For testing performance
      let endTime = performance.now()
      let elapsed = (endTime - startTime) /1000
      this.statusMessage = ""
      console.log("Time elapsed: " + elapsed)
    }, 25)//This is the back-half of the "setTimeout"
  }

  customDates() {
    if (this.primaryFormHasChanged === true){//Have to rerun the original calculation again if a primary input has changed.
      this.onSubmit()
    }
    this.customPV = undefined //Makes custom date output disappear until new PV is calc'd. (We don't want a broken-looking half-table appearing if there is an error in new inputs.)

    //If there are inputs for a fixedRetirementBenefitDate (as would be the case if person has filed or is on disability -- or for personB in a divorce scenario) go get those inputs and make a Date object
    //Then use that object for personA's retirementBenefitDate. Otherwise, use input from Custom Date form
    if (this.personAfixedRetirementBenefitMonth || this.personAfixedRetirementBenefitYear){
      this.personA.fixedRetirementBenefitDate = new MonthYearDate(this.personAfixedRetirementBenefitYear, this.personAfixedRetirementBenefitMonth-1, 1)
      this.personA.retirementBenefitDate = new MonthYearDate(this.personA.fixedRetirementBenefitDate)
    }
    else {
      this.personA.retirementBenefitDate = new MonthYearDate(this.customPersonAretirementBenefitYear, this.customPersonAretirementBenefitMonth-1, 1)
    }
    if (this.personBfixedRetirementBenefitMonth || this.personBfixedRetirementBenefitYear){
      this.personB.fixedRetirementBenefitDate = new MonthYearDate(this.personBfixedRetirementBenefitYear, this.personBfixedRetirementBenefitMonth-1, 1)
      this.personB.retirementBenefitDate = new MonthYearDate(this.personB.fixedRetirementBenefitDate)
    }
    else {
      this.personB.retirementBenefitDate = new MonthYearDate(this.customPersonBretirementBenefitYear, this.customPersonBretirementBenefitMonth-1, 1)

    }
    //Get inputs for custom spousal dates
    this.personA.spousalBenefitDate = new MonthYearDate(this.customPersonAspousalBenefitYear, this.customPersonAspousalBenefitMonth-1, 1)
    this.personB.spousalBenefitDate = new MonthYearDate(this.customPersonBspousalBenefitYear, this.customPersonBspousalBenefitMonth-1, 1)

    //If there are inputs for custom begin/end suspension dates create Date objects and set applicable person field. (Set to 1900 if there are no inputs)
    if (this.customPersonAbeginSuspensionMonth || this.customPersonAbeginSuspensionYear) {
      this.personA.beginSuspensionDate = new MonthYearDate (this.customPersonAbeginSuspensionYear, this.customPersonAbeginSuspensionMonth-1, 1)
    }
    else {
      this.personA.beginSuspensionDate = new MonthYearDate(1900, 0, 1)
    }
    if (this.customPersonAendSuspensionMonth || this.customPersonAendSuspensionYear) {
      this.personA.endSuspensionDate = new MonthYearDate (this.customPersonAendSuspensionYear, this.customPersonAendSuspensionMonth-1, 1)
    }
    else {
      this.personA.endSuspensionDate = new MonthYearDate(1900, 0, 1)
    }
    if (this.customPersonBbeginSuspensionMonth || this.customPersonBbeginSuspensionYear) {
      this.personB.beginSuspensionDate = new MonthYearDate (this.customPersonBbeginSuspensionYear, this.customPersonBbeginSuspensionMonth-1, 1)
    }
    else {
      this.personB.beginSuspensionDate = new MonthYearDate(1900, 0, 1)
    }
    if (this.customPersonBendSuspensionMonth || this.customPersonBendSuspensionYear) {
      this.personB.endSuspensionDate = new MonthYearDate (this.customPersonBendSuspensionYear, this.customPersonBendSuspensionMonth-1, 1)
    }
    else {
      this.personB.endSuspensionDate = new MonthYearDate(1900, 0, 1)
    }


    //Get spousal benefit dates if there were no inputs from user (i.e. if personA won't actually file for a spousal benefit at any time, get the input that makes function run appropriately)
    if ( (this.personA.PIA > 0.5 * this.personB.PIA && this.personA.actualBirthDate > this.deemedFilingCutoff) || this.personA.declineSpousal === true ) {
      //If married, personA spousal date is later of retirement dates
      if (this.scenario.maritalStatus == "married") {
        if (this.personA.retirementBenefitDate > this.personB.retirementBenefitDate) {
          this.personA.spousalBenefitDate = new MonthYearDate(this.personA.retirementBenefitDate)
        }
        else {
          this.personA.spousalBenefitDate = new MonthYearDate(this.personB.retirementBenefitDate)
        }
      }
      //If divorced, personA spousal date is personA retirementdate
      else if (this.scenario.maritalStatus == "divorced"){
        this.personA.spousalBenefitDate = new MonthYearDate(this.personA.retirementBenefitDate)
      }
    }
    //Ditto, for personB
    if ( (this.personB.PIA > 0.5 * this.personA.PIA && this.personB.actualBirthDate > this.deemedFilingCutoff) || this.personB.declineSpousal === true ) {
      //personB spousal date is later of retirement dates
      if (this.personA.retirementBenefitDate > this.personB.retirementBenefitDate) {
        this.personB.spousalBenefitDate = new MonthYearDate(this.personA.retirementBenefitDate)
      }
      else {
        this.personB.spousalBenefitDate = new MonthYearDate(this.personB.retirementBenefitDate)
      }
    }

    //Check for errors in custom date inputs
   this.errorCollection = this.inputValidationService.checkForCustomDateErrors(this.errorCollection, this.scenario, this.personA, this.personB)


    //Calc PV with input dates
      //Create a new ClaimingScenario object that is a clone of the original one. It isn't a reference but a whole new one. So changes to original don't change this one. (This is necessary so that it can have a separate "outputTable" field from the original.)
        //Note though that any fields that are themselves objects will just be copied by reference. So changes to that object would change both ClaimingScenario objects.
        this.customDateScenario = Object.assign({}, this.scenario)
        this.customDateScenario.outputTableComplete = false //set this to false to begin with, in case it had been true from prior runs of function
    if (this.scenario.maritalStatus == "single" && this.errorCollection.hasErrors === false) {
      this.customPV = this.presentvalueService.calculateSinglePersonPV(this.personA, this.customDateScenario, true)
      }
    if(this.scenario.maritalStatus == "married" && this.errorCollection.hasErrors === false) {
      this.customPV = this.presentvalueService.calculateCouplePV(this.personA, this.personB, this.customDateScenario, true)
      }
    if(this.scenario.maritalStatus == "divorced" && this.errorCollection.hasErrors === false) {
      this.customPV = this.presentvalueService.calculateCouplePV(this.personA, this.personB, this.customDateScenario, true)
    }
    this.differenceInPV = this.solutionSet.solutionPV - this.customPV
  }

  //Use inputs to calculate ages, SSbirthdates, FRAs, etc. Happens every time an input in the primary form is changed.
  getPrimaryFormInputs() {
    this.personA.actualBirthDate = new Date (this.personAinputYear, this.personAinputMonth-1, this.personAinputDay)
    this.personA.SSbirthDate = this.birthdayService.findSSbirthdate(this.personAinputMonth, this.personAinputDay, this.personAinputYear)
    this.personA.FRA = this.birthdayService.findFRA(this.personA.SSbirthDate)
    this.personA.survivorFRA = this.birthdayService.findSurvivorFRA(this.personA.SSbirthDate)
    this.personB.actualBirthDate = new Date (this.personBinputYear, this.personBinputMonth-1, this.personBinputDay)
    this.personB.SSbirthDate = this.birthdayService.findSSbirthdate(this.personBinputMonth, this.personBinputDay, this.personBinputYear)
    this.personB.FRA = this.birthdayService.findFRA(this.personB.SSbirthDate)
    this.personB.survivorFRA = this.birthdayService.findSurvivorFRA(this.personB.SSbirthDate)
    this.personA.initialAge =  ( this.today.getMonth() - this.personA.SSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.personA.SSbirthDate.getFullYear()) )/12
      if (this.personA.initialAge > 70){
        this.personA.hasFiled = true
      }
    this.personB.initialAge =  ( this.today.getMonth() - this.personB.SSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.personB.SSbirthDate.getFullYear()) )/12
      if (this.personB.initialAge > 70){
        this.personB.hasFiled = true
      }
    this.personA.initialAgeRounded = Math.round(this.personA.initialAge)
    this.personB.initialAgeRounded = Math.round(this.personB.initialAge)
    this.personA.quitWorkDate = new MonthYearDate(this.personAquitWorkYear, this.personAquitWorkMonth-1, 1)
    this.personB.quitWorkDate = new MonthYearDate(this.personBquitWorkYear, this.personBquitWorkMonth-1, 1)
    if (this.personAfixedRetirementBenefitMonth && this.personAfixedRetirementBenefitYear){
      this.personA.fixedRetirementBenefitDate = new MonthYearDate(this.personAfixedRetirementBenefitYear, this.personAfixedRetirementBenefitMonth-1, 1)
    }
    if (this.personBfixedRetirementBenefitMonth && this.personBfixedRetirementBenefitYear){
      this.personB.fixedRetirementBenefitDate = new MonthYearDate(this.personBfixedRetirementBenefitYear, this.personBfixedRetirementBenefitMonth-1, 1)
    }
    this.personA.mortalityTable = this.mortalityService.determineMortalityTable(this.personAgender, this.personAmortalityInput, this.personAassumedDeathAge)
    this.personB.mortalityTable = this.mortalityService.determineMortalityTable(this.personBgender, this.personBmortalityInput, this.personBassumedDeathAge)
    //set initialCalcDate
      //if single, it's year in which user turns 62
        if (this.scenario.maritalStatus == "single") {
          this.scenario.initialCalcDate = new MonthYearDate(this.personA.SSbirthDate.getFullYear()+62, 0, 1)
        }
      //If married, set initialCalcDate to Jan 1 of year in which first spouse reaches age 62
        if (this.scenario.maritalStatus == "married"){
          if (this.personA.SSbirthDate < this.personB.SSbirthDate)
            {
              this.scenario.initialCalcDate = new MonthYearDate(this.personA.SSbirthDate.getFullYear()+62, 0, 1)
            }
          else {
            this.scenario.initialCalcDate = new MonthYearDate(this.personB.SSbirthDate.getFullYear()+62, 0, 1)
            }
        }
      //If divorced, we want initialCalcDate to be Jan 1 of personA's age62 year.
        if (this.scenario.maritalStatus == "divorced") {
          this.scenario.initialCalcDate = new MonthYearDate(this.personA.SSbirthDate.getFullYear()+62, 0, 1)
        }
      //Don't let initialCalcDate be earlier than this year
        if (this.scenario.initialCalcDate.getFullYear() < this.today.getFullYear()){
          this.scenario.initialCalcDate = new MonthYearDate(this.today.getFullYear(), 0, 1)
        }
      //Reset conditionally-hidden inputs as necessary, based on changes to other inputs. (If a hidden input should be null/false based on status of other inputs, make sure it is null/false.)
      this.resetHiddenInputs()
    }


  waitCursor() {
    document.getElementById("container").style.cursor = "wait";
    document.getElementById("maximizeSubmit").style.cursor = "wait";
    this.statusMessage = "Calculating the optimal strategy..."
  }

  normalCursor(){
    document.getElementById("container").style.cursor = "default";
    document.getElementById("maximizeSubmit").style.cursor = "default";
  }


  resetHiddenInputs(){
    //Reset "personB has filed" to false if divorced. (Otherwise can have bug if they selected married, yes personB has filed, then switch to divorced because the "has personB filed" input disappears and calc won't run.)
      if (this.scenario.maritalStatus == "divorced" && this.personB.initialAge < 70) {
        this.personB.hasFiled = false
      }
    //reset earnings test inputs if "still working" is false
      if (this.personAworking === false) {
        this.personA.monthlyEarnings = 0
        this.personAquitWorkMonth = null
        this.personAquitWorkYear = null
      }
      if (this.personBworking === false) {
        this.personB.monthlyEarnings = 0
        this.personBquitWorkMonth = null
        this.personBquitWorkYear = null
      }
    //reset fixed retirement date inputs if person has no fixed retirement date
      if (this.personA.hasFiled === false && this.personA.isDisabled === false) {
        this.personAfixedRetirementBenefitMonth = null
        this.personAfixedRetirementBenefitYear = null
        this.personA.fixedRetirementBenefitDate = null
      }
      if (this.personB.hasFiled === false && this.personB.isDisabled === false && this.scenario.maritalStatus == "married") {
        this.personBfixedRetirementBenefitMonth = null
        this.personBfixedRetirementBenefitYear = null
        this.personB.fixedRetirementBenefitDate = null
      }
    //If person is disabled, set "still working" to false, set "has filed" to false
    if (this.personA.isDisabled === true){
      this.personAworking = false
      this.personA.hasFiled = false
    }
    if (this.personB.isDisabled === true){
      this.personBworking = false
      this.personB.hasFiled = false
    }
    //If divorce scenario *and* personB is on disability, give them a fixedRetirementBenefitDate of today (point being so that "ex-spouse must be 62" rule doesn't get in way)
    if (this.scenario.maritalStatus == "divorced" && this.personB.isDisabled === true){
      this.personB.fixedRetirementBenefitDate = new MonthYearDate()
    }
    //If "declineSpousal" or "declineSuspension" inputs are checked in custom date form, reset related month/year inputs
    if (this.personA.declineSpousal === true){
      this.customPersonAspousalBenefitMonth = null
      this.customPersonAspousalBenefitYear = null
    }
    if (this.personB.declineSpousal === true){
      this.customPersonBspousalBenefitMonth = null
      this.customPersonBspousalBenefitYear = null
    }
    if (this.personA.declineSuspension === true){
      this.customPersonAbeginSuspensionMonth = null
      this.customPersonAbeginSuspensionYear = null
      this.customPersonAendSuspensionMonth = null
      this.customPersonAendSuspensionYear = null
    }
    if (this.personB.declineSuspension === true){
      this.customPersonBbeginSuspensionMonth = null
      this.customPersonBbeginSuspensionYear = null
      this.customPersonBendSuspensionMonth = null
      this.customPersonBendSuspensionYear = null
    }
  }

  primaryFormInputChange(){
    this.getPrimaryFormInputs()
    this.primaryFormHasChanged = true
  }

  focusError(){//Do all these checks in reverse order on screen, so that top-most check happens last (i.e., so that the input element that gets focused is the top-most one on the screen)
    if (this.errorCollection.customPersonBspousalDateError){
      document.getElementById("customPersonBspousalBenefitMonth").focus()
    }
    if (this.errorCollection.customPersonBendSuspensionDateError){
      document.getElementById("customPersonBendSuspensionMonth").focus()
    }
    if (this.errorCollection.customPersonBbeginSuspensionDateError){
      document.getElementById("customPersonBbeginSuspensionMonth").focus()
    }
    if (this.errorCollection.customPersonBretirementDateError){
      document.getElementById("customPersonBretirementBenefitMonth").focus()
    }
    if (this.errorCollection.customPersonAspousalDateError){
      document.getElementById("customPersonAspousalBenefitMonth").focus()
    }
    if (this.errorCollection.customPersonAendSuspensionDateError){
      document.getElementById("customPersonAendSuspensionMonth").focus()
    }
    if (this.errorCollection.customPersonAbeginSuspensionDateError){
      document.getElementById("customPersonAbeginSuspensionMonth").focus()
    }
    if (this.errorCollection.customPersonAretirementDateError){
      document.getElementById("customPersonAretirementBenefitMonth").focus()
    }
    if (this.errorCollection.personBfixedRetirementDateError){
      document.getElementById("personBfixedRetirementBenefitMonth").focus()
    }
    if (this.errorCollection.personAfixedRetirementDateError){
      document.getElementById("personAfixedRetirementBenefitMonth").focus()
    }
  }

  printPage(){
    window.print()
  }
}
