import { Injectable } from '@angular/core';
import {BirthdayService} from './birthday.service'

@Injectable()
export class BenefitService {

  constructor(private birthdayService: BirthdayService) { }

  retirementBenefit: number
  error: string

  calculateRetirementBenefit(PIA: number, FRA: Date, inputBenefitMonth: number, inputBenefitYear: number)
  {

    //Figure out when they're filing
    let monthsWaited = inputBenefitMonth - FRA.getMonth() - 1 + 12 * (inputBenefitYear - FRA.getFullYear())

    //Validation in case they try to start benefit earlier than possible or after 70 (Just ignoring the "must be 62 for entire month" rule right now)
    this.error = undefined
    if (this.birthdayService.SSbirthDate >= new Date('January 1, 1943') && this.birthdayService.SSbirthDate <= new Date('December 31, 1954'))
    {
      if (monthsWaited > 48) {this.error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -48) {this.error = "Please enter a later date. You cannot file for retirement benefits before age 62."}
    }
    if (this.birthdayService.SSbirthDate >= new Date('January 1, 1955') && this.birthdayService.SSbirthDate <= new Date('December 31, 1955'))
    {
      if (monthsWaited > 46) {this.error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -50) {this.error = "Please enter a later date. You cannot file for retirement benefits before age 62."}
    }
    if (this.birthdayService.SSbirthDate >= new Date('January 1, 1956') && this.birthdayService.SSbirthDate <= new Date('December 31, 1956'))
    {
      if (monthsWaited > 44) {this.error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -52) {this.error = "Please enter a later date. You cannot file for retirement benefits before age 62."}
    }
    if (this.birthdayService.SSbirthDate >= new Date('January 1, 1957') && this.birthdayService.SSbirthDate <= new Date('December 31, 1957'))
    {
      if (monthsWaited > 42) {this.error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -54) {this.error = "Please enter a later date. You cannot file for retirement benefits before age 62."}
    }
    if (this.birthdayService.SSbirthDate >= new Date('January 1, 1958') && this.birthdayService.SSbirthDate <= new Date('December 31, 1958'))
    {
      if (monthsWaited > 40) {this.error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -56) {this.error = "Please enter a later date. You cannot file for retirement benefits before age 62."}
    }
    if (this.birthdayService.SSbirthDate >= new Date('January 1, 1959') && this.birthdayService.SSbirthDate <= new Date('December 31, 1959'))
    {
      if (monthsWaited > 38) {this.error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -58) {this.error = "Please enter a later date. You cannot file for retirement benefits before age 62."}
    }
    if (this.birthdayService.SSbirthDate >= new Date('January 1, 1960'))
    {
      if (monthsWaited > 36) {this.error = "Please enter an earlier date. You do not want to wait beyond age 70."}
      if (monthsWaited < -60) {this.error = "Please enter a later date. You cannot file for retirement benefits before age 62."}
    }

    //Calculate benefit
    if (!this.error)
    {
      if (monthsWaited < -36)
      {this.retirementBenefit = PIA - (PIA / 100 * 5 / 9 * 36) + (PIA / 100 * 5 / 12 * (monthsWaited+36))}
      if (monthsWaited < 0 && monthsWaited >= -36)
      {this.retirementBenefit = PIA + (PIA / 100 * 5 / 9 * monthsWaited)}
      if (monthsWaited == 0)
      {this.retirementBenefit = PIA}
      if (monthsWaited > 0 )
      {this.retirementBenefit = PIA + (PIA / 100 * 2 / 3 * monthsWaited)}

      return this.retirementBenefit
    }


  
  }
}
