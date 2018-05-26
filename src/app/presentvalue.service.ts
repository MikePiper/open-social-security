import { Injectable } from '@angular/core';
import {BirthdayService} from './birthday.service'
import {BenefitService} from './benefit.service'
import { CurrencyPipe } from '@angular/common';
import {SolutionSet} from './solutionset'

@Injectable()
export class PresentvalueService {

  constructor(private benefitService: BenefitService, private birthdayService: BirthdayService) { }
  
  today: Date = new Date()

  calculateSinglePersonPV(FRA: Date, SSbirthDate: Date, initialAge: number, PIA: number, inputBenefitDate: Date, gender: string, mortalityTable:number[], discountRate: number)
  {
    let retirementBenefit: number = this.benefitService.calculateRetirementBenefit(PIA, FRA, inputBenefitDate)
    let retirementPV: number = 0
    let ageLastBirthday: number
    let denominatorAge: number
    let probabilityAlive: number

    //calculate age in month in which they start benefit
    let age: number = ( 12 * (inputBenefitDate.getFullYear() - SSbirthDate.getFullYear()) + (inputBenefitDate.getMonth()) - SSbirthDate.getMonth()  )/12

    //calculate age when filling out form
    let today: Date = new Date()
    let initialAgeRounded: number = Math.round(initialAge)
    
    //Calculate PV via loop until they hit age 115 (by which point "remaining lives" is zero)
      while (age < 115) {
          //Calculate probability of being alive at end of age in question
          //If user is older than 62 when filling out form, denominator is lives remaining at age when filling out form. Otherwise it's lives remaining at age 62
          if (initialAgeRounded <= 62) {
            denominatorAge = 62
          }
          else {
            denominatorAge = initialAgeRounded
          }
          ageLastBirthday = Math.floor(age)
          probabilityAlive = //need probability of being alive at end of "age"
            mortalityTable[ageLastBirthday + 1] / mortalityTable[denominatorAge] * (1 - (age%1))//times something based on "age"
          + mortalityTable[ageLastBirthday + 2] / mortalityTable[denominatorAge] * (age%1)//times something based on "age"
          
          //Calculate probability-weighted benefit
          let annualPV = retirementBenefit * 12 * probabilityAlive
          //Discount that benefit to age 62
          annualPV = annualPV / (1 + discountRate/2) //e.g., benefits received during age 62 must be discounted for 0.5 years
          annualPV = annualPV / Math.pow((1 + discountRate),(age - 62)) //e.g., benefits received during age 63 must be discounted for 1.5 years
          //Add discounted benefit to ongoing count of retirementPV, add 1 year to age and calculationYear, and start loop over
          retirementPV = retirementPV + annualPV
          age = age + 1
      }
        return retirementPV
  }

  calculateCouplePV(spouseAgender: string, spouseBgender:string, spouseAmortalityTable:number[], spouseBmortalityTable:number[], spouseASSbirthDate: Date, spouseBSSbirthDate: Date, spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number,
    spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAPIA: number, spouseBPIA: number, spouseAretirementBenefitDate: Date, spouseBretirementBenefitDate: Date, spouseAspousalBenefitDate: Date, spouseBspousalBenefitDate: Date,
    spouseAgovernmentPension: number, spouseBgovernmentPension:number, discountRate:number){
    let spouseAretirementBenefit: number = 0
    let spouseBretirementBenefit: number = 0
    let spouseAspousalBenefit: number
    let spouseBspousalBenefit: number
    let spouseAsurvivorBenefit: number = 0
    let spouseBsurvivorBenefit: number = 0
    let spouseAage: number
    let spouseAroundedAge: number
    let probabilityAalive: number
    let spouseBage: number
    let spouseBroundedAge: number
    let probabilityBalive: number
    let couplePV = 0
    let firstStartDate: Date
    let secondStartDate: Date

    //If spouse A's input benefit date earlier, set firstStartDate and secondStartDate accordingly.
    if (spouseAretirementBenefitDate < spouseBretirementBenefitDate)
      {
      firstStartDate = new Date(spouseAretirementBenefitDate)
      secondStartDate = new Date(spouseBretirementBenefitDate)
      }
    else {//This is fine as a simple "else" statement. If the two input benefit dates are equal, doing it as of either date is fine.
    firstStartDate = new Date(spouseBretirementBenefitDate)
    secondStartDate = new Date(spouseAretirementBenefitDate)
      }
    
    //Find age of each spouse as of firstStartDate
    spouseAage = ( firstStartDate.getMonth() - spouseASSbirthDate.getMonth() + 12 * (firstStartDate.getFullYear() - spouseASSbirthDate.getFullYear()) )/12
    spouseBage = ( firstStartDate.getMonth() - spouseBSSbirthDate.getMonth() + 12 * (firstStartDate.getFullYear() - spouseBSSbirthDate.getFullYear()) )/12

    //Calculate PV via loop until both spouses are at least age 115 (by which point "remaining lives" alive is zero)
    let currentCalculationDate: Date = new Date(firstStartDate)
    while (spouseAage < 115 || spouseBage < 115){
      //Retirement benefit A is zero if currentCalculationDate is prior to spouseAinputBenefitDate. Otherwise retirement benefit A is calculated as of spouseAinputBenefitDate.
      if (currentCalculationDate < spouseAretirementBenefitDate) {
        spouseAretirementBenefit = 0
        }
        else {spouseAretirementBenefit = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAretirementBenefitDate)
        }
      //Retirement benefit B is zero if currentCalculationDate is prior to spouseBinputBenefitDate. Otherwise retirement benefit B is calculated as of spouseBinputBenefitDate.
      if (currentCalculationDate < spouseBretirementBenefitDate) {
        spouseBretirementBenefit = 0
        }
        else {spouseBretirementBenefit = this.benefitService.calculateRetirementBenefit(spouseBPIA, spouseBFRA, spouseBretirementBenefitDate)
        }

      //Calculate spousal benefits (zero if before applicable claiming date). Don't need to check here if other spouse has filed for retirement benefit yet, because that's being done with input validation.
      if (currentCalculationDate < spouseAspousalBenefitDate){
        spouseAspousalBenefit = 0
        }
        else {
        spouseAspousalBenefit = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, spouseAretirementBenefit, spouseAspousalBenefitDate, spouseAgovernmentPension)
        }
      if (currentCalculationDate < spouseBspousalBenefitDate) {
        spouseBspousalBenefit = 0
        }
        else {
        spouseBspousalBenefit = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, spouseBretirementBenefit, spouseBspousalBenefitDate, spouseBgovernmentPension)
        }
        

      //Survivor benefits are zero before survivorFRA, after survivorFRA, calculate each spouse's survivor benefit using other spouse's intended claiming age as their date of death. (That is, assuming that other spouse lives to their intended claiming age.)
        if (currentCalculationDate < spouseAsurvivorFRA) {
          spouseAsurvivorBenefit = 0    //<-- This will get changed when we incorporate restricted applications for survivor benefits
        } else {
          spouseAsurvivorBenefit = this.benefitService.calculateSurvivorBenefit(spouseASSbirthDate, spouseAsurvivorFRA, spouseAretirementBenefit, spouseAsurvivorFRA, spouseBFRA, spouseBretirementBenefitDate, spouseBPIA, spouseBretirementBenefitDate, spouseAgovernmentPension)
        }
        if (currentCalculationDate < spouseBsurvivorFRA){
          spouseBsurvivorBenefit = 0    //<-- This will get changed when we incorporate restricted applications for survivor benefits
        } else {
          spouseBsurvivorBenefit = this.benefitService.calculateSurvivorBenefit(spouseBSSbirthDate, spouseBsurvivorFRA, spouseBretirementBenefit, spouseBsurvivorFRA, spouseAFRA, spouseAretirementBenefitDate, spouseAPIA, spouseAretirementBenefitDate, spouseBgovernmentPension)

        }

      //Calculate probability of spouseA being alive at given age
        //When calculating probability alive, we have to round age to get a whole number to use for lookup in array.
        //Normally we round age down and use that number for the whole year. But sometimes, for example, real age will be 66 but javascript sees it as 65.99999, so we have to round that up.
          if (spouseAage%1 > 0.99) {
          spouseAroundedAge = Math.round(spouseAage)
          }
          else {spouseAroundedAge = Math.floor(spouseAage)}
          //Calculate probability of being alive at age in question.
          if (spouseAinitialAgeRounded <= 62) {
            probabilityAalive = spouseAmortalityTable[spouseAroundedAge + 1] / spouseAmortalityTable[62]
          }
          //If spouseA is older than 62 when filling out form, denominator is lives remaining at age when filling out the form.
          else { 
            probabilityAalive = spouseAmortalityTable[spouseAroundedAge + 1] / spouseAmortalityTable[spouseAinitialAgeRounded]
          }
      //Do same math to calculate probability of spouseB being alive at given age
          //calculate rounded age
          if (spouseBage%1 > 0.99) {
          spouseBroundedAge = Math.round(spouseBage)
          }
          else {spouseBroundedAge = Math.floor(spouseBage)}
          //use rounded age and lives remaining array to calculate probability
          if (spouseBinitialAgeRounded <= 62) {
            probabilityBalive = spouseBmortalityTable[spouseBroundedAge + 1] / spouseBmortalityTable[62]
          }
          //If spouseA is older than 62 when filling out form, denominator is lives remaining at age when filling out the form.
          else { 
            probabilityBalive = spouseBmortalityTable[spouseBroundedAge + 1] / spouseBmortalityTable[spouseBinitialAgeRounded]
          }
      //Find probability-weighted benefit
        let monthlyPV = 
        (probabilityAalive * (1-probabilityBalive) * (spouseAretirementBenefit + spouseAsurvivorBenefit)) //Scenario where A is alive, B is deceased
        + (probabilityBalive * (1-probabilityAalive) * (spouseBretirementBenefit + spouseBsurvivorBenefit)) //Scenario where B is alive, A is deceased
        + ((probabilityAalive * probabilityBalive) * (spouseAretirementBenefit + spouseAspousalBenefit + spouseBretirementBenefit + spouseBspousalBenefit)) //Scenario where both are alive
      
      //Discount that benefit
            //Find which spouse is older, because we're discounting back to date on which older spouse is age 62.
            let olderRoundedAge: number
            if (spouseAage > spouseBage) {
              olderRoundedAge = spouseAroundedAge
            } else {olderRoundedAge = spouseBroundedAge}
            //Here is where actual discounting happens. Discounting by half a year, because we assume all benefits received mid-year. Then discounting for any additional years needed to get back to PV at 62.
            monthlyPV = monthlyPV / (1 + discountRate/2) / Math.pow((1 + discountRate),(olderRoundedAge - 62))

      /*log benefit amounts by date
      console.log("currentCalculationDate: " + currentCalculationDate)
      console.log("spouseAretirementBenefit: " + spouseAretirementBenefit)
      console.log("spouseBretirementBenefit: " + spouseBretirementBenefit)
      console.log("spouseAspousalBenefit: " + spouseAspousalBenefit)
      console.log("spouseBspousalBenefit: " + spouseBspousalBenefit)
      */

      //Add discounted benefit to ongoing count of retirementPV, add 1 month to each age, add 1 month to currentCalculationDate, and start loop over
        couplePV = couplePV + monthlyPV
        spouseAage = spouseAage + 1/12
        spouseBage = spouseBage + 1/12
        currentCalculationDate.setMonth(currentCalculationDate.getMonth()+1)
    }

    return couplePV
  }


  maximizeSinglePersonPV(PIA: number, SSbirthDate: Date, actualBirthDate:Date, initialAge:number, FRA: Date, gender: string, mortalityTable:number[], discountRate: number){
    //find initial testClaimingDate for age 62
    let testClaimingDate = new Date(SSbirthDate.getFullYear()+62, 1, 1)
    if (actualBirthDate.getDate() <= 2){
      testClaimingDate.setMonth(actualBirthDate.getMonth())
    } else {
      testClaimingDate.setMonth(actualBirthDate.getMonth()+1)
    }

    //If user is currently over age 62 when filling out form, set testClaimingDate to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
    let ageToday = this.today.getFullYear() - SSbirthDate.getFullYear() + (this.today.getMonth() - SSbirthDate.getMonth())/12
    if (ageToday > 62){
      testClaimingDate.setMonth(this.today.getMonth())
      testClaimingDate.setFullYear(this.today.getFullYear())
    }

    //Run calculateSinglePersonPV for their earliest possible claiming date, save the PV and the date.
    let savedPV: number = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, testClaimingDate, gender, mortalityTable, discountRate)
    let savedClaimingDate = new Date(testClaimingDate)

    //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
    let endingTestDate = new Date(SSbirthDate.getFullYear()+70, SSbirthDate.getMonth()-1, 1)
    while (testClaimingDate <= endingTestDate){
      //Add 1 month to claiming age and run both calculations again and compare results. Save better of the two.
      testClaimingDate.setMonth(testClaimingDate.getMonth() + 1)
      let currentTestPV = this.calculateSinglePersonPV(FRA, SSbirthDate, initialAge, PIA, testClaimingDate, gender, mortalityTable, discountRate)
      if (currentTestPV > savedPV)
        {savedClaimingDate.setMonth(testClaimingDate.getMonth())
          savedClaimingDate.setFullYear(testClaimingDate.getFullYear())
          savedPV = currentTestPV}
    }
    //after loop is finished
    console.log("saved PV: " + savedPV)
    console.log("savedClaimingDate: " + savedClaimingDate)

    let solutionSet:SolutionSet = {
      "solutionPV":savedPV,
      "spouseAretirementSolution":savedClaimingDate,
      "spouseBretirementSolution":null,
      "spouseAspousalSolution":null,
      "spouseBspousalSolution":null
    }
    return solutionSet
  }


  maximizeCouplePV(spouseAPIA: number, spouseBPIA: number, spouseAactualBirthDate:Date, spouseBactualBirthDate:Date, spouseASSbirthDate: Date, spouseBSSbirthDate: Date, spouseAinitialAgeRounded:number, spouseBinitialAgeRounded:number,
    spouseAFRA: Date, spouseBFRA: Date, spouseAsurvivorFRA:Date, spouseBsurvivorFRA:Date,
    spouseAgender: string, spouseBgender:string, spouseAmortalityTable:number[], spouseBmortalityTable:number[], spouseAgovernmentPension:number, spouseBgovernmentPension:number, discountRate: number){

    let deemedFilingCutoff: Date = new Date(1954, 0, 1)

    //find initial test dates for spouseA (first month for which spouseA is considered 62 for entire month)
    let spouseAretirementDate = new Date(spouseASSbirthDate.getFullYear()+62, 1, 1)
    let spouseAspousalDate = new Date(spouseASSbirthDate.getFullYear()+62, 1, 1)
    if (spouseAactualBirthDate.getDate() <= 2){
      spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth())
      spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth())
    } else {
      spouseAretirementDate.setMonth(spouseAactualBirthDate.getMonth()+1)
      spouseAspousalDate.setMonth(spouseAactualBirthDate.getMonth()+1)
    }
    //If spouseA is currently over age 62 when filling out form, adjust their initial test dates to today's month/year instead of their age 62 month/year.
    let today = new Date()
    let spouseAageToday: number = today.getFullYear() - spouseASSbirthDate.getFullYear() + (today.getMonth() - spouseASSbirthDate.getMonth()) /12
    if (spouseAageToday > 62){
      spouseAretirementDate.setMonth(today.getMonth())
      spouseAretirementDate.setFullYear(today.getFullYear())
      spouseAspousalDate.setMonth(today.getMonth())
      spouseAspousalDate.setFullYear(today.getFullYear())
    }
    //Do all of the same, but for spouseB.
    let spouseBretirementDate = new Date(spouseBSSbirthDate.getFullYear()+62, 1, 1)
    let spouseBspousalDate = new Date(spouseBSSbirthDate.getFullYear()+62, 1, 1)
    if (spouseBactualBirthDate.getDate() <= 2){
      spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth())
      spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth())
    } else {
      spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth()+1)
      spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth()+1)
    }
    let spouseBageToday: number = today.getFullYear() - spouseBSSbirthDate.getFullYear() + (today.getMonth() - spouseBSSbirthDate.getMonth()) /12
    if (spouseBageToday > 62){
      spouseBretirementDate.setMonth(today.getMonth())
      spouseBretirementDate.setFullYear(today.getFullYear())
      spouseBspousalDate.setMonth(today.getMonth())
      spouseBspousalDate.setFullYear(today.getFullYear())
    }
    //Check to see if spouseA's current spousalDate is prior to spouseB's earliest retirementDate. If so, adjust.
    if (spouseAspousalDate < spouseBretirementDate){
      spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
      spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
    }

    //Initialize savedPV as zero. Set spouseAsavedDate and spouseBsavedDate equal to their current testDates.
      let savedPV: number = 0
      let spouseAsavedRetirementDate = new Date(spouseAretirementDate)
      let spouseBsavedRetirementDate = new Date(spouseBretirementDate)
      let spouseAsavedSpousalDate = new Date(spouseAspousalDate)
      let spouseBsavedSpousalDate = new Date(spouseBspousalDate)

    //Set endingTestDate for each spouse equal to the month they turn 70
    let spouseAendTestDate = new Date(spouseASSbirthDate.getFullYear()+70, spouseASSbirthDate.getMonth(), 1)
    let spouseBendTestDate = new Date(spouseBSSbirthDate.getFullYear()+70, spouseBSSbirthDate.getMonth(), 1)

    while (spouseAretirementDate <= spouseAendTestDate) {
        //Reset spouseB test dates to earliest possible (i.e., their "age 62 for whole month" month or today's month if they're currently older than 62, but never earlier than spouse A's retirementDate)
        if (spouseBageToday > 62){
          spouseBretirementDate.setMonth(today.getMonth())
          spouseBretirementDate.setFullYear(today.getFullYear())
          spouseBspousalDate.setMonth(today.getMonth())
          spouseBspousalDate.setFullYear(today.getFullYear())
        } else {
            spouseBretirementDate.setFullYear(spouseBSSbirthDate.getFullYear()+62)
            spouseBspousalDate.setFullYear(spouseBSSbirthDate.getFullYear()+62)
            if (spouseBactualBirthDate.getDate() <= 2){
              spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth())
              spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth())
            } else {
              spouseBretirementDate.setMonth(spouseBactualBirthDate.getMonth()+1)
              spouseBspousalDate.setMonth(spouseBactualBirthDate.getMonth()+1)
            }
        }
        if (spouseBspousalDate < spouseAretirementDate) {
          spouseBspousalDate.setMonth(spouseAretirementDate.getMonth())
          spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear())
        }
        while (spouseBretirementDate <= spouseBendTestDate) {
          //Calculate PV using current testDates
            let currentTestPV: number = this.calculateCouplePV(spouseAgender, spouseBgender, spouseAmortalityTable, spouseBmortalityTable, spouseASSbirthDate, spouseBSSbirthDate, Number(spouseAinitialAgeRounded), Number(spouseBinitialAgeRounded), spouseAFRA, spouseBFRA, spouseAsurvivorFRA, spouseBsurvivorFRA, Number(spouseAPIA), Number(spouseBPIA), spouseAretirementDate, spouseBretirementDate, spouseAspousalDate, spouseBspousalDate, Number(spouseAgovernmentPension), Number(spouseBgovernmentPension), Number(discountRate))
            //If PV is greater than saved PV, save new PV and save new testDates
            if (currentTestPV > savedPV) {
              savedPV = currentTestPV
              spouseAsavedRetirementDate.setMonth(spouseAretirementDate.getMonth())
              spouseAsavedRetirementDate.setFullYear(spouseAretirementDate.getFullYear())
              spouseBsavedRetirementDate.setMonth(spouseBretirementDate.getMonth())
              spouseBsavedRetirementDate.setFullYear(spouseBretirementDate.getFullYear())
              spouseAsavedSpousalDate.setMonth(spouseAspousalDate.getMonth())
              spouseAsavedSpousalDate.setFullYear(spouseAspousalDate.getFullYear())
              spouseBsavedSpousalDate.setMonth(spouseBspousalDate.getMonth())
              spouseBsavedSpousalDate.setFullYear(spouseBspousalDate.getFullYear())
              }
          //Find next possible claiming combination for spouseB
            //if spouseB has new deemed filing rules, increment both dates by 1. (But don't increment spousalDate if it's currently set later than retirementDate.)
              //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
            if (spouseBactualBirthDate > deemedFilingCutoff) {
              if (spouseBspousalDate <= spouseBretirementDate) {
                spouseBspousalDate.setMonth(spouseBspousalDate.getMonth()+1)
              }
              spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
            }
          
            else {//i.e., if spouseB has old deemed filing rules
              //if spouseBretirementDate < FRA, increment both test dates by 1. (Don't increment spousalDate though if it is currently set later than retirementDate.)
              if (spouseBretirementDate < spouseBFRA) {
                if (spouseBspousalDate <= spouseBretirementDate) {
                  spouseBspousalDate.setMonth(spouseBspousalDate.getMonth()+1)
                }
                spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
                //No need to check here if spousal is too early, because at start of this loop it was set to earliest possible.
              }
              else {//i.e., if spouseBretirementDate >= FRA
                //Increment retirement testdate by 1 and set spousal date to earliest possible restricted application date (later of FRA or other spouse's retirementtestdate)
                spouseBretirementDate.setMonth(spouseBretirementDate.getMonth()+1)
                if (spouseAretirementDate > spouseBFRA) {
                  spouseBspousalDate.setMonth(spouseAretirementDate.getMonth())
                  spouseBspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                } else {
                  spouseBspousalDate.setMonth(spouseBFRA.getMonth())
                  spouseBspousalDate.setFullYear(spouseBFRA.getFullYear())
                }
              }

            }
          //After spouse B's retirement testdate has been incremented, adjust spouseA's spousal date as necessary
            //If spouseA has new deemed filing rules, set spouseA spousalDate to later of spouseA retirementDate or spouseB retirementDate
              if (spouseAactualBirthDate > deemedFilingCutoff) {
                if (spouseAretirementDate > spouseBretirementDate) {
                  spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                } else {
                  spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                  spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                }
              }
              else {//i.e., if spouseA has old deemed filing rules
                if (spouseAretirementDate < spouseAFRA) {
                  //Set spouseA spousal testdate to later of spouseA retirementDate or spouseB retirementDate
                  if (spouseAretirementDate > spouseBretirementDate) {
                    spouseAspousalDate.setMonth(spouseAretirementDate.getMonth())
                    spouseAspousalDate.setFullYear(spouseAretirementDate.getFullYear())
                  } else {
                    spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                    spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                  }
                }
                else {//i.e., if spouseAretirementDate currently after spouseAFRA
                  //Set spouseA spousalDate to earliest possible restricted application date (later of FRA or spouse B's retirementDate)
                  if (spouseAFRA > spouseBretirementDate) {
                    spouseAspousalDate.setMonth(spouseAFRA.getMonth())
                    spouseAspousalDate.setFullYear(spouseAFRA.getFullYear())
                  } else {
                    spouseAspousalDate.setMonth(spouseBretirementDate.getMonth())
                    spouseAspousalDate.setFullYear(spouseBretirementDate.getFullYear())
                  }
                }
              }
    
    

        }
        //Add 1 month to spouseAretirementDate
        spouseAretirementDate.setMonth(spouseAretirementDate.getMonth()+1)

      }
    //after loop is finished
      console.log("saved PV: " + savedPV)
      console.log("spouseAretirementDate: " + spouseAsavedRetirementDate)
      console.log("spouseBretirementDate: " + spouseBsavedRetirementDate)
      console.log("spouseAspousalDate: " + spouseAsavedSpousalDate)
      console.log("spouseBspousalDate: " + spouseBsavedSpousalDate)

      let solutionSet: SolutionSet = {
        "solutionPV":savedPV,
        "spouseAretirementSolution":spouseAsavedRetirementDate,
        "spouseBretirementSolution":spouseBsavedRetirementDate,
        "spouseAspousalSolution":spouseAsavedSpousalDate,
        "spouseBspousalSolution":spouseBsavedSpousalDate
      }
      //Set spousal dates back to null in cases in which there will be no spousal benefit, so user doesn't see a suggested spousal claiming age that makes no sense.
        //need to recalculate spousal benefit for each spouse using the four saved dates.
      let finalCheckSpouseAretirement = this.benefitService.calculateRetirementBenefit(spouseAPIA, spouseAFRA, spouseAsavedRetirementDate)
      let finalCheckSpouseAspousal = this.benefitService.calculateSpousalBenefit(spouseAPIA, spouseBPIA, spouseAFRA, finalCheckSpouseAretirement, spouseAsavedSpousalDate, spouseAgovernmentPension)
      let finalCheckSpouseBretirement = this.benefitService.calculateRetirementBenefit(spouseBPIA, spouseBFRA, spouseBsavedRetirementDate)
      let finalCheckSpouseBspousal = this.benefitService.calculateSpousalBenefit(spouseBPIA, spouseAPIA, spouseBFRA, finalCheckSpouseBretirement, spouseBsavedSpousalDate, spouseBgovernmentPension)
      if (finalCheckSpouseAspousal == 0 && spouseAsavedSpousalDate >= spouseAsavedRetirementDate) //We compare the dates because we don't want to eliminate the spousal date from output if it's prior to retirement date (as in restricted app)
        {solutionSet.spouseAspousalSolution = null}
      if (finalCheckSpouseBspousal == 0 && spouseBsavedSpousalDate >= spouseBsavedRetirementDate) //Ditto about date comparisons
        {solutionSet.spouseBspousalSolution = null}
      //Set retirement date to null if person has 0 PIA.
      if (spouseAPIA == 0) {solutionSet.spouseAretirementSolution = null}
      if (spouseBPIA == 0) {solutionSet.spouseBretirementSolution = null}

      return solutionSet
  }



//Lives remaining out of 100k, from SSA 2014 period life table
maleSSAtable = [
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
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleSSAtable = [
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
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleNS1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99878, 
  99752, 
  99621, 
  99486, 
  99346, 
  99200, 
  99046, 
  98882, 
  98707, 
  98518, 
  98313, 
  98093, 
  97858, 
  97612, 
  97352, 
  97078, 
  96785, 
  96469, 
  96121, 
  95735, 
  95307, 
  94833, 
  94307, 
  93726, 
  93085, 
  92376, 
  91588, 
  90708, 
  89717, 
  88598, 
  87332, 
  85902, 
  84296, 
  82501, 
  80505, 
  78291, 
  75838, 
  73126, 
  70141, 
  66872, 
  63302, 
  59421, 
  55230, 
  50742, 
  45995, 
  41062, 
  36045, 
  31069, 
  26266, 
  21767, 
  17683, 
  14094, 
  11015, 
  8421, 
  6283, 
  4563, 
  3220, 
  2204, 
  1461, 
  937, 
  581, 
  349, 
  202, 
  114, 
  62, 
  33, 
  17, 
  9, 
  4, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
]

maleNS2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99857, 
  99708, 
  99555, 
  99396, 
  99232, 
  99061, 
  98881, 
  98691, 
  98485, 
  98261, 
  98016, 
  97751, 
  97467, 
  97164, 
  96843, 
  96502, 
  96138, 
  95741, 
  95305, 
  94822, 
  94286, 
  93694, 
  93042, 
  92325, 
  91541, 
  90680, 
  89733, 
  88686, 
  87521, 
  86219, 
  84765, 
  83144, 
  81347, 
  79364, 
  77188, 
  74807, 
  72204, 
  69362, 
  66267, 
  62914, 
  59291, 
  55397, 
  51238, 
  46835, 
  42230, 
  37497, 
  32740, 
  28076, 
  23631, 
  19516, 
  15818, 
  12597, 
  9845, 
  7526, 
  5615, 
  4079, 
  2878, 
  1970, 
  1306, 
  838, 
  520, 
  312, 
  181, 
  101, 
  55, 
  29, 
  15, 
  8, 
  4, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
]

maleSM1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99747, 
  99482, 
  99203, 
  98907, 
  98594, 
  98261, 
  97905, 
  97524, 
  97115, 
  96673, 
  96195, 
  95679, 
  95117, 
  94505, 
  93837, 
  93105, 
  92301, 
  91415, 
  90436, 
  89355, 
  88165, 
  86856, 
  85423, 
  83863, 
  82174, 
  80353, 
  78393, 
  76282, 
  74007, 
  71562, 
  68949, 
  66181, 
  63281, 
  60277, 
  57194, 
  54053, 
  50867, 
  47647, 
  44413, 
  41137, 
  37791, 
  34392, 
  30963, 
  27535, 
  24151, 
  20868, 
  17747, 
  14846, 
  12216, 
  9890, 
  7881, 
  6191, 
  4788, 
  3634, 
  2699, 
  1956, 
  1379, 
  944, 
  626, 
  401, 
  249, 
  149, 
  87, 
  49, 
  26, 
  14, 
  7, 
  4, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
]

maleSM2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99712, 
  99410, 
  99093, 
  98756, 
  98398, 
  98018, 
  97611, 
  97175, 
  96706, 
  96200, 
  95654, 
  95063, 
  94421, 
  93722, 
  92961, 
  92129, 
  91218, 
  90217, 
  89117, 
  87907, 
  86580, 
  85130, 
  83550, 
  81840, 
  80001, 
  78031, 
  75925, 
  73672, 
  71263, 
  68691, 
  65964, 
  63098, 
  60119, 
  57058, 
  53943, 
  50797, 
  47633, 
  44461, 
  41296, 
  38115, 
  34887, 
  31632, 
  28372, 
  25136, 
  21964, 
  18908, 
  16022, 
  13360, 
  10963, 
  8856, 
  7048, 
  5534, 
  4280, 
  3248, 
  2412, 
  1748, 
  1233, 
  844, 
  559, 
  359, 
  223, 
  133, 
  77, 
  43, 
  24, 
  13, 
  7, 
  3, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
]

femaleNS1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99927, 
  99853, 
  99778, 
  99700, 
  99619, 
  99532, 
  99439, 
  99339, 
  99229, 
  99107, 
  98970, 
  98817, 
  98649, 
  98467, 
  98270, 
  98058, 
  97828, 
  97579, 
  97307, 
  97008, 
  96679, 
  96317, 
  95921, 
  95485, 
  95008, 
  94484, 
  93908, 
  93269, 
  92558, 
  91760, 
  90862, 
  89851, 
  88711, 
  87425, 
  85971, 
  84323, 
  82449, 
  80318, 
  77928, 
  75290, 
  72386, 
  69115, 
  65465, 
  61509, 
  57250, 
  52710, 
  47938, 
  43012, 
  38020, 
  33056, 
  28230, 
  23646, 
  19372, 
  15473, 
  12011, 
  9032, 
  6559, 
  4597, 
  3111, 
  2032, 
  1279, 
  777, 
  455, 
  257, 
  141, 
  75, 
  39, 
  20, 
  10, 
  5, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
]

femaleNS2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99915, 
  99829, 
  99741, 
  99650, 
  99555, 
  99453, 
  99344, 
  99226, 
  99096, 
  98950, 
  98787, 
  98604, 
  98403, 
  98183, 
  97946, 
  97690, 
  97415, 
  97116, 
  96789, 
  96432, 
  96041, 
  95612, 
  95143, 
  94631, 
  94073, 
  93463, 
  92796, 
  92061, 
  91247, 
  90341, 
  89330, 
  88199, 
  86933, 
  85517, 
  83930, 
  82148, 
  80139, 
  77873, 
  75355, 
  72599, 
  69591, 
  66241, 
  62539, 
  58564, 
  54324, 
  49843, 
  45177, 
  40401, 
  35605, 
  30876, 
  26318, 
  22028, 
  18046, 
  14414, 
  11189, 
  8414, 
  6110, 
  4282, 
  2898, 
  1893, 
  1192, 
  723, 
  424, 
  240, 
  131, 
  70, 
  36, 
  18, 
  9, 
  5, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
]

femaleSM1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99841, 
  99673, 
  99493, 
  99297, 
  99083, 
  98851, 
  98595, 
  98316, 
  98012, 
  97677, 
  97312, 
  96912, 
  96473, 
  95990, 
  95457, 
  94869, 
  94220, 
  93504, 
  92714, 
  91844, 
  90887, 
  89838, 
  88689, 
  87435, 
  86075, 
  84606, 
  83022, 
  81316, 
  79489, 
  77543, 
  75476, 
  73281, 
  70953, 
  68487, 
  65878, 
  63126, 
  60207, 
  57086, 
  53755, 
  50222, 
  46526, 
  42743, 
  38871, 
  34929, 
  31014, 
  27181, 
  23490, 
  20006, 
  16783, 
  13858, 
  11262, 
  9010, 
  7082, 
  5454, 
  4111, 
  3030, 
  2182, 
  1529, 
  1035, 
  676, 
  426, 
  258, 
  151, 
  86, 
  47, 
  25, 
  13, 
  7, 
  3, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
]

femaleSM2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99800, 
  99588, 
  99360, 
  99111, 
  98838, 
  98541, 
  98215, 
  97857, 
  97465, 
  97035, 
  96564, 
  96049, 
  95484, 
  94864, 
  94184, 
  93437, 
  92619, 
  91722, 
  90743, 
  89674, 
  88511, 
  87248, 
  85884, 
  84414, 
  82839, 
  81159, 
  79373, 
  77474, 
  75466, 
  73356, 
  71142, 
  68820, 
  66388, 
  63841, 
  61179, 
  58404, 
  55490, 
  52407, 
  49148, 
  45724, 
  42173, 
  38579, 
  34936, 
  31260, 
  27640, 
  24125, 
  20768, 
  17625, 
  14738, 
  12137, 
  9846, 
  7871, 
  6187, 
  4765, 
  3591, 
  2647, 
  1907, 
  1336, 
  904, 
  591, 
  372, 
  226, 
  132, 
  75, 
  41, 
  22, 
  11, 
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

}
