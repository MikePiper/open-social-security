import { Injectable } from '@angular/core';
import { Person } from './data model classes/person';
import { MonthYearDate } from './data model classes/monthyearDate';
import { CalculationScenario } from './data model classes/calculationscenario';
import { CalculationYear } from './data model classes/calculationyear';
import { BirthdayService } from './birthday.service';

@Injectable({
  providedIn: 'root'
})
export class FamilyMaximumService {

  constructor(private birthdayService: BirthdayService) { }
  
  today:MonthYearDate = new MonthYearDate()



  //calculates family maximum on one person's work record
  calculateFamilyMaximum(person:Person):Person{
    if (person.isOnDisability === true){
      /* https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615742
      family maximum is lesser of:
      85% of the AIME (but not less than the PIA before COLAs), or
      150% of the worker's PIA before COLAs.
      ...then you add all the COLAs back.
      */
      let PIAbeforeCOLAs: number = person.PIA
      //take current disability benefit (person.PIA) and back out COLAs for every year back to (and including) year in which disability entitlement began
          let thisYear:number = new MonthYearDate().getFullYear()
          let entitlementYear:number = person.fixedRetirementBenefitDate.getFullYear()
          let i: number = thisYear - 1 //Don't back out COLA for this year, because it isn't effective until next year anyway.
          while (i >= entitlementYear) {
            PIAbeforeCOLAs = PIAbeforeCOLAs / (1 + this.annualIndexedValuesArray[i - 1979].COLA)
            i = i - 1
          }
      //Use original PIA (together with bend points from year in question) to calculate their AIME
          let firstBendPoint: number = this.annualIndexedValuesArray[entitlementYear - 1979].firstPIAbendPoint
          let secondBendPoint: number = this.annualIndexedValuesArray[entitlementYear - 1979].secondPIAbendPoint
          if (PIAbeforeCOLAs <= 0.9 * firstBendPoint) {
            person.AIME = PIAbeforeCOLAs / 0.9
          }
          else if (PIAbeforeCOLAs <= ( (0.9 * firstBendPoint) + (0.32 * (secondBendPoint - firstBendPoint)))) {
            person.AIME = (PIAbeforeCOLAs / 0.32) - (1.8125 * firstBendPoint)
          }
          else {
            person.AIME = (PIAbeforeCOLAs - 0.58 * firstBendPoint - 0.17 * secondBendPoint) / 0.15
          }
      //Now we can compare 85% of AIME, PIA before COLAs, and 150% of PIA before COLAs to get family max
          if (0.85 * person.AIME >= PIAbeforeCOLAs){
            //family max is lesser of 85% of AIME or 150% of PIA before cola
            if (0.85 * person.AIME < 1.5 * PIAbeforeCOLAs){
              person.familyMaximum = 0.85 * person.AIME
            }
            else {
              person.familyMaximum = 1.5 * PIAbeforeCOLAs
            }
          }
          else {
            person.familyMaximum = PIAbeforeCOLAs
          }
      //Then we have to add COLAs back.
          person.familyMaximum = person.familyMaximum + (person.PIA - PIAbeforeCOLAs)
    }
    else {//i.e., person isn't disabled
    //Family max is 150% up to first bend point, 272% from first to second, 134% from second to third, 175% beyond that
      if (this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979]){//If bend points exist for year in which person turned 62. (Which mostly means if they turned 62 in the past, use those bend points.)
        var firstBendPoint: number = this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979].firstFamilyMaxBendPoint
        var secondBendPoint: number = this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979].secondFamilyMaxBendPoint
        var thirdBendPoint: number = this.annualIndexedValuesArray[person.SSbirthDate.getFullYear() + 62 - 1979].thirdFamilyMaxBendPoint
      }
      else {//If they turn 62 in the future, use most recent published bend points.
        var firstBendPoint: number = this.annualIndexedValuesArray[this.annualIndexedValuesArray.length - 1].firstFamilyMaxBendPoint
        var secondBendPoint: number = this.annualIndexedValuesArray[this.annualIndexedValuesArray.length - 1].secondFamilyMaxBendPoint
        var thirdBendPoint: number = this.annualIndexedValuesArray[this.annualIndexedValuesArray.length - 1].thirdFamilyMaxBendPoint
      }
      if (person.PIA <= firstBendPoint){
        person.familyMaximum = 1.5 * person.PIA
      }
      else if (person.PIA <= secondBendPoint){
        person.familyMaximum = 1.5 * firstBendPoint + 2.72 * (person.PIA - firstBendPoint)
      }
      else if (person.PIA <= thirdBendPoint){
        person.familyMaximum = 1.5 * firstBendPoint + 2.72 * (secondBendPoint - firstBendPoint) + 1.34 * (person.PIA - secondBendPoint)
      }
      else {
        person.familyMaximum = 1.5 * firstBendPoint + 2.72 * (secondBendPoint - firstBendPoint) + 1.34 * (thirdBendPoint - secondBendPoint) + 1.75 * (person.PIA - thirdBendPoint)
      }
    }
    return person
  }

  calculateCombinedFamilyMaximum(personA:Person, personB:Person, simultaneousEntitlementYear:number):number{//simultaneousEntitlementDate is date on which a child first becomes eligible on two work records
    let combinedFamilyMaximum:number
    let sumOfIndividualFamilyMaximums:number = personA.familyMaximum + personB.familyMaximum
    if (simultaneousEntitlementYear > this.today.getFullYear()){//if simultaneousEntitlementYear is in the future (which it usually will be) we won't have MaxTaxableWage figure for that year. So we have to use this year's.
      simultaneousEntitlementYear = this.today.getFullYear()
    }
    let limitForCombinedFamilyMaximum:number = 1.75 * this.calculatePIAfromAIME(this.annualIndexedValuesArray[simultaneousEntitlementYear - 1979].MaxTaxableWages / 12, simultaneousEntitlementYear)
    if (sumOfIndividualFamilyMaximums <= limitForCombinedFamilyMaximum){
      combinedFamilyMaximum = sumOfIndividualFamilyMaximums
    }
    else {
      combinedFamilyMaximum = limitForCombinedFamilyMaximum
    }
    return combinedFamilyMaximum
  }

  calculatePIAfromAIME(AIME:number, eligibilityYear:number){
    let PIA:number = 0
    let firstBendPoint = this.annualIndexedValuesArray[eligibilityYear - 1979].firstPIAbendPoint
    let secondBendPoint = this.annualIndexedValuesArray[eligibilityYear - 1979].secondPIAbendPoint
    if (AIME <= firstBendPoint){
      PIA = 0.9 * AIME
    }
    else if (AIME <= secondBendPoint){
      PIA = 0.9 * firstBendPoint + 0.32 * (AIME - firstBendPoint)
    }
    else {
      PIA = 0.9 * firstBendPoint + 0.32 * (secondBendPoint - firstBendPoint) + 0.15 * (AIME - secondBendPoint)
    }
    return PIA
  }

  applyFamilyMaximumSingle(scenario:CalculationScenario, amountLeftForRestOfFamiliy:number){
      let numberOfAxilliaries:number = 0
      for (let child of scenario.children){
        if (child.isOnDisability === true || child.age < 17.99){
          numberOfAxilliaries = numberOfAxilliaries + 1
        }
      }
      let maxAuxilliaryBenefitPerAuxilliary:number = amountLeftForRestOfFamiliy / numberOfAxilliaries
      for (let child of scenario.children){
        if (child.monthlyChildPayment > maxAuxilliaryBenefitPerAuxilliary){
          child.monthlyChildPayment = maxAuxilliaryBenefitPerAuxilliary
        }
      }
    return scenario
  }

  applyFamilyMaximumCouple(familyMaxRunNumber:number, scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personAaliveBoolean:boolean, personB:Person, personBaliveBoolean:boolean) {
    if (scenario.children.length > 0 || personA.isOnDisability === true || personB.isOnDisability === true){//Only bother with all this if we know familymax might be applicable (because of kids or a person being disabled)

      let familyMaximum:number = 0
      let sumOfAuxBenefits:number = 0

      //Check if there's at least one child under 18 or disabled
      let entitledChild:boolean = this.birthdayService.checkForChildUnder18orDisabled(scenario)

      //Find out who is entitled as aux beneficiaries
        if (personA.monthlySpousalPayment > 0 || personA.monthlySurvivorPayment > 0){//if personA is entitled on personB's record
          familyMaximum = personB.familyMaximum
        }
        if (personB.monthlySpousalPayment > 0 || personB.monthlySurvivorPayment > 0){//if personB is entitled on personA's record
          familyMaximum = personA.familyMaximum
        }
        if(calcYear.date >= personA.retirementBenefitDate && calcYear.date >= personB.retirementBenefitDate && entitledChild === true){//if there is a child entitled on both personA and personB
          if (personA.retirementBenefitDate > this.today && personB.retirementBenefitDate > this.today){//if both retirementBenefitDates are in the future, use this year as simultaneous entitlement year (becuase we don't know future year's bend points)
            familyMaximum = this.calculateCombinedFamilyMaximum(personA, personB, this.today.getFullYear())
          }
          else if (personA.retirementBenefitDate >= personB.retirementBenefitDate && personA.retirementBenefitDate < this.today){//if personA's entitlement date happens second and is in the past, use that as simultaneous entitlement year
            familyMaximum = this.calculateCombinedFamilyMaximum(personA, personB, personA.retirementBenefitDate.getFullYear())
          }
          else if (personB.retirementBenefitDate >= personA.retirementBenefitDate && personB.retirementBenefitDate < this.today){//if personB's entitlement date happens second and is in the past, use that as simultaneous entitlement year
            familyMaximum = this.calculateCombinedFamilyMaximum(personA, personB, personB.retirementBenefitDate.getFullYear())
          }
        }

      //Sum aux benefit amounts ("original benefits" first time through)
        for (let child of scenario.children){
          sumOfAuxBenefits = sumOfAuxBenefits + child.monthlyChildPayment
        }
        if (scenario.maritalStatus == "married"){//Don't include spousal or survivor benefits if it's divorce scenario
          sumOfAuxBenefits = sumOfAuxBenefits + personA.monthlySpousalPayment + personB.monthlySpousalPayment + personA.monthlySurvivorPayment + personB.monthlySurvivorPayment
          //Can add both personA's and personB's spousal amounts here, because monthlySpousalPayment will be zero if person not eligible. And will be zero if either person is deceased.
          //personA.monthlySurvivorPayment will be zero in cases where personB is alive (and vice versa)
          //if personB is considered deceased, first time through this function personA.monthlySurvivorPayment is "original benefit" amount for personA (which is deceased's PIA, plus any DRCs)
          //if personB is considered deceased, second time through this function personA.monthlySurvivorPayment will be that same amount, reduced for familyMax and for own entitlement
        }
      //Find family max to be split among auxilliary beneficiaries (i.e., reduce by worker's own PIA in worker-alive scenario)
        let familyMaxForAuxBeneficiaries:number = familyMaximum
        if (personAaliveBoolean === true && personBaliveBoolean === true && calcYear.date >= personA.spousalBenefitDate && (personA.PIA < 0.5 * personB.PIA || calcYear.date < personA.retirementBenefitDate)){//i.e., personA is entitled on personB's record in both-alive scenario
        familyMaxForAuxBeneficiaries = familyMaxForAuxBeneficiaries - personB.PIA
        }
        if (personAaliveBoolean === true && personBaliveBoolean === true && calcYear.date >= personB.spousalBenefitDate && (personB.PIA < 0.5 * personA.PIA || calcYear.date < personB.retirementBenefitDate)){//i.e., personB is entitled on personA's record in both-alive scenario
        familyMaxForAuxBeneficiaries = familyMaxForAuxBeneficiaries - personA.PIA
        }
      //First run of family max exists only to adjust benefits downward. Second run exists only to adjust benefits upward (after reducing some people's aux benefits for own entitlement).
        if (sumOfAuxBenefits == 0){
          //no need to do anything, since nobody is getting aux benefits anyway, even before family max adjustment. Need this here though so that we can avoid "divide by zero" below.
        }
        else if (sumOfAuxBenefits > familyMaxForAuxBeneficiaries && familyMaxRunNumber == 1){
          //find percentage that we can pay
            let percentageAvailable:number = familyMaxForAuxBeneficiaries / sumOfAuxBenefits
          //multiply each child's child benefit by that percentage
            for (let child of scenario.children){
              child.monthlyChildPayment = child.monthlyChildPayment * percentageAvailable
            }
          //multiply spouse/survivor benefits in a married scenario
            if (scenario.maritalStatus == "married"){
              personA.monthlySpousalPayment = personA.monthlySpousalPayment * percentageAvailable
              personB.monthlySpousalPayment = personB.monthlySpousalPayment * percentageAvailable
              personA.monthlySurvivorPayment = personA.monthlySurvivorPayment * percentageAvailable
              personB.monthlySurvivorPayment = personB.monthlySurvivorPayment * percentageAvailable
            }
        }
        else if (sumOfAuxBenefits < familyMaxForAuxBeneficiaries && familyMaxRunNumber == 2){
          //find percentage that we can pay
          let percentageAvailable:number = familyMaxForAuxBeneficiaries / sumOfAuxBenefits
          //multiply each child's child benefit by that percentage, but don't let benefit exceed "original benefit"
            for (let child of scenario.children){
              child.monthlyChildPayment = child.monthlyChildPayment * percentageAvailable
              if (child.monthlyChildPayment > child.originalBenefit) {
                child.monthlyChildPayment = child.originalBenefit
              }
            }
        }
    }
  }


  //access by, eg this.annualIndexedValuesArray[entitlementYear - 1979].secondPIAbendPoint
  //Note that these are the COLAs FOR a given year (effective January of next year)
      //https://www.ssa.gov/oact/cola/colaseries.html as compared to https://www.ssa.gov/cola/
      annualIndexedValuesArray = [
        {
          "Year": 1979,
          "firstPIAbendPoint": 180,
          "secondPIAbendPoint": 1085,
          "firstFamilyMaxBendPoint": 230,
          "secondFamilyMaxBendPoint": 332,
          "thirdFamilyMaxBendPoint": 433,
          "COLA": 0.099,
          "MaxTaxableWages": 22900
        },
        {
          "Year": 1980,
          "firstPIAbendPoint": 194,
          "secondPIAbendPoint": 1171,
          "firstFamilyMaxBendPoint": 248,
          "secondFamilyMaxBendPoint": 358,
          "thirdFamilyMaxBendPoint": 467,
          "COLA": 0.143,
          "MaxTaxableWages": 25900
        },
        {
          "Year": 1981,
          "firstPIAbendPoint": 211,
          "secondPIAbendPoint": 1274,
          "firstFamilyMaxBendPoint": 270,
          "secondFamilyMaxBendPoint": 390,
          "thirdFamilyMaxBendPoint": 508,
          "COLA": 0.112,
          "MaxTaxableWages": 29700
        },
        {
          "Year": 1982,
          "firstPIAbendPoint": 230,
          "secondPIAbendPoint": 1388,
          "firstFamilyMaxBendPoint": 294,
          "secondFamilyMaxBendPoint": 425,
          "thirdFamilyMaxBendPoint": 554,
          "COLA": 0.074,
          "MaxTaxableWages": 32400
        },
        {
          "Year": 1983,
          "firstPIAbendPoint": 254,
          "secondPIAbendPoint": 1528,
          "firstFamilyMaxBendPoint": 324,
          "secondFamilyMaxBendPoint": 468,
          "thirdFamilyMaxBendPoint": 610,
          "COLA": 0.035,
          "MaxTaxableWages": 35700
        },
        {
          "Year": 1984,
          "firstPIAbendPoint": 267,
          "secondPIAbendPoint": 1612,
          "firstFamilyMaxBendPoint": 342,
          "secondFamilyMaxBendPoint": 493,
          "thirdFamilyMaxBendPoint": 643,
          "COLA": 0.035,
          "MaxTaxableWages": 37800
        },
        {
          "Year": 1985,
          "firstPIAbendPoint": 280,
          "secondPIAbendPoint": 1691,
          "firstFamilyMaxBendPoint": 358,
          "secondFamilyMaxBendPoint": 517,
          "thirdFamilyMaxBendPoint": 675,
          "COLA": 0.031,
          "MaxTaxableWages": 39600
        },
        {
          "Year": 1986,
          "firstPIAbendPoint": 297,
          "secondPIAbendPoint": 1790,
          "firstFamilyMaxBendPoint": 379,
          "secondFamilyMaxBendPoint": 548,
          "thirdFamilyMaxBendPoint": 714,
          "COLA": 0.013,
          "MaxTaxableWages": 42000
        },
        {
          "Year": 1987,
          "firstPIAbendPoint": 310,
          "secondPIAbendPoint": 1866,
          "firstFamilyMaxBendPoint": 396,
          "secondFamilyMaxBendPoint": 571,
          "thirdFamilyMaxBendPoint": 745,
          "COLA": 0.042,
          "MaxTaxableWages": 43800
        },
        {
          "Year": 1988,
          "firstPIAbendPoint": 319,
          "secondPIAbendPoint": 1922,
          "firstFamilyMaxBendPoint": 407,
          "secondFamilyMaxBendPoint": 588,
          "thirdFamilyMaxBendPoint": 767,
          "COLA": 0.04,
          "MaxTaxableWages": 45000
        },
        {
          "Year": 1989,
          "firstPIAbendPoint": 339,
          "secondPIAbendPoint": 2044,
          "firstFamilyMaxBendPoint": 433,
          "secondFamilyMaxBendPoint": 626,
          "thirdFamilyMaxBendPoint": 816,
          "COLA": 0.047,
          "MaxTaxableWages": 48000
        },
        {
          "Year": 1990,
          "firstPIAbendPoint": 356,
          "secondPIAbendPoint": 2145,
          "firstFamilyMaxBendPoint": 455,
          "secondFamilyMaxBendPoint": 656,
          "thirdFamilyMaxBendPoint": 856,
          "COLA": 0.054,
          "MaxTaxableWages": 51300
        },
        {
          "Year": 1991,
          "firstPIAbendPoint": 370,
          "secondPIAbendPoint": 2230,
          "firstFamilyMaxBendPoint": 473,
          "secondFamilyMaxBendPoint": 682,
          "thirdFamilyMaxBendPoint": 890,
          "COLA": 0.037,
          "MaxTaxableWages": 53400
        },
        {
          "Year": 1992,
          "firstPIAbendPoint": 387,
          "secondPIAbendPoint": 2333,
          "firstFamilyMaxBendPoint": 495,
          "secondFamilyMaxBendPoint": 714,
          "thirdFamilyMaxBendPoint": 931,
          "COLA": 0.03,
          "MaxTaxableWages": 55500
        },
        {
          "Year": 1993,
          "firstPIAbendPoint": 401,
          "secondPIAbendPoint": 2420,
          "firstFamilyMaxBendPoint": 513,
          "secondFamilyMaxBendPoint": 740,
          "thirdFamilyMaxBendPoint": 966,
          "COLA": 0.026,
          "MaxTaxableWages": 57600
        },
        {
          "Year": 1994,
          "firstPIAbendPoint": 422,
          "secondPIAbendPoint": 2545,
          "firstFamilyMaxBendPoint": 539,
          "secondFamilyMaxBendPoint": 779,
          "thirdFamilyMaxBendPoint": 1016,
          "COLA": 0.028,
          "MaxTaxableWages": 60600
        },
        {
          "Year": 1995,
          "firstPIAbendPoint": 426,
          "secondPIAbendPoint": 2567,
          "firstFamilyMaxBendPoint": 544,
          "secondFamilyMaxBendPoint": 785,
          "thirdFamilyMaxBendPoint": 1024,
          "COLA": 0.026,
          "MaxTaxableWages": 61200
        },
        {
          "Year": 1996,
          "firstPIAbendPoint": 437,
          "secondPIAbendPoint": 2635,
          "firstFamilyMaxBendPoint": 559,
          "secondFamilyMaxBendPoint": 806,
          "thirdFamilyMaxBendPoint": 1052,
          "COLA": 0.029,
          "MaxTaxableWages": 62700
        },
        {
          "Year": 1997,
          "firstPIAbendPoint": 455,
          "secondPIAbendPoint": 2741,
          "firstFamilyMaxBendPoint": 581,
          "secondFamilyMaxBendPoint": 839,
          "thirdFamilyMaxBendPoint": 1094,
          "COLA": 0.021,
          "MaxTaxableWages": 65400
        },
        {
          "Year": 1998,
          "firstPIAbendPoint": 477,
          "secondPIAbendPoint": 2875,
          "firstFamilyMaxBendPoint": 609,
          "secondFamilyMaxBendPoint": 880,
          "thirdFamilyMaxBendPoint": 1147,
          "COLA": 0.013,
          "MaxTaxableWages": 68400
        },
        {
          "Year": 1999,
          "firstPIAbendPoint": 505,
          "secondPIAbendPoint": 3043,
          "firstFamilyMaxBendPoint": 645,
          "secondFamilyMaxBendPoint": 931,
          "thirdFamilyMaxBendPoint": 1214,
          "COLA": 0.025,
          "MaxTaxableWages": 72600
        },
        {
          "Year": 2000,
          "firstPIAbendPoint": 531,
          "secondPIAbendPoint": 3202,
          "firstFamilyMaxBendPoint": 679,
          "secondFamilyMaxBendPoint": 980,
          "thirdFamilyMaxBendPoint": 1278,
          "COLA": 0.035,
          "MaxTaxableWages": 76200
        },
        {
          "Year": 2001,
          "firstPIAbendPoint": 561,
          "secondPIAbendPoint": 3381,
          "firstFamilyMaxBendPoint": 717,
          "secondFamilyMaxBendPoint": 1034,
          "thirdFamilyMaxBendPoint": 1349,
          "COLA": 0.026,
          "MaxTaxableWages": 80400
        },
        {
          "Year": 2002,
          "firstPIAbendPoint": 592,
          "secondPIAbendPoint": 3567,
          "firstFamilyMaxBendPoint": 756,
          "secondFamilyMaxBendPoint": 1092,
          "thirdFamilyMaxBendPoint": 1424,
          "COLA": 0.014,
          "MaxTaxableWages": 84900
        },
        {
          "Year": 2003,
          "firstPIAbendPoint": 606,
          "secondPIAbendPoint": 3653,
          "firstFamilyMaxBendPoint": 774,
          "secondFamilyMaxBendPoint": 1118,
          "thirdFamilyMaxBendPoint": 1458,
          "COLA": 0.021,
          "MaxTaxableWages": 87000
        },
        {
          "Year": 2004,
          "firstPIAbendPoint": 612,
          "secondPIAbendPoint": 3689,
          "firstFamilyMaxBendPoint": 782,
          "secondFamilyMaxBendPoint": 1129,
          "thirdFamilyMaxBendPoint": 1472,
          "COLA": 0.027,
          "MaxTaxableWages": 87900
        },
        {
          "Year": 2005,
          "firstPIAbendPoint": 627,
          "secondPIAbendPoint": 3779,
          "firstFamilyMaxBendPoint": 801,
          "secondFamilyMaxBendPoint": 1156,
          "thirdFamilyMaxBendPoint": 1508,
          "COLA": 0.041,
          "MaxTaxableWages": 90000
        },
        {
          "Year": 2006,
          "firstPIAbendPoint": 656,
          "secondPIAbendPoint": 3955,
          "firstFamilyMaxBendPoint": 838,
          "secondFamilyMaxBendPoint": 1210,
          "thirdFamilyMaxBendPoint": 1578,
          "COLA": 0.033,
          "MaxTaxableWages": 94200
        },
        {
          "Year": 2007,
          "firstPIAbendPoint": 680,
          "secondPIAbendPoint": 4100,
          "firstFamilyMaxBendPoint": 869,
          "secondFamilyMaxBendPoint": 1255,
          "thirdFamilyMaxBendPoint": 1636,
          "COLA": 0.023,
          "MaxTaxableWages": 97500
        },
        {
          "Year": 2008,
          "firstPIAbendPoint": 711,
          "secondPIAbendPoint": 4288,
          "firstFamilyMaxBendPoint": 909,
          "secondFamilyMaxBendPoint": 1312,
          "thirdFamilyMaxBendPoint": 1711,
          "COLA": 0.058,
          "MaxTaxableWages": 102000
        },
        {
          "Year": 2009,
          "firstPIAbendPoint": 744,
          "secondPIAbendPoint": 4483,
          "firstFamilyMaxBendPoint": 950,
          "secondFamilyMaxBendPoint": 1372,
          "thirdFamilyMaxBendPoint": 1789,
          "COLA": 0,
          "MaxTaxableWages": 106800
        },
        {
          "Year": 2010,
          "firstPIAbendPoint": 761,
          "secondPIAbendPoint": 4586,
          "firstFamilyMaxBendPoint": 972,
          "secondFamilyMaxBendPoint": 1403,
          "thirdFamilyMaxBendPoint": 1830,
          "COLA": 0,
          "MaxTaxableWages": 106800
        },
        {
          "Year": 2011,
          "firstPIAbendPoint": 749,
          "secondPIAbendPoint": 4517,
          "firstFamilyMaxBendPoint": 957,
          "secondFamilyMaxBendPoint": 1382,
          "thirdFamilyMaxBendPoint": 1803,
          "COLA": 0.036,
          "MaxTaxableWages": 106800
        },
        {
          "Year": 2012,
          "firstPIAbendPoint": 767,
          "secondPIAbendPoint": 4624,
          "firstFamilyMaxBendPoint": 980,
          "secondFamilyMaxBendPoint": 1415,
          "thirdFamilyMaxBendPoint": 1845,
          "COLA": 0.017,
          "MaxTaxableWages": 110100
        },
        {
          "Year": 2013,
          "firstPIAbendPoint": 791,
          "secondPIAbendPoint": 4768,
          "firstFamilyMaxBendPoint": 1011,
          "secondFamilyMaxBendPoint": 1459,
          "thirdFamilyMaxBendPoint": 1903,
          "COLA": 0.015,
          "MaxTaxableWages": 113700
        },
        {
          "Year": 2014,
          "firstPIAbendPoint": 816,
          "secondPIAbendPoint": 4917,
          "firstFamilyMaxBendPoint": 1042,
          "secondFamilyMaxBendPoint": 1505,
          "thirdFamilyMaxBendPoint": 1962,
          "COLA": 0.017,
          "MaxTaxableWages": 117000
        },
        {
          "Year": 2015,
          "firstPIAbendPoint": 826,
          "secondPIAbendPoint": 4980,
          "firstFamilyMaxBendPoint": 1056,
          "secondFamilyMaxBendPoint": 1524,
          "thirdFamilyMaxBendPoint": 1987,
          "COLA": 0,
          "MaxTaxableWages": 118500
        },
        {
          "Year": 2016,
          "firstPIAbendPoint": 856,
          "secondPIAbendPoint": 5157,
          "firstFamilyMaxBendPoint": 1093,
          "secondFamilyMaxBendPoint": 1578,
          "thirdFamilyMaxBendPoint": 2058,
          "COLA": 0.003,
          "MaxTaxableWages": 118500
        },
        {
          "Year": 2017,
          "firstPIAbendPoint": 885,
          "secondPIAbendPoint": 5336,
          "firstFamilyMaxBendPoint": 1131,
          "secondFamilyMaxBendPoint": 1633,
          "thirdFamilyMaxBendPoint": 2130,
          "COLA": 0.02,
          "MaxTaxableWages": 127200
        },
        {
          "Year": 2018,
          "firstPIAbendPoint": 895,
          "secondPIAbendPoint": 5397,
          "firstFamilyMaxBendPoint": 1144,
          "secondFamilyMaxBendPoint": 1651,
          "thirdFamilyMaxBendPoint": 2154,
          "COLA": null,
          "MaxTaxableWages": 128400
        }
       ]
}
