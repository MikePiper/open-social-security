import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { BenefitService } from '../benefit.service';
import {BirthdayService} from '../birthday.service'
import {PresentvalueService} from '../presentvalue.service'
import {SolutionSet} from '../solutionset'

@Component({
  selector: 'app-input-form',
  templateUrl: './input-form.component.html',
  styleUrls: ['./input-form.component.css']
})
export class InputFormComponent implements OnInit {

  constructor(private benefitService: BenefitService, private birthdayService: BirthdayService, private presentvalueService: PresentvalueService, private http: HttpClient) { }

  ngOnInit() {
  }
  today = new Date()

//Variables to make form work
  inputMonths: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  inputDays: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
              16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
  inputYears = [ 1947, 1948, 1949,
              1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
              1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969,
              1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
              1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
              1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
              2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
              2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018
              ]
  inputBenefitYears = [2014, 2015, 2016, 2017, 2018, 2019,
                    2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
                    2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
                    2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049,
                    2050, 2051, 2052, 2053, 2054, 2055, 2056, 2057, 2058, 2059,
                    2060]


//Inputs from form
  maritalStatus: string = "unmarried"
  spouseAinputMonth: number = 4
  spouseAinputDay: number = 15
  spouseAinputYear: number = 1960
  spouseAPIA: number = 1000
  spouseAretirementBenefitMonth: number
  spouseAretirementBenefitYear: number
  spouseAretirementBenefitDate: Date
  spouseAspousalBenefitMonth: number
  spouseAspousalBenefitYear: number
  spouseAspousalBenefitDate: Date
  spouseAgender: string = "male"
  spouseAmortalityInput: string = "SSA"
  spouseBinputMonth: number = 4
  spouseBinputDay: number = 15
  spouseBinputYear: number = 1960
  spouseBPIA: number = 1000
  spouseBretirementBenefitMonth: number
  spouseBretirementBenefitYear: number
  spouseBretirementBenefitDate: Date
  spouseBspousalBenefitMonth: number
  spouseBspousalBenefitYear: number
  spouseBspousalBenefitDate: Date
  spouseBgender: string = "female"
  spouseBmortalityInput: string = "SSA"
  discountRate: number = 0.01
  advanced: boolean = false
  spouseAgovernmentPension: number = 0
  spouseBgovernmentPension: number = 0

  //Calculated dates and related info
  spouseAactualBirthDate: Date
  spouseASSbirthDate: Date
  spouseAFRA: Date
  spouseAsurvivorFRA: Date
  spouseBSSbirthDate: Date
  spouseBactualBirthDate: Date
  spouseBFRA: Date
  spouseBsurvivorFRA: Date
  spouseAage: number
  spouseBage: number
  spouseAageRounded: number
  spouseBageRounded: number
  spouseAmortalityTable: number[]
  spouseBmortalityTable: number[]


  //Error variables
  spouseAretirementDateError:string
  spouseBretirementDateError:string
  spouseAspousalDateError:string
  spouseBspousalDateError:string

  //solution variables
  customPV: number
  solutionSet: SolutionSet = {
    "solutionPV":null,
    "spouseAretirementSolution":null,
    "spouseBretirementSolution":null,
    "spouseAspousalSolution":null,
    "spouseBspousalSolution":null
  }

  onSubmit() {
  let startTime = performance.now() //for testing performance
  console.log("-------------")
  //Calculate ages, SSbirthdates, FRAs, etc.
  this.spouseAactualBirthDate = new Date (this.spouseAinputYear, this.spouseAinputMonth-1, this.spouseAinputDay)
  this.spouseASSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseAinputMonth, this.spouseAinputDay, this.spouseAinputYear))
  this.spouseAFRA = new Date(this.birthdayService.findFRA(this.spouseASSbirthDate))
  this.spouseAsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseASSbirthDate))
  this.spouseBactualBirthDate = new Date (this.spouseBinputYear, this.spouseBinputMonth-1, this.spouseBinputDay)
  this.spouseBSSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseBinputMonth, this.spouseBinputDay, this.spouseBinputYear))
  this.spouseBFRA = new Date(this.birthdayService.findFRA(this.spouseBSSbirthDate))
  this.spouseBsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseBSSbirthDate))
  this.spouseAage =  ( this.today.getMonth() - this.spouseASSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseASSbirthDate.getFullYear()) )/12
  this.spouseBage =  ( this.today.getMonth() - this.spouseBSSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseBSSbirthDate.getFullYear()) )/12
  this.spouseAageRounded = Math.round(this.spouseAage)
  this.spouseBageRounded = Math.round(this.spouseBage)
  //Determine appropriate mortality table based on user input
  if (this.spouseAgender == "male") {
    if (this.spouseAmortalityInput == "NS1") {this.spouseAmortalityTable = this.presentvalueService.maleNS1}
    if (this.spouseAmortalityInput == "NS2") {this.spouseAmortalityTable = this.presentvalueService.maleNS2}
    if (this.spouseAmortalityInput == "SSA") {this.spouseAmortalityTable = this.presentvalueService.maleSSAtable}
    if (this.spouseAmortalityInput == "SM1") {this.spouseAmortalityTable = this.presentvalueService.maleSM1}
    if (this.spouseAmortalityInput == "SM2") {this.spouseAmortalityTable = this.presentvalueService.maleSM2}
  }
  if (this.spouseAgender == "female") {
    if (this.spouseAmortalityInput == "NS1") {this.spouseAmortalityTable = this.presentvalueService.femaleNS1}
    if (this.spouseAmortalityInput == "NS2") {this.spouseAmortalityTable = this.presentvalueService.femaleNS2}
    if (this.spouseAmortalityInput == "SSA") {this.spouseAmortalityTable = this.presentvalueService.femaleSSAtable}
    if (this.spouseAmortalityInput == "SM1") {this.spouseAmortalityTable = this.presentvalueService.femaleSM1}
    if (this.spouseAmortalityInput == "SM2") {this.spouseAmortalityTable = this.presentvalueService.femaleSM2}
  }
  if (this.spouseBgender == "male") {
    if (this.spouseBmortalityInput == "NS1") {this.spouseBmortalityTable = this.presentvalueService.maleNS1}
    if (this.spouseBmortalityInput == "NS2") {this.spouseBmortalityTable = this.presentvalueService.maleNS2}
    if (this.spouseBmortalityInput == "SSA") {this.spouseBmortalityTable = this.presentvalueService.maleSSAtable}
    if (this.spouseBmortalityInput == "SM1") {this.spouseBmortalityTable = this.presentvalueService.maleSM1}
    if (this.spouseBmortalityInput == "SM2") {this.spouseBmortalityTable = this.presentvalueService.maleSM2}
  }
  if (this.spouseBgender == "female") {
    if (this.spouseBmortalityInput == "NS1") {this.spouseBmortalityTable = this.presentvalueService.femaleNS1}
    if (this.spouseBmortalityInput == "NS2") {this.spouseBmortalityTable = this.presentvalueService.femaleNS2}
    if (this.spouseBmortalityInput == "SSA") {this.spouseBmortalityTable = this.presentvalueService.femaleSSAtable}
    if (this.spouseBmortalityInput == "SM1") {this.spouseBmortalityTable = this.presentvalueService.femaleSM1}
    if (this.spouseBmortalityInput == "SM2") {this.spouseBmortalityTable = this.presentvalueService.femaleSM2}
  }
  //Call appropriate "maximizePV" function to find best solution
  if (this.maritalStatus == "unmarried") {
    this.solutionSet = this.presentvalueService.maximizeSinglePersonPV(Number(this.spouseAPIA), this.spouseASSbirthDate, this.spouseAactualBirthDate, this.spouseAage, this.spouseAFRA, this.spouseAgender, this.spouseAmortalityTable, Number(this.discountRate))
    }
  if(this.maritalStatus == "married")
    {
    this.solutionSet = this.presentvalueService.maximizeCouplePV(Number(this.spouseAPIA), Number(this.spouseBPIA), this.spouseAactualBirthDate, this.spouseBactualBirthDate, this.spouseASSbirthDate, this.spouseBSSbirthDate, Number(this.spouseAageRounded), Number(this.spouseBageRounded), this.spouseAFRA, this.spouseBFRA, this.spouseAsurvivorFRA, this.spouseBsurvivorFRA, this.spouseAgender, this.spouseBgender, this.spouseAmortalityTable, this.spouseBmortalityTable, Number(this.spouseAgovernmentPension), Number(this.spouseBgovernmentPension), Number(this.discountRate))
    }
  this.normalCursor()
    //For testing performance
    let endTime = performance.now()
    let elapsed = (endTime - startTime) /1000
    console.log("Time elapsed: " + elapsed)
  }

  customDates() {
    //TODO: Get all the normal inputs from above, calc SSbirthdates, FRAs, etc.
    this.spouseAactualBirthDate = new Date (this.spouseAinputYear, this.spouseAinputMonth-1, this.spouseAinputDay)
    this.spouseASSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseAinputMonth, this.spouseAinputDay, this.spouseAinputYear))
    this.spouseAFRA = new Date(this.birthdayService.findFRA(this.spouseASSbirthDate))
    this.spouseAsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseASSbirthDate))
    this.spouseBactualBirthDate = new Date (this.spouseBinputYear, this.spouseBinputMonth-1, this.spouseBinputDay)
    this.spouseBSSbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseBinputMonth, this.spouseBinputDay, this.spouseBinputYear))
    this.spouseBFRA = new Date(this.birthdayService.findFRA(this.spouseBSSbirthDate))
    this.spouseBsurvivorFRA = new Date(this.birthdayService.findSurvivorFRA(this.spouseBSSbirthDate))
    this.spouseAage =  ( this.today.getMonth() - this.spouseASSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseASSbirthDate.getFullYear()) )/12
    this.spouseBage =  ( this.today.getMonth() - this.spouseBSSbirthDate.getMonth() + 12 * (this.today.getFullYear() - this.spouseBSSbirthDate.getFullYear()) )/12
    this.spouseAageRounded = Math.round(this.spouseAage)
    this.spouseBageRounded = Math.round(this.spouseBage)
    //Get input benefit dates
    this.spouseAretirementBenefitDate = new Date(this.spouseAretirementBenefitYear, this.spouseAretirementBenefitMonth-1, 1)
    this.spouseAspousalBenefitDate = new Date(this.spouseAspousalBenefitYear, this.spouseAspousalBenefitMonth-1, 1)
    this.spouseBretirementBenefitDate = new Date(this.spouseBretirementBenefitYear, this.spouseBretirementBenefitMonth-1, 1)
    this.spouseBspousalBenefitDate = new Date(this.spouseBspousalBenefitYear, this.spouseBspousalBenefitMonth-1, 1)
    this.spouseAretirementDateError = this.checkValidRetirementInputs(this.spouseAFRA, this.spouseASSbirthDate, this.spouseAactualBirthDate, this.spouseAretirementBenefitDate)
    this.spouseBretirementDateError = this.checkValidRetirementInputs(this.spouseBFRA, this.spouseBSSbirthDate, this.spouseBactualBirthDate, this.spouseBretirementBenefitDate)
    this.spouseAspousalDateError = this.checkValidSpousalInputs(this.spouseAFRA, this.spouseAactualBirthDate, this.spouseASSbirthDate, this.spouseAretirementBenefitDate, this.spouseAspousalBenefitDate, this.spouseBretirementBenefitDate)
    this.spouseBspousalDateError = this.checkValidSpousalInputs(this.spouseBFRA, this.spouseBactualBirthDate, this.spouseBSSbirthDate, this.spouseBretirementBenefitDate, this.spouseBspousalBenefitDate, this.spouseAretirementBenefitDate)
    //Calc PV with input dates
    if (this.maritalStatus == "unmarried" && !this.spouseAretirementDateError) {
      this.customPV = this.presentvalueService.calculateSinglePersonPV(this.spouseAFRA, this.spouseASSbirthDate, Number(this.spouseAage), Number(this.spouseAPIA), this.spouseAretirementBenefitDate, this.spouseAgender, this.spouseAmortalityTable, Number(this.discountRate))
      }
    if(this.maritalStatus == "married" && !this.spouseAretirementDateError && !this.spouseBretirementDateError && !this.spouseBspousalDateError && !this.spouseAspousalDateError)
      {
      this.customPV = this.presentvalueService.calculateCouplePV(this.spouseAgender, this.spouseBgender, this.spouseAmortalityTable, this.spouseBmortalityTable, this.spouseASSbirthDate, this.spouseBSSbirthDate, Number(this.spouseAageRounded), Number(this.spouseBageRounded), this.spouseAFRA, this.spouseBFRA, this.spouseAsurvivorFRA, this.spouseBsurvivorFRA, Number(this.spouseAPIA), Number(this.spouseBPIA), this.spouseAretirementBenefitDate, this.spouseBretirementBenefitDate, this.spouseAspousalBenefitDate, this.spouseBspousalBenefitDate, Number(this.spouseAgovernmentPension), Number(this.spouseBgovernmentPension), Number(this.discountRate))
      }
  }

  checkValidRetirementInputs(FRA: Date, SSbirthDate: Date, actualBirthDate:Date, retirementBenefitDate:Date) {
    let error = undefined

    //Validation to make sure they are not filing for benefits in the past
    if ( (retirementBenefitDate.getFullYear() < this.today.getFullYear()) || (retirementBenefitDate.getFullYear() == this.today.getFullYear() && (retirementBenefitDate.getMonth() < this.today.getMonth() )) )
    {
    error = "Please enter a date no earlier than this month."
    }

    //Validation in case they try to start benefit earlier than possible or after 70
    let earliestDate: Date = new Date(SSbirthDate.getFullYear()+62, 1, 1)
    if (actualBirthDate.getDate() <= 2) {
      earliestDate.setMonth(actualBirthDate.getMonth())
    } else {
      earliestDate.setMonth(actualBirthDate.getMonth()+1)
    }
    if (retirementBenefitDate < earliestDate) {error = "Please enter a later date. You cannot file for retirement benefits before the first month in which you are 62 for the entire month."}
    let latestDate: Date = new Date (SSbirthDate.getFullYear()+70, SSbirthDate.getMonth(), 1)
    if (retirementBenefitDate > latestDate) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
    return error
  }


  checkValidSpousalInputs(FRA: Date, actualBirthDate:Date, SSbirthDate: Date, ownRetirementBenefitDate:Date, spousalBenefitDate:Date, otherSpouseRetirementBenefitDate:Date) {
    let error = undefined
    let deemedFilingCutoff: Date = new Date(1954, 0, 1)
    let secondStartDate:Date = new Date(1,1,1)
    //TODO: Needs validation for spousal benefit before retirement benefit if deemed filing should apply (i.e., under 62 on 1/1/2016 or if under FRA on input age for claiming spousal)
    if (actualBirthDate < deemedFilingCutoff) {//old deemed filing rules apply: If spousalBenefitDate < FRA, it must be equal to ownRetirementBenefitDate
        if ( spousalBenefitDate < FRA && ( spousalBenefitDate.getMonth() !== ownRetirementBenefitDate.getMonth() || spousalBenefitDate.getFullYear() !== ownRetirementBenefitDate.getFullYear() ) )
        {
        error = "You can't file a restricted application for just spousal benefits prior to your FRA."
        }
    }
    else {//new deemed filing rules apply: Own spousalBenefitDate must equal later of own retirementBenefitDate or other spouse's retirementBenefitDate
        if (ownRetirementBenefitDate < otherSpouseRetirementBenefitDate) {
          secondStartDate.setFullYear(otherSpouseRetirementBenefitDate.getFullYear())
          secondStartDate.setMonth(otherSpouseRetirementBenefitDate.getMonth())
        }
        else {
          secondStartDate.setFullYear(ownRetirementBenefitDate.getFullYear())
          secondStartDate.setMonth(ownRetirementBenefitDate.getMonth())
        }
        if ( spousalBenefitDate.getMonth() !== secondStartDate.getMonth() || spousalBenefitDate.getFullYear() !== secondStartDate.getFullYear() ) {
        error = "Invalid spousal benefit date per new deemed filing rules"
        }
    }
    //Validation to make sure they are not filing for benefits in the past
    if ( (spousalBenefitDate.getFullYear() < this.today.getFullYear()) || (spousalBenefitDate.getFullYear() == this.today.getFullYear() && (spousalBenefitDate.getMonth() < this.today.getMonth() )) )
    {
    error = "Please enter a date no earlier than this month."
    }

    //Validation in case they try to start benefit earlier than possible. (Just ignoring the "must be 62 for entire month" rule right now.) (No validation check for after age 70, because sometimes that will be earliest they can -- if they're much younger than other spouse.)
    let claimingAge: number = ( spousalBenefitDate.getMonth() - SSbirthDate.getMonth() + 12 * (spousalBenefitDate.getFullYear() - SSbirthDate.getFullYear()) )/12
    if (claimingAge < 61.99) {error = "Please enter a later date. You cannot file for spousal benefits before age 62."}

    //Validation in case they try to start spousal benefit before other spouse's retirement benefit.
    if (spousalBenefitDate < otherSpouseRetirementBenefitDate) {error = "You cannot start your spousal benefit before your spouse has filed for his/her own retirement benefit."}

    return error
  }

  waitCursor() {
    document.getElementById("container").style.cursor = "wait";
    document.getElementById("maximizeSubmit").style.cursor = "wait";
  }

  normalCursor(){
    document.getElementById("container").style.cursor = "default";
    document.getElementById("maximizeSubmit").style.cursor = "default";
  }
}
