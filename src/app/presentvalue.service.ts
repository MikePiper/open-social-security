import {Injectable} from '@angular/core'
import {BenefitService} from './benefit.service'
import {MortalityService} from './mortality.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {SolutionSet} from './data model classes/solutionset'
import {Range} from './data model classes/range'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {CalculationYear} from './data model classes/calculationyear'
import {OutputTableService} from './outputtable.service'
import {MonthYearDate} from "./data model classes/monthyearDate"
import {FamilyMaximumService} from './familymaximum.service'
import {BirthdayService} from './birthday.service'
import { ClaimStrategy } from './data model classes/claimStrategy'


@Injectable()
export class PresentValueService {

  constructor(private birthdayService:BirthdayService, private benefitService: BenefitService, private mortalityService:MortalityService, private earningsTestService: EarningsTestService, private familyMaximumService:FamilyMaximumService,
    private solutionSetService: SolutionSetService, private outputTableService: OutputTableService) { }

  today: MonthYearDate = new MonthYearDate()

  calculateSinglePersonPV(person:Person, scenario:CalculationScenario, printOutputTable:boolean) : ClaimStrategy{
    //Create ClaimStrategy object for saving PVs
    let claimStrategy:ClaimStrategy = new ClaimStrategy(person)
    //reset values for new PV calc
      claimStrategy.PV = 0
      claimStrategy.pvNoCut = 0
      claimStrategy.outputTable = []
      person.hasHadGraceYear = false
      person.adjustedRetirementBenefitDate = new MonthYearDate(person.retirementBenefitDate)
      person.DRCsViaSuspension = 0
      person.retirementARFcreditingMonths = 0
      this.benefitService.checkWhichPIAtoUse(person, this.today)//checks whether person is *entitled* to gov pension (by checking eligible and pension beginning date) and sets PIA accordingly based on one of two PIA inputs
      //If person is on disability, have to recalculate disability family max at start of each PV calc (because in prior PV calc, at their FRA their family max was recalculated using retirement family max rules)
      if (person.isOnDisability === true){person = this.familyMaximumService.calculateFamilyMaximum(person, this.today)}

      // values used to provide results for both cut and noCut scenarios
      if (scenario.benefitCutAssumption) {
        scenario.setBenefitCutFactors();
      }

      //calculate initial retirement benefit
      person.retirementBenefit = this.benefitService.calculateRetirementBenefit(person, person.retirementBenefitDate)

    //Find childBenefitDate for any children
    for (let child of scenario.children){
      child.childBenefitDate = this.benefitService.determineChildBenefitDate(scenario, child, person)
    }

    //Create initial CalculationYear object
    let initialCalcDate:MonthYearDate = this.whenShouldPVcalculationStart(scenario, person)
    let calcYear:CalculationYear = new CalculationYear(initialCalcDate)

    //calculate age(s) as of that date
    person.age = this.birthdayService.findAgeOnDate(person, calcYear.date)
    for (let child of scenario.children){
      child.age = this.birthdayService.findAgeOnDate(child, calcYear.date)
    }

    let cutThisYear:boolean = (scenario.benefitCutAssumption === true) && (calcYear.date.getFullYear() >= scenario.benefitCutYear)
    
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
                scenario = this.familyMaximumService.applyFamilyMaximumSingle(scenario, amountLeftForRestOfFamiliy)
              }

            //Adjust as necessary for earnings test (and tally months withheld)
            if (person.quitWorkDate > this.today){
              this.earningsTestService.applyEarningsTestSingle(scenario, person, calcYear)
            }

            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitSinglePersonAlive for PV calc and appropriate table sum for table output)
            this.addMonthlyPaymentAmountsToApplicableSumsSingle(scenario, calcYear, person, true, printOutputTable)


      //Assume person is deceased
            //calculate monthlyPayment field for each person (sets child monthlyPayments to 75% of PIA if they are under 18 or disabled)
            this.benefitService.calculateMonthlyPaymentsSingle(scenario, calcYear, person, false)

            //adjust each person's monthlyPayment as necessary for family max
            if (scenario.children.length > 0){
              let amountLeftForRestOfFamiliy:number = person.familyMaximum
              scenario = this.familyMaximumService.applyFamilyMaximumSingle(scenario, amountLeftForRestOfFamiliy)
            }

            //Earnings test: not necessary in Single scenario if person is deceased

            //sum everybody's monthlyPayment fields and add that sum to appropriate annual total (annualBenefitPersonDeceased)
            this.addMonthlyPaymentAmountsToApplicableSumsSingle(scenario, calcYear, person, false, printOutputTable)


        //Increase everybody's age by 1/12
        for (let child of scenario.children){
          child.age = child.age + 1/12
        }
        person.age = person.age + 1/12

        //if it's December...
        if (calcYear.date.getMonth() == 11){
          //Add back any overwithholding from earnings test
            this.earningsTestService.addBackOverwithholding(calcYear, scenario)

          //Apply assumed benefit cut, if applicable
          if (cutThisYear) {
            this.benefitService.applyAssumedBenefitCut(scenario, calcYear)
          }

          //If printOutputTable is true, add row to output table.
            if (printOutputTable === true){
              claimStrategy = this.outputTableService.generateOutputTableSingle(person, claimStrategy, scenario, calcYear)
            }

          //Apply probability alive to annual benefit amounts
              //Calculate probability of being alive at end of age in question. (Have to use age-1 here because we want their age as of beginning of year.)
          let probabilityPersonAlive:number = this.mortalityService.calculateProbabilityAlive(scenario, person, person.age-1)
          calcYear.annualPV = calcYear.annualBenefitSinglePersonAlive * probabilityPersonAlive + calcYear.annualBenefitSinglePersonDeceased * (1 - probabilityPersonAlive)

          //Discount that probability-weighted annual benefit amount back to this year
          calcYear.annualPV = this.discountToPresentValue(scenario.discountRate, calcYear.annualPV, this.today.getFullYear(), calcYear.date.getFullYear())

          //Add discounted benefits to ongoing sums
          claimStrategy.PV += calcYear.annualPV;

          // for calculation of both cut and noCut PV's
          if (cutThisYear) {
            // PV has been adjusted this year
            // We need to de-adjust it for the noCut case
            claimStrategy.pvNoCut += (calcYear.annualPV * scenario.decutFactor);
          } else {
            claimStrategy.pvNoCut += calcYear.annualPV;
          }

          //increment month by 1 and create new CalculationYear object because it's now January
          // (we started these calculations with month === 11)
          calcYear.date.setMonth(calcYear.date.getMonth()+1)
          calcYear = new CalculationYear(calcYear.date)

          if (!cutThisYear) { //Check if there will be a cut this year. (But we don't need to check again if cutThisYear is already true.)
            cutThisYear = (scenario.benefitCutAssumption === true) && (calcYear.date.getFullYear() >= scenario.benefitCutYear)
          }

        } else {
          //increment month by 1.
          // It's not a new year - we got here because month is not 11
          calcYear.date.setMonth(calcYear.date.getMonth()+1)
        }
    }
        return claimStrategy
  }

  calculateCouplePV(personA:Person, personB:Person, scenario:CalculationScenario, printOutputTable:boolean) : ClaimStrategy{
    //Create ClaimStrategy object for saving PVs
    let claimStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
    //reset values for new PV calc
      claimStrategy.PV = 0
      claimStrategy.pvNoCut = 0
      claimStrategy.outputTable = []

    // cutFactor & pvNoCut are used to adjust annual benefits to provide results for both cut and nocut scenarios
    if (scenario.benefitCutAssumption) {
      scenario.setBenefitCutFactors();
    }
    let cutThisYear: boolean = (scenario.benefitCutAssumption === true) && (this.today.getFullYear() >= scenario.benefitCutYear)
  
    let savedCalculationYear: CalculationYear
    personA.hasHadGraceYear = false
    personB.hasHadGraceYear = false
    personA.retirementBenefit = 0
    personB.retirementBenefit = 0
    personA.adjustedRetirementBenefitDate = new MonthYearDate(personA.retirementBenefitDate)
    personA.adjustedSpousalBenefitDate = new MonthYearDate(personA.spousalBenefitDate)
    personB.adjustedRetirementBenefitDate = new MonthYearDate(personB.retirementBenefitDate)
    personB.adjustedSpousalBenefitDate = new MonthYearDate(personB.spousalBenefitDate)
    personA.DRCsViaSuspension = 0
    personB.DRCsViaSuspension = 0
    personA.retirementARFcreditingMonths = 0
    personA.spousalARFcreditingMonths = 0
    personB.retirementARFcreditingMonths = 0
    personB.spousalARFcreditingMonths = 0
    personA.entitledToRetirement = false
    personB.entitledToRetirement = false
    this.benefitService.checkWhichPIAtoUse(personA, this.today)//checks whether person is *entitled* to gov pension (by checking eligible and pension beginning date) and sets PIA accordingly based on one of two PIA inputs
    this.benefitService.checkWhichPIAtoUse(personB, this.today)


    //If person is on disability, have to recalculate disability family max at start of each PV calc (because in prior PV calc, at their FRA their family max was recalculated using retirement family max rules)
      if (personA.isOnDisability === true){personA = this.familyMaximumService.calculateFamilyMaximum(personA, this.today)}
      if (personB.isOnDisability === true){personB = this.familyMaximumService.calculateFamilyMaximum(personB, this.today)}

    //Determine whether anybody is suspending benefits at any time in this PV calc
      if (personA.beginSuspensionDate >= this.today){personA.suspendingBenefits = true}
      else {personA.suspendingBenefits = false}
      if (personB.beginSuspensionDate >= this.today){personB.suspendingBenefits = true}
      else {personB.suspendingBenefits = false}


    //calculate combined family maximum (We need to know "simultaneous entitlement year" so we can't do this in HomeComponent or maximize function. But can do it anywhere at beginning of PV calc.)
        //simultaneousentitlementyear is later of two retirementBenefitDates (simplification: ignoring the possibility of it being a child's DoB, which could happen if child is born AFTER both retirementBenefitDates)
          if (personA.retirementBenefitDate < personB.retirementBenefitDate){
            this.familyMaximumService.calculateCombinedFamilyMaximum(personA, personB, personB.retirementBenefitDate.getFullYear())
          }
          else {
            this.familyMaximumService.calculateCombinedFamilyMaximum(personA, personB, personA.retirementBenefitDate.getFullYear())
          }
      
    //Determine whether either person will be getting child-in-care spousal benefits
        if (scenario.children.length > 0){
          personA.childInCareSpousal = false
          personB.childInCareSpousal = false
          if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, personB.retirementBenefitDate) === true){
            //If there is no disabled child, and spousalBenefitDate is after FRA and after youngestchildturns16date, then automatic conversion (to regular spousal from child-in-care spousal) must not have occurred, which means they weren't on child-in-care spousal
            if (!(personA.spousalBenefitDate > personA.FRA && personA.spousalBenefitDate > scenario.youngestChildTurns16date && scenario.disabledChild === false)){
              personA.childInCareSpousal = true
            }
          }
          if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, personA.retirementBenefitDate) === true){
            //If there is no disabled child, and spousalBenefitDate is after FRA and after youngestchildturns16date, then automatic conversion (to regular spousal from child-in-care spousal) must not have occurred, which means they weren't on child-in-care spousal
            if (!(personB.spousalBenefitDate > personB.FRA && personB.spousalBenefitDate > scenario.youngestChildTurns16date && scenario.disabledChild === false)){
              personB.childInCareSpousal = true
            }
          }
        }

    //Create initial CalculationYear object
        let initialCalcDate:MonthYearDate = this.whenShouldPVcalculationStart(scenario, personA, personB)
        let calcYear:CalculationYear = new CalculationYear(initialCalcDate)
        if (calcYear.date < this.today){calcYear.isInPast = true}
        else {calcYear.isInPast = false}

    //Find childBenefitDate for any children
    for (let child of scenario.children){
      child.childBenefitDate = this.benefitService.determineChildBenefitDate(scenario, child, personA, personB)
    }

    //calculate ages as of initial calcYear.date
      personA.age = this.birthdayService.findAgeOnDate(personA, calcYear.date)
      personB.age = this.birthdayService.findAgeOnDate(personB, calcYear.date)
      for (let child of scenario.children){
        child.age = this.birthdayService.findAgeOnDate(child, calcYear.date)
      }

    //Calculate PV via monthly loop until they hit age 115 (by which point "remaining lives" is zero)
    while (personA.age < 115 || personB.age < 115){

      //Use savedCalculationYear sums if parents over 70, children over 18 or disabled, and assumed benfit cut year (if applicable) has been reached
      if (savedCalculationYear){
        this.useSavedCalculationYearForFasterLoop(calcYear, savedCalculationYear)
      }
      else {
      //Do we have to calculate/recalculate any benefits for personA or personB?
      this.benefitService.monthlyCheckForBenefitRecalculationsCouple(personA, personB, calcYear)

      //Assume personA and personB are alive
            //calculate "original benefit" amounts for each person (spousal/survivor amounts not yet reduced for family max, own entitlement, age, or GPO)
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, true, personB, true)
            //Adjust each person's monthlyPayment as necessary for family max
              this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, true, personB, true)
            //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
              this.benefitService.adjustSpousalAndSurvivorBenefitsForOwnEntitlement(personA, personB)
            //Redo family max application
              this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, true, personB, true)
            //Adjust spousal monthlyPayment fields as necessary for age
              this.benefitService.adjustSpousalBenefitsForAge(scenario, personA, personB)
            //Adjust spousal/survivor monthlyPayment fields for GPO
              this.benefitService.adjustSpousalAndSurvivorBenefitsForGPO(personA, personB)
            //Adjust as necessary for earnings test (and tally months withheld)
              this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, true, personB, true)
            //add everybody's monthlyPayment fields to appropriate annual totals (annualBenefitBothAlive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, true, personB, true, printOutputTable)
      //Assume personA is alive and personB is deceased
            //calculate "original benefit" amounts for each person (spousal/survivor amounts not yet reduced for family max, own entitlement, age, or GPO)
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, true, personB, false)
            //Adjust each person's monthlyPayment as necessary for family max
              this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, true, personB, false)
            //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
              this.benefitService.adjustSpousalAndSurvivorBenefitsForOwnEntitlement(personA, personB)
            //Redo family max application
              this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, true, personB, false)
            //Adjust survivor benefit for RIB-LIM (i.e., for early entitlement of deceased person, if applicable)
              this.benefitService.adjustSurvivorBenefitsForRIB_LIM(personA, personB)
            //Adjust spousal/survivor monthlyPayment fields for GPO
              this.benefitService.adjustSpousalAndSurvivorBenefitsForGPO(personA, personB)
            //Adjust as necessary for earnings test (and tally months withheld)
              this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, true, personB, false)
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitOnlyPersonAalive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, true, personB, false, printOutputTable)
      //Assume personA is deceased and personB is alive
            //calculate "original benefit" amounts for each person (spousal/survivor amounts not yet reduced for family max, own entitlement, age, or GPO)
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, false, personB, true)
            //Adjust each person's monthlyPayment as necessary for family max
              this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, false, personB, true)
            //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
              this.benefitService.adjustSpousalAndSurvivorBenefitsForOwnEntitlement(personA, personB)
            //Redo family max application
              this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, false, personB, true)
            //Adjust survivor benefit for RIB-LIM (i.e., for early entitlement of deceased person, if applicable)
              this.benefitService.adjustSurvivorBenefitsForRIB_LIM(personB, personA)
            //Adjust spousal/survivor monthlyPayment fields for GPO
              this.benefitService.adjustSpousalAndSurvivorBenefitsForGPO(personA, personB)
            //Adjust as necessary for earnings test (and tally months withheld)
              this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, false, personB, true)
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitOnlyPersonBalive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, false, personB, true, printOutputTable)
      //Assume personA and personB are deceased
            //calculate "original benefit" amounts for each person
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, false, personB, false)
            //Adjust each person's monthlyPayment as necessary for family max
              this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, false, personB, false)
            //Earnings test not necessary
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitBothDeceased)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, false, personB, false, printOutputTable)
      }

      //After month is over increase age of everybody by 1 month
            personA.age = personA.age + 1/12
            personB.age = personB.age + 1/12
            for (let child of scenario.children){
              child.age = child.age + 1/12
            }
      //if it's December...
      if (calcYear.date.getMonth() == 11){
        //Apply assumed benefit cut, if applicable
        if (!savedCalculationYear && cutThisYear) {
          // if we have a savedCalculationYear, the benefit cuts have already been applied
          this.benefitService.applyAssumedBenefitCut(scenario, calcYear)
        }
      
        //Add back any overwithholding from earnings test
        this.earningsTestService.addBackOverwithholding(calcYear, scenario)

            //If printOutputTable is true, add row to output table.
              if (printOutputTable === true && scenario.maritalStatus == "married"){
                claimStrategy = this.outputTableService.generateOutputTableCouple(personA, personB, claimStrategy, scenario, calcYear)
              }
              if (printOutputTable === true && scenario.maritalStatus == "divorced"){
                claimStrategy = this.outputTableService.generateOutputTableDivorced(personA, claimStrategy, scenario, calcYear)
              }

            //Calculate each person's probability of being alive at end of age in question. (Have to use age-1 here because we want their age as of beginning of year.)
              let probabilityAalive:number = this.mortalityService.calculateProbabilityAlive(scenario, personA, personA.age-1, personB)
              let probabilityBalive:number = this.mortalityService.calculateProbabilityAlive(scenario, personB, personB.age-1, personA)

            //Apply probability alive to annual benefit amounts
              let annualPV:number =
                probabilityAalive * probabilityBalive * calcYear.annualBenefitBothAlive +
                probabilityAalive * (1 - probabilityBalive) * calcYear.annualBenefitOnlyPersonAalive +
                probabilityBalive * (1 - probabilityAalive) * calcYear.annualBenefitOnlyPersonBalive +
                (1 - probabilityAalive) * (1 - probabilityBalive) * calcYear.annualBenefitBothDeceased


            // if (printOutputTable === true){
            //   console.log("monthly loop year: " + calcYear.date.getFullYear())
            //   console.log("probability A alive: " + probabilityAalive)
            //   console.log("probability B alive: " + probabilityBalive)
            //   console.log("undiscounted annualPV: " + annualPV)
            // }

            //Discount that probability-weighted annual benefit amount back to this year
              annualPV = this.discountToPresentValue(scenario.discountRate, annualPV, this.today.getFullYear(), calcYear.date.getFullYear())

                // if (printOutputTable === true){
                //   console.log(calcYear.date.getFullYear())
                //   console.log("discounted annualPV: " + annualPV)
                //   console.log("annualBenefitBothAlive: " + calcYear.annualBenefitBothAlive)
                //   console.log("annualBenefitBothDeceased: " + calcYear.annualBenefitBothDeceased)
                //   console.log("annualBenefitOnlyPersonAalive: " + calcYear.annualBenefitOnlyPersonAalive)
                //   console.log("annualBenefitOnlyPersonBalive: " + calcYear.annualBenefitOnlyPersonBalive)
                //   console.log("tablePersonAannualRetirementBenefit: " + calcYear.tablePersonAannualRetirementBenefit)
                //   console.log("tablePersonAannualSpousalBenefit: " + calcYear.tablePersonAannualSpousalBenefit)
                //   console.log("tablePersonAannualSurvivorBenefit: " + calcYear.tablePersonAannualSurvivorBenefit)
                //   console.log("tablePersonBannualRetirementBenefit: " + calcYear.tablePersonBannualRetirementBenefit)
                //   console.log("tablePersonBannualSpousalBenefit: " + calcYear.tablePersonBannualSpousalBenefit)
                //   console.log("tablePersonBannualSurvivorBenefit: " + calcYear.tablePersonBannualSurvivorBenefit)
                //   console.log("tableTotalAnnualChildBenefitsBothParentsAlive: " + calcYear.tableTotalAnnualChildBenefitsBothParentsAlive)
                //   console.log("tableTotalAnnualChildBenefitsBothParentsDeceased: " + calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased)
                //   console.log("tableTotalAnnualChildBenefitsOnlyPersonAalive: " + calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive)
                //   console.log("tableTotalAnnualChildBenefitsOnlyPersonBalive: " + calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive)                     
                // }

            //Add discounted benefit to ongoing sum
              claimStrategy.PV = claimStrategy.PV + annualPV


          // for calculation of both cut and noCut PV's
          if (cutThisYear) { 
			      // PV has been adjusted this year
			      // We need to de-adjust it to get the NoCut value
            claimStrategy.pvNoCut += (annualPV * scenario.decutFactor)
          } else {
            claimStrategy.pvNoCut += annualPV
          }

        //Create saved CalculationYear object if 
        // (a) we haven't already done so, and 
        // (b) conditions are appropriate for us to do so            
        if (!savedCalculationYear && (this.readyForSavedCalculationYearForFasterLoop(scenario, calcYear, personA, personB)) === true){
              savedCalculationYear = this.createSavedCalculationYearForFasterLoop(calcYear)
            }
      }
      //increment month by 1 and create new CalculationYear object if it's now January
      calcYear.date.setMonth(calcYear.date.getMonth()+1)
      if (calcYear.date.getMonth() == 0){
      calcYear = new CalculationYear(calcYear.date)
        if (!cutThisYear) { //Check if there will be a cut this year. (But we don't need to check again if cutThisYear is already true.)
          cutThisYear = (scenario.benefitCutAssumption === true) && (calcYear.date.getFullYear() >= scenario.benefitCutYear)
        }
      }
      if (!(calcYear.isInPast === false) && calcYear.date < this.today){calcYear.isInPast = true}//if calcYear.isInPast is already false, no need to check again as date gets incremented forward (using "not false" rather than "is true" because we want it to trigger if it isn't set yet also)
      else {calcYear.isInPast = false}
    }

    return claimStrategy
  }


  maximizeSinglePersonPV(person:Person, scenario:CalculationScenario) : SolutionSet{

    scenario.restrictedApplicationPossible = false;

    //find initial retirementBenefitDate for age 62 (or, more often, 62 and 1 month)
    person.retirementBenefitDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth())
    if (person.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
      person.retirementBenefitDate.setMonth(person.retirementBenefitDate.getMonth()+1)
    }

    //If user is currently over age 62 when filling out form, set retirementBenefitDate to today's month/year instead of their age 62 month/year, so that calc starts today instead of 62.
    let ageToday = this.today.getFullYear() - person.SSbirthDate.getFullYear() + (this.today.getMonth() - person.SSbirthDate.getMonth())/12
    if (ageToday > 62){
      person.retirementBenefitDate.setMonth(this.today.getMonth())
      person.retirementBenefitDate.setFullYear(this.today.getFullYear())
    }

    //If user is currently beyond FRA when filling out form, set retirementBenefitDate to earliest retroactive date (6 months ago but no earlier than FRA)
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
    person = this.familyMaximumService.calculateFamilyMaximum(person, this.today)

    //Initialize savedStrategy, with zero PV, using person's current dates
    let savedStrategy: ClaimStrategy = new ClaimStrategy(person)
    savedStrategy.PV = 0

    //Set endingTestDate equal to the month they turn 70
      let endingTestDate:MonthYearDate = new MonthYearDate(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth())

    //Create new range object, with earliest start date and endingTestDate
    let earliestStart: MonthYearDate = new MonthYearDate(person.retirementBenefitDate)
    if (person.beginSuspensionDate > earliestStart) {
      earliestStart = person.beginSuspensionDate;
    }
    scenario.range = new Range(earliestStart, endingTestDate);
      
    while (person.retirementBenefitDate <= endingTestDate && person.endSuspensionDate <= endingTestDate){
      //run PV calc (again) and compare results. 
      let currentTest:ClaimStrategy = this.calculateSinglePersonPV(person, scenario, false) //TODO: maybe this has to be two lines? first is constructor instantiating the ClaimStrategy, and second runs PV calc function?
          // store data for this combination of claim dates
          scenario.range.processPVs(currentTest, false);
          //Save better of the two. (If they're literally the same, save the second one tested, because it gives better longevity insurance)
          if (currentTest.PV >= savedStrategy.PV){
          savedStrategy = new ClaimStrategy(person)
          savedStrategy.PV = currentTest.PV
      }
      //Increment claiming date (or suspension date)
      person = this.incrementRetirementORendSuspensionDate(person, scenario)
    }

    //after loop is finished, set Person's retirementBenefitDate and suspension dates to the saved dates, for sake of running PV calc again for outputTable
    person.retirementBenefitDate = new MonthYearDate(savedStrategy.personARetirementDate)
    person.beginSuspensionDate = new MonthYearDate(savedStrategy.personABeginSuspensionDate)
    person.endSuspensionDate = new MonthYearDate(savedStrategy.personAEndSuspensionDate)
    savedStrategy = this.calculateSinglePersonPV(person, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable

    //Generate solution set (for sake of output) from saved values
    let solutionSet:SolutionSet = this.solutionSetService.generateSingleSolutionSet(scenario, person, savedStrategy)

    console.log(solutionSet)

    scenario.range.initFracsAndColors();

    return solutionSet
  }


  maximizeCouplePViterateBothPeople(personA:Person, personB:Person, scenario:CalculationScenario) : SolutionSet{

    let deemedFilingCutoff: Date = new Date(1954, 0, 1); 
    scenario.restrictedApplicationPossible = 
      ((personA.actualBirthDate < deemedFilingCutoff) || (personB.actualBirthDate < deemedFilingCutoff))

    //find initial retirementBenefitDate for personA (first month for which they are considered 62 for entire month)
    personA.retirementBenefitDate = new MonthYearDate(personA.actualBirthDate.getFullYear()+62, personA.actualBirthDate.getMonth())
    if (personA.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
      personA.retirementBenefitDate.setMonth(personA.retirementBenefitDate.getMonth()+1)
    }
    //If personA is currently over age 62 when filling out form, adjust their initial retirementBenefitDate to today's month/year instead of their age 62 month/year.
    let spouseAageToday: number = this.today.getFullYear() - personA.SSbirthDate.getFullYear() + (this.today.getMonth() - personA.SSbirthDate.getMonth()) /12
    if (spouseAageToday > 62){
      personA.retirementBenefitDate = new MonthYearDate(this.today)
    }
    //If personA is currently beyond FRA when filling out form, set their initial retirementBenefitDate to earliest retroactive date (6 months ago but no earlier than FRA)
    if (this.today > personA.FRA){
      personA.retirementBenefitDate.setMonth(this.today.getMonth()-6)
      if (personA.retirementBenefitDate < personA.FRA){
        personA.retirementBenefitDate = new MonthYearDate(personA.FRA)
      }
    }

    //Do all of the same, but for personB.
    personB.retirementBenefitDate = new MonthYearDate(personB.actualBirthDate.getFullYear()+62, personB.actualBirthDate.getMonth())
    if (personB.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
      personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
    }
    let spouseBageToday: number = this.today.getFullYear() - personB.SSbirthDate.getFullYear() + (this.today.getMonth() - personB.SSbirthDate.getMonth()) /12
    if (spouseBageToday > 62){
      personB.retirementBenefitDate = new MonthYearDate(this.today)
    }
    if (this.today > personB.FRA){
      personB.retirementBenefitDate.setMonth(this.today.getMonth()-6)
      if (personB.retirementBenefitDate < personB.FRA){
        personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
      }
    }

    //If either person has already filed or is on disability, initialize that person's begin&end suspension date as their FRA (but no earlier than this month), and set that person's retirementBenefitDate using fixedRetirementBenefitDate field 
    if (personA.isOnDisability === true || personA.hasFiled === true) {
      if (this.today > personA.FRA){
        personA.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
        personA.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
      }
      else {
        personA.beginSuspensionDate = new MonthYearDate(personA.FRA)
        personA.endSuspensionDate = new MonthYearDate(personA.FRA)
      }
      personA.retirementBenefitDate = new MonthYearDate(personA.fixedRetirementBenefitDate)
    }
    if (personB.isOnDisability === true || personB.hasFiled === true) {
      if (this.today > personB.FRA){
        personB.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
        personB.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
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

    //Initialize savedStrategy, with zero PV, using personA's and personB's current dates
      let savedStrategy:ClaimStrategy = new ClaimStrategy(personA, personB)
      savedStrategy.PV = 0

    //Set endingTestDate for each spouse equal to the month they turn 70. Or if using fixed-death-age-assumption younger than 70, set to assumed month of death
    let spouseAendTestDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+70, personA.SSbirthDate.getMonth())
    let spouseBendTestDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+70, personB.SSbirthDate.getMonth())
    if (personA.mortalityTable[70] == 0) {
      let deceasedByAge:number = personA.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69. But we want last possible filing date suggested to be 68, so we subtract 1 in following line.
      spouseAendTestDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+deceasedByAge-1, personA.SSbirthDate.getMonth())
    }
    if (personB.mortalityTable[70] == 0) {
      let deceasedByAge:number = personB.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69
      spouseBendTestDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+deceasedByAge-1, personB.SSbirthDate.getMonth())
    }

    //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
    personA = this.familyMaximumService.calculateFamilyMaximum(personA, this.today)
    personB = this.familyMaximumService.calculateFamilyMaximum(personB, this.today)

    // get limits for storage of PV for range of claim options
    let earliestStartA: MonthYearDate = new MonthYearDate(this.findEarliestDateForPersonToStoreInRange(personA))
    let earliestStartB: MonthYearDate = new MonthYearDate(this.findEarliestDateForPersonToStoreInRange(personB))

    //Create new range object for storage of data
    scenario.range = new Range(earliestStartA, spouseAendTestDate, earliestStartB, spouseBendTestDate);
    let solutionSet: SolutionSet;

    while (personA.retirementBenefitDate <= spouseAendTestDate && personA.endSuspensionDate <= spouseAendTestDate) {
        //Reset personB.retirementBenefitDate to earliest possible (i.e., their "age 62 for whole month" month, or today's month if they're currently older than 62, or earliest retroactive date if they're older than FRA)
        if (spouseBageToday > 62){
          personB.retirementBenefitDate = new MonthYearDate(this.today)
        }
        else {
          personB.retirementBenefitDate = new MonthYearDate(personB.actualBirthDate.getFullYear()+62, personB.actualBirthDate.getMonth())
          if (personB.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
            personB.retirementBenefitDate.setMonth(personB.retirementBenefitDate.getMonth()+1)
          }
        }
        if (this.today > personB.FRA){
          personB.retirementBenefitDate.setMonth(this.today.getMonth()-6)
          if (personB.retirementBenefitDate < personB.FRA){
            personB.retirementBenefitDate = new MonthYearDate(personB.FRA)
          }
        }

        //If personB is disabled or already filed, reset suspension begin/end dates, and set retirementBenefitDate using fixedRetirementBenefitDate field
          if (personB.isOnDisability === true || personB.hasFiled === true) {
            if (this.today > personB.FRA){
              personB.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
              personB.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
            }
            else {
              personB.beginSuspensionDate = new MonthYearDate(personB.FRA)
              personB.endSuspensionDate = new MonthYearDate(personB.FRA)
            }
            personB.retirementBenefitDate = new MonthYearDate(personB.fixedRetirementBenefitDate)
          }

        //After personB's retirementBenefitDate has been reset, reset spousal dates as necessary for personA and personB
          personA = this.adjustSpousalBenefitDate(personA, personB, scenario)
          personB = this.adjustSpousalBenefitDate(personB, personA, scenario)

        while (personB.retirementBenefitDate <= spouseBendTestDate && personB.endSuspensionDate <= spouseBendTestDate) {
          //Calculate PV using current testDates
            let currentTest: ClaimStrategy = this.calculateCouplePV(personA, personB, scenario, false)
            
             // store data for this combination of claim dates
            scenario.range.processPVs(currentTest, false);

            //If PV is greater than saved PV, save new PV and save new testDates.
            if (currentTest.PV >= savedStrategy.PV) {
              savedStrategy = new ClaimStrategy(personA, personB)
              savedStrategy.PV = currentTest.PV
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
      personA.retirementBenefitDate = new MonthYearDate(savedStrategy.personARetirementDate)
      personA.spousalBenefitDate = new MonthYearDate(savedStrategy.personASpousalDate)
      if (savedStrategy.personAchildInCareSpousalDate) {personA.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personAchildInCareSpousalDate)}
      personA.beginSuspensionDate = new MonthYearDate(savedStrategy.personABeginSuspensionDate)
      personA.endSuspensionDate = new MonthYearDate(savedStrategy.personAEndSuspensionDate)
      personB.retirementBenefitDate = new MonthYearDate(savedStrategy.personBRetirementDate)
      personB.spousalBenefitDate = new MonthYearDate(savedStrategy.personBSpousalDate)
      if (savedStrategy.personBchildInCareSpousalDate) {personB.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personBchildInCareSpousalDate)}
      personB.beginSuspensionDate = new MonthYearDate(savedStrategy.personBBeginSuspensionDate)
      personB.endSuspensionDate = new MonthYearDate(savedStrategy.personBEndSuspensionDate)
      savedStrategy = this.calculateCouplePV(personA, personB, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable

      //Generate solution set (for sake of output) from saved values
      solutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, personA, personB, savedStrategy)
      
      console.log(solutionSet);

      scenario.range.initFracsAndColors();

      return solutionSet
  }


//This function is for when one spouse is over 70 (and therefore has no retirement age or suspension age to iterate).
//Also is the function for a divorcee, because we take the ex-spouse's filing date as a given (i.e., as an input)
maximizeCouplePViterateOnePerson(scenario:CalculationScenario, flexibleSpouse:Person, fixedSpouse:Person) : SolutionSet{

  let deemedFilingCutoff: Date = new Date(1954, 0, 1); 
  scenario.restrictedApplicationPossible = (flexibleSpouse.actualBirthDate < deemedFilingCutoff);

    fixedSpouse.retirementBenefitDate = new MonthYearDate(fixedSpouse.fixedRetirementBenefitDate)

    //find initial retirementBenefitDate for flexibleSpouse (first month for which flexibleSpouse is considered 62 for entire month)
    flexibleSpouse.retirementBenefitDate = new MonthYearDate(flexibleSpouse.actualBirthDate.getFullYear()+62, flexibleSpouse.actualBirthDate.getMonth())
    if (flexibleSpouse.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
      flexibleSpouse.retirementBenefitDate.setMonth(flexibleSpouse.retirementBenefitDate.getMonth()+1)
    }
    //If flexibleSpouse is currently over age 62 when filling out form, adjust their initial retirementBenefitDate to today's month/year instead of their age 62 month/year.
    let flexibleSpouseAgeToday: number = this.today.getFullYear() - flexibleSpouse.SSbirthDate.getFullYear() + (this.today.getMonth() - flexibleSpouse.SSbirthDate.getMonth()) /12
    if (flexibleSpouseAgeToday > 62){
      flexibleSpouse.retirementBenefitDate.setMonth(this.today.getMonth())
      flexibleSpouse.retirementBenefitDate.setFullYear(this.today.getFullYear())
    }
    //If flexibleSpouse is currently beyond FRA when filling out form, set testClaimingDate to earliest retroactive date (6 months ago but no earlier than FRA)
    if (this.today > flexibleSpouse.FRA){
      flexibleSpouse.retirementBenefitDate.setMonth(this.today.getMonth()-6)
      if (flexibleSpouse.retirementBenefitDate < flexibleSpouse.FRA){
        flexibleSpouse.retirementBenefitDate.setMonth(flexibleSpouse.FRA.getMonth())
        flexibleSpouse.retirementBenefitDate.setFullYear(flexibleSpouse.FRA.getFullYear())
      }
    }

    //If flexibleSpouse has already filed or is on disability, initialize their begin&end suspension date as their FRA (but no earlier than this month). And set retirementBenefitDate to fixedRetirementBenefitDate
    if (flexibleSpouse.isOnDisability === true || flexibleSpouse.hasFiled === true) {
      if (this.today > flexibleSpouse.FRA){
        flexibleSpouse.beginSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
        flexibleSpouse.endSuspensionDate = new MonthYearDate(this.today.getFullYear(), this.today.getMonth())
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

      
    //Initialize savedStrategy, with zero PV, using each spouse's current dates
    let savedStrategy:ClaimStrategy
    if (flexibleSpouse.id == "A"){
      savedStrategy = new ClaimStrategy(flexibleSpouse, fixedSpouse)
    }
    else {
      savedStrategy = new ClaimStrategy(fixedSpouse, flexibleSpouse)
    }
    savedStrategy.PV = 0

    //Set endTestDate equal to the month flexibleSpouse turns 70. Or, if flexible spouse chose a fixed-death-age assumption younger than age 70, set ending test date to that fixed death age.
    let endTestDate = new MonthYearDate(flexibleSpouse.SSbirthDate.getFullYear()+70, flexibleSpouse.SSbirthDate.getMonth())
    if (flexibleSpouse.mortalityTable[70] == 0) {
      let deceasedByAge:number = flexibleSpouse.mortalityTable.findIndex(item => item == 0) //If they chose assumed death at 68, "deceasedByAge" will be 69. But we want last possible filing date suggested to be 68, so we subtract 1 in following line.
      endTestDate = new MonthYearDate(flexibleSpouse.SSbirthDate.getFullYear()+deceasedByAge-1, flexibleSpouse.SSbirthDate.getMonth())
    }

    //Calculate family max -- this happens here rather than in calculatePV function because it only has to happen once (doesn't depend on parent filing date)
      flexibleSpouse = this.familyMaximumService.calculateFamilyMaximum(flexibleSpouse, this.today)
      fixedSpouse = this.familyMaximumService.calculateFamilyMaximum(fixedSpouse, this.today)

    //Create new range object for storage of data   
      scenario.range = new Range(flexibleSpouse.retirementBenefitDate, endTestDate);      

    while (flexibleSpouse.retirementBenefitDate <= endTestDate && flexibleSpouse.endSuspensionDate <= endTestDate) {
      //Calculate PV using current test dates for flexibleSpouse and fixed dates for fixedSpouse
      //and call processPVs to store data for this combination of claim dates
      if (flexibleSpouse.id == "A"){
        var currentTest: ClaimStrategy = this.calculateCouplePV(flexibleSpouse, fixedSpouse, scenario, false)
        scenario.range.processPVs(currentTest, false)
      }
      else {
        var currentTest: ClaimStrategy = this.calculateCouplePV(fixedSpouse, flexibleSpouse, scenario, false)
        scenario.range.processPVs(currentTest, true)
      }



      //If PV is greater than or equal to saved PV, save new PV and save new testDates
      if (currentTest.PV >= savedStrategy.PV) {
        if (flexibleSpouse.id == "A"){
          savedStrategy = new ClaimStrategy(flexibleSpouse, fixedSpouse)
        }
        else {
          savedStrategy = new ClaimStrategy(fixedSpouse, flexibleSpouse)
        }
        savedStrategy.PV = currentTest.PV
        }
      
      //Increment flexibleSpouse's dates (and fixedSpouse's spousal date, which is usually just set to be same as flexible spouse's retirement date)
        flexibleSpouse = this.incrementRetirementORendSuspensionDate(flexibleSpouse, scenario)
        flexibleSpouse = this.adjustSpousalBenefitDate(flexibleSpouse, fixedSpouse, scenario)
        fixedSpouse = this.adjustSpousalBenefitDate(fixedSpouse, flexibleSpouse, scenario)

    }

      //after loop is finished, set person objects' benefit dates to the saved dates, for sake of running PV calc again for outputTable
      if (flexibleSpouse.id == "A"){
        flexibleSpouse.retirementBenefitDate = new MonthYearDate(savedStrategy.personARetirementDate)
        flexibleSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personASpousalDate)
        flexibleSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personAchildInCareSpousalDate)
        flexibleSpouse.beginSuspensionDate = new MonthYearDate(savedStrategy.personABeginSuspensionDate)
        flexibleSpouse.endSuspensionDate = new MonthYearDate(savedStrategy.personAEndSuspensionDate)
        fixedSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personBSpousalDate)
        fixedSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personBchildInCareSpousalDate)
        savedStrategy = this.calculateCouplePV(flexibleSpouse, fixedSpouse, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable
      }
      else {//flexible spouse is personB
        flexibleSpouse.retirementBenefitDate = new MonthYearDate(savedStrategy.personBRetirementDate)
        flexibleSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personBSpousalDate)
        flexibleSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personBchildInCareSpousalDate)
        flexibleSpouse.beginSuspensionDate = new MonthYearDate(savedStrategy.personBBeginSuspensionDate)
        flexibleSpouse.endSuspensionDate = new MonthYearDate(savedStrategy.personBEndSuspensionDate)
        fixedSpouse.spousalBenefitDate = new MonthYearDate(savedStrategy.personASpousalDate)
        fixedSpouse.childInCareSpousalBenefitDate = new MonthYearDate(savedStrategy.personAchildInCareSpousalDate)
        savedStrategy = this.calculateCouplePV(fixedSpouse, flexibleSpouse, scenario, true)//running the calc again on savedStrategy, just to generate the outputTable
      }
  
      //generate solutionSet
      if (flexibleSpouse.id == "A"){
        var solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, flexibleSpouse, fixedSpouse, savedStrategy)
      }
      else {
        var solutionSet:SolutionSet = this.solutionSetService.generateCoupleSolutionSet(scenario, fixedSpouse, flexibleSpouse, savedStrategy)
      }

      console.log(solutionSet)

      scenario.range.initFracsAndColors();

      return solutionSet
  }

  //Adjusts spousal date as necessary. Is used after new retirement date is selected for either person.
  //Regarding retroactive applications, they are generally handled by the fact that person's retirementBenefitDate could be a retroactive date, with appropriate limitations.
    //In case of restricted application though (where person's spousalBenefitDate is set without regard to person's retirementBenefitDate) we have to check and make sure it's no more than 6 (or 12) months ago
  adjustSpousalBenefitDate(person:Person, otherPerson:Person, scenario:CalculationScenario) : Person {
    let deemedFilingCutoff: Date = new Date(1954, 0, 1)
    let otherPersonsLimitingDate: MonthYearDate

    //Determine "otherPerson's Limiting Date" (i.e., the date -- based on otherPerson -- before which "Person" cannot file a spousal benefit)
      if (scenario.maritalStatus == "married") {
        otherPersonsLimitingDate = new MonthYearDate(otherPerson.retirementBenefitDate)
      }
      else if (scenario.maritalStatus == "divorced"){//If divorced, otherPersonsLimitingDate is first month for which otherPerson is age 62 all month
        otherPersonsLimitingDate = new MonthYearDate(otherPerson.actualBirthDate.getFullYear()+62, otherPerson.actualBirthDate.getMonth())
        if (otherPerson.actualBirthDate.getDate() > 1) {//i.e., if they are born after 2nd of month ("1" is second of month)
          otherPersonsLimitingDate.setMonth(otherPersonsLimitingDate.getMonth()+1)
        }
      }
      if (otherPerson.isOnDisability === true){//If otherPerson is disabled, there is no "otherPersonsLimitingDate." So just make this own "age 62 all month" month
      //Also, this check has to come last since it overrides others.
        otherPersonsLimitingDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth())
        if (person.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
          otherPersonsLimitingDate.setMonth(otherPersonsLimitingDate.getMonth()+1)
        }
      }

    if (person.actualBirthDate >= deemedFilingCutoff) {//i.e., if person has new deemed filing rules
      //set spousalBenefitDate to own retirementBenefitDate, but no earlier than otherPersonsLimitingDate
      if (person.retirementBenefitDate > otherPersonsLimitingDate) {
        person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
      }
      else {
        person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
      }
    }
    else {//i.e., if person has old deemed filing rules
      if (person.retirementBenefitDate < person.FRA) {
        //set spousalBenefitDate to own retirementBenefitDate, but no earlier than otherPersonsLimitingDate
        if (person.retirementBenefitDate > otherPersonsLimitingDate) {
          person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
        }
        else {
          person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
        }
      }
      else {//i.e., if person's retirementBenefitDate currently after his/her FRA
        //Set person's spousalBenefitDate to earliest possible restricted application date (i.e., later of FRA or otherPersonsLimitingDate)
          //...but no earlier than 6 months ago (or 12 months ago if otherPerson is disabled)
        if (person.FRA > otherPersonsLimitingDate) {
          person.spousalBenefitDate = new MonthYearDate(person.FRA)
        }
        else {
          person.spousalBenefitDate = new MonthYearDate(otherPersonsLimitingDate)
        }
        if (otherPerson.isOnDisability === false){
          let sixMonthsAgo:MonthYearDate = new MonthYearDate(this.today)
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6)
          if (person.spousalBenefitDate < sixMonthsAgo){
            person.spousalBenefitDate = new MonthYearDate(sixMonthsAgo)
          }
        }
        else {//i.e., otherPerson is on disability
          let twelveMonthsAgo:MonthYearDate = new MonthYearDate(this.today)
          twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12)
          if (person.spousalBenefitDate < twelveMonthsAgo){
            person.spousalBenefitDate = new MonthYearDate(twelveMonthsAgo)
          }
        }
      }
    }
    //If person has already filed for retirement or is on disability, don't let spousalBenefitDate be before retirementBenefitDate (otherwise it will try retroactive spousal appplications in some cases where they can't actually happen)
      if ( (person.hasFiled === true || person.isOnDisability) && person.spousalBenefitDate < person.retirementBenefitDate){
        person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
      }

    //If there are minor or disabled children, spousalBenefitDate represents date on which regular spousal benefit (as opposed to child-in-care spousal benefit) begins.
      if (scenario.children.length > 0){
        //if there is a disabled child or a child under 16 when otherPerson begins retirement benefit, don't let spousalBenefitDate be before own FRA.
          //In other words, we're assuming here that person doesn't file Form SSA-25. We're letting them claim child-in-care spousal benefits, then letting it stop when youngest child reaches 16 (if not yet FRA and no disabled child), then start again at FRA.
        if (this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, otherPerson.retirementBenefitDate)=== true){
          if (person.spousalBenefitDate < person.FRA){
            person.spousalBenefitDate = new MonthYearDate(person.FRA)
          }
          //Unless person files for own retirement benefit before FRA and after child-in-care spousal was suspended, in which case they'd be deemed to file for regular spousal benefits at that time as well.
          if (person.retirementBenefitDate < person.FRA && person.retirementBenefitDate >= scenario.youngestChildTurns16date && scenario.disabledChild === false){
            person.spousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
          }
        }
        //Find date on which child-in-care spousal benefit begins
          //If married, is otherPerson.retirementBenefitDate, but no earlier than 6 months ago (12 months if otherPerson is disabled). Can be retroactive before FRA because spousal would not be reduced for age because it's child-in-care.
          if (scenario.maritalStatus == "married"){

            let sixMonthsAgo:MonthYearDate = new MonthYearDate(this.today)
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6)
            let twelveMonthsAgo:MonthYearDate = new MonthYearDate(this.today)
            twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear()-1)

            person.childInCareSpousalBenefitDate = new MonthYearDate(otherPerson.retirementBenefitDate)
            if (otherPerson.isOnDisability === false){//otherPerson is NOT on disability
              if (person.childInCareSpousalBenefitDate < sixMonthsAgo){
                person.childInCareSpousalBenefitDate = new MonthYearDate(sixMonthsAgo)
              }
            }
            else {//i.e., otherPerson IS on disability
              if (person.childInCareSpousalBenefitDate < twelveMonthsAgo){
                person.childInCareSpousalBenefitDate = new MonthYearDate(twelveMonthsAgo)
              }
            }
          }
          //If divorced, we aren't concerned with when otherPerson files. Also, deemed filing applies here.
              //That is, the exception to deemed filing for child-in-care spousal only applies to still-married couples. So an application for child-in-care spousal benefits would also be an application for retirement benefits.
              //As such, childInCareSpousalBenefitDate is own retirementBenefitDate, but no earlier than when otherPerson turns age 62
          if (scenario.maritalStatus == "divorced"){
            person.childInCareSpousalBenefitDate = new MonthYearDate(person.retirementBenefitDate)
            let otherPersonAge62Date:MonthYearDate = new MonthYearDate(otherPerson.SSbirthDate.getFullYear()+62, otherPerson.SSbirthDate.getMonth())
            if (person.childInCareSpousalBenefitDate < otherPersonAge62Date){
              person.childInCareSpousalBenefitDate = new MonthYearDate(otherPersonAge62Date)
            }
          }
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


  addMonthlyPaymentAmountsToApplicableSumsSingle(scenario:CalculationScenario, calcYear:CalculationYear, person:Person, personAliveBoolean:boolean, printOutputTable:Boolean){
    if (personAliveBoolean === true){
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
    }
    else {//i.e., "person is deceased"
      //sum everybody's monthlyPayment fields and add that sum to appropriate annual total (annualBenefitPersonDeceased)
      for (let child of scenario.children){
        if (calcYear.date >= this.today){//only want to include child survivor benefit in PV calc if it is not from a month in the past (would never have a retroactive child survivor application, since if parent is already deceased calculator doesn't run)
          calcYear.annualBenefitSinglePersonDeceased = calcYear.annualBenefitSinglePersonDeceased + child.monthlyChildPayment
        }
        if (printOutputTable === true){
          calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased = calcYear.tableTotalAnnualChildBenefitsSingleParentDeceased + child.monthlyChildPayment
        }
      }
    }
  }


  addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personAaliveBoolean:boolean, personB:Person, personBaliveBoolean:boolean, printOutputTable:Boolean){
      //if both spouses alive, add monthlyPayment fields to annualBenefitBothAlive
        if (personAaliveBoolean === true && personBaliveBoolean === true){
          if (calcYear.isInPast === false || (personA.hasFiled === false && personA.isOnDisability === false) ){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
          calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive + personA.monthlyRetirementPayment + personA.monthlySpousalPayment
          }
          if (calcYear.isInPast === false || (personB.hasFiled === false && personB.isOnDisability === false) ){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
            if (scenario.maritalStatus == "married"){//only want to include personB's monthlyPayment fields in PV if married rather than divorced
              calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive + personB.monthlyRetirementPayment + personB.monthlySpousalPayment
            }
          }
          for (let child of scenario.children){
            if (calcYear.isInPast === false || child.hasFiled === false){//if this benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e,. not because of a prior filing)
              calcYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive + child.monthlyChildPayment
            }
          }
        }
      //if personA alive and personB deceased, add monthlyPayment fields to annualBenefitOnlyPersonAalive
        if (personAaliveBoolean === true && personBaliveBoolean === false){
          if (calcYear.isInPast === false){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
            calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + personA.monthlyRetirementPayment + personA.monthlySurvivorPayment
            for (let child of scenario.children){
              calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + child.monthlyChildPayment
            }
          }
        }
      //if personA deceased and personB alive, add monthlyPayment fields to annualBenefitOnlyPersonBalive
        if (personAaliveBoolean === false && personBaliveBoolean === true){
          if (calcYear.isInPast === false){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
            if (scenario.maritalStatus == "married"){//only want to include personB's monthlyPayment fields in PV if married rather than divorced
              calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + personB.monthlyRetirementPayment + personB.monthlySurvivorPayment
            }
            for (let child of scenario.children){
              calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + child.monthlyChildPayment            
            }
          }
        }
      //if personA deceased and personB deceased, add monthlyPayment fields to annualBenefitBothDeceased
        if (personAaliveBoolean === false && personBaliveBoolean === false){
          if (calcYear.isInPast === false){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with retroactive survivor benefit application)
            for (let child of scenario.children){
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

  readyForSavedCalculationYearForFasterLoop(scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personB:Person):boolean{
    if (personA.age < 71.1 || personB.age < 71.1){
        //We call this function in december. We have already added 1 month to person's age at point where this function is called though.
        //and we want to make sure they were 70 for the ENTIRE year. So they need to be 71 and 1 month by this point basically.
      return false
    }
    for (let child of scenario.children){
      if (child.age < 19.1 && child.isOnDisability === false){
        //Ditto reasoning above, but for age 18
        return false
      }
    }
    if (scenario.benefitCutAssumption === true && calcYear.date.getFullYear() < scenario.benefitCutYear){
      return false
    }
    if ((personA.eligibleForNonCoveredPension === true && personA.entitledToNonCoveredPension === false) || (personB.eligibleForNonCoveredPension === true && personB.entitledToNonCoveredPension === false)){
      return false
    }
    return true
  }

  createSavedCalculationYearForFasterLoop(calcYear:CalculationYear):CalculationYear{
      let savedCalculationYear:CalculationYear = new CalculationYear(this.today)
      savedCalculationYear.annualBenefitBothAlive = calcYear.annualBenefitBothAlive
      savedCalculationYear.annualBenefitBothDeceased = calcYear.annualBenefitBothDeceased
      savedCalculationYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive
      savedCalculationYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive
      savedCalculationYear.tablePersonAannualRetirementBenefit = calcYear.tablePersonAannualRetirementBenefit
      savedCalculationYear.tablePersonAannualSpousalBenefit = calcYear.tablePersonAannualSpousalBenefit
      savedCalculationYear.tablePersonAannualSurvivorBenefit = calcYear.tablePersonAannualSurvivorBenefit
      savedCalculationYear.tablePersonBannualRetirementBenefit = calcYear.tablePersonBannualRetirementBenefit
      savedCalculationYear.tablePersonBannualSpousalBenefit = calcYear.tablePersonBannualSpousalBenefit
      savedCalculationYear.tablePersonBannualSurvivorBenefit = calcYear.tablePersonBannualSurvivorBenefit
      savedCalculationYear.tableTotalAnnualChildBenefitsBothParentsAlive = calcYear.tableTotalAnnualChildBenefitsBothParentsAlive
      savedCalculationYear.tableTotalAnnualChildBenefitsBothParentsDeceased = calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased
      savedCalculationYear.tableTotalAnnualChildBenefitsOnlyPersonAalive = calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive
      savedCalculationYear.tableTotalAnnualChildBenefitsOnlyPersonBalive = calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive

      return savedCalculationYear
    
  }

  useSavedCalculationYearForFasterLoop(calcYear:CalculationYear, savedCalculationYear:CalculationYear){
    calcYear.annualBenefitBothAlive = savedCalculationYear.annualBenefitBothAlive
    calcYear.annualBenefitBothDeceased = savedCalculationYear.annualBenefitBothDeceased
    calcYear.annualBenefitOnlyPersonAalive = savedCalculationYear.annualBenefitOnlyPersonAalive
    calcYear.annualBenefitOnlyPersonBalive = savedCalculationYear.annualBenefitOnlyPersonBalive
    calcYear.tablePersonAannualRetirementBenefit = savedCalculationYear.tablePersonAannualRetirementBenefit
    calcYear.tablePersonAannualSpousalBenefit = savedCalculationYear.tablePersonAannualSpousalBenefit
    calcYear.tablePersonAannualSurvivorBenefit = savedCalculationYear.tablePersonAannualSurvivorBenefit
    calcYear.tablePersonBannualRetirementBenefit = savedCalculationYear.tablePersonBannualRetirementBenefit
    calcYear.tablePersonBannualSpousalBenefit = savedCalculationYear.tablePersonBannualSpousalBenefit
    calcYear.tablePersonBannualSurvivorBenefit = savedCalculationYear.tablePersonBannualSurvivorBenefit
    calcYear.tableTotalAnnualChildBenefitsBothParentsAlive = savedCalculationYear.tableTotalAnnualChildBenefitsBothParentsAlive
    calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased = savedCalculationYear.tableTotalAnnualChildBenefitsBothParentsDeceased
    calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive = savedCalculationYear.tableTotalAnnualChildBenefitsOnlyPersonAalive
    calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive = savedCalculationYear.tableTotalAnnualChildBenefitsOnlyPersonBalive
  }

  whenShouldPVcalculationStart(scenario:CalculationScenario, personA:Person, personB?:Person):MonthYearDate{
    let startDate:MonthYearDate
    //Determine if there is a child who has not yet filed. (This is important because it might open possibility of retroactive application.)
        let childWhoHasntFiled:boolean = false
        for (let child of scenario.children){
          if (child.hasFiled === false){
            childWhoHasntFiled = true
          }
        }

    if (scenario.maritalStatus == "single"){
      if (personA.initialAge < 62 && personA.isOnDisability === false){
          if (scenario.children.length > 0){
            startDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0) //Jan 1 of age-62 year (because we have to include same number of child-survivor benefit years regardless of when retirement benefit starts).
          }
          else {//(i.e., no children) 
            startDate = new MonthYearDate(personA.retirementBenefitDate.getFullYear(), 0) //Jan1 of retirementBenefit year.
          }
      }
      else {//(i.e., person is disabled and/or over 62)
        if (childWhoHasntFiled === true || (this.today > personA.FRA && personA.hasFiled === false) ){
          startDate = new MonthYearDate(this.today.getFullYear()-1, 0) //Jan1 of last year due to retroactive app possibility
        }
        else {//i.e., no retroactive application possibility
          startDate = new MonthYearDate(this.today.getFullYear(), 0) //Jan 1 of this year
        }
      }
    }
    else if (scenario.maritalStatus == "married"){
      if (personA.initialAge < 62 && personA.isOnDisability === false && personB.initialAge < 62 && personB.isOnDisability === false){
        if (scenario.children.length > 0){
          //Jan 1 of older spouse's age-62 year (because we have to include same number of child-survivor benefit years regardless of when retirement benefit starts)
          if (personA.SSbirthDate < personB.SSbirthDate){
            startDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0)
          }
          else {
            startDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0)
          }
        }
        else {//i.e., no children
          //Jan 1 of earlier retirementBenefit year
            if (personA.retirementBenefitDate < personB.retirementBenefitDate){
              startDate = new MonthYearDate(personA.retirementBenefitDate.getFullYear(), 0)
            }
            else {
              startDate = new MonthYearDate(personB.retirementBenefitDate.getFullYear(), 0)
            }
          //...but not later than Jan1 of older person's survivorFRA year (because we have to include same number of survivor benefit years in every calc regardless of retirementBenefitDates)
            if (personA.SSbirthDate < personB.SSbirthDate && startDate > new MonthYearDate(personA.survivorFRA.getFullYear(),0) ){
              startDate = new MonthYearDate(personA.survivorFRA.getFullYear(), 0)
            }
            else if (personB.SSbirthDate < personA.SSbirthDate && startDate > new MonthYearDate(personB.survivorFRA.getFullYear(),0) ){
              startDate = new MonthYearDate(personB.survivorFRA.getFullYear(), 0)
            }
        } 
      }
      else {//(i.e., if personA or personB is disabled or over 62)
          if (childWhoHasntFiled === true || (this.today > personA.FRA && personA.hasFiled === false) || (this.today > personB.FRA && personB.hasFiled === false) ){
            startDate = new MonthYearDate(this.today.getFullYear()-1, 0) //Jan1 of last year due to retroactive app possibility
          }
          else {//i.e., no retroactive application possibility
            startDate = new MonthYearDate(this.today.getFullYear(), 0) //Jan 1 of this year
          }
      }
    }
    else if (scenario.maritalStatus == "divorced"){
      if (personA.initialAge < 62 && personA.isOnDisability === false && personB.initialAge < 62 && personB.isOnDisability === false){
        if (scenario.children.length > 0){
          //Jan 1 of older spouse's age-62 year (because we have to include same number of child and child-survivor benefit years regardless of when retirement benefit starts)
          if (personA.SSbirthDate < personB.SSbirthDate){
            startDate = new MonthYearDate(personA.SSbirthDate.getFullYear()+62, 0)
          }
          else {
            startDate = new MonthYearDate(personB.SSbirthDate.getFullYear()+62, 0)
          }
        }
        else {//i.e., no children
          //Jan 1 of personA's retirementBenefit year
            startDate = new MonthYearDate(personA.retirementBenefitDate.getFullYear(), 0)
          //...but not later than Jan1 of personA's survivorFRA year (because we have to include same number of survivor benefit years in every calc regardless of retirementBenefitDate).
            if (startDate > new MonthYearDate(personA.survivorFRA.getFullYear(),0) ){
              startDate = new MonthYearDate(personA.survivorFRA.getFullYear(),0)
            }
        }
      }
      else {//(i.e., if personA or personB is disabled or over 62)
        if (childWhoHasntFiled === true || (this.today > personA.FRA && personA.hasFiled === false)){
          startDate = new MonthYearDate(this.today.getFullYear()-1, 0) //Jan1 of last year due to retroactive app possibility
        }
        else {//i.e., no retroactive application possibility
          startDate = new MonthYearDate(this.today.getFullYear(), 0) //Jan 1 of this year
        }
      }
    }  
    return startDate
  }

  discountToPresentValue(discountRate:number, futureValue:number, thisYear:number, cashflowYear:number):number{
    let presentValue:number
    //discountRate comes in as whole number, convert to decimal
    discountRate = discountRate / 100
    //If it's a benefit from last year (retroactive) or a benefit from this year, it should just be taken at face value.
    if (cashflowYear < thisYear){
        presentValue = futureValue
      }
    else {
      //Just go by difference in year values, ignoring months.
        //For example, next year's benefits should be discounted by 1 year. Some might be as much as 23 months in future. But some might only be 1 month in future.
      presentValue = futureValue / Math.pow((1 + discountRate),(cashflowYear - thisYear))
    }
    return presentValue
  }

  findEarliestDateForPersonToStoreInRange(person:Person):MonthYearDate{
    let earliestDate:MonthYearDate
    if (person.spousalBenefitDate){
      earliestDate = new MonthYearDate(person.spousalBenefitDate)
    }
    if (person.childInCareSpousalBenefitDate){
      earliestDate = new MonthYearDate(person.childInCareSpousalBenefitDate)
    }
    if (earliestDate > person.retirementBenefitDate && person.PIA > 0) {
      earliestDate = new MonthYearDate(person.retirementBenefitDate)
    }
    if (person.endSuspensionDate > earliestDate) {
      earliestDate = new MonthYearDate(person.endSuspensionDate)
    }
    return earliestDate
  }
}
