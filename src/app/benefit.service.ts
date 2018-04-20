import { Injectable } from '@angular/core';
import {BirthdayService} from './birthday.service'

@Injectable()
export class BenefitService {

  constructor(private birthdayService: BirthdayService) { }

  retirementBenefit: number
  error: string

  calculateRetirementBenefit(PIA: number, FRA: Date, inputBenefitMonth: number, inputBenefitYear: number)
  {
     //Calculate benefit
    let monthsWaited = inputBenefitMonth - FRA.getMonth() - 1 + 12 * (inputBenefitYear - FRA.getFullYear())

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
