import { Component, OnInit } from '@angular/core';
import { BenefitService } from '../benefit.service';
import {BirthdayService} from '../birthday.service'
import {PresentvalueService} from '../presentvalue.service'

@Component({
  selector: 'app-input-form',
  templateUrl: './input-form.component.html',
  styleUrls: ['./input-form.component.css']
})
export class InputFormComponent implements OnInit {

  constructor(private benefitService: BenefitService, private birthdayService: BirthdayService, private presentvalueService: PresentvalueService) { }

  ngOnInit() {

  }

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
  maritalStatus: string = "married"
  spouseAinputMonth: number = 4
  spouseAinputDay: number = 8
  spouseAinputYear: number = 1984
  spouseAPIA: number = 1000
  spouseAinputBenefitMonth: number = 4
  spouseAinputBenefitYear: number = 2051
  spouseAinputBenefitDate: Date
  spouseAgender: string = "male"
  spouseBinputMonth: number = 4
  spouseBinputDay: number = 28
  spouseBinputYear: number = 1984
  spouseBPIA: number = 1000
  spouseBinputBenefitMonth: number = 4
  spouseBinputBenefitYear: number = 2051
  spouseBinputBenefitDate: Date
  spouseBgender: string = "female"
  discountRate: number = 0.007
  spouseAbirthDate: Date
  spouseAFRA: Date
  spouseBbirthDate: Date
  spouseBFRA: Date
  spouseAerror:string
  spouseBerror:string

  onSubmit() {
  console.log("-------------")
  this.spouseAbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseAinputMonth, this.spouseAinputDay, this.spouseAinputYear))
  this.spouseAFRA = new Date(this.birthdayService.findFRA(this.spouseAbirthDate))
  this.spouseBbirthDate = new Date(this.birthdayService.findSSbirthdate(this.spouseBinputMonth, this.spouseBinputDay, this.spouseBinputYear))
  this.spouseBFRA = new Date(this.birthdayService.findFRA(this.spouseBbirthDate))
  this.spouseAinputBenefitDate = new Date(this.spouseAinputBenefitYear, this.spouseAinputBenefitMonth-1, 1)
  this.spouseBinputBenefitDate = new Date(this.spouseBinputBenefitYear, this.spouseBinputBenefitMonth-1, 1)
  this.spouseAerror = this.checkValidInputs(this.spouseAFRA, this.spouseAbirthDate, this.spouseAinputBenefitYear, this.spouseAinputBenefitMonth)
  this.spouseBerror = this.checkValidInputs(this.spouseBFRA, this.spouseBbirthDate, this.spouseBinputBenefitYear, this.spouseBinputBenefitMonth)
  if (this.maritalStatus == "unmarried" && !this.spouseAerror) {
    console.log("Spouse A PV using input dates: " + this.presentvalueService.calculateSinglePersonPV(this.spouseAFRA, this.spouseAbirthDate, Number(this.spouseAPIA), this.spouseAinputBenefitDate, this.spouseAgender, Number(this.discountRate)))
    this.presentvalueService.maximizeSinglePersonPV(Number(this.spouseAPIA), this.spouseAbirthDate, this.spouseAFRA, this.spouseAgender, Number(this.discountRate))
    }
  if(this.maritalStatus == "married" && !this.spouseAerror && !this.spouseBerror)
    {
      console.log("couplePV using input dates: " + this.presentvalueService.calculateCouplePV(this.spouseAFRA, this.spouseBFRA, this.spouseAbirthDate, this.spouseBbirthDate, Number(this.spouseAPIA), Number(this.spouseBPIA), this.spouseAinputBenefitDate, this.spouseBinputBenefitDate, this.spouseAgender, this.spouseBgender, Number(this.discountRate)))
      this.presentvalueService.maximizeCouplePV(Number(this.spouseAPIA), Number(this.spouseBPIA), this.spouseAbirthDate, this.spouseBbirthDate, this.spouseAFRA, this.spouseBFRA, this.spouseAgender, this.spouseBgender, Number(this.discountRate))
    }
  }



  //TODO: This has not yet been refactored to use "inputBenefitDate" Date objects rather than separate number objects for Year and Month.
  checkValidInputs(FRA: Date, SSbirthDate: Date, inputBenefitYear: number, inputBenefitMonth: number) {
    let error = undefined

    //Validation to make sure they are not filing for benefits in the past
    let today = new Date()
    if ( (inputBenefitYear < today.getFullYear()) || (inputBenefitYear == today.getFullYear() && (inputBenefitMonth < today.getMonth() + 1 )) )
    {
    error = "Please enter a date no earlier than this month."
    }

    //Validation in case they try to start benefit earlier than possible or after 70 (Just ignoring the "must be 62 for entire month" rule right now)
    let monthsWaited = inputBenefitMonth - FRA.getMonth() - 1 + 12 * (inputBenefitYear - FRA.getFullYear())
    if (SSbirthDate >= new Date('January 1, 1943') && SSbirthDate <= new Date('December 31, 1954'))
    {
      if (monthsWaited > 48) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -48) {error = "Please enter a later date. You cannot file for retirement or spousal benefits before age 62."}
    }
    if (SSbirthDate >= new Date('January 1, 1955') && SSbirthDate <= new Date('December 31, 1955'))
    {
      if (monthsWaited > 46) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -50) {error = "Please enter a later date. You cannot file for retirement or spousal benefits before age 62."}
    }
    if (SSbirthDate >= new Date('January 1, 1956') && SSbirthDate <= new Date('December 31, 1956'))
    {
      if (monthsWaited > 44) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -52) {error = "Please enter a later date. You cannot file for retirement or spousal benefits before age 62."}
    }
    if (SSbirthDate >= new Date('January 1, 1957') && SSbirthDate <= new Date('December 31, 1957'))
    {
      if (monthsWaited > 42) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -54) {error = "Please enter a later date. You cannot file for retirement or spousal benefits before age 62."}
    }
    if (SSbirthDate >= new Date('January 1, 1958') && SSbirthDate <= new Date('December 31, 1958'))
    {
      if (monthsWaited > 40) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -56) {error = "Please enter a later date. You cannot file for retirement or spousal benefits before age 62."}
    }
    if (SSbirthDate >= new Date('January 1, 1959') && SSbirthDate <= new Date('December 31, 1959'))
    {
      if (monthsWaited > 38) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -58) {error = "Please enter a later date. You cannot file for retirement or spousal benefits before age 62."}
    }
    if (SSbirthDate >= new Date('January 1, 1960'))
    {
      if (monthsWaited > 36) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -60) {error = "Please enter a later date. You cannot file for retirement or spousal benefits before age 62."}
    }

    return error
  }



}
