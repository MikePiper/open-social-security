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

      return Number(retirementBenefit)
  
  }

  calculateSpousalBenefit(PIA: number, otherSpousePIA: number, FRA: Date, retirementStartMonth: number, retirementStartYear: number, spousalStartMonth: number, spousalStartYear: number)
  {
    //no need to check for filing prior to 62, because we're already checking for that in the input form component.

    //Initial calculation
    let spousalBenefit = otherSpousePIA / 2

    //subtract greater of PIA or retirement benefit, but no more than spousal benefit
      //This currently assumes new deemed filing rules for everybody. Eventually, will have to do this subtraction only if they are already receiving retirement benefit.
          //Also, "inputbenefitmonth" and "inputbenefityear" could be different for retirement benefit and spousal benefit, with old deemed filing rules.
      let retirementBenefit = this.calculateRetirementBenefit(Number(PIA), FRA, retirementStartMonth, retirementStartYear)
      if (retirementBenefit > PIA) {
        spousalBenefit = spousalBenefit - retirementBenefit
      }
      else {spousalBenefit = spousalBenefit - PIA}
      if (spousalBenefit < 0) {
        spousalBenefit = 0
      }

    //Multiply by a reduction factor if spousal benefit claimed prior to FRA
    let monthsWaited = spousalStartMonth - FRA.getMonth() - 1 + 12 * (spousalStartYear - FRA.getFullYear())
    if (monthsWaited >= -36 && monthsWaited < 0)
    {spousalBenefit = spousalBenefit + (spousalBenefit * 25/36/100 * monthsWaited)}
    if (monthsWaited < -36)
    {spousalBenefit = spousalBenefit - (spousalBenefit * 25/36/100 * 36) + (spousalBenefit * 5/12/100 * (monthsWaited+36))}

    return Number(spousalBenefit)
  }

  calculateSurvivorBenefit(survivorRetirementBenefit: number, survivorFRA: Date, survivorBenefitDate: Date, deceasedFRA: Date, dateOfDeath: Date,  deceasedPIA: number, deceasedClaimingDate: Date)
  {
    //calculate a benefit...
    //need deceased spouse's PIA
    //need date deceased spouse had filed (or if they hadn't filed)
    //need date of deceased's death
    //need survivor's FRA and when they are filing for survivor benefit
    let survivorBenefit = 0
    // if deceased spouse had not filed
        //if deceased spouse was younger than FRA, survivor benefit = deceasedPIA
          if (dateOfDeath < deceasedFRA){
            survivorBenefit = deceasedPIA
          }
        //if deceased spouse was older than FRA, survivorBenefit = deceased's retirement benefit on date of death
        else {
         // survivorBenefit = this.calculateRetirementBenefit(....)
        }
    //if deceased spouse had filed survivorBenefit = deceased spouse's retirement benefit, but no less than 82.5% of deceased's PIA
        //survivorBenefit = this.calculateRetirementBenefit(...)
        if (survivorBenefit < 0.825 * deceasedPIA) {
          survivorBenefit = 0.825 * deceasedPIA
        }

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
