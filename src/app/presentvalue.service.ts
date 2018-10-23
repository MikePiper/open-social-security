import {Injectable} from '@angular/core'
import {BenefitService} from './benefit.service'
import {MortalityService} from './mortality.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {SolutionSet} from './data model classes/solutionset'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {CalculationYear} from './data model classes/calculationyear'
import {OutputTableService} from './outputtable.service'
import {MonthYearDate} from "./data model classes/monthyearDate"


@Injectable()
export class PresentValueService {

  constructor(private benefitService: BenefitService, private mortalityService:MortalityService, private earningsTestService: EarningsTestService, private solutionSetService: SolutionSetService,
  private outputTableService: OutputTableService) { }

  today: MonthYearDate = new MonthYearDate()

  calculateSinglePersonPV(person:Person, scenario:CalculationScenario, printOutputTable:boolean):number{
    //reset values for new PV calc
      let retirementPV:number = 0
      person.hasHadGraceYear = false
      person.adjustedRetirementBenefitDate = new MonthYearDate(person.retirementBenefitDate)
      person.DRCsViaSuspension = 0
      person.monthsRetirementWithheld = 0
      scenario.outputTable = []

    //calculate initial retirement benefit
      person.retirementBenefit = this.benefitService.calculateRetirementBenefit(person, person.retirementBenefitDate)

    //Find childBenefitDate for any children
    for (let child of scenario.children){
      child.childBenefitDate = this.benefitService.determineChildBenefitDate(scenario, child, person)
    }

    //Create initial CalculationYear object
    //initialCalcDate is Jan 1 of year they turn 62, but no later than retirementBenefitDate (point being, if they are on disability prior to 62, we want calc to start now so we can get table beginning now)
    let initialCalcDate:MonthYearDate = new MonthYearDate(person.SSbirthDate.getFullYear()+62, 0, 1)
    if (initialCalcDate.getFullYear() > person.retirementBenefitDate.getFullYear()){
      initialCalcDate = new MonthYearDate(person.retirementBenefitDate)
    }
    let calcYear:CalculationYear = new CalculationYear(initialCalcDate)

    //calculate age(s) as of that date
    person.age = ( 12 * (calcYear.date.getFullYear() - person.SSbirthDate.getFullYear()) + (calcYear.date.getMonth()) - person.SSbirthDate.getMonth()  )/12
    for (let child of scenario.children){
      child.age = ( 12 * (calcYear.date.getFullYear() - child.SSbirthDate.getFullYear()) + (calcYear.date.getMonth()) - child.SSbirthDate.getMonth()  )/12
    }

    //Calculate PV via monthly loop until they hit age 115 (by which point "remaining lives" is zero)
    while (person.age < 115) {
      //Do we have to recalculate any benefits? (e.g., due to reaching FRA and ARF happening, or due to suspension ending) (Never have to recalculate a child's benefit amount.)
        this.benefitService.monthlyCheckForBenefitRecalculationsSingle(person, calcYear)
      
      //Do we ever have to recalculate family max? (No. In family scenario might have to recalculate combined family max though. Or rather, combined family max doesn't get calculated at beginning but rather in a later year?)
      
      //Assume person is alive
            //calculate monthlyPayment field for each person (checks to see if we're before or after retirementBenefitDate, checks if benefit suspended or not, checks if children are under 18 or disabled)
            this.benefitService.calculateMonthlyPaymentsSingle(scenario, calcYear, person, true)

            //Adjust each person's monthlyPayment as necessary for family max
              if (scenario.children.length > 0){
                let amountLeftForRestOfFamiliy:number = person.familyMaximum - person.PIA
                scenario = this.benefitService.applyFamilyMaximumSingle(scenario, amountLeftForRestOfFamiliy)
              }

            //Adjust as necessary for earnings test (and tally months withheld)
            if (person.quitWorkDate > this.today){
              this.earningsTestService.applyEarningsTestSingle(scenario, person, calcYear)
            }

            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitSinglePersonAlive for PV calc and appropriate table sum for table output)
            if (calcYear.date >= this.today || (person.hasFiled === false && person.isOnDisability === false) ){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
              calcYear.annualBenefitSinglePersonAlive = calcYear.annualBenefitSinglePersonAlive + person.monthlyRetirementPayment
            }
            for (let child of scenario.children){
              if (calcYear.date >= this.today || child.hasFiled === false){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
                calcYear.annualBenefitSinglePersonAlive = calcYear.annualBenefitSinglePersonAlive + child.monthlyChildPayment
              }
            }
            if (printOutputTable === true){
              calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit + person.monthlyRetirementPayment
              for (let child of scenario.children){
                calcYear.tableTotalAnnualChildBenefitsSingleParentAlive = calcYear.tableTotalAnnualChildBenefitsSingleParentAlive + child.monthlyChildPayment
              }
            }

      //Assume person is deceased
            //calculate monthlyPayment field for each person (sets child monthlyPayments to 75% of PIA if they are under 18 or disabled)
            this.benefitService.calculateMonthlyPaymentsSingle(scenario, calcYear, person, false)

            //adjust each person's monthlyPayment as necessary for family max
            if (scenario.children.length > 0){
              let amountLeftForRestOfFamiliy:number = person.familyMaximum
              scenario = this.benefitService.applyFamilyMaximumSingle(scenario, amountLeftForRestOfFamiliy)
            }

            //Earnings test: not necessary in Single scenario if person is deceased

            //sum everybody's monthlyPayment fields and add that sum to appropriate annual total (annualBenefitPersonDeceased)
            for (let child of scenario.children){
              if (calcYear.date >= this.today){//only want to include child survivor benefit in PV calc if it is not from a month in the past (would never have a retroactive child survivor application, since if parent is already deceased calculator doesn't run)
                calcYear.annualBenefitSinglePersonDeceased = calcYear.annualBenefitSinglePersonDeceased + child.monthlyChildPayment
              }
              if (printOutputTable === true){
                calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased = calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased + child.monthlyChildPayment
              }
            }

      //After month is over increase age of each child by 1/12 (have to do it here because we care about their age by months for eligibility, whereas parent we can just increment by years)
        for (let child of scenario.children){
          child.age = child.age + 1/12
        }

        //if it's December...
        if (calcYear.date.getMonth() == 11){
          //Add back any overwithholding from earnings test
            if (calcYear.annualWithholdingDueToPersonAearnings < 0) {//If annualWithholding is negative due to overwithholding...
              calcYear.annualBenefitSinglePersonAlive = calcYear.annualBenefitSinglePersonAlive - calcYear.annualWithholdingDueToPersonAearnings//add back for PV-related sum
              calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit - calcYear.annualWithholdingDueToPersonAearnings//add back for table-related sum
            }

          //Apply assumed benefit cut, if applicable
            this.benefitService.applyAssumedBenefitCut(scenario, calcYear)

          //If printOutputTable is true, add row to output table.
            if (printOutputTable === true){
              this.outputTableService.generateOutputTableSingle(person, scenario, calcYear)
            }

          //Apply probability alive to annual benefit amounts
          let probabilityPersonAlive:number = this.mortalityService.calculateProbabilityAlive(person, person.age)
          calcYear.annualPV = calcYear.annualBenefitSinglePersonAlive * probabilityPersonAlive + calcYear.annualBenefitSinglePersonDeceased * (1 - probabilityPersonAlive)

          //Discount that probability-weighted annual benefit amount to age 62
          calcYear.annualPV = calcYear.annualPV / (1 + scenario.discountRate/100/2) //e.g., benefits received during age 62 must be discounted for 0.5 years
          calcYear.annualPV = calcYear.annualPV / Math.pow((1 + scenario.discountRate/100),(person.age - 62)) //e.g., benefits received during age 63 must be discounted for 1.5 years

          //Add discounted benefit to ongoing sum
          retirementPV = retirementPV + calcYear.annualPV

          //increment person's age by 1 year
          person.age = person.age + 1
        }

        //increment month by 1 and create new CalculationYear object if it's now January
        calcYear.date.setMonth(calcYear.date.getMonth()+1)
        if (calcYear.date.getMonth() == 0){
        calcYear = new CalculationYear(calcYear.date)
        }
    }

    return retirementPV
  }

  calculateCouplePVmonthlyLoop(personA:Person, personB:Person, scenario:CalculationScenario, printOutputTable:boolean) : number{
    //reset values for new PV calc
    let couplePV: number = 0
    personA.hasHadGraceYear = false
    personB.hasHadGraceYear = false
    personA.adjustedRetirementBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
    personA.adjustedSpousalBenefitDate = new MonthYearDate(personA.spousalBenefitDate)
    personB.adjustedRetirementBenefitDate = new MonthYearDate(personB.retirementBenefitDate)
    personB.adjustedSpousalBenefitDate = new MonthYearDate(personB.spousalBenefitDate)
    personA.DRCsViaSuspension = 0
    personB.DRCsViaSuspension = 0


    //calculate combined family maximum (We need to know "simultaneous entitlement year" so we can't do this in HomeComponent or maximize function. But can do it anywhere at beginning of PV calc.)
        //simultaneousentitlementyear is later of two retirementBenefitDates (simplification: ignoring the possibility of it being a child's DoB, which could happen if child is born AFTER both retirementBenefitDates)
          if (personA.retirementBenefitDate < personB.retirementBenefitDate){
            this.benefitService.calculateCombinedFamilyMaximum(personA, personB, personB.retirementBenefitDate.getFullYear())
          }
          else {
            this.benefitService.calculateCombinedFamilyMaximum(personA, personB, personA.retirementBenefitDate.getFullYear())
          }

    //Create initial CalculationYear object
        let initialCalcDate:MonthYearDate
        //If divorced, set to Jan 1 of year in which personA turns 62
          if (scenario.maritalStatus == "divorced") {
            initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0)
          }
        //If married, set initialCalcDate to Jan 1 of year in which first spouse reaches age 62
          if (scenario.maritalStatus == "married"){
            if (personA.SSbirthDate < personB.SSbirthDate)
              {
                initialCalcDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0)
              }
            else {
              initialCalcDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0)
              }
          }
        //Don't let initialCalcDate be later than the earlier retirementBenefitDate (point being, if a person is on disability prior to 62, we want calc to start now so we can get table beginning now)
          if (personA.retirementBenefitDate < personB.retirementBenefitDate && initialCalcDate > personA.retirementBenefitDate){
            initialCalcDate = new MonthYearDate(personA.retirementBenefitDate.getFullYear(), 0)
          }
          if (personB.retirementBenefitDate < personA.retirementBenefitDate && initialCalcDate > personB.retirementBenefitDate){
            initialCalcDate = new MonthYearDate(personB.retirementBenefitDate.getFullYear(), 0)
          }
        let calcYear:CalculationYear = new CalculationYear(initialCalcDate)

    //Find childBenefitDate for any children
    for (let child of scenario.children){
      child.childBenefitDate = this.benefitService.determineChildBenefitDate(scenario, child, personA, personB)
    }

    //calculate ages as of initialCalcDate
      personA.age = ( calcYear.date.getMonth() - personA.SSbirthDate.getMonth() + 12 * (calcYear.date.getFullYear() - personA.SSbirthDate.getFullYear()) )/12
      personB.age = ( calcYear.date.getMonth() - personB.SSbirthDate.getMonth() + 12 * (calcYear.date.getFullYear() - personB.SSbirthDate.getFullYear()) )/12

    //Calculate PV via monthly loop until they hit age 115 (by which point "remaining lives" is zero)
    while (personA.age < 115 || personB.age < 115){
      //Do we have to calculate/recalculate any benefits for personA or personB?
        this.benefitService.monthlyCheckForBenefitRecalculationsCouple(personA, personB, calcYear)

      //Assume personA and personB are alive
            //calculate monthlyPayment field for each person
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, true, personB, true)
            //TODO: Adjust each person's monthlyPayment as necessary for family max
            //Adjust as necessary for earnings test (and tally months withheld)
            //add everybody's monthlyPayment fields to appropriate annual totals (annualBenefitBothAlive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, true, personB, true, printOutputTable)
      //Assume personA is alive and personB is deceased
            //calculate monthlyPayment field for each person
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, true, personB, false)
            //TODO: Adjust each person's monthlyPayment as necessary for family max
            //TODO: Adjust as necessary for earnings test (and tally months withheld)
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitOnlyPersonAalive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, true, personB, false, printOutputTable)
      //Assume personA is deceased and personB is alive
            //calculate monthlyPayment field for each person
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, false, personB, true)
            //TODO: Adjust each person's monthlyPayment as necessary for family max
            //TODO: Adjust as necessary for earnings test (and tally months withheld)
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitOnlyPersonBalive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, false, personB, true, printOutputTable)
      //Assume personA and personB are deceased
            //calculate monthlyPayment field for each person
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, false, personB, false)
            //TODO: adjust each person's monthlyPayment as necessary for family max
            //Earnings test: not necessary
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitBothDeceased)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, false, personB, true, printOutputTable)
      //After month is over increase age of each child by 1/12 (have to do it here because we care about their age by months for eligibility, whereas parent we can just increment by years)
            for (let child of scenario.children){
              child.age = child.age + 1/12
            }
      //if it's December...
      if (calcYear.date.getMonth() == 11){
            //TODO: Add back any overwithholding from earnings test

            //Apply assumed benefit cut, if applicable (use function from BenefitService, not from PVservice)
            this.benefitService.applyAssumedBenefitCut(scenario, calcYear)

            //If printOutputTable is true, add row to output table.
              if (printOutputTable === true && scenario.maritalStatus == "married"){
                this.outputTableService.generateOutputTableCouple(personA, personB, scenario, calcYear)
              }
              if (printOutputTable === true && scenario.maritalStatus == "divorced"){
                this.outputTableService.generateOutputTableDivorced(personA, scenario, calcYear)
              }

            //Calculate each person's probability of being alive at end of age in question
              let probabilityAalive:number = this.mortalityService.calculateProbabilityAlive(personA, personA.age)
              let probabilityBalive:number = this.mortalityService.calculateProbabilityAlive(personB, personB.age)

            //Apply probability alive to annual benefit amounts
              let annualPV:number =
                probabilityAalive * probabilityBalive * calcYear.annualBenefitBothAlive +
                probabilityAalive * (1 - probabilityBalive) * calcYear.annualBenefitOnlyPersonAalive +
                probabilityBalive * (1 - probabilityAalive) * calcYear.annualBenefitOnlyPersonBalive

                if (printOutputTable === true){
                  console.log("monthly loop" + calcYear.date.getFullYear())
                  console.log("personA retirement: " + calcYear.tablePersonAannualRetirementBenefit)
                  console.log("personB retirement: " + calcYear.tablePersonBannualRetirementBenefit)
                  console.log("personA spousal: " + calcYear.tablePersonAannualSpousalBenefit)
                  console.log("personB spousal: " + calcYear.tablePersonBannualSpousalBenefit)
                  console.log("personA survivor: " + calcYear.tablePersonAannualSurvivorBenefit)
                  console.log("personB survivor: " + calcYear.tablePersonBannualSurvivorBenefit)
                  console.log("undiscounted annualPV: " + annualPV)
                }

            //Discount that probability-weighted annual benefit amount to age 62
                //Find which spouse is older, because we're discounting back to date on which older spouse is age 62.
                let olderAge: number
                if (personA.age > personB.age) {
                  olderAge = personA.age
                } else {olderAge = personB.age}
                //Here is where actual discounting happens. Discounting by half a year, because we assume all benefits received mid-year. Then discounting for any additional years needed to get back to PV at 62.
                annualPV = annualPV / (1 + scenario.discountRate/100/2) / Math.pow((1 + scenario.discountRate/100),(olderAge - 62))

                if (printOutputTable === true){
                  console.log("discounted annual PV: "+ annualPV)
                }

            //Add discounted benefit to ongoing sum
              couplePV = couplePV + annualPV

            //increment personA and personB ages by 1 year
              personA.age = personA.age + 1
              personB.age = personB.age + 1
      }
      //increment month by 1 and create new CalculationYear object if it's now January
      calcYear.date.setMonth(calcYear.date.getMonth()+1)
      if (calcYear.date.getMonth() == 0){
      calcYear = new CalculationYear(calcYear.date)
      }
    }
    return couplePV
  }

  calculateCouplePV(personA:Person, personB:Person, scenario:CalculationScenario, printOutputTable:boolean) : number{
    
    //Assorted variables
    let probabilityAalive: number
    let probabilityBalive: number
    let couplePV: number = 0
    let earningsTestResult:any[]

    //reset values for new PV calc
        personA.hasHadGraceYear = false
        personB.hasHadGraceYear = false
        personA.adjustedRetirementBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
        personA.adjustedSpousalBenefitDate = new MonthYearDate(personA.spousalBenefitDate)
        personB.adjustedRetirementBenefitDate = new MonthYearDate(personB.retirementBenefitDate)
        personB.adjustedSpousalBenefitDate = new MonthYearDate(personB.spousalBenefitDate)
        personA.retirementBenefitWithDRCsfromSuspension = 0
        personA.spousalBenefitWithSuspensionDRCRetirement = 0
        personA.survivorBenefitWithSuspensionDRCRetirement = 0
        personA.DRCsViaSuspension = 0
        personB.retirementBenefitWithDRCsfromSuspension = 0
        personB.DRCsViaSuspension = 0
        personB.spousalBenefitWithSuspensionDRCRetirement = 0
        personB.survivorBenefitWithSuspensionDRCRetirement = 0
        scenario.outputTable = []

    //Find Jan 1 of initial calcYear (year in which first person turns 62)
    let calcYear:CalculationYear = new CalculationYear(scenario.initialCalcDate)


    //Find age of each spouse as of that Jan 1
    personA.age = ( calcYear.date.getMonth() - personA.SSbirthDate.getMonth() + 12 * (calcYear.date.getFullYear() - personA.SSbirthDate.getFullYear()) )/12
    personB.age = ( calcYear.date.getMonth() - personB.SSbirthDate.getMonth() + 12 * (calcYear.date.getFullYear() - personB.SSbirthDate.getFullYear()) )/12


    //Calculate monthly benefit amounts, pre-ARF
    personA.initialRetirementBenefit = this.benefitService.calculateRetirementBenefit(personA, personA.retirementBenefitDate)
    personB.initialRetirementBenefit = this.benefitService.calculateRetirementBenefit(personB, personB.retirementBenefitDate)
    personA.spousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personA, personB, 0, personA.spousalBenefitDate)
    personA.spousalBenefitWithRetirementPreARF = this.benefitService.calculateSpousalBenefit(personA, personB, personA.initialRetirementBenefit, personA.spousalBenefitDate)
    personB.spousalBenefitWithoutRetirement = this.benefitService.calculateSpousalBenefit(personB, personA, 0, personB.spousalBenefitDate)
    personB.spousalBenefitWithRetirementPreARF = this.benefitService.calculateSpousalBenefit(personB, personA, personB.initialRetirementBenefit, personB.spousalBenefitDate)
    personA.survivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personA, 0, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
    personA.survivorBenefitWithRetirementPreARF = this.benefitService.calculateSurvivorBenefit(personA, personA.initialRetirementBenefit, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
    personB.survivorBenefitWithoutRetirement = this.benefitService.calculateSurvivorBenefit(personB, 0, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
    personB.survivorBenefitWithRetirementPreARF = this.benefitService.calculateSurvivorBenefit(personB, personB.initialRetirementBenefit, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)



    //Calculate PV via loop until both spouses are at least age 115 (by which point "remaining lives" is zero)
    while (personA.age < 115 || personB.age < 115){

      //count number of months in this year for which each type of benefit will be received 
        let countCoupleBenefitMonthsResult:any[] = this.benefitService.CountCoupleBenefitMonths(scenario, calcYear, personA, personB)
        calcYear = countCoupleBenefitMonthsResult[0]
        personA = countCoupleBenefitMonthsResult[1]
        personB = countCoupleBenefitMonthsResult[2]


      //Earnings test        
      if (earningsTestResult === undefined || calcYear.date.getFullYear() <= personA.FRA.getFullYear() || calcYear.date.getFullYear() <= personB.FRA.getFullYear()){//Only have to run earnings test if it's before FRA or if it has never been run (has to be run once for after-ARF values to be calc'd)
        earningsTestResult = this.earningsTestService.earningsTestCouple(calcYear, scenario, personA, personB)
        calcYear = earningsTestResult[0]
        personA = earningsTestResult[1]
        personB = earningsTestResult[2]
      }
    
      //Calculate retirementBenefit with DRCs from suspension as well as new spousal/survivor benefits accounting for larger retirement benefit.
      //Have to do this any time either person hits FRA or endSuspensionDate. Also have to do it in initial calcYear in case person's FRA and endSuspensionDate are already in the past
      if (calcYear.date.getFullYear() == scenario.initialCalcDate.getFullYear() ||
          calcYear.date.getFullYear() == personA.FRA.getFullYear() || calcYear.date.getFullYear() == personB.FRA.getFullYear() ||
          calcYear.date.getFullYear() == personA.endSuspensionDate.getFullYear() || calcYear.date.getFullYear() == personB.endSuspensionDate.getFullYear()) {
        personA.retirementBenefitWithDRCsfromSuspension = this.benefitService.calculateRetirementBenefit(personA, personA.adjustedRetirementBenefitDate)
        personB.retirementBenefitWithDRCsfromSuspension = this.benefitService.calculateRetirementBenefit(personB, personB.adjustedRetirementBenefitDate)
        personA.spousalBenefitWithSuspensionDRCRetirement = this.benefitService.calculateSpousalBenefit(personA, personB, personA.retirementBenefitWithDRCsfromSuspension, personA.spousalBenefitDate)
        personB.spousalBenefitWithSuspensionDRCRetirement = this.benefitService.calculateSpousalBenefit(personB, personA, personB.retirementBenefitWithDRCsfromSuspension, personB.spousalBenefitDate)
        personA.survivorBenefitWithSuspensionDRCRetirement = this.benefitService.calculateSurvivorBenefit(personA, personA.retirementBenefitWithDRCsfromSuspension, personA.survivorFRA, personB, personB.retirementBenefitDate, personB.retirementBenefitDate)
        personB.survivorBenefitWithSuspensionDRCRetirement = this.benefitService.calculateSurvivorBenefit(personB, personB.retirementBenefitWithDRCsfromSuspension, personB.survivorFRA, personA, personA.retirementBenefitDate, personA.retirementBenefitDate)
      }

      //Calculate annual benefits, accounting for Adjustment Reduction Factor in years beginning at FRA
      calcYear = this.benefitService.calculateAnnualBenefitAmountsCouple(personA, personB, calcYear, printOutputTable)

      //If user is divorced, we don't actually want to include the ex-spouse's benefit amounts in our PV sum
      if (scenario.maritalStatus == "divorced") {
        calcYear.tablePersonBannualRetirementBenefit = 0
        calcYear.tablePersonBannualSpousalBenefit = 0
        calcYear.tablePersonBannualSurvivorBenefit = 0
      }

      //adjust annualbenefit fields on calcYear object for future benefit cuts, if so desired
      if (scenario.benefitCutAssumption === true) {calcYear = this.adjustBenefitsForAssumedCut(calcYear, scenario)}

      //generate row for outputTable if necessary
        if (printOutputTable === true) {
          if (scenario.maritalStatus == "married") {scenario = this.outputTableService.generateOutputTableCouple(personA, personB, scenario, calcYear)}
          else if (scenario.maritalStatus == "divorced") {scenario = this.outputTableService.generateOutputTableDivorced(personA, scenario, calcYear)}
        }

      //Calculate each person's probability of being alive at end of age in question
        probabilityAalive = this.mortalityService.calculateProbabilityAlive(personA, personA.age)
        probabilityBalive = this.mortalityService.calculateProbabilityAlive(personB, personB.age)

      //Find total probability-weighted annual benefit
        let annualPV = 
        (probabilityAalive * (1-probabilityBalive) * (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSurvivorBenefit)) //Scenario where A is alive, B is deceased
        + (probabilityBalive * (1-probabilityAalive) * (calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSurvivorBenefit)) //Scenario where B is alive, A is deceased
        + ((probabilityAalive * probabilityBalive) * (calcYear.tablePersonAannualRetirementBenefit + calcYear.tablePersonAannualSpousalBenefit + calcYear.tablePersonBannualRetirementBenefit + calcYear.tablePersonBannualSpousalBenefit)) //Scenario where both are alive

        if (printOutputTable === true){
          console.log("annual loop" + calcYear.date.getFullYear())
          console.log("personA retirement: " + calcYear.tablePersonAannualRetirementBenefit)
          console.log("personB retirement: " + calcYear.tablePersonBannualRetirementBenefit)
          console.log("personA spousal: " + calcYear.tablePersonAannualSpousalBenefit)
          console.log("personB spousal: " + calcYear.tablePersonBannualSpousalBenefit)
          console.log("personA survivor: " + calcYear.tablePersonAannualSurvivorBenefit)
          console.log("personB survivor: " + calcYear.tablePersonBannualSurvivorBenefit)
          console.log("undiscounted annualPV: " + annualPV)
        }

      //Discount that benefit
            //Find which spouse is older, because we're discounting back to date on which older spouse is age 62.
            let olderAge: number
            if (personA.age > personB.age) {
              olderAge = personA.age
            } else {olderAge = personB.age}
            //Here is where actual discounting happens. Discounting by half a year, because we assume all benefits received mid-year. Then discounting for any additional years needed to get back to PV at 62.
            annualPV = annualPV / (1 + scenario.discountRate/100/2) / Math.pow((1 + scenario.discountRate/100),(olderAge - 62))

            if (printOutputTable === true){
              console.log("discounted annual PV: "+ annualPV)
            }

      //Add discounted benefit to ongoing count of retirementPV, add 1 to each age, add 1 year to currentCalculationDate, and start loop over
        couplePV = couplePV + annualPV
        personA.age = personA.age + 1
        personB.age = personB.age + 1
        //calcYear.date.setFullYear(calcYear.date.getFullYear()+1)
        let newCalcDate:MonthYearDate = new MonthYearDate(calcYear.date.getFullYear()+1, 0, 1)
        calcYear = new CalculationYear(newCalcDate)
    }

    return couplePV
  }



  maximizeSinglePersonPV(person:Person, scenario:CalculationScenario) : SolutionSet{

    //find initial testClaimingDate for age 62
    person.retirementBenefitDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth(), 1)
    if (person.actualBirthDate.getDate() > 2){
      person.retirementBenefitDate.setMonth(person.retirementBenefitDate.getMonth()+1)
    }

    //If user is currently over age 62 when filling out form, set testClaimingDate to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
    let ageToday = this.today.getFullYear() - person.SSbirthDate.getFullYear() + (this.today.getMonth() - person.SSbirthDate.getMonth())/12
    if (ageToday > 62){
      person.retirementBenefitDate.setMonth(this.today.getMonth())
      person.retirementBenefitDate.setFullYear(this.today.getFullYear())
    }

    //If user is currently beyond FRA when filling out form, set testClaimingDate to earliest retroactive date (6 months ago but no earlier than FRA)
    if (this.today > person.FRA){
      person.retirementBenefitDate.setMonth(this.today.getMonth()-6)
      if (person.retirementBenefitDate < person.FRA){
        person.retirementBenefitDate.setMonth(person.FRA.getMonth())
        person.retirementBenefitDate.setFullYear(person.FRA.getFullYear())
      }
    }

    //If user has already filed or is on disability, initialize begin/end suspension dates as their FRA (but no earlier than this month), and set person's retirementBenefitDate using fixedRetirementBenefitDate field 
    if (person.isOnDisability === true || person.hasFiled === true) {
      if (this.today > person.FRA){
        person.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
        person.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
      }
      else {
        person.beginSuspensionDate = new MonthYearDate(person.FRA)
        person.endSuspensionDate = new MonthYearDate(person.FRA)
      }
      person.retirementBenefitDate = new MonthYearDate(person.fixedRetirementBenefitDate)
    }

    //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
    person = this.benefitService.calculateFamilyMaximum(person)

    //Run calculateSinglePersonPV for their earliest possible claiming date, save the PV and the date.
    let savedPV: number = this.calculateSinglePersonPV(person, scenario, false)
    let savedClaimingDate: MonthYearDate = new MonthYearDate(person.retirementBenefitDate)
    let savedBeginSuspensionDate: MonthYearDate = new MonthYearDate(person.beginSuspensionDate)
    let savedEndSuspensionDate: MonthYearDate = new MonthYearDate(person.endSuspensionDate)

    //Set endingTestDate equal to the month before they turn 70 (because loop starts with adding a month and then testing new values)
    let endingTestDate = new MonthYearDate(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth()-1, 1)
    while (person.retirementBenefitDate <= endingTestDate && person.endSuspensionDate <= endingTestDate){
      //Increment claiming date (or suspension date) and run both calculations again and compare results. Save better of the two. (If they're literally the same, save the second one tested, because it gives better longevity insurance)
      person = this.incrementRetirementORendSuspensionDate(person, scenario)
      let currentTestPV = this.calculateSinglePersonPV(person, scenario, false)
      if (currentTestPV >= savedPV){
          savedPV = currentTestPV
          savedClaimingDate = new MonthYearDate(person.retirementBenefitDate)
          savedBeginSuspensionDate = new MonthYearDate(person.beginSuspensionDate)
          savedEndSuspensionDate = new MonthYearDate(person.endSuspensionDate)
      }
    }

    //after loop is finished, set Person's retirementBenefitDate and suspension dates to the saved dates, for sake of running PV calc again for outputTable
    person.retirementBenefitDate = new MonthYearDate(savedClaimingDate)
    person.beginSuspensionDate = new MonthYearDate(savedBeginSuspensionDate)
    person.endSuspensionDate = new MonthYearDate(savedEndSuspensionDate)
    let outputTablePVcalc: number = this.calculateSinglePersonPV(person, scenario, true)

    //Generate solution set (for sake of output) from saved values
    let solutionSet:SolutionSet = this.solutionSetService.generateSingleSolutionSet(scenario, person, Number(savedPV))

    console.log(solutionSet)

    return solutionSet
  }


  maximizeCouplePViterateBothPeople(personA:Person, personB:Person, scenario:CalculationScenario) : SolutionSet{

    //find initial retirementBenefitDate for personA (first month for which they are considered 62 for entire month)
    personA.retirementBenefitDate = new MonthYearDate(personA.actualBirthDate.getFullYear()+62, personA.actualBirthDate.getMonth(), 1)
    if (personA.actualBirthDate.getDate() > 2){
      personA.retirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+1)
    }
    //If personA is currently over age 62 when filling out form, adjust their initial retirementBenefitDate to today's month/year instead of their age 62 month/year.
    let spouseAageToday: number = this.today.getFullYear() - personA.SSbirthDate.getFullYear() + (this.today.getMonth() - personA.SSbirthDate.getMonth()) /12
    if (spouseAageToday > 62){
      personA.retirementBenefitDate.setMonth(this.today.getMonth())
      personA.retirementBenefitDate.setFullYear(this.today.getFullYear())
    }
    //Do all of the same, but for personB.
    personB.retirementBenefitDate = new MonthYearDate(personB.actualBirthDate.getFullYear()+62, personB.actualBirthDate.getMonth(), 1)
    if (personB.actualBirthDate.getDate() > 2){
      personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
    }
    let spouseBageToday: number = this.today.getFullYear() - personB.SSbirthDate.getFullYear() + (this.today.getMonth() - personB.SSbirthDate.getMonth()) /12
    if (spouseBageToday > 62){
      personB.retirementBenefitDate.setMonth(this.today.getMonth())
      personB.retirementBenefitDate.setFullYear(this.today.getFullYear())
    }

    //If either person has already filed or is on disability, initialize that person's begin&end suspension date as their FRA (but no earlier than this month), and set that person's retirementBenefitDate using fixedRetirementBenefitDate field 
    if (personA.isOnDisability === true || personA.hasFiled === true) {
      if (this.today > personA.FRA){
        personA.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
        personA.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
      }
      else {
        personA.beginSuspensionDate = new MonthYearDate(personA.FRA)
        personA.endSuspensionDate = new MonthYearDate(personA.FRA)
      }
      personA.retirementBenefitDate = new MonthYearDate(personA.fixedRetirementBenefitDate)
    }
    if (personB.isOnDisability === true || personB.hasFiled === true) {
      if (this.today > personB.FRA){
        personB.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
        personB.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
      }
      else {
        personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
        personB.endSuspensionDate = new MonthYearDate(personB.FRA)
      }
      personB.retirementBenefitDate = new MonthYearDate(personB.fixedRetirementBenefitDate)
    }

    //Set initial spousalBenefitDates based on initial retirementBenefitDates
    personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
    personB = this.adjustSpousalBenefitDate(personB, personA, scenario)

    //Initialize savedPV as zero. Save various initial test dates.
      let savedPV: number = 0
      let personAsavedRetirementDate = new MonthYearDate(personA.retirementBenefitDate)
      let personBsavedRetirementDate = new MonthYearDate(personB.retirementBenefitDate)
      let personAsavedSpousalDate = new MonthYearDate(personA.spousalBenefitDate)
      let personBsavedSpousalDate = new MonthYearDate(personB.spousalBenefitDate)
      let personAsavedBeginSuspensionDate = new MonthYearDate(personA.beginSuspensionDate)
      let personBsavedBeginSuspensionDate = new MonthYearDate(personB.beginSuspensionDate)
      let personAsavedEndSuspensionDate = new MonthYearDate(personA.endSuspensionDate)
      let personBsavedEndSuspensionDate = new MonthYearDate(personB.endSuspensionDate)

    //Set endingTestDate for each spouse equal to the month they turn 70. Or if using fixed-death-age-assumption younger than 70, set to assumed month of death
    let spouseAendTestDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+70, personA.SSbirthDate.getMonth(), 1)
    let spouseBendTestDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+70, personB.SSbirthDate.getMonth(), 1)
    if (personA.mortalityTable[70] == 0) {
      let deceasedByAge:number = personA.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69. But we want last possible filing date suggested to be 68, so we subtract 1 in following line.
      spouseAendTestDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+deceasedByAge-1, personA.SSbirthDate.getMonth(), 1)
    }
    if (personB.mortalityTable[70] == 0) {
      let deceasedByAge:number = personB.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69
      spouseBendTestDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+deceasedByAge-1, personB.SSbirthDate.getMonth(), 1)
    }

    //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
    personA = this.benefitService.calculateFamilyMaximum(personA)
    personB = this.benefitService.calculateFamilyMaximum(personB)

    while (personA.retirementBenefitDate <= spouseAendTestDate && personA.endSuspensionDate <= spouseAendTestDate) {
        //Reset personB.retirementBenefitDate to earliest possible (i.e., their "age 62 for whole month" month or today's month if they're currently older than 62)
        if (spouseBageToday > 62){
          personB.retirementBenefitDate.setMonth(this.today.getMonth())
          personB.retirementBenefitDate.setFullYear(this.today.getFullYear())
        } else {
          personB.retirementBenefitDate = new MonthYearDate(personB.actualBirthDate.getFullYear()+62, personB.actualBirthDate.getMonth(), 1)
          if (personB.actualBirthDate.getDate() > 2){
            personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
          }
        }
        //If personB is disabled or already filed, reset suspension begin/end dates, and set retirementBenefitDate using fixedRetirementBenefitDate field
          if (personB.isOnDisability === true || personB.hasFiled === true) {
            if (this.today > personB.FRA){
              personB.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
              personB.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
            }
            else {
              personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
              personB.endSuspensionDate = new MonthYearDate(personB.FRA)
            }
            personB.retirementBenefitDate = new MonthYearDate(personB.fixedRetirementBenefitDate)
          }

        //After personB's retirement testdate has been reset, reset spousal dates as necessary for personA and personB
          personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
          personB = this.adjustSpousalBenefitDate(personB, personA, scenario)

        while (personB.retirementBenefitDate <= spouseBendTestDate && personB.endSuspensionDate <= spouseBendTestDate) {
          //Calculate PV using current testDates
            let currentTestPV: number = this.calculateCouplePV(personA, personB, scenario, false)
            //If PV is greater than saved PV, save new PV and save new testDates.
            if (currentTestPV >= savedPV) {
              savedPV = currentTestPV
              personAsavedRetirementDate = new MonthYearDate(personA.retirementBenefitDate)
              personBsavedRetirementDate = new MonthYearDate(personB.retirementBenefitDate)
              personAsavedSpousalDate = new MonthYearDate(personA.spousalBenefitDate)
              personBsavedSpousalDate = new MonthYearDate(personB.spousalBenefitDate)
              personAsavedBeginSuspensionDate = new MonthYearDate(personA.beginSuspensionDate)
              personBsavedBeginSuspensionDate = new MonthYearDate(personB.beginSuspensionDate)
              personAsavedEndSuspensionDate = new MonthYearDate(personA.endSuspensionDate)
              personBsavedEndSuspensionDate = new MonthYearDate(personB.endSuspensionDate)
              }

          //Find next possible claiming combination for spouseB
            personB = this.incrementRetirementORendSuspensionDate(personB, scenario)
            personB = this.adjustSpousalBenefitDate(personB, personA, scenario)

          //After personB's retirement/spousal dates have been incremented, adjust personA's spousal date as necessary
            personA = this.adjustSpousalBenefitDate(personA, personB, scenario)

        }
        //Increment personA's retirementBenefitDate
          personA = this.incrementRetirementORendSuspensionDate(personA, scenario)
        
      }
    //after loop is finished, set person objects' benefit dates to the saved dates, for sake of running PV calc again for outputTable
      personA.retirementBenefitDate = new MonthYearDate(personAsavedRetirementDate)
      personA.spousalBenefitDate = new MonthYearDate(personAsavedSpousalDate)
      personA.beginSuspensionDate = new MonthYearDate(personAsavedBeginSuspensionDate)
      personA.endSuspensionDate = new MonthYearDate(personAsavedEndSuspensionDate)
      personB.retirementBenefitDate = new MonthYearDate(personBsavedRetirementDate)
      personB.spousalBenefitDate = new MonthYearDate(personBsavedSpousalDate)
      personB.beginSuspensionDate = new MonthYearDate(personBsavedBeginSuspensionDate)
      personB.endSuspensionDate = new MonthYearDate(personBsavedEndSuspensionDate)

      let outputTablePVcalc: number = this.calculateCouplePV(personA, personB, scenario, true)

      //Generate solution set (for sake of output) from saved values
      let solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, personA, personB, Number(savedPV))
      
      console.log(solutionSet)

      return solutionSet
  }


//This function is for when one spouse is over 70 (and therefore has no retirement age or suspension age to iterate).
//Also is the function for a divorcee, because we take the ex-spouse's filing date as a given (i.e., as an input)
maximizeCouplePViterateOnePerson(scenario:CalculationScenario, flexibleSpouse:Person, fixedSpouse:Person) : SolutionSet{

    fixedSpouse.retirementBenefitDate = new MonthYearDate(fixedSpouse.fixedRetirementBenefitDate)

    //find initial retirementBenefitDate for flexibleSpouse (first month for which flexibleSpouse is considered 62 for entire month)
    flexibleSpouse.retirementBenefitDate = new MonthYearDate(flexibleSpouse.actualBirthDate.getFullYear()+62, flexibleSpouse.actualBirthDate.getMonth(), 1)
    if (flexibleSpouse.actualBirthDate.getDate() > 2){
      flexibleSpouse.retirementBenefitDate.setMonth(flexibleSpouse.retirementBenefitDate.getMonth()+1)
    }
    //If flexibleSpouse is currently over age 62 when filling out form, adjust their initial retirementBenefitDate to today's month/year instead of their age 62 month/year.
    let flexibleSpouseAgeToday: number = this.today.getFullYear() - flexibleSpouse.SSbirthDate.getFullYear() + (this.today.getMonth() - flexibleSpouse.SSbirthDate.getMonth()) /12
    if (flexibleSpouseAgeToday > 62){
      flexibleSpouse.retirementBenefitDate.setMonth(this.today.getMonth())
      flexibleSpouse.retirementBenefitDate.setFullYear(this.today.getFullYear())
    }

    //If flexibleSpouse has already filed or is on disability, initialize their begin&end suspension date as their FRA (but no earlier than this month). And set retirementBenefitDate to fixedRetirementBenefitDate
    if (flexibleSpouse.isOnDisability === true || flexibleSpouse.hasFiled === true) {
      if (this.today > flexibleSpouse.FRA){
        flexibleSpouse.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
        flexibleSpouse.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
      }
      else {
        flexibleSpouse.beginSuspensionDate = new MonthYearDate(flexibleSpouse.FRA)
        flexibleSpouse.endSuspensionDate = new MonthYearDate(flexibleSpouse.FRA)
      }
      flexibleSpouse.retirementBenefitDate = new MonthYearDate(flexibleSpouse.fixedRetirementBenefitDate)
    }

    //Set initial spousalBenefitDate for flexibleSpouse and fixed spouse
      flexibleSpouse = this.adjustSpousalBenefitDate(flexibleSpouse, fixedSpouse, scenario)
      fixedSpouse = this.adjustSpousalBenefitDate(fixedSpouse, flexibleSpouse, scenario)


    //Initialize savedPV as zero. Set saved dates equal to their current testDates.
    let savedPV: number = 0
    let flexibleSpouseSavedRetirementDate = new MonthYearDate(flexibleSpouse.retirementBenefitDate)
    let flexibleSpouseSavedSpousalDate = new MonthYearDate(flexibleSpouse.spousalBenefitDate)
    let flexibleSpouseSavedBeginSuspensionDate = new MonthYearDate(flexibleSpouse.beginSuspensionDate)
    let flexibleSpouseSavedEndSuspensionDate = new MonthYearDate(flexibleSpouse.endSuspensionDate)
    let fixedSpouseSavedSpousalDate: MonthYearDate = new MonthYearDate(fixedSpouse.spousalBenefitDate)

    //Set endTestDate equal to the month flexibleSpouse turns 70. Or, if flexible spouse chose a fixed-death-age assumption younger than age 70, set ending test date to that fixed death age.
    let endTestDate = new MonthYearDate(flexibleSpouse.SSbirthDate.getFullYear()+70, flexibleSpouse.SSbirthDate.getMonth(), 1)
    if (flexibleSpouse.mortalityTable[70] == 0) {
      let deceasedByAge:number = flexibleSpouse.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69. But we want last possible filing date suggested to be 68, so we subtract 1 in following line.
      endTestDate = new MonthYearDate(flexibleSpouse.SSbirthDate.getFullYear()+deceasedByAge-1, flexibleSpouse.SSbirthDate.getMonth(), 1)
    }

    //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
      flexibleSpouse = this.benefitService.calculateFamilyMaximum(flexibleSpouse)
      fixedSpouse = this.benefitService.calculateFamilyMaximum(fixedSpouse)

    while (flexibleSpouse.retirementBenefitDate <= endTestDate && flexibleSpouse.endSuspensionDate <= endTestDate) {
      //Calculate PV using current test dates for flexibleSpouse and fixed dates for fixedSpouse
      if (flexibleSpouse.id == "A"){
        var currentTestPV: number = this.calculateCouplePV(flexibleSpouse, fixedSpouse, scenario, false)
      }
      else {
        var currentTestPV: number = this.calculateCouplePV(fixedSpouse, flexibleSpouse, scenario, false)
      }

      //If PV is greater than or equal to saved PV, save new PV and save new testDates
      if (currentTestPV >= savedPV) {
        savedPV = currentTestPV
        flexibleSpouseSavedRetirementDate = new MonthYearDate(flexibleSpouse.retirementBenefitDate)
        flexibleSpouseSavedSpousalDate = new MonthYearDate(flexibleSpouse.spousalBenefitDate)
        flexibleSpouseSavedBeginSuspensionDate = new MonthYearDate(flexibleSpouse.beginSuspensionDate)
        flexibleSpouseSavedEndSuspensionDate = new MonthYearDate(flexibleSpouse.endSuspensionDate)
        fixedSpouseSavedSpousalDate = new MonthYearDate(fixedSpouse.spousalBenefitDate)
        }
      
      //Increment flexibleSpouse's dates (and fixedSpouse's spousal date, which is usually just set to be same as flexible spouse's retirement date)
        flexibleSpouse = this.incrementRetirementORendSuspensionDate(flexibleSpouse, scenario)
        flexibleSpouse = this.adjustSpousalBenefitDate(flexibleSpouse, fixedSpouse, scenario)
        fixedSpouse = this.adjustSpousalBenefitDate(fixedSpouse, flexibleSpouse, scenario)

    }

      //after loop is finished, set person objects' benefit dates to the saved dates, for sake of running PV calc again for outputTable
      flexibleSpouse.retirementBenefitDate = new MonthYearDate(flexibleSpouseSavedRetirementDate)
      flexibleSpouse.spousalBenefitDate = new MonthYearDate(flexibleSpouseSavedSpousalDate)
      flexibleSpouse.beginSuspensionDate = new MonthYearDate(flexibleSpouseSavedBeginSuspensionDate)
      flexibleSpouse.endSuspensionDate = new MonthYearDate(flexibleSpouseSavedEndSuspensionDate)
      fixedSpouse.spousalBenefitDate = new MonthYearDate(fixedSpouseSavedSpousalDate)
      if (flexibleSpouse.id == "A"){
      let outputTablePVcalc: number = this.calculateCouplePV(flexibleSpouse, fixedSpouse, scenario, true)
      }
      else {
      let outputTablePVcalc: number = this.calculateCouplePV(fixedSpouse, flexibleSpouse, scenario, true)
      }
  
      //generate solutionSet
      if (flexibleSpouse.id == "A"){
        var solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, flexibleSpouse, fixedSpouse, Number(savedPV))
      }
      else {
        var solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, fixedSpouse, flexibleSpouse, Number(savedPV))
      }

      console.log(solutionSet)
      return solutionSet
  }

  //Adjusts spousal date as necessary. Is used after new retirement date is selected for either person.
  adjustSpousalBenefitDate(person:Person, otherPerson:Person, scenario:CalculationScenario) : Person {
    let deemedFilingCutoff: Date = new Date(1954, 0, 1)
    let otherPersonsLimitingDate: MonthYearDate

    //Determine "otherPerson's Limiting Date" (i.e., the date -- based on otherPerson -- before which "Person" cannot file a spousal benefit)
    if (scenario.maritalStatus == "married") {
      otherPersonsLimitingDate = otherPerson.retirementBenefitDate
    }
    if (scenario.maritalStatus == "divorced"){//If divorced, otherPersonsLimitingDate is first month for which otherPerson is age 62 all month
      otherPersonsLimitingDate = new MonthYearDate(otherPerson.actualBirthDate.getFullYear()+62, otherPerson.actualBirthDate.getMonth(), 1)
      if (otherPerson.actualBirthDate.getDate() > 2) {
        otherPersonsLimitingDate.setMonth(otherPersonsLimitingDate.getMonth()+1)
      }
    }
    if (otherPerson.isOnDisability === true){//If otherPerson is disabled, there is no "otherPersonsLimitingDate." So just make this own "age 62 all month" month
    //Also, this check has to come last since it overrides others.
      otherPersonsLimitingDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth(), 1)
      if (person.actualBirthDate.getDate() > 2){
        otherPersonsLimitingDate.setMonth(otherPersonsLimitingDate.getMonth()+1)
      }
    }

    if (person.actualBirthDate > deemedFilingCutoff) {//i.e., if person has new deemed filing rules
      //set spousalBenefitDate to own retirementBenefitDate, but no earlier than otherPersonsLimitingDate
      if (person.retirementBenefitDate > otherPersonsLimitingDate) {
        person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
      } else {
        person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
      }
    }
    else {//i.e., if person has old deemed filing rules
      if (person.retirementBenefitDate < person.FRA) {
        //set spousalBenefitDate to own retirementBenefitDate, but no earlier than otherPersonsLimitingDate
        if (person.retirementBenefitDate > otherPersonsLimitingDate) {
          person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
        } else {
          person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
        }
      }
      else {//i.e., if person's retirementBenefitDate currently after his/her FRA
        //Set person's spousalBenefitlDate to earliest possible restricted application date (i.e., later of FRA or otherPersonsLimitingDate)
        if (person.FRA > otherPersonsLimitingDate) {
          person.spousalBenefitDate = new MonthYearDate(person.FRA)
        } else {
          person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
        }
      }
    }

    //Don't let spousalBenefitDate be earlier than this month unless "person" has already filed for spousal benefits -- that is, unless (person is older than 70 or person has filed) AND (otherPerson is over 70, otherPerson has filed, or otherPerson is on disability)
    if (  (person.initialAge >= 70 || person.hasFiled === true) && (otherPerson.initialAge >= 70 || otherPerson.hasFiled === true || otherPerson.isOnDisability === true)  ){
      //don't check whether spousalBenefitDate is in the past
    }
    else if (person.spousalBenefitDate < this.today){
      person.spousalBenefitDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth(), 1)
    }
    
    return person
  }

  incrementRetirementORendSuspensionDate(person:Person, scenario:CalculationScenario) : Person {
    if (person.isOnDisability === true) {
      person.endSuspensionDate.setMonth(person.endSuspensionDate.getMonth()+1)
    }
    else if (person.hasFiled === true){
      person.endSuspensionDate.setMonth(person.endSuspensionDate.getMonth()+1)
    }
    else {//i.e., person hasn't filed and isn't disabled
    person.retirementBenefitDate.setMonth(person.retirementBenefitDate.getMonth()+1)
  }
    return person
  }

  adjustBenefitsForAssumedCut(calcYear:CalculationYear, scenario:CalculationScenario){
      if (calcYear.date.getFullYear() >= scenario.benefitCutYear) {
        calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit * (1 - scenario.benefitCutPercentage/100)
        calcYear.tablePersonAannualSpousalBenefit = calcYear.tablePersonAannualSpousalBenefit * (1 - scenario.benefitCutPercentage/100)
        calcYear.tablePersonAannualSurvivorBenefit = calcYear.tablePersonAannualSurvivorBenefit * (1 - scenario.benefitCutPercentage/100)
        calcYear.tablePersonBannualRetirementBenefit = calcYear.tablePersonBannualRetirementBenefit * (1 - scenario.benefitCutPercentage/100)
        calcYear.tablePersonBannualSpousalBenefit = calcYear.tablePersonBannualSpousalBenefit * (1 - scenario.benefitCutPercentage/100)
        calcYear.tablePersonBannualSurvivorBenefit = calcYear.tablePersonBannualSurvivorBenefit * (1 - scenario.benefitCutPercentage/100)
      }
    return calcYear
  }

  addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personAaliveBoolean:boolean, personB:Person, personBaliveBoolean:boolean, printOutputTable:Boolean){
      //if both parents alive, add monthlyPayment fields to annualBenefitBothAlive
        if (personAaliveBoolean === true && personBaliveBoolean === true){
          if (calcYear.date >= this.today || (personA.hasFiled === false && personA.isOnDisability === false) ){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
          calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive + personA.monthlyRetirementPayment + personA.monthlySpousalPayment
          }
          if (calcYear.date >= this.today || (personB.hasFiled === false && personB.isOnDisability === false) ){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
            if (scenario.maritalStatus == "married"){//only want to include personB's monthlyPayment fields in PV if married rather than divorced
              calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive + personB.monthlyRetirementPayment + personB.monthlySpousalPayment
            }
          }
          for (let child of scenario.children){
            if (calcYear.date >= this.today || child.hasFiled === false){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
              calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive + child.monthlyChildPayment
            }
          }
        }
      //if personA alive and personB deceased, add monthlyPayment fields to annualBenefitOnlyPersonAalive
        if (personAaliveBoolean === true && personBaliveBoolean === false){
          if (calcYear.date >= this.today){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
          calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + personA.monthlyRetirementPayment + personA.monthlySurvivorPayment
          }
          for (let child of scenario.children){
            if (calcYear.date >= this.today){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
              calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + child.monthlyChildPayment
            }
          }
        }
      //if personA deceased and personB alive, add monthlyPayment fields to annualBenefitOnlyPersonBalive
        if (personAaliveBoolean === false && personBaliveBoolean === true){
          if (calcYear.date >= this.today){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
            if (scenario.maritalStatus == "married"){//only want to include personB's monthlyPayment fields in PV if married rather than divorced
              calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + personB.monthlyRetirementPayment + personB.monthlySurvivorPayment
            }
          }
          for (let child of scenario.children){
            if (calcYear.date >= this.today){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
              calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + child.monthlyChildPayment
            }
          }
        }
      //if personA deceased and personB deceased, add monthlyPayment fields to annualBenefitBothDeceased
        if (personAaliveBoolean === false && personBaliveBoolean === false){
          for (let child of scenario.children){
            if (calcYear.date >= this.today){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
              calcYear.annualBenefitBothDeceased = calcYear.annualBenefitBothDeceased + child.monthlyChildPayment
            }
          }
        }

      //Add everybody's monthlyPayment fields to appropriate table sum for table output
      if (printOutputTable === true){
        if (personAaliveBoolean === true && personBaliveBoolean === true){
          calcYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit + personA.monthlyRetirementPayment
          calcYear.tablePersonAannualSpousalBenefit = calcYear.tablePersonAannualSpousalBenefit + personA.monthlySpousalPayment
          calcYear.tablePersonBannualRetirementBenefit = calcYear.tablePersonBannualRetirementBenefit + personB.monthlyRetirementPayment
          calcYear.tablePersonBannualSpousalBenefit = calcYear.tablePersonBannualSpousalBenefit + personB.monthlySpousalPayment
          for (let child of scenario.children){
            calcYear.tableTotalAnnualChildBenefitsBothParentsAlive = calcYear.tableTotalAnnualChildBenefitsBothParentsAlive + child.monthlyChildPayment
          }
        }
        if (personAaliveBoolean === true && personBaliveBoolean === false){
          calcYear.tablePersonAannualSurvivorBenefit = calcYear.tablePersonAannualSurvivorBenefit + personA.monthlySurvivorPayment
          for (let child of scenario.children){
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive = calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive + child.monthlyChildPayment
          }
        }
        if (personAaliveBoolean === false && personBaliveBoolean === true){
          calcYear.tablePersonBannualSurvivorBenefit = calcYear.tablePersonBannualSurvivorBenefit + personB.monthlySurvivorPayment
          for (let child of scenario.children){
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive = calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive + child.monthlyChildPayment
          }
        }
        if (personAaliveBoolean === false && personBaliveBoolean === false){
          for (let child of scenario.children){
            calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased = calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased + child.monthlyChildPayment
          }
        }
      }
  }
}
