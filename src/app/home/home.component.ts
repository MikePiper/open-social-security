import {Component, OnInit} from '@angular/core'
import {BirthdayService} from '../birthday.service'
import {PresentValueService} from '../presentvalue.service'
import {MortalityService} from '../mortality.service'
import {Person} from '../data model classes/person'
import {SolutionSet} from '../data model classes/solutionset'
import {FREDresponse} from '../data model classes/fredresponse'
import {HttpClient} from '@angular/common/http'
import {ClaimingScenario} from '../data model classes/claimingscenario'


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private birthdayService: BirthdayService, private presentvalueService: PresentValueService, private mortalityService: MortalityService, private http: HttpClient) { }

  ngOnInit() {
    this.http.get<FREDresponse>("https://www.quandl.com/api/v3/datasets/FRED/DFII20.json?limit=1&api_key=iuEbMEnRuZzmUpzMYgx3")
    .subscribe(
      data => {this.scenario.discountRate = data.dataset.data[0][1]},
      error => {this.scenario.discountRate = 1}
    )
  }

  personA:Person = new Person("A")
  personB:Person = new Person("B")
  scenario:ClaimingScenario = new ClaimingScenario()
  customDateScenario:ClaimingScenario
  today:Date = new Date()
  deemedFilingCutoff: Date = new Date(1954, 0, 1)
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
  spouseAinputMonth: number = 4
  spouseAinputDay: number = 15
  spouseAinputYear: number = 1960
  spouseAfixedRetirementBenefitMonth: number
  spouseAfixedRetirementBenefitYear: number
  spouseBfixedRetirementBenefitMonth: number
  spouseBfixedRetirementBenefitYear: number
  spouseAgender: string = "male"
  spouseAassumedDeathAge: number = 0
  spouseAmortalityInput: string = "SSA"
  spouseBinputMonth: number = 4
  spouseBinputDay: number = 15
  spouseBinputYear: number = 1960
  spouseBgender: string = "female"
  spouseBmortalityInput: string = "SSA"
  spouseBassumedDeathAge: number = 0
  advanced: boolean = false

    //earnings test inputs
    spouseAworking: boolean = false
    spouseAquitWorkYear: number
    spouseAquitWorkMonth: number
    spouseBworking: boolean = false
    spouseBquitWorkYear: number
    spouseBquitWorkMonth: number

  //Inputs from custom date form
  customSpouseAretirementBenefitMonth: number
  customSpouseAretirementBenefitYear: number
  customSpouseAspousalBenefitMonth: number
  customSpouseAspousalBenefitYear: number
  customSpouseBretirementBenefitMonth: number
  customSpouseBretirementBenefitYear: number
  customSpouseBspousalBenefitMonth: number
  customSpouseBspousalBenefitYear: number
  spouseAdeclineSpousal: boolean = false
  spouseBdeclineSpousal: boolean = false


  //Error variables
  statusMessage:string = ""
  customSpouseAretirementDateError:string
  customSpouseBretirementDateError:string
  customSpouseAspousalDateError:string
  customSpouseBspousalDateError:string
  spouseAfixedRetirementDateError:string
  spouseBfixedRetirementDateError:string

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
    this.resetErrors()
    this.getPrimaryFormInputs()
    this.scenario.outputTableComplete = false //set this to false to begin with, in case it had been true from prior runs of function
    this.checkForFixedRetirementDateErrors()


    //If there are no fixedRetirementDate errors, call appropriate "maximizePV" function to find best solution
    if (this.scenario.maritalStatus == "single") {
        if (!this.spouseAfixedRetirementDateError) {
          this.solutionSet = this.presentvalueService.maximizeSinglePersonPV(this.personA, this.scenario)
        }
    }
    else if (this.scenario.maritalStatus == "married") {
        if (!this.spouseAfixedRetirementDateError && !this.spouseBfixedRetirementDateError){
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
    }
    else if (this.scenario.maritalStatus == "divorced") {
        if (!this.spouseAfixedRetirementDateError && !this.spouseBfixedRetirementDateError){
          this.solutionSet = this.presentvalueService.maximizeCouplePViterateOnePerson(this.scenario, this.personA, this.personB)
        }
    }
    this.normalCursor()
    this.primaryFormHasChanged = false//Set this to false so that customDates() doesn't rerun onSubmit() next time it is run, unless another change is made to primary inputs
    if (this.customSpouseAretirementBenefitMonth || this.customSpouseAspousalBenefitMonth || this.customSpouseBretirementBenefitMonth || this.customSpouseBspousalBenefitMonth){//If custom date inputs have been provided (and this function is being rerun via top submit button after having changed a primary input), rerun the PV calc with custom dates and new primary inputs
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

    //Reset input benefit dates, then get from user input
    this.personA.retirementBenefitDate = null
    this.personA.spousalBenefitDate = null
    this.personB.retirementBenefitDate = null
    this.personB.spousalBenefitDate = null
    this.personA.fixedRetirementBenefitDate = new Date(this.spouseAfixedRetirementBenefitYear, this.spouseAfixedRetirementBenefitMonth-1, 1)
    this.personB.fixedRetirementBenefitDate = new Date(this.spouseBfixedRetirementBenefitYear, this.spouseBfixedRetirementBenefitMonth-1, 1)

    this.personA.retirementBenefitDate = new Date(this.customSpouseAretirementBenefitYear, this.customSpouseAretirementBenefitMonth-1, 1)
        //If spouse A has already filed, there will be no input regarding their retirement date in custom dates form, so go get "fixed" date from above
        if (this.scenario.personAhasFiled === true) {this.personA.retirementBenefitDate = new Date(this.personA.fixedRetirementBenefitDate)}
    this.personA.spousalBenefitDate = new Date(this.customSpouseAspousalBenefitYear, this.customSpouseAspousalBenefitMonth-1, 1)
    this.personB.retirementBenefitDate = new Date(this.customSpouseBretirementBenefitYear, this.customSpouseBretirementBenefitMonth-1, 1)
        //If spouse B has already filed (or if divorce scenario), there will be no input regarding their retirement date in custom dates form, so go get "fixed" date from above
        if (this.scenario.personBhasFiled === true || this.scenario.maritalStatus === "divorced") {this.personB.retirementBenefitDate = new Date(this.personB.fixedRetirementBenefitDate)}
    this.personB.spousalBenefitDate = new Date(this.customSpouseBspousalBenefitYear, this.customSpouseBspousalBenefitMonth-1, 1)


    //Check for errors in input dates
    this.checkForFixedRetirementDateErrors()
    this.customSpouseAretirementDateError = this.checkValidRetirementInputs(this.personA, this.personA.retirementBenefitDate)
    this.customSpouseBretirementDateError = this.checkValidRetirementInputs(this.personB, this.personB.retirementBenefitDate)
    this.customSpouseAspousalDateError = this.checkValidSpousalInputs(this.personA, this.personB, this.personA.retirementBenefitDate, this.personA.spousalBenefitDate, this.personB.retirementBenefitDate)
    if (this.scenario.maritalStatus == "married") {
      this.customSpouseBspousalDateError = this.checkValidSpousalInputs(this.personB, this.personA, this.personB.retirementBenefitDate, this.personB.spousalBenefitDate, this.personA.retirementBenefitDate)
    }


    //Get spousal benefit dates if there were no inputs from user (i.e. if spouseA won't actually file for a spousal benefit at any time, get the input that makes function run appropriately)
    if ( (this.personA.PIA > 0.5 * this.personB.PIA && this.personA.actualBirthDate > this.deemedFilingCutoff) || this.spouseAdeclineSpousal === true ) {
      //If married, spouseA spousal date is later of retirement dates
      if (this.scenario.maritalStatus == "married") {
        if (this.personA.retirementBenefitDate > this.personB.retirementBenefitDate) {
          this.personA.spousalBenefitDate = new Date(this.personA.retirementBenefitDate)
        }
        else {
          this.personA.spousalBenefitDate = new Date(this.personB.retirementBenefitDate)
        }
      }
      //If divorced, spouseA spousal date is spouseA retirementdate
      else if (this.scenario.maritalStatus == "divorced"){
        this.personA.spousalBenefitDate = new Date(this.personA.retirementBenefitDate)
      }
      //eliminate spouseAspousalDateError, because user didn't even input anything
      this.customSpouseAspousalDateError = undefined
    }
    //Ditto, for spouseB
    if ( (this.personB.PIA > 0.5 * this.personA.PIA && this.personB.actualBirthDate > this.deemedFilingCutoff) || this.spouseBdeclineSpousal === true ) {
      //spouseB spousal date is later of retirement dates
      if (this.personA.retirementBenefitDate > this.personB.retirementBenefitDate) {
        this.personB.spousalBenefitDate = new Date(this.personA.retirementBenefitDate)
      }
      else {
        this.personB.spousalBenefitDate = new Date(this.personB.retirementBenefitDate)
      }
      //eliminate spouseAspousalDateError, because user didn't even input anything
      this.customSpouseBspousalDateError = undefined
    }

    //Calc PV with input dates
      //Create a new ClaimingScenario object that is a clone of the original one. It isn't a reference but a whole new one. So changes to original don't change this one. (This is necessary so that it can have a separate "outputTable" field from the original.)
        //Note though that any fields that are themselves objects will just be copied by reference. So changes to that object would change both ClaimingScenario objects.
        this.customDateScenario = Object.assign({}, this.scenario)
        this.customDateScenario.outputTableComplete = false //set this to false to begin with, in case it had been true from prior runs of function
    if (this.scenario.maritalStatus == "single" && !this.customSpouseAretirementDateError) {
      this.customPV = this.presentvalueService.calculateSinglePersonPV(this.personA, this.customDateScenario, true)
      }
    if(this.scenario.maritalStatus == "married" && !this.customSpouseAretirementDateError && !this.customSpouseBretirementDateError && !this.customSpouseAspousalDateError && !this.customSpouseBspousalDateError) {
      this.customPV = this.presentvalueService.calculateCouplePV(this.personA, this.personB, this.customDateScenario, true)
      }
    if(this.scenario.maritalStatus == "divorced" && !this.spouseBfixedRetirementDateError && !this.customSpouseAretirementDateError && !this.customSpouseAspousalDateError) {
      this.customPV = this.presentvalueService.calculateCouplePV(this.personA, this.personB, this.customDateScenario, true)
    }
    this.differenceInPV = this.solutionSet.solutionPV - this.customPV
  }

  //Use inputs to calculate ages, SSbirthdates, FRAs, etc. Happens every time an input in the primary form is changed.
  getPrimaryFormInputs() {
    this.personA.actualBirthDate = new Date (this.spouseAinputYear, this.spouseAinputMonth-1, this.spouseAinputDay)
    this.personA.SSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseAinputMonth, this.spouseAinputDay, this.spouseAinputYear))
    this.personA.FRA = new Date(this.birthdayService.findFRA(this.personA.SSbirthDate))
    this.personA.survivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.personA.SSbirthDate))
    this.personB.actualBirthDate = new Date (this.spouseBinputYear, this.spouseBinputMonth-1, this.spouseBinputDay)
    this.personB.SSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseBinputMonth, this.spouseBinputDay, this.spouseBinputYear))
    this.personB.FRA = new Date(this.birthdayService.findFRA(this.personB.SSbirthDate))
    this.personB.survivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.personB.SSbirthDate))
    this.personA.initialAge =  ( this.today.getMonth() - this.personA.SSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.personA.SSbirthDate.getFullYear()) )/12
      if (this.personA.initialAge > 70){
        this.scenario.personAhasFiled = true
      }
    this.personB.initialAge =  ( this.today.getMonth() - this.personB.SSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.personB.SSbirthDate.getFullYear()) )/12
      if (this.personB.initialAge > 70){
        this.scenario.personBhasFiled = true
      }
    this.personA.initialAgeRounded = Math.round(this.personA.initialAge)
    this.personB.initialAgeRounded = Math.round(this.personB.initialAge)
    this.personA.quitWorkDate = new Date(this.spouseAquitWorkYear, this.spouseAquitWorkMonth-1, 1)
    this.personB.quitWorkDate = new Date(this.spouseBquitWorkYear, this.spouseBquitWorkMonth-1, 1)
    if (this.spouseAfixedRetirementBenefitMonth && this.spouseAfixedRetirementBenefitYear){
      this.personA.fixedRetirementBenefitDate = new Date(this.spouseAfixedRetirementBenefitYear, this.spouseAfixedRetirementBenefitMonth-1, 1)
    }
    if (this.spouseBfixedRetirementBenefitMonth && this.spouseBfixedRetirementBenefitYear){
      this.personB.fixedRetirementBenefitDate = new Date(this.spouseBfixedRetirementBenefitYear, this.spouseBfixedRetirementBenefitMonth-1, 1)
    }
    this.personA.mortalityTable = this.mortalityService.determineMortalityTable(this.spouseAgender, this.spouseAmortalityInput, this.spouseAassumedDeathAge)
    this.personB.mortalityTable = this.mortalityService.determineMortalityTable(this.spouseBgender, this.spouseBmortalityInput, this.spouseBassumedDeathAge)
    //set initialCalcDate
      //if single, it's year in which user turns 62
      if (this.scenario.maritalStatus == "single") {
        this.scenario.initialCalcDate = new Date(this.personA.SSbirthDate.getFullYear()+62, 0, 1)
      }
      //If married, set initialCalcDate to Jan 1 of year in which first spouse reaches age 62
        if (this.scenario.maritalStatus == "married"){
          if (this.personA.SSbirthDate < this.personB.SSbirthDate)
            {
            this.scenario.initialCalcDate = new Date(this.personA.SSbirthDate.getFullYear()+62, 0, 1)
            }
          else {//This is fine as a simple "else" statement. If the two SSbirth dates are equal, doing it as of either date is fine.
          this.scenario.initialCalcDate = new Date(this.personB.SSbirthDate.getFullYear()+62, 0, 1)
            }
        }
      //If divorced, we want initialCalcDate to be Jan 1 of personA's age62 year.
      if (this.scenario.maritalStatus == "divorced") {
        this.scenario.initialCalcDate = new Date(this.personA.SSbirthDate.getFullYear()+62, 0, 1)
      }
      //Reset conditionally-hidden inputs as necessary, based on changes to other inputs. (If a hidden input should be null/false based on status of other inputs, make sure it is null/false.)
      this.resetHiddenInputs()
    }

  checkValidRetirementInputs(person:Person, retirementBenefitDate:Date) {
    let error = undefined

    //Make sure there is an input
    //if ( isNaN(retirementBenefitDate.getFullYear()) || isNaN(retirementBenefitDate.getMonth()) ) {
    if (!retirementBenefitDate || isNaN(retirementBenefitDate.getFullYear()) ){
      if (this.scenario.maritalStatus == "divorced" && person.id == "B"){
        error = "Your ex-spouse's filing date is necessary in order to run the calculation. If you do not know the answer, you can call the SSA to see if your ex-spouse has filed for his/her retirement benefit. Or you can guess as to your ex-spouse's plans (e.g., assume they file at age 66)."
      }
      else {//otherwise just give generic "please enter date" message
        error = "Please enter a date."
      }
      return error
    }

    //Validation in case they try to start benefit earlier than possible or after 70
    let earliestDate: Date = new Date(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth(), 1)
    if (person.actualBirthDate.getDate() > 2) {
      earliestDate.setMonth(earliestDate.getMonth()+1)
    }
    if (retirementBenefitDate < earliestDate) {error = "Please enter a later date. A person cannot file for retirement benefits before the first month in which they are 62 for the entire month."}
    let latestDate: Date = new Date (person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth(), 1)
    if (retirementBenefitDate > latestDate) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
    return error
  }


  checkValidSpousalInputs(person:Person, otherPerson:Person, ownRetirementBenefitDate:Date, spousalBenefitDate:Date, otherPersonRetirementBenefitDate:Date) {
    let error = undefined
    let secondStartDate:Date = new Date(1,1,1)
    //Make sure there is an input (Note that this will get overrode in the customDates function after the error check, in cases where there isn't supposed to be a user input)
    if ( isNaN(spousalBenefitDate.getFullYear()) || isNaN(spousalBenefitDate.getMonth()) ) {
      error = "Please enter a date."
    }

    //Deemed filing validation
    if (person.actualBirthDate < this.deemedFilingCutoff) {//old deemed filing rules apply: If spousalBenefitDate < FRA, it must be equal to ownRetirementBenefitDate
        if ( spousalBenefitDate < person.FRA && spousalBenefitDate.getTime() !== ownRetirementBenefitDate.getTime() )
        {
        error = "You can't file a restricted application (i.e., application for spousal-only) prior to your FRA."
        }
    }
    else {//new deemed filing rules apply
      //Married version: own spousalBenefitDate must equal later of own retirementBenefitDate or other spouse's retirementBenefitDate
        if(this.scenario.maritalStatus == "married") {
          if (ownRetirementBenefitDate < otherPersonRetirementBenefitDate) {
            secondStartDate = new Date(otherPersonRetirementBenefitDate)
          }
          else {
            secondStartDate = new Date(ownRetirementBenefitDate)
          }
          if ( spousalBenefitDate.getTime() !== secondStartDate.getTime() ) {
          error = "Per new deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or your spouse's retirement benefit date."
          }
        }
      //Divorced version: own spousalBenefitDate must equal later of own retirementBenefitDate or other spouse's age62 date
        if(this.scenario.maritalStatus == "divorced") {
          let exSpouse62Date = new Date(otherPerson.actualBirthDate.getFullYear()+62, otherPerson.actualBirthDate.getMonth(), 1)
          if (otherPerson.actualBirthDate.getDate() > 2){
            exSpouse62Date.setMonth(exSpouse62Date.getMonth()+1)
          }
          if (ownRetirementBenefitDate < exSpouse62Date) {
            secondStartDate = new Date(exSpouse62Date)
          }
          else {
            secondStartDate = new Date(ownRetirementBenefitDate)
          }
          if ( spousalBenefitDate.getTime() !== secondStartDate.getTime() ) {
          error = "Per new deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or the first month in which your ex-spouse is 62 for the entire month."
          }
        }
    }

    //Validation in case they try to start benefit earlier than possible.
    let earliestDate: Date = new Date(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth(), 1)
    if (person.actualBirthDate.getDate() > 2) {
      earliestDate.setMonth(earliestDate.getMonth()+1)
    }
    if (spousalBenefitDate < earliestDate) {error = "Please enter a later date. You cannot file for spousal benefits before the first month in which you are 62 for the entire month."}

    //Validation in case they try to start spousal benefit before other spouse's retirement benefit.
    if (spousalBenefitDate < otherPersonRetirementBenefitDate && this.scenario.maritalStatus == "married") {error = "You cannot start your spousal benefit before your spouse has filed for his/her own retirement benefit."}

    return error
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
        this.scenario.personBhasFiled = false
      }
    //reset earnings test inputs if "still working" is false
      if (this.spouseAworking === false) {
        this.personA.monthlyEarnings = 0
        this.spouseAquitWorkMonth = null
        this.spouseAquitWorkYear = null
      }
      if (this.spouseBworking === false) {
        this.personB.monthlyEarnings = 0
        this.spouseBquitWorkMonth = null
        this.spouseBquitWorkYear = null
      }
    //reset fixed retirement date inputs if person has no fixed retirement date
      if (this.scenario.personAhasFiled === false && this.personA.isDisabled === false) {
        this.spouseAfixedRetirementBenefitMonth = null
        this.spouseAfixedRetirementBenefitYear = null
        this.personA.fixedRetirementBenefitDate = null
      }
      if (this.scenario.personBhasFiled === false && this.personA.isDisabled === false && this.scenario.maritalStatus == "married") {
        this.spouseBfixedRetirementBenefitMonth = null
        this.spouseBfixedRetirementBenefitYear = null
        this.personB.fixedRetirementBenefitDate = null
      }
  }

  resetErrors(){
    this.spouseAfixedRetirementDateError = undefined
    this.spouseBfixedRetirementDateError = undefined
    this.customSpouseAretirementDateError = undefined
    this.customSpouseBretirementDateError = undefined
  }

  checkForFixedRetirementDateErrors(){
    if (this.scenario.personAhasFiled === true) {
      this.spouseAfixedRetirementDateError = this.checkValidRetirementInputs(this.personA, this.personA.fixedRetirementBenefitDate)
    }
    if ( (this.scenario.maritalStatus == "married" && this.scenario.personBhasFiled === true) || (this.scenario.maritalStatus == "divorced") )  {//If married and personB has filed, or if divorced
      this.spouseBfixedRetirementDateError = this.checkValidRetirementInputs(this.personB, this.personB.fixedRetirementBenefitDate)
    }
  }

  primaryFormInputChange(){
    this.getPrimaryFormInputs()
    this.primaryFormHasChanged = true
  }
}
