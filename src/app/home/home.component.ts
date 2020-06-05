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
import { BenefitService } from '../benefit.service'
import { ClaimStrategy } from '../data model classes/claimStrategy'


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private inputValidationService:InputValidationService, private birthdayService: BirthdayService, private presentvalueService: PresentValueService,
    private mortalityService: MortalityService, private benefitService: BenefitService, private http: HttpClient) { }

  ngOnInit() {
    this.http.get<FREDresponse>("https://www.quandl.com/api/v3/datasets/FRED/DFII20.json?limit=1&api_key=iuEbMEnRuZzmUpzMYgx3")
    .subscribe(
      data => {this.scenario.discountRate = data.dataset.data[0][1]},
      error => {this.scenario.discountRate = 1}
    )
  }

  personA:Person = new Person("A")
  personB:Person = new Person("B")
  child1:Person = new Person("1")
  child2:Person = new Person("2")
  child3:Person = new Person("3")
  child4:Person = new Person("4")
  child5:Person = new Person("5")
  child6:Person = new Person("6")
  childrenObjectsArray:Person[] = [this.child1, this.child2, this.child3, this.child4, this.child5, this.child6]
  scenario:CalculationScenario = new CalculationScenario()
  customClaimStrategy = new ClaimStrategy(this.personA, this.personB)
  errorCollection:ErrorCollection = new ErrorCollection()
  today:MonthYearDate = new MonthYearDate()
  deemedFilingCutoff: Date = new Date(1954, 0, 1)//January 2, 1954. If date is LESS than cutoff, old rules. If greater than OR EQUAL TO cutoff, new rules.
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
  inputYears: number[] = [1925, 1926, 1927, 1928, 1929,
              1930, 1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939,
              1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949,
              1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
              1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969,
              1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
              1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
              1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
              2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
              2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]

  inputBenefitYears: number[] = [1979, //Can't go earlier than 1979 or calculation rules are different. Tough luck to anybody older.
                    1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
                    1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
                    2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
                    2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
                    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
                    2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
                    2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049,
                    2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059,
                    2060]

  quitWorkYears: number[] = [ 2018, 2019,
    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
    2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
    2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049,
    2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059,
    2060, 2061, 2062, 2063, 2065, 2065, 2066, 2067, 2069, 2070 ]


//Inputs from form
  personAprimaryPIAinput: number = 1000
  personAsecondaryPIAinput: number = 1000
  personAinputMonth: number = 4
  personAinputDay: number = 15
  personAinputYear: number = 1960
  personAfixedRetirementBenefitMonth: number
  personAfixedRetirementBenefitYear: number
  personAnonCoveredPensionMonth:number = 1
  personAnonCoveredPensionYear:number = 2020
  personAgender: string = "male"
  personAassumedDeathAge: number = 0
  personAmortalityInput: string = "SSA2016"
  personBprimaryPIAinput: number = 1000
  personBsecondaryPIAinput: number = 1000
  personBinputMonth: number = 4
  personBinputDay: number = 15
  personBinputYear: number = 1960
  personBfixedRetirementBenefitMonth: number
  personBfixedRetirementBenefitYear: number
  personBnonCoveredPensionMonth:number = 1
  personBnonCoveredPensionYear:number = 2020
  personBgender: string = "female"
  personBmortalityInput: string = "SSA2016"
  personBassumedDeathAge: number = 0
  advanced: boolean = false
  qualifyingChildrenBoolean:boolean = false

    //earnings test inputs
    personAworking: boolean = false
    personAquitWorkYear: number
    personAquitWorkMonth: number
    personBworking: boolean = false
    personBquitWorkYear: number
    personBquitWorkMonth: number

  // Defaults for later inputs from custom date form
  // and to simplify assignment statements
    todayMonth: number = this.today.getMonth()+1
    todayYear:number = this.today.getFullYear()

      //Inputs from custom date form
  customPersonAretirementBenefitMonth: number = this.todayMonth
  customPersonAretirementBenefitYear: number = this.todayYear
  customPersonAspousalBenefitMonth: number = this.todayMonth
  customPersonAspousalBenefitYear: number = this.todayYear
  customPersonBretirementBenefitMonth: number = this.todayMonth
  customPersonBretirementBenefitYear: number = this.todayYear
  customPersonBspousalBenefitMonth: number = this.todayMonth
  customPersonBspousalBenefitYear: number = this.todayYear
  customPersonAbeginSuspensionMonth: number = this.todayMonth
  customPersonAbeginSuspensionYear: number = this.todayYear
  customPersonAendSuspensionMonth: number = this.todayMonth
  customPersonAendSuspensionYear: number = this.todayYear
  customPersonBbeginSuspensionMonth: number = this.todayMonth
  customPersonBbeginSuspensionYear: number = this.todayYear
  customPersonBendSuspensionMonth: number = this.todayMonth
  customPersonBendSuspensionYear: number = this.todayYear


  //solution variables
  differenceInPV: number
  differenceInPV_asPercent: number
  solutionSet: SolutionSet = {
    "claimStrategy":new ClaimStrategy(this.personA, this.personB),
    "solutionsArray": [],
    "computationComplete": false
  }



   onSubmit() {
    this.waitCursor()
    this.solutionSet.computationComplete = false;
    setTimeout( () => {//whole rest of this function is in a setTimeout statement, to have 10 millisecond delay, to give DOM time to update with status message from waitCursor()
    let startTime = performance.now() //for testing performance
    console.log("-------------")
    console.log(this.personA)
    console.log(this.personB)
    this.getPrimaryFormInputs()
    this.solutionSet.claimStrategy.outputTableComplete = false //set this to false to begin with, in case it had been true from prior runs of function
    this.errorCollection = this.inputValidationService.checkForFixedRetirementDateErrors(this.errorCollection, this.scenario, this.personA, this.personB)
    this.focusError()

    //If there are no fixedRetirementDate errors, call appropriate "maximizePV" function to find best solution
    if (this.errorCollection.hasErrors === false){
      this.solutionSet = {
        "claimStrategy":new ClaimStrategy(this.personA, this.personB),
        "solutionsArray": [],
        "computationComplete": false
      };
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
    // computation is finished
    this.solutionSet.computationComplete = true;
    this.normalCursor()
    this.primaryFormHasChanged = false//Set this to false so that customDates() doesn't rerun onSubmit() next time it is run, unless another change is made to primary inputs
    if (this.customClaimStrategy.PV){//If customDates() has already been run (and this function is being rerun via top submit button after having changed a primary input), rerun the PV calc with custom dates and new primary inputs
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
    this.customClaimStrategy = new ClaimStrategy(this.personA, this.personB)//new object in order to reset outputTable to be undefined, PV to be undefined, and outputTableComplete to be false
    this.getCustomDateFormInputs()
    this.errorCollection = this.inputValidationService.checkForCustomDateErrors(this.errorCollection, this.scenario, this.personA, this.personB)

    //Calc PV with input dates
        //Create a new CalculationScenario object that is a clone of the original one. It isn't a reference but a whole new one. So changes to original don't change this one.
        //(This is necessary so that it can have a separate "outputTable" field from the original.)
          //Note though that any fields that are themselves objects will just be copied by reference. So changes to that object would change both ClaimingScenario objects.
      if (this.scenario.maritalStatus == "single" && this.errorCollection.hasErrors === false) {
        this.customClaimStrategy = this.presentvalueService.calculateSinglePersonPV(this.personA, this.scenario, true)
        }
      if(this.scenario.maritalStatus == "married" && this.errorCollection.hasErrors === false) {
        this.customClaimStrategy = this.presentvalueService.calculateCouplePV(this.personA, this.personB, this.scenario, true)
        }
      if(this.scenario.maritalStatus == "divorced" && this.errorCollection.hasErrors === false) {
        this.customClaimStrategy = this.presentvalueService.calculateCouplePV(this.personA, this.personB, this.scenario, true)
      }
      this.differenceInPV = this.solutionSet.claimStrategy.PV - this.customClaimStrategy.PV
      this.differenceInPV_asPercent = (this.differenceInPV / this.solutionSet.claimStrategy.PV) * 100
  }

  //Use inputs to calculate ages, SSbirthdates, FRAs, etc. Happens every time an input in the primary form is changed.
  getPrimaryFormInputs() {
    this.personA.actualBirthDate = new Date (this.personAinputYear, this.personAinputMonth-1, this.personAinputDay-1)
    this.personA.SSbirthDate = this.birthdayService.findSSbirthdate(this.personAinputMonth, this.personAinputDay, this.personAinputYear)
    this.personA.FRA = this.birthdayService.findFRA(this.personA.SSbirthDate)
    this.personA.survivorFRA = this.birthdayService.findSurvivorFRA(this.personA.SSbirthDate)
    this.personB.actualBirthDate = new Date (this.personBinputYear, this.personBinputMonth-1, this.personBinputDay-1)
    this.personB.SSbirthDate = this.birthdayService.findSSbirthdate(this.personBinputMonth, this.personBinputDay, this.personBinputYear)
    this.personB.FRA = this.birthdayService.findFRA(this.personB.SSbirthDate)
    this.personB.survivorFRA = this.birthdayService.findSurvivorFRA(this.personB.SSbirthDate)
    this.personA.initialAge =  this.birthdayService.findAgeOnDate(this.personA, this.today)
      if (this.personA.initialAge > 70){
        this.personA.hasFiled = true
      }
    this.personB.initialAge =  this.birthdayService.findAgeOnDate(this.personB, this.today)
      if (this.personB.initialAge > 70){
        this.personB.hasFiled = true
      }
    this.personA.initialAgeRounded = Math.round(this.personA.initialAge)
    this.personB.initialAgeRounded = Math.round(this.personB.initialAge)
    //Get PIA inputs
      //personA
      if (this.personA.eligibleForNonCoveredPension === false){
        this.personA.PIA = this.personAprimaryPIAinput
      }
      else {//i.e., personA will be getting noncovered pension
        //create nonCoveredPensionDate
        this.personA.nonCoveredPensionDate = new MonthYearDate(this.personAnonCoveredPensionYear, this.personAnonCoveredPensionMonth-1)
        //set WEP_PIA and nonWEP_PIA based on primary/secondary PIAinput
        if (this.personA.isOnDisability === true && this.personA.nonCoveredPensionDate > this.today){//if person is on disability and pension has not yet begun, primaryPIAinput represents their nonWEP_PIA
          this.personA.nonWEP_PIA = this.personAprimaryPIAinput
          this.personA.WEP_PIA = this.personAsecondaryPIAinput
        }
        else {//in all other cases in which person is eligible for noncovered pension, primaryPIAinput is their WEP PIA
          this.personA.WEP_PIA = this.personAprimaryPIAinput
          this.personA.nonWEP_PIA = this.personAsecondaryPIAinput
        }
      }
      //personB
      if (this.personB.eligibleForNonCoveredPension === false){
        this.personB.PIA = this.personBprimaryPIAinput
      }
      else {//i.e., personB will be getting noncovered pension
        //create nonCoveredPensionDate
        this.personB.nonCoveredPensionDate = new MonthYearDate(this.personBnonCoveredPensionYear, this.personBnonCoveredPensionMonth-1)
        //set WEP_PIA and nonWEP_PIA based on primary/secondary PIAinput
        if (this.personB.isOnDisability === true && this.personB.nonCoveredPensionDate > this.today){//if person is on disability and pension has not yet begun, primaryPIAinput represents their nonWEP_PIA
          this.personB.nonWEP_PIA = this.personBprimaryPIAinput
          this.personB.WEP_PIA = this.personBsecondaryPIAinput
        }
        else {//in all other cases in which person is eligible for noncovered pension, primaryPIAinput is their WEP PIA
          this.personB.WEP_PIA = this.personBprimaryPIAinput
          this.personB.nonWEP_PIA = this.personBsecondaryPIAinput
        }
      }
    this.benefitService.checkWhichPIAtoUse(this.personA, this.today)
    this.benefitService.checkWhichPIAtoUse(this.personB, this.today)

    //reset beginSuspensionDate and endSuspensionDate for each person. This is necessary because if maximize function is run with one person having a fixed filing date...
      //...then that person's suspension dates will be iterated, and they wouldn't get reset at any point. And we WANT them to be reset if you run the function again after changing any inputs.
      if (this.personA.hasFiled === false || this.personA.isOnDisability === false){
        this.personA.beginSuspensionDate = new MonthYearDate(1900, 0, 1)
        this.personA.endSuspensionDate = new MonthYearDate(1900, 0, 1)
      }
      if (this.personB.hasFiled === false || this.personB.isOnDisability === false){
        this.personB.beginSuspensionDate = new MonthYearDate(1900, 0, 1)
        this.personB.endSuspensionDate = new MonthYearDate(1900, 0, 1)
      }

    this.personA.quitWorkDate = new MonthYearDate(this.personAquitWorkYear, this.personAquitWorkMonth-1)
    this.personB.quitWorkDate = new MonthYearDate(this.personBquitWorkYear, this.personBquitWorkMonth-1)
    if (this.personAfixedRetirementBenefitMonth && this.personAfixedRetirementBenefitYear){
      this.personA.fixedRetirementBenefitDate = new MonthYearDate(this.personAfixedRetirementBenefitYear, this.personAfixedRetirementBenefitMonth-1)
    }
    if (this.personBfixedRetirementBenefitMonth && this.personBfixedRetirementBenefitYear){
      this.personB.fixedRetirementBenefitDate = new MonthYearDate(this.personBfixedRetirementBenefitYear, this.personBfixedRetirementBenefitMonth-1)
    }
    this.personA.mortalityTable = this.mortalityService.determineMortalityTable(this.personAgender, this.personAmortalityInput, this.personAassumedDeathAge)
    this.personB.mortalityTable = this.mortalityService.determineMortalityTable(this.personBgender, this.personBmortalityInput, this.personBassumedDeathAge)
    this.personA.baseMortalityFactor = this.mortalityService.calculateBaseMortalityFactor(this.personA)
    this.personB.baseMortalityFactor = this.mortalityService.calculateBaseMortalityFactor(this.personB)

    //Clear children array and only push as many children objects as applicable
    if (this.scenario.numberOfChildren > 0){
        this.scenario.setChildrenArray(this.childrenObjectsArray, this.today)
    }
    else {this.scenario.children = []}

    //This childInCareSpousal field is used for determining whether to display spousal input dates in custom form. We normally set this in getCustomDateFormInputs(). But we set it here in case of disabled child so that spousal benefit input doesnt show up on initial load of custom date form.
    if (this.scenario.disabledChild === true){
      this.personA.childInCareSpousal = true
      this.personB.childInCareSpousal = true
    }

      //Reset conditionally-hidden inputs as necessary, based on changes to other inputs. (If a hidden input should be null/false based on status of other inputs, make sure it is null/false.)
      this.resetHiddenInputs()
    }

  //Use inputs to set retirementBenefitDate, spousalBenefitDate fields. Also checks now whether there will be child-in-care spousal benefits, given retirementBenefitDates selected.
  //Input validation doesn't happen here. This function runs every time the form changes, and we only want validation upon submission.
  getCustomDateFormInputs() {
    //set everybody's dates to undefined at first. (Clears any values they had from maximize function or anything else. We want them undefined at the end of this function if this function intentionally does not set them.)
    this.personA.retirementBenefitDate = undefined
    this.personA.spousalBenefitDate = undefined
    this.personA.beginSuspensionDate = undefined
    this.personA.endSuspensionDate = undefined
    this.personB.retirementBenefitDate = undefined
    this.personB.spousalBenefitDate = undefined
    this.personB.beginSuspensionDate = undefined
    this.personB.endSuspensionDate = undefined

    //If there are inputs for a fixedRetirementBenefitDate (as would be the case if person has filed or is on disability -- or for personB in a divorce scenario) go get those inputs and make a Date object
      //Then use that object for personA's retirementBenefitDate. Otherwise, use input from Custom Date form.
      if (this.personAfixedRetirementBenefitMonth || this.personAfixedRetirementBenefitYear){
        this.personA.fixedRetirementBenefitDate = new MonthYearDate(this.personAfixedRetirementBenefitYear, this.personAfixedRetirementBenefitMonth-1)
        this.personA.retirementBenefitDate = new MonthYearDate(this.personA.fixedRetirementBenefitDate)
      }
      else {
        this.personA.retirementBenefitDate = new MonthYearDate(this.customPersonAretirementBenefitYear, this.customPersonAretirementBenefitMonth-1)
      }
      if (this.personBfixedRetirementBenefitMonth || this.personBfixedRetirementBenefitYear){
        this.personB.fixedRetirementBenefitDate = new MonthYearDate(this.personBfixedRetirementBenefitYear, this.personBfixedRetirementBenefitMonth-1)
        this.personB.retirementBenefitDate = new MonthYearDate(this.personB.fixedRetirementBenefitDate)
      }
      else {
        this.personB.retirementBenefitDate = new MonthYearDate(this.customPersonBretirementBenefitYear, this.customPersonBretirementBenefitMonth-1)
      }

    //If user is selecting custom begin/end suspension dates create Date objects and set applicable person field. (Set to 1900 if they haven't filed or are declining suspension.)
      if ((this.personA.hasFiled === true || this.personA.isOnDisability === true) && this.personA.declineSuspension === false) {
        this.personA.beginSuspensionDate = new MonthYearDate (this.customPersonAbeginSuspensionYear, this.customPersonAbeginSuspensionMonth-1)
      }
      else {
        this.personA.beginSuspensionDate = new MonthYearDate(1900, 0)
      }
      if ((this.personA.hasFiled === true || this.personA.isOnDisability === true) && this.personA.declineSuspension === false) {
        this.personA.endSuspensionDate = new MonthYearDate (this.customPersonAendSuspensionYear, this.customPersonAendSuspensionMonth-1)
      }
      else {
        this.personA.endSuspensionDate = new MonthYearDate(1900, 0)
      }
      if ((this.personB.hasFiled === true || this.personB.isOnDisability === true) && this.personB.declineSuspension === false) {
        this.personB.beginSuspensionDate = new MonthYearDate (this.customPersonBbeginSuspensionYear, this.customPersonBbeginSuspensionMonth-1)
      }
      else {
        this.personB.beginSuspensionDate = new MonthYearDate(1900, 0)
      }
      if ((this.personB.hasFiled === true || this.personB.isOnDisability === true) && this.personB.declineSuspension === false) {
        this.personB.endSuspensionDate = new MonthYearDate (this.customPersonBendSuspensionYear, this.customPersonBendSuspensionMonth-1)
      }
      else {
        this.personB.endSuspensionDate = new MonthYearDate(1900, 0)
      }

      //Set spousalBenefitDates automatically if child-in-care
      //If there are minor or disabled children, spousalBenefitDate must reflect date on which regular spousal benefit (as opposed to child-in-care spousal benefit) begins.
      this.personA.childInCareSpousal = false
      this.personB.childInCareSpousal = false
      if (this.scenario.children.length > 0){
        //if there is a disabled child or a child under 16 when otherPerson begins retirement benefit, don't let spousalBenefitDate be before own FRA.
          //In other words, we're assuming here that person doesn't file Form SSA-25. We're letting them claim child-in-care spousal benefits, then letting it stop when youngest child reaches 16 (if not yet FRA and no disabled child), then start again at FRA.
        if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(this.scenario, this.personB.retirementBenefitDate) === true){
          this.presentvalueService.adjustSpousalBenefitDate(this.personA, this.personB, this.scenario)
          //Also, set childInCareSpousal field to true if applicable
          //If there is no disabled child, and spousalBenefitDate is after FRA and after youngestchildturns16date, then there must not have been an automatic conversion (to regular spousal from child-in-care spousal) which means they weren't on child-in-care spousal
          if (!(this.personA.spousalBenefitDate > this.personA.FRA && this.personA.spousalBenefitDate > this.scenario.youngestChildTurns16date && this.scenario.disabledChild === false)){
            this.personA.childInCareSpousal = true
          }
        }
        if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(this.scenario, this.personA.retirementBenefitDate) === true){
          this.presentvalueService.adjustSpousalBenefitDate(this.personB, this.personA, this.scenario)
          if (!(this.personB.spousalBenefitDate > this.personB.FRA && this.personB.spousalBenefitDate > this.scenario.youngestChildTurns16date && this.scenario.disabledChild === false)){
            this.personB.childInCareSpousal = true
          }
        }
      }
      if (this.personA.childInCareSpousal === false) {
      //if we're in a different no-input situation (i.e. if personA won't actually file for a spousal benefit at any time) get the input that makes function run appropriately
        if (
          this.personA.declineSpousal === true || //choosing not to file for spousal
          (this.personA.PIA >= 0.5 * this.personB.PIA && this.personA.actualBirthDate >= this.deemedFilingCutoff) || //can't file for spousal due to new deemed filing and size of PIA
          (this.personA.PIA >= 0.5 * this.personB.PIA && (this.personA.hasFiled === true || this.personA.isOnDisability === true)) || //can't file for spousal due to size of PIA and because already filed for retirement/disability
          ( (this.personA.hasFiled === true || this.personA.isOnDisability === true) && (this.personB.hasFiled === true || this.personB.isOnDisability === true) ) //both have already started retirement or disability and therefore have already started spousal so there will be no spousal input
        )
          {
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
        else {//i.e., if there are inputs
          this.personA.spousalBenefitDate = new MonthYearDate(this.customPersonAspousalBenefitYear, this.customPersonAspousalBenefitMonth-1)
        }
      }
    //Ditto for personB
    if (this.personB.childInCareSpousal === false){
      //if we're in a different no-input situation (i.e. if personA won't actually file for a spousal benefit at any time) get the input that makes function run appropriately
      if (
        this.personB.declineSpousal === true || //choosing not to file for spousal
        (this.personB.PIA >= 0.5 * this.personA.PIA && this.personB.actualBirthDate >= this.deemedFilingCutoff) || //can't file for spousal due to new deemed filing and size of PIA
        (this.personB.PIA >= 0.5 * this.personA.PIA && (this.personB.hasFiled === true || this.personB.isOnDisability === true)) || //can't file for spousal due to size of PIA and because already filed for retirement/disability
        ( (this.personA.hasFiled === true || this.personA.isOnDisability === true) && (this.personB.hasFiled === true || this.personB.isOnDisability === true) ) || //both have already started retirement or disability and therefore have already started spousal so there will be no spousal input
        this.scenario.maritalStatus == "divorced"
        )
        {
          //personB spousal date is later of retirement dates
          if (this.personA.retirementBenefitDate > this.personB.retirementBenefitDate) {
            this.personB.spousalBenefitDate = new MonthYearDate(this.personA.retirementBenefitDate)
          }
          else {
            this.personB.spousalBenefitDate = new MonthYearDate(this.personB.retirementBenefitDate)
          }
        }
      else {//i.e., if there are inputs
        this.personB.spousalBenefitDate = new MonthYearDate(this.customPersonBspousalBenefitYear, this.customPersonBspousalBenefitMonth-1)
      }
    }
    //Call resetHiddenInputs() <-- necessary because right now that is the function that's bound to custom date form's (change) event. And we'll need that event to be bound to this function instead.
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
        this.personA.quitWorkDate = new MonthYearDate(1, 0, 1) //If nothing was input for quitWorkDate, make up a date way in the past so "before/after today" check can run but returns false (and therefore earnings test gets skipped)
      }
      if (this.personBworking === false) {
        this.personB.monthlyEarnings = 0
        this.personBquitWorkMonth = null
        this.personBquitWorkYear = null
        this.personB.quitWorkDate = new MonthYearDate(1, 0, 1) //If nothing was input for quitWorkDate, make up a date way in the past so "before/after today" check can run but returns false (and therefore earnings test gets skipped)
      }
    //reset fixed retirement date inputs if person has no fixed retirement date
      if (this.personA.hasFiled === false && this.personA.isOnDisability === false) {
        this.personAfixedRetirementBenefitMonth = null
        this.personAfixedRetirementBenefitYear = null
        this.personA.fixedRetirementBenefitDate = null
      }
      if (this.personB.hasFiled === false && this.personB.isOnDisability === false && this.scenario.maritalStatus == "married") {
        this.personBfixedRetirementBenefitMonth = null
        this.personBfixedRetirementBenefitYear = null
        this.personB.fixedRetirementBenefitDate = null
      }
    //If person is disabled, set "still working" to false, set "has filed" to false
    if (this.personA.isOnDisability === true){
      this.personAworking = false
      this.personA.hasFiled = false
    }
    if (this.personB.isOnDisability === true){
      this.personBworking = false
      this.personB.hasFiled = false
    }
    //If divorce scenario *and* personB is on disability, give them a fixedRetirementBenefitDate of today (point being so that "ex-spouse must be 62" rule doesn't get in way)
    if (this.scenario.maritalStatus == "divorced" && this.personB.isOnDisability === true){
      this.personB.fixedRetirementBenefitDate = new MonthYearDate()
    }

    // Reset values related to government pension if not receiving a government pension
    if (this.personA.eligibleForNonCoveredPension === false) {
      this.personA.entitledToNonCoveredPension = false
      this.personA.governmentPension = 0
      this.personA.WEP_PIA = undefined
      this.personA.nonWEP_PIA = undefined
      this.personA.nonCoveredPensionDate = undefined
    }

    if (this.personB.eligibleForNonCoveredPension === false) {
      this.personB.entitledToNonCoveredPension = false
      this.personB.governmentPension = 0
      this.personB.WEP_PIA = undefined
      this.personB.nonWEP_PIA = undefined
      this.personB.nonCoveredPensionDate = undefined
    }

    //If "declineSpousal" or "declineSuspension" inputs are checked in custom date form, reset related month/year inputs. Similarly, reset spousal inputs to null if person in question would get child-in-care spousal
    if (this.personA.declineSpousal === true || this.personA.childInCareSpousal === true){
      this.customPersonAspousalBenefitMonth = null
      this.customPersonAspousalBenefitYear = null
    }
    if (this.personB.declineSpousal === true || this.personB.childInCareSpousal === true){
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
    //Zero children if qualifyingChildren boolean is false
    if (this.qualifyingChildrenBoolean === false){
      this.scenario.numberOfChildren = 0
      this.scenario.children = []
    }
    if (this.personA.isOnDisability === false && this.personA.hasFiled === false && this.personB.isOnDisability === false && this.personB.hasFiled === false){
      for (let child of this.scenario.children){
        child.hasFiled = false
      }
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
