import { Injectable } from '@angular/core';
import {BirthdayService} from './birthday.service'
import {BenefitService} from './benefit.service'
import { CurrencyPipe } from '@angular/common';

@Injectable()
export class PresentvalueService {

  constructor(private benefitService: BenefitService, private birthdayService: BirthdayService) { }

  age: number
  roundedAge: number
  probabilityAlive: number
  

  calculateRetirementPV(FRA: Date, SSbirthDate: Date, PIA: number, inputBenefitMonth: number, inputBenefitYear: number, gender: string, discountRate: number)
  {
    let retirementBenefit = this.benefitService.calculateRetirementBenefit(PIA, FRA, inputBenefitMonth, inputBenefitYear)
    let retirementPV = 0


    //calculate age when they start benefit
    this.age = ( inputBenefitMonth - SSbirthDate.getMonth() - 1 + 12 * (inputBenefitYear - SSbirthDate.getFullYear()) )/12
    

    //Calculate PV via loop until they hit end of probabillity array
      while (this.age < 118) {
        //When calculating probability alive, we have to round age to get a whole number to use for lookup in array.
        //Normally we round age down and use that number for the whole year. But sometimes, for example, real age will be 66 but javascript sees it as 65.99999, so we have to round that up.
        if (this.age%1 > 0.999) {this.roundedAge = Math.round(this.age)}
          else { this.roundedAge = Math.floor(this.age)}
        //If they're already over 62 when filling out form, denominator should be lives remaining at their current age when filling it out.
        if (gender == "male") {this.probabilityAlive = this.maleLivesRemaining[this.roundedAge + 1] / this.maleLivesRemaining[62]}
        if (gender == "female") {this.probabilityAlive = this.femaleLivesRemaining[this.roundedAge + 1] / this.femaleLivesRemaining[62]}
        
        let monthlyPV = retirementBenefit * this.probabilityAlive
        monthlyPV = monthlyPV / (1 + discountRate/2) 
        monthlyPV = monthlyPV / Math.pow((1 + discountRate),(this.roundedAge - 62))
        retirementPV = retirementPV + monthlyPV
        this.age = this.age + 1/12
      }
        return retirementPV
  }

  maximizeRetirementPV(PIA: number, SSbirthDate: Date, FRA: Date, gender: string, discountRate: number){
    //find initial benefitMonth and benefitYear for age 62 (have to add 1 to month, because getMonth returns 0-11)
    let benefitMonth = SSbirthDate.getMonth() + 1
    let benefitYear = SSbirthDate.getFullYear() + 62

    //If they are currently over age 62 when filling out form, set benefitMonth and benefitYear to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
    let today = new Date()
    let ageToday = today.getFullYear() - SSbirthDate.getFullYear() + (today.getMonth() - SSbirthDate.getMonth())/12
    if (ageToday > 62){
      benefitMonth = today.getMonth()+1
      benefitYear = today.getFullYear()
    }

    //Run calculateRetirementPV for their age 62 benefit, save the PV and the age.
    let savedPV = this.calculateRetirementPV(FRA, SSbirthDate, PIA, benefitMonth, benefitYear, gender, discountRate)
    let savedClaimingDate = new Date(benefitMonth + "-01-" + benefitYear)
    let currentTestDate = new Date(savedClaimingDate)

    //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
    let endingTestDate = new Date(SSbirthDate)
    endingTestDate.setFullYear(endingTestDate.getFullYear() + 70)
    endingTestDate.setMonth(endingTestDate.getMonth()-1)
    while (currentTestDate <= endingTestDate){
      //Add 1 month to claiming age and run both calculations again and compare results. Save better of the two.
      currentTestDate.setMonth(currentTestDate.getMonth() + 1)
      benefitMonth = currentTestDate.getMonth() + 1
      benefitYear = currentTestDate.getFullYear()
      let currentTestPV = this.calculateRetirementPV(FRA, SSbirthDate, PIA, benefitMonth, benefitYear, gender, discountRate)
      if (currentTestPV > savedPV)
        {savedClaimingDate.setMonth(currentTestDate.getMonth())
          savedClaimingDate.setFullYear(currentTestDate.getFullYear())
          savedPV = currentTestPV}
    }
    //after loop is finished
    console.log("saved PV: " + savedPV)
    console.log("savedClaimingDate: " + savedClaimingDate)
  }

//Lives remaining out of 100k, from SSA 2014 period life table
maleLivesRemaining = [
  100000,
  99368,
  99328,
  99300,
  99279,
  99261,
  99245,
  99231,
  99218,
  99206,
  99197,
  99187,
  99177,
  99164,
  99144,
  99114,
  99074,
  99024,
  98963,
  98889,
  98802,
  98701,
  98588,
  98464,
  98335,
  98204,
  98072,
  97937,
  97801,
  97662,
  97520,
  97373,
  97224,
  97071,
  96914,
  96753,
  96587,
  96415,
  96236,
  96050,
  95856,
  95653,
  95437,
  95207,
  94958,
  94688,
  94394,
  94073,
  93721,
  93336,
  92913,
  92449,
  91943,
  91392,
  90792,
  90142,
  89439,
  88681,
  87867,
  87001,
  86081,
  85104,
  84065,
  82967,
  81812,
  80600,
  79324,
  77977,
  76550,
  75036,
  73427,
  71710,
  69878,
  67930,
  65866,
  63686,
  61377,
  58930,
  56344,
  53625,
  50776,
  47795,
  44685,
  41461,
  38148,
  34771,
  31358,
  27943,
  24565,
  21270,
  18107,
  15128,
  12381,
  9906,
  7733,
  5878,
  4348,
  3130,
  2194,
  1500,
  1001,
  652,
  413,
  254,
  151,
  87,
  48,
  26,
  13,
  6,
  3,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleLivesRemaining = [
  100000,
  99469,
  99434,
  99412,
  99396,
  99383,
  99372,
  99361,
  99351,
  99342,
  99334,
  99325,
  99317,
  99307,
  99294,
  99279,
  99260,
  99237,
  99210,
  99180,
  99146,
  99109,
  99069,
  99025,
  98978,
  98929,
  98877,
  98822,
  98765,
  98705,
  98641,
  98575,
  98505,
  98431,
  98351,
  98266,
  98175,
  98076,
  97970,
  97856,
  97735,
  97604,
  97463,
  97311,
  97146,
  96966,
  96771,
  96559,
  96327,
  96072,
  95794,
  95488,
  95155,
  94794,
  94405,
  93987,
  93539,
  93057,
  92542,
  91997,
  91420,
  90809,
  90157,
  89461,
  88715,
  87914,
  87049,
  86114,
  85102,
  84006,
  82818,
  81525,
  80117,
  78591,
  76947,
  75182,
  73280,
  71225,
  69008,
  66621,
  64059,
  61304,
  58350,
  55213,
  51913,
  48467,
  44889,
  41191,
  37394,
  33531,
  29650,
  25811,
  22083,
  18536,
  15240,
  12250,
  9620,
  7378,
  5525,
  4043,
  2893,
  2021,
  1375,
  909,
  583,
  361,
  215,
  123,
  67,
  35,
  17,
  8,
  3,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
]

}
