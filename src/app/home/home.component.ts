import {Component, OnInit, ViewChild, AfterViewInit} from '@angular/core'
import {BirthdayService} from '../birthday.service'
import {CalculatePvService} from '../calculate-PV.service'
import {MortalityService, mortalityTableOption} from '../mortality.service'
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
import { RangeComponent } from '../range/range.component'
import { ActivatedRoute } from '@angular/router'
import { MaximizePVService } from '../maximize-pv.service'


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private route: ActivatedRoute, private inputValidationService:InputValidationService, private birthdayService: BirthdayService, private mortalityService: MortalityService,
    private calculatePvService: CalculatePvService, private maximizePvService:MaximizePVService, private benefitService: BenefitService, private http: HttpClient) { 

    }

  ngOnInit() {
    this.personA.gender = "male"
    this.personB.gender = "female"

    //Get inputs from URL parameters, if applicable
    this.getInputsFromURLparameters()

    //Get TIPS yield for discount rate
    this.http.get<FREDresponse>("https://www.quandl.com/api/v3/datasets/FRED/DFII20.json?limit=1&api_key=iuEbMEnRuZzmUpzMYgx3")
      .subscribe( 
        data => { // we got the TIPS discount rate from www.quandl.com
          this.tipsDiscountRate = data.dataset.data[0][1];
          this.scenario.discountRate = this.tipsDiscountRate;
          this.defaultDiscountRateSource = "TIPS";
          console.log("'get<FREDresponse>' got TIPS rate from internet");
        },
        error => { 
          // If there is no internet, we get here after going to end of ngOnInit()
          // If there is internet, we may get here if there was an error in the 'subscribe' process
          // so we'll set the error parameters
          this.scenario.discountRate = this.defaultDiscountRateIfError;
          this.defaultDiscountRateSource = "ERROR"
          console.log("ngOnInit() got ERROR, using defaults");
        },
        //The subscribe method of Observable accepts 3 optional functions as parameters: what to do with data that comes back, what to do with error if one occurs, what to do on completion
        //If discount rate was set via URL parameter, we want use that instead of TIPS yield. We have to put this here (onComplete) to make sure it happens AFTER observable
        () =>{
          if (this.urlDiscountRate){
            this.scenario.discountRate = this.urlDiscountRate
            this.defaultDiscountRateSource = "URL";
            console.log("ngOnInit() got discount rate from URL");
          }
        }
      )


  }


  @ViewChild(RangeComponent)
  private rangeComponent:RangeComponent
  personA = new Person("A")
  personB = new Person("B")
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
              2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
              2020]

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

  // defaults
  urlDiscountRate: number
  tipsDiscountRate: number
  defaultDiscountRateIfError: number = 1
  defaultDiscountRateSource: string
  // these allow updating of table without changing home.component.html
  defaultMortalityTableID: mortalityTableOption = "SSA2017"
  defaultMortalityTableName: string = "2017 Social Security Period Life Table"


//Inputs from form
  personAprimaryPIAinput: number = 1000
  personAsecondaryPIAinput: number = 1000
  personAinputMonth: number = 4
  personAinputDay: number = 15
  personAinputYear: number = 1960
  personAfixedRetirementBenefitMonth: number
  personAfixedRetirementBenefitYear: number
  personAfixedMotherFatherBenefitMonth: number
  personAfixedMotherFatherBenefitYear: number
  personAfixedSurvivorBenefitMonth: number
  personAfixedSurvivorBenefitYear: number
  personAnonCoveredPensionMonth:number = 1
  personAnonCoveredPensionYear:number = 2020
  personAassumedDeathAge: number = 100 // what many people might hope
  personAmortalityInput: mortalityTableOption = this.defaultMortalityTableID
  personBprimaryPIAinput: number = 1000
  personBsecondaryPIAinput: number = 1000
  personBinputMonth: number = 4
  personBinputDay: number = 15
  personBinputYear: number = 1960
  personBdeathInputMonth: number = 4
  personBdeathInputYear: number = 2020
  personBfixedRetirementBenefitMonth: number
  personBfixedRetirementBenefitYear: number
  personBnonCoveredPensionMonth:number = 1
  personBnonCoveredPensionYear:number = 2020
  personBmortalityInput: mortalityTableOption = this.defaultMortalityTableID
  personBassumedDeathAge: number = 100 // what many people might hope

  // items for possible additional input
  additionalInput: boolean = false
  disabilityShow: boolean = false
  workingShow: boolean = false
  pensionShow: boolean = false
  mortalityShow: boolean = false
  childrenShow: boolean = false
  discountShow: boolean = false
  cutShow: boolean = false

  childUnder16orDisabled: boolean = false

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
  customPersonAsurvivorBenefitMonth: number = this.todayMonth
  customPersonAsurvivorBenefitYear: number = this.todayYear



//Inputs from Range component
  rangeComponentShowCutRadio:boolean = false //This will be set based on a boolean emited by child (Range) component when user flips cut/nocut radio button. False will mean show without a cut, true will mean show with a cut.


  //solution variables
  asComparedToPV:number //this is the PV of the recommended strategy, either .PV or .pvNoCut depending on status of rangeComponentShowCutRadio
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
        this.solutionSet = this.maximizePvService.maximizeSinglePersonPV(this.personA, this.scenario)
      }
      else if (this.scenario.maritalStatus == "married"){
          if (this.personA.initialAge < 70 && this.personB.initialAge < 70) {//i.e., if both spouses are under 70 (and we therefore need to iterate ages for both)
            this.solutionSet = this.maximizePvService.maximizeCouplePViterateBothPeople(this.personA, this.personB, this.scenario)
          }
          else if (this.personA.initialAge >= 70){//if personA is over 70, we only need to iterate ages for B
            this.solutionSet = this.maximizePvService.maximizeCouplePViterateOnePerson(this.scenario, this.personB, this.personA)
          }
          else if (this.personB.initialAge >= 70){//if personB is over 70, we only need to iterate ages for A
            this.solutionSet = this.maximizePvService.maximizeCouplePViterateOnePerson(this.scenario, this.personA, this.personB)
          }
      }
      else if (this.scenario.maritalStatus == "divorced") {
          this.solutionSet = this.maximizePvService.maximizeCouplePViterateOnePerson(this.scenario, this.personA, this.personB)
      }
      else if (this.scenario.maritalStatus == "survivor"){
          this.solutionSet = this.maximizePvService.maximizeSurvivorPV(this.personA, this.personB, this.scenario)
      }
    }
    // computation is finished
    this.solutionSet.computationComplete = true;
    this.normalCursor()
    this.primaryFormHasChanged = false//Set this to false so that customDates() doesn't rerun onSubmit() next time it is run, unless another change is made to primary inputs
    if (this.customClaimStrategy.PV > 0){//If customDates() has already been run (and this function is being rerun via top submit button after having changed a primary input), rerun the PV calc with custom dates and new primary inputs
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

    //Create a clone of the normal scenario object, for the purpose of changing the value of benefitCutAssumption when flipping back and forth between "cut" and "nocut" in the Range component (don't want to change the original CalculationScenario object)
              //Note though that any fields that are themselves objects will just be copied by reference. So changes to that object would change both ClaimingScenario objects.
    let customCalculationScenario: CalculationScenario = Object.assign(new CalculationScenario(), this.scenario)
    //The above line will set benefitCutAssumption to true in customCalculationScenario if it's true in primary form input, so we have to set back to false if "NoCut" radio is selected
    if (this.rangeComponentShowCutRadio === false){
      customCalculationScenario.benefitCutAssumption = false
    }

    this.customClaimStrategy = new ClaimStrategy(this.personA, this.personB)//new object in order to reset outputTable to be undefined, PV to be undefined, and outputTableComplete to be false
    this.getCustomDateFormInputs()
    this.errorCollection = this.inputValidationService.checkForCustomDateErrors(this.errorCollection, customCalculationScenario, this.personA, this.personB)
    //Calc PV with input dates
      if (this.errorCollection.hasErrors === false){
        if (this.scenario.maritalStatus == "single") {
          this.customClaimStrategy = this.calculatePvService.calculateSinglePersonPV(this.personA, customCalculationScenario, true)
        }
        else {
          this.customClaimStrategy = this.calculatePvService.calculateCouplePV(this.personA, this.personB, customCalculationScenario, true)
        }
        this.asComparedToPV = this.rangeComponentShowCutRadio == true ? this.solutionSet.claimStrategy.PV : this.solutionSet.claimStrategy.pvNoCut
        this.differenceInPV = this.customClaimStrategy.PV - this.asComparedToPV
        this.differenceInPV_asPercent = (this.differenceInPV / this.asComparedToPV) * 100
        //Update the range component view
        if (this.rangeComponent){
          this.rangeComponent.updateRangeComponentBasedOnDropDownInputs()
        }
      }
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
    if (this.scenario.maritalStatus == "survivor"){
      this.personB.dateOfDeath = new MonthYearDate(this.personBdeathInputYear, this.personBdeathInputMonth-1)
    }
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
        this.personA.PIA = Number(this.personAprimaryPIAinput)
      }
      else {//i.e., personA will be getting noncovered pension
        //create nonCoveredPensionDate
        this.personA.nonCoveredPensionDate = new MonthYearDate(this.personAnonCoveredPensionYear, this.personAnonCoveredPensionMonth-1)
        //set WEP_PIA and nonWEP_PIA based on primary/secondary PIAinput
        if (this.personA.isOnDisability === true && this.personA.nonCoveredPensionDate > this.today){//if person is on disability and pension has not yet begun, primaryPIAinput represents their nonWEP_PIA
          this.personA.nonWEP_PIA = Number(this.personAprimaryPIAinput)
          this.personA.WEP_PIA = Number(this.personAsecondaryPIAinput)
        }
        else {//in all other cases in which person is eligible for noncovered pension, primaryPIAinput is their WEP PIA
          this.personA.WEP_PIA = Number(this.personAprimaryPIAinput)
          this.personA.nonWEP_PIA = Number(this.personAsecondaryPIAinput)
        }
      }
      //personB
      if (this.personB.eligibleForNonCoveredPension === false){
        this.personB.PIA = Number(this.personBprimaryPIAinput)
      }
      else {//i.e., personB will be getting noncovered pension
        //create nonCoveredPensionDate
        this.personB.nonCoveredPensionDate = new MonthYearDate(this.personBnonCoveredPensionYear, this.personBnonCoveredPensionMonth-1)
        //set WEP_PIA and nonWEP_PIA based on primary/secondary PIAinput
        if (this.personB.isOnDisability === true && this.personB.nonCoveredPensionDate > this.today){//if person is on disability and pension has not yet begun, primaryPIAinput represents their nonWEP_PIA
          this.personB.nonWEP_PIA = Number(this.personBprimaryPIAinput)
          this.personB.WEP_PIA = Number(this.personBsecondaryPIAinput)
        }
        else {//in all other cases in which person is eligible for noncovered pension, primaryPIAinput is their WEP PIA
          this.personB.WEP_PIA = Number(this.personBprimaryPIAinput)
          this.personB.nonWEP_PIA = Number(this.personBsecondaryPIAinput)
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
    this.personA.mortalityTable = this.mortalityService.determineMortalityTable(this.personA.gender, this.personAmortalityInput, this.personAassumedDeathAge)
    this.personB.mortalityTable = this.mortalityService.determineMortalityTable(this.personB.gender, this.personBmortalityInput, this.personBassumedDeathAge)
    this.personA.baseMortalityFactor = this.mortalityService.calculateBaseMortalityFactor(this.personA)
    this.personB.baseMortalityFactor = this.mortalityService.calculateBaseMortalityFactor(this.personB)

    //Set fixedSurvivorBenefitDate and fixedMotherFatherBenefitDate if applicable
    if (this.personAfixedSurvivorBenefitMonth && this.personAfixedSurvivorBenefitYear){
      this.personA.fixedSurvivorBenefitDate = new MonthYearDate(this.personAfixedSurvivorBenefitYear, this.personAfixedSurvivorBenefitMonth-1)
    }
    if (this.personAfixedMotherFatherBenefitMonth && this.personAfixedMotherFatherBenefitYear){
      this.personA.fixedMotherFatherBenefitDate = new MonthYearDate(this.personAfixedMotherFatherBenefitYear, this.personAfixedMotherFatherBenefitMonth-1)
    }

    //Clear children array and only push as many children objects as applicable
    if (this.scenario.numberOfChildren > 0){
        this.scenario.setChildrenArray(this.childrenObjectsArray, this.today)
    }
    else {this.scenario.children = []}
    this.childUnder16orDisabled = this.birthdayService.checkForChildUnder16orDisabled(this.scenario)


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
    this.personA.childInCareSpousalBenefitDate = undefined
    this.personA.beginSuspensionDate = undefined
    this.personA.endSuspensionDate = undefined
    this.personA.survivorBenefitDate = undefined
    this.personA.motherFatherBenefitDate = undefined
    this.personB.retirementBenefitDate = undefined
    this.personB.spousalBenefitDate = undefined
    this.personB.childInCareSpousalBenefitDate = undefined
    this.personB.beginSuspensionDate = undefined
    this.personB.endSuspensionDate = undefined
    this.personB.survivorBenefitDate = undefined

    //Set retirementBenefitDate fields
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
      else {//personB has no fixedRetirementBenefitDate
        this.personB.retirementBenefitDate = new MonthYearDate(this.customPersonBretirementBenefitYear, this.customPersonBretirementBenefitMonth-1)
        if (this.scenario.maritalStatus == "survivor"){//it's a survivor scenario, and personB hadn't filed as of date of death (we know this because personB has no fixedRetirementBenefitDate)
          //set to FRA if they died prior to FRA or date of death if they died after FRA
          if (this.personB.dateOfDeath < this.personB.FRA){
            this.personB.retirementBenefitDate = new MonthYearDate(this.personB.FRA)
          }
          else {
            this.personB.retirementBenefitDate = new MonthYearDate(this.personB.dateOfDeath)
          }
        }
      }


    //Set survivor benefit dates
        //In survivor scenario, if personA has a fixedSurvivorBenefitDate or fixedMotherFatherBenefitDate (i.e., person already filed), use those for applicable fields.
        //Otherwise, use input from Custom Date form. (Or in motherfatherbenefitdate case, just set it to earliest date. Like child benefits, we'll just have a message saying "file asap")
        if (this.scenario.maritalStatus == "survivor"){
          if (this.personA.hasFiledAsSurvivor === true){
            this.personA.survivorBenefitDate = new MonthYearDate(this.personA.fixedSurvivorBenefitDate)
          }
          else {
            this.personA.survivorBenefitDate = new MonthYearDate(this.customPersonAsurvivorBenefitYear, this.customPersonAsurvivorBenefitMonth-1)
          }
          if (this.personA.hasFiledAsMotherFather === true){
            this.personA.motherFatherBenefitDate = new MonthYearDate(this.personA.fixedMotherFatherBenefitDate)
          }
          else {
            this.personA.motherFatherBenefitDate = new MonthYearDate(this.maximizePvService.findEarliestMotherFatherBenefitDate(this.personB, this.scenario))
          }
        }
        else{//If not a survivor scenario, set survivorBenefitDate to survivorFRA
          this.personA.survivorBenefitDate = new MonthYearDate(this.personA.survivorFRA)
          this.personB.survivorBenefitDate = new MonthYearDate(this.personB.survivorFRA)
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
          this.maximizePvService.adjustSpousalBenefitDate(this.personA, this.personB, this.scenario)
          //Also, set childInCareSpousal field to true if applicable
          //If there is no disabled child, and spousalBenefitDate is after FRA and after youngestchildturns16date, then there must not have been an automatic conversion (to regular spousal from child-in-care spousal) which means they weren't on child-in-care spousal
          if (!(this.personA.spousalBenefitDate > this.personA.FRA && this.personA.spousalBenefitDate > this.scenario.youngestChildTurns16date && this.scenario.disabledChild === false)){
            this.personA.childInCareSpousal = true
          }
        }
        if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(this.scenario, this.personA.retirementBenefitDate) === true){
          this.maximizePvService.adjustSpousalBenefitDate(this.personB, this.personA, this.scenario)
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
            this.maximizePvService.adjustSpousalBenefitDate(this.personA, this.personB, this.scenario)
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
          this.maximizePvService.adjustSpousalBenefitDate(this.personB, this.personA, this.scenario)
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
    //If a person has no PIA, retirementBenefitDate input will be hidden, so set it to satisfy deemed filing rule using their selected spousal benefit date.
      if (this.personA.PIA == 0){
        this.personA.retirementBenefitDate = new MonthYearDate(this.personA.spousalBenefitDate)
        // //But don't let retirementBenefitDate be later than 70, or inputvalidation.service will give error.
        // if (this.personA.retirementBenefitDate > new MonthYearDate(this.personA.SSbirthDate.getFullYear()+70, this.personA.SSbirthDate.getMonth()) ){
        //   this.personA.retirementBenefitDate = new MonthYearDate(this.personA.SSbirthDate.getFullYear()+70, this.personA.SSbirthDate.getMonth())
        // }
      }
      if (this.personB.PIA == 0){
        this.personB.retirementBenefitDate = new MonthYearDate(this.personB.spousalBenefitDate)
        // //But don't let retirementBenefitDate be later than 70, or inputvalidation.service will give error.
        // if (this.personB.retirementBenefitDate > new MonthYearDate(this.personB.SSbirthDate.getFullYear()+70, this.personB.SSbirthDate.getMonth()) ){
        //   this.personB.retirementBenefitDate = new MonthYearDate(this.personB.SSbirthDate.getFullYear()+70, this.personB.SSbirthDate.getMonth())
        // }
      }

    //Reset "personB has filed" to false if divorced. (Otherwise can have bug if they selected married, yes personB has filed, then switch to divorced because the "has personB filed" input disappears and calc won't run.)
      if (this.scenario.maritalStatus == "divorced" && this.personB.initialAge < 70) {
        this.personB.hasFiled = false
      }

    //Reset applicable personB inputs if personB is deceased
      if (this.scenario.maritalStatus == "survivor"){
        this.personB.eligibleForNonCoveredPension = false
        this.personBworking = false
        this.personB.isOnDisability = false
      }

    //Reset personB.dateOfDeath if not survivor scenario
      if (this.scenario.maritalStatus !== "survivor"){
        this.personB.dateOfDeath = undefined
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
    //reset fixed date inputs if person has no applicable fixed date
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
      if (this.personA.hasFiledAsMotherFather === false){
        this.personAfixedMotherFatherBenefitMonth = null
        this.personAfixedMotherFatherBenefitYear = null
        this.personA.fixedMotherFatherBenefitDate = null
      }
      if (this.personA.hasFiledAsSurvivor === false){
        this.personAfixedSurvivorBenefitMonth = null
        this.personAfixedSurvivorBenefitYear = null
        this.personA.fixedSurvivorBenefitDate = null
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

  alternativeStrategyPVcalcViaClickOnRange(claimStrategy:ClaimStrategy){
    //When a cell is clicked in the Range component, selectCell() is called there. That emits a ClaimStrategy object to this component.
    //We use that ClaimStrategy object to set all the custom date inputs.
    //Then we call the customDates() function to calculate the PV and provide all the output related to that custom ClaimStrategy
    if (claimStrategy){//Only do all of this if an actual claimStrategy came back via the click. If it wasn't a valid claimStrategy, do nothing?
      this.customPersonAretirementBenefitMonth = claimStrategy.personARetirementDate.getMonth()+1
      this.customPersonAretirementBenefitYear = claimStrategy.personARetirementDate.getFullYear()
      this.customPersonAspousalBenefitMonth = claimStrategy.personASpousalDate.getMonth()+1
      this.customPersonAspousalBenefitYear = claimStrategy.personASpousalDate.getFullYear()
      this.customPersonAsurvivorBenefitMonth = claimStrategy.personAsurvivorDate.getMonth()+1
      this.customPersonAsurvivorBenefitYear = claimStrategy.personAsurvivorDate.getFullYear()
  
      this.customPersonAbeginSuspensionMonth = claimStrategy.personABeginSuspensionDate.getMonth()+1
      this.customPersonAbeginSuspensionYear = claimStrategy.personABeginSuspensionDate.getFullYear()
      this.customPersonAendSuspensionMonth = claimStrategy.personAEndSuspensionDate.getMonth()+1
      this.customPersonAendSuspensionYear = claimStrategy.personAEndSuspensionDate.getFullYear()
  
      if (this.scenario.maritalStatus == "married" || this.scenario.maritalStatus == "divorced"){
        this.customPersonBretirementBenefitMonth = claimStrategy.personBRetirementDate.getMonth()+1
        this.customPersonBretirementBenefitYear = claimStrategy.personBRetirementDate.getFullYear()
        this.customPersonBspousalBenefitMonth = claimStrategy.personBSpousalDate.getMonth()+1
        this.customPersonBspousalBenefitYear = claimStrategy.personBSpousalDate.getFullYear()
    
        this.customPersonBbeginSuspensionMonth = claimStrategy.personBBeginSuspensionDate.getMonth()+1
        this.customPersonBbeginSuspensionYear = claimStrategy.personBBeginSuspensionDate.getFullYear()
        this.customPersonBendSuspensionMonth = claimStrategy.personBEndSuspensionDate.getMonth()+1
        this.customPersonBendSuspensionYear = claimStrategy.personBEndSuspensionDate.getFullYear()
      }
  
      //reset "decline" inputs
        this.personA.declineSpousal = false
        this.personA.declineSuspension = false
        this.personB.declineSpousal = false
        this.personB.declineSuspension = false
  
      this.customDates()
    }

  }

  alternativeStrategyPVcalcViaRangeBenefitCutBooleanSwitch(showCut:boolean){
    if (showCut === true){
      this.rangeComponentShowCutRadio = true
    }
    else {
      this.rangeComponentShowCutRadio = false
    }
    if (this.customClaimStrategy.PV > 0){//Run customDates() to calculate new PV. But we only want to run it if it has been run already, otherwise this runs as soon as Range component is initiated, which generates errors
      this.customDates()
    }
  }

  getInputsFromURLparameters(){
    this.route.queryParams.subscribe(params => {
      if (params['additionalInput']){
        this.additionalInput = params['additionalInput'] == "true" ? true : false
      }
      if (params['disabilityShow']){
        this.disabilityShow = params['disabilityShow'] == "true" ? true : false
      }
      if (params['workingShow']){
        this.workingShow = params['workingShow'] == "true" ? true : false
      }
      if (params['pensionShow']){
        this.pensionShow = params['pensionShow'] == "true" ? true : false
      }
      if (params['mortalityShow']){
        this.mortalityShow = params['mortalityShow'] == "true" ? true : false
      }
      if (params['childrenShow']){
        this.childrenShow = params['childrenShow'] == "true" ? true : false
      }
      if (params['discountShow']){
        this.discountShow = params['discountShow'] == "true" ? true : false
      }
      if (params['cutShow']){
        this.cutShow = params['cutShow'] == "true" ? true : false
      }
          //Scenario inputs
          if (params['marital']){
            this.scenario.maritalStatus = params['marital']
          }
          if (params['discount']){
            this.urlDiscountRate = Number(params['discount'])
          }
          if (params['cutAssumption']){
            this.scenario.benefitCutAssumption = params['cutAssumption'] == "true" ? true : false
          }
          if (params['cutYear']){
            this.scenario.benefitCutYear = Number(params['cutYear'])
          }
          if (params['cutPercent']){
            this.scenario.benefitCutPercentage = Number(params['cutPercent'])
          }
      //personA inputs
          if (params['aGender']){
            this.personA.gender = params['aGender']
          }
          if (params['aDOBm']){
            this.personAinputMonth = Number(params['aDOBm'])
          }
          if (params['aDOBd']){
            this.personAinputDay = Number(params['aDOBd'])
          }
          if (params['aDOBy']){
            this.personAinputYear = Number(params['aDOBy'])
          }
          if (params['aDisability']){
            this.personA.isOnDisability = params['aDisability'] == "true" ? true : false
          }
          if (params['aPIA']){
            this.personAprimaryPIAinput = Number(params['aPIA'])
          }
          if (params['aFixedRBm']){
            this.personAfixedRetirementBenefitMonth = Number(params['aFixedRBm'])
          }
          if (params['aFixedRBy']){
            this.personAfixedRetirementBenefitYear = Number(params['aFixedRBy'])
          }
          if (params['aWorking']){
            this.personAworking = params['aWorking'] == "true" ? true : false
          }
          if (params['aQuitm']){
            this.personAquitWorkMonth = Number(params['aQuitm'])
          }
          if (params['aQuity']){
            this.personAquitWorkYear = Number(params['aQuity'])
          }
          if (params['aEarnings']){
            this.personA.monthlyEarnings = Number(params['aEarnings'])
          }
          if (params['aFiled']){
            this.personA.hasFiled = params['aFiled'] == "true" ? true : false
          }
          if (params['aEligiblePension']){
            this.personA.eligibleForNonCoveredPension = params['aEligiblePension'] == "true" ? true : false
          }
          if (params['aPensionm']){
            this.personAnonCoveredPensionMonth = Number(params['aPensionm'])
          }
          if (params['aPensiony']){
            this.personAnonCoveredPensionYear = Number(params['aPensiony'])
          }
          if (params['aGovPension']){
            this.personA.governmentPension = Number(params['aGovPension'])
          }
          if (params['aPIA2']){
            this.personAsecondaryPIAinput = Number(params['aPIA2'])
          }
          if (params['aMortality']){
            this.personAmortalityInput = params['aMortality']
          }
          if (params['aDeathAge']){
            this.personAassumedDeathAge = Number(params['aDeathAge'])
          }

      //personB inputs
          if (params['bGender']){
            this.personB.gender = params['bGender']
          }
          if (params['bDOBm']){
            this.personBinputMonth = Number(params['bDOBm'])
          }
          if (params['bDOBd']){
            this.personBinputDay = Number(params['bDOBd'])
          }
          if (params['bDOBy']){
            this.personBinputYear = Number(params['bDOBy'])
          }
          if (params['bDisability']){
            this.personB.isOnDisability = params['bDisability'] == "true" ? true : false
          }
          if (params['bPIA']){
            this.personBprimaryPIAinput = Number(params['bPIA'])
          }
          if (params['bFixedRBm']){
            this.personBfixedRetirementBenefitMonth = Number(params['bFixedRBm'])
          }
          if (params['bFixedRBy']){
            this.personBfixedRetirementBenefitYear = Number(params['bFixedRBy'])
          }
          if (params['bWorking']){
            this.personBworking = params['bWorking'] == "true" ? true : false
          }
          if (params['bQuitm']){
            this.personBquitWorkMonth = Number(params['bQuitm'])
          }
          if (params['bQuity']){
            this.personBquitWorkYear = Number(params['bQuity'])
          }
          if (params['bEarnings']){
            this.personB.monthlyEarnings = Number(params['bEarnings'])
          }
          if (params['bFiled']){
            this.personB.hasFiled = params['bFiled'] == "true" ? true : false
          }
          if (params['bEligiblePension']){
            this.personB.eligibleForNonCoveredPension = params['bEligiblePension'] == "true" ? true : false
          }
          if (params['bPensionm']){
            this.personBnonCoveredPensionMonth = Number(params['bPensionm'])
          }
          if (params['bPensiony']){
            this.personBnonCoveredPensionYear = Number(params['bPensiony'])
          }
          if (params['bGovPension']){
            this.personB.governmentPension = Number(params['bGovPension'])
          }
          if (params['bPIA2']){
            this.personBsecondaryPIAinput = Number(params['bPIA2'])
          }
          if (params['bMortality']){
            this.personBmortalityInput = params['bMortality']
          }
          if (params['bDeathAge']){
            this.personBassumedDeathAge = Number(params['bDeathAge'])
          }

      //Not sure how to handle per-child inputs, since they're coming through in a separate component
      if (params['children']){
        this.qualifyingChildrenBoolean = params['children'] == "true" ? true : false
      }
    })
  }

}
