import { Injectable } from '@angular/core';
import {BirthdayService} from './birthday.service'

@Injectable()
export class BenefitService {

  constructor(private birthdayService: BirthdayService) { }

  calculateRetirementBenefit(PIA: number, FRA: Date, inputBenefitMonth: number, inputBenefitYear: number)
  {
    let retirementBenefit: number = 0
    let monthsWaited = inputBenefitMonth - FRA.getMonth() - 1 + 12 * (inputBenefitYear - FRA.getFullYear())

      if (monthsWaited < -36)
      {retirementBenefit = PIA - (PIA / 100 * 5 / 9 * 36) + (PIA / 100 * 5 / 12 * (monthsWaited+36))}
      if (monthsWaited < 0 && monthsWaited >= -36)
      {retirementBenefit = PIA + (PIA / 100 * 5 / 9 * monthsWaited)}
      if (monthsWaited == 0)
      {retirementBenefit = PIA}
      if (monthsWaited > 0 )
      {retirementBenefit = PIA + (PIA / 100 * 2 / 3 * monthsWaited)}

      return retirementBenefit
  
  }

  calculateSpousalBenefit(PIA: number, otherSpousePIA: number, FRA: Date, inputBenefitMonth: number, inputBenefitYear: number )
  {
    let spousalBenefit = otherSpousePIA / 2
    //adjust if claimed prior to FRA
    let monthsWaited = inputBenefitMonth - FRA.getMonth() - 1 + 12 * (inputBenefitYear - FRA.getFullYear())
    if (monthsWaited > -36 && monthsWaited < 0)
    {spousalBenefit = spousalBenefit + (spousalBenefit * 25/36/100 * monthsWaited)}
    if (monthsWaited < -36)
    {spousalBenefit = spousalBenefit - (spousalBenefit * 25/36/100 * 36) + (spousalBenefit * 5/12/100 * (monthsWaited+36))}
    //no need to check for filing prior to 62, because we're already checking for that in the input form component.
    //subtract greater of PIA or retirement benefit (but no more than spousal benefit), if they have already claimed such (or, since we're applying new deemed filing rules to everybody, are we assuming that they've automatically already filed?)
    return spousalBenefit
  }

  calculateSurvivorBenefit(ownRetirementBenefit: number, FRA: Date, inputBenefitMonth: number, inputBenefitYear: number, deceasedPIA: number, deceasedClaimingMonth: number, deceasedClaimingYear: number)
  {
    //calculate a benefit...
    //need deceased spouse's PIA
    //need date deceased spouse had filed (or if they hadn't filed)
    //need date of deceased's death
    //need survivor's FRA and when they are filing for survivor benefit
    let survivorBenefit = 0
    // if deceased spouse had not filed
        //if deceased spouse was younger than FRA
            //survivorBenefit = deceased spouse's PIA
        //if deceased spouse was older than FRA
            //survivorBenefit = deceased's retirement benefit on date of death
    //if deceased spouse had filed
        //survivorBenefit = deceased spouse's retirement benefit, but no less than 82.5% of deceased's PIA

    //Adjust survivor benefit downward if survivor claims it prior to FRA (remember here to find their *survivor* FRA)
        //if deceased did not file before FRA
          //find percentage of the way they are from 60 to FRA
          //survivorBenefit = survivorBenefit - (survivorBenefit * 0.285 * (1 - that percentage))
        //if deceased had filed before FRA, do completely new calculation
            //survivorBenefit = deceased's PIA
            //find percentage of the way that survivor is from 60 to FRA
            //survivorBenefit = survivorBenefit - (survivorBenefit * 0.285 * (1 - that percentage))
            //survivorBenefit then limited to greater of 82.5% of deceased's PIA or amount deceased was receiving on date of death
    //subtract own retirement benefit, but do not subtract more than survivor benefit
  }
}
