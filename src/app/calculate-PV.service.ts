import {Injectable} from '@angular/core'
import {BenefitService} from './benefit.service'
import {MortalityService} from './mortality.service'
import {EarningsTestService} from './earningstest.service'
import {SolutionSetService} from './solutionset.service'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {CalculationYear} from './data model classes/calculationyear'
import {OutputTableService} from './outputtable.service'
import {MonthYearDate} from "./data model classes/monthyearDate"
import {FamilyMaximumService} from './familymaximum.service'
import {BirthdayService} from './birthday.service'
import { ClaimStrategy } from './data model classes/claimStrategy'


@Injectable()
export class CalculatePvService {

  today: MonthYearDate = new MonthYearDate()
  sixMonthsAgo:MonthYearDate
  twelveMonthsAgo:MonthYearDate

  constructor(private birthdayService:BirthdayService, private benefitService: BenefitService, private mortalityService:MortalityService, private earningsTestService: EarningsTestService,
    private familyMaximumService:FamilyMaximumService, private outputTableService: OutputTableService) {
      this.setToday(new MonthYearDate())
    }

    setToday(today:MonthYearDate){
      this.today = new MonthYearDate(today)
      this.sixMonthsAgo = new MonthYearDate(today)
      this.sixMonthsAgo.setMonth(this.sixMonthsAgo.getMonth()-6)
      this.twelveMonthsAgo = new MonthYearDate(today)
      this.twelveMonthsAgo.setFullYear(this.twelveMonthsAgo.getFullYear()-1)
    }


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
            this.earningsTestService.addBackOverwithholding(calcYear, scenario, person)

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
    personA.adjustedSurvivorBenefitDate = new MonthYearDate(personA.survivorBenefitDate)
    personB.adjustedSurvivorBenefitDate = new MonthYearDate(personB.survivorBenefitDate)
    personA.DRCsViaSuspension = 0
    personB.DRCsViaSuspension = 0
    personA.retirementARFcreditingMonths = 0
    personA.spousalARFcreditingMonths = 0
    personA.survivorARFcreditingMonths = 0
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
        //Alternatively, if personA is already widow(er), then children already entitled on personB, so it's just personA's retirementBenefitDate
          if (personA.retirementBenefitDate > personB.retirementBenefitDate || scenario.maritalStatus == "survivor"){
            this.familyMaximumService.calculateCombinedFamilyMaximum(personA, personB, personA.retirementBenefitDate.getFullYear())
          }
          else {
            this.familyMaximumService.calculateCombinedFamilyMaximum(personA, personB, personB.retirementBenefitDate.getFullYear())
          }
      
    //Determine whether either person will be getting child-in-care spousal benefits
        if (scenario.children.length > 0 && (scenario.maritalStatus == "married" || scenario.maritalStatus == "divorced")){//there are children, and not a scenario where personA is already widow(er)
          personA.childInCareSpousal = false //reset to false, then check if it should be true
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
            //Apply deductions and reductions as necessary
              this.applyDeductionsAndReductions(scenario, calcYear, personA, true, personB, true)
            //add everybody's monthlyPayment fields to appropriate annual totals (annualBenefitBothAlive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, true, personB, true, printOutputTable)
      //Assume personA is alive and personB is deceased
            //calculate "original benefit" amounts for each person (spousal/survivor amounts not yet reduced for family max, own entitlement, age, or GPO)
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, true, personB, false)
            //Apply deductions and reductions as necessary
              this.applyDeductionsAndReductions(scenario, calcYear, personA, true, personB, false)
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitOnlyPersonAalive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, true, personB, false, printOutputTable)
      //Assume personA is deceased and personB is alive
            //calculate "original benefit" amounts for each person (spousal/survivor amounts not yet reduced for family max, own entitlement, age, or GPO)
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, false, personB, true)
            //Apply deductions and reductions as necessary
              this.applyDeductionsAndReductions(scenario, calcYear, personA, false, personB, true)
            //add everybody's monthlyPayment fields to appropriate annual total (annualBenefitOnlyPersonBalive for PV calc and appropriate table sum for table output)
              this.addMonthlyPaymentAmountsToApplicableSumsForCouple(scenario, calcYear, personA, false, personB, true, printOutputTable)
      //Assume personA and personB are deceased
            //calculate "original benefit" amounts for each person
              this.benefitService.calculateMonthlyPaymentsCouple(scenario, calcYear, personA, false, personB, false)
            //Adjust each person's monthlyPayment as necessary for family max
              this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, false, personB, false)
            //Family max is only deduction/reduction necessary in "both parents deceased" case
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
        this.earningsTestService.addBackOverwithholding(calcYear, scenario, personA)

            //If printOutputTable is true, add row to output table.
              if (printOutputTable === true && scenario.maritalStatus == "married"){
                claimStrategy = this.outputTableService.generateOutputTableCouple(personA, personB, claimStrategy, scenario, calcYear)
              }
              if (printOutputTable === true && scenario.maritalStatus == "divorced"){
                claimStrategy = this.outputTableService.generateOutputTableDivorced(personA, claimStrategy, scenario, calcYear)
              }
              if (printOutputTable === true && scenario.maritalStatus == "survivor"){
                claimStrategy = this.outputTableService.generateOutputTableSurvivor(personA, claimStrategy, scenario, calcYear)
              }

            //Calculate each person's probability of being alive at end of age in question. (Have to use age-1 here because we want their age as of beginning of year.)
              let probabilityAalive:number = this.mortalityService.calculateProbabilityAlive(scenario, personA, personA.age-1, personB)
              let probabilityBalive:number = this.mortalityService.calculateProbabilityAlive(scenario, personB, personB.age-1, personA)
              if (scenario.maritalStatus == "survivor"){probabilityBalive = 0}

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
      //Determine if there is a child who has not yet filed when calculator is being used. (This is important because it might open possibility of retroactive application.)
      let childWhoHasntFiled:boolean = false
      for (let child of scenario.children){
        if (child.hasFiled === false){
          childWhoHasntFiled = true
        }
      }

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
          //if a benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e., not because of a prior filing)
          if (calcYear.isInPast === false || (scenario.maritalStatus == "survivor" && personA.hasFiled === false && personA.isOnDisability === false)){
            calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + personA.monthlyRetirementPayment
          }
          if (calcYear.isInPast === false || (scenario.maritalStatus == "survivor" && personA.hasFiledAsSurvivor === false)){
            calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + personA.monthlySurvivorPayment
          }
          if (calcYear.isInPast === false || (scenario.maritalStatus == "survivor" && personA.hasFiledAsMotherFather === false)){
            calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + personA.monthlyMotherFatherPayment
          }
          for (let child of scenario.children){
            if (calcYear.isInPast === false || child.hasFiled === false)
            calcYear.annualBenefitOnlyPersonAalive = calcYear.annualBenefitOnlyPersonAalive + child.monthlyChildPayment
          }
        }
      //if personA deceased and personB alive, add monthlyPayment fields to annualBenefitOnlyPersonBalive
        if (personAaliveBoolean === false && personBaliveBoolean === true){
          //if a benefit is for a month in the past, only want to include it in PV calc if it's from a retroactive application (i.e., not because of a prior filing)
            //Also, we only want to include any of personB's own benefits in PV calc if it's not a divorce scenario
            if (scenario.maritalStatus !== "divorced"){
              if (calcYear.isInPast === false || (scenario.maritalStatus == "survivor" && personB.hasFiled === false && personB.isOnDisability === false)){
                calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + personB.monthlyRetirementPayment
              }
              if (calcYear.isInPast === false || (scenario.maritalStatus == "survivor" && personB.hasFiledAsSurvivor === false)){
                calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + personB.monthlySurvivorPayment
              }
              if (calcYear.isInPast === false || (scenario.maritalStatus == "survivor" && personB.hasFiledAsMotherFather === false)){
                calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + personB.monthlyMotherFatherPayment
              }
            }
          for (let child of scenario.children){
            if (calcYear.isInPast === false || child.hasFiled === false)
            calcYear.annualBenefitOnlyPersonBalive = calcYear.annualBenefitOnlyPersonBalive + child.monthlyChildPayment
          }
        }
      //if personA deceased and personB deceased, add monthlyPayment fields to annualBenefitBothDeceased
        if (personAaliveBoolean === false && personBaliveBoolean === false){
          if (calcYear.isInPast === false){//only want to include it in PV calc if it's for a month no earlier than today (calculator will never be dealing with scenario where both parents are deceased and child is filing retroactive survivor application)
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
          calcYear.tablePersonAannualRetirementBenefitOnlyAalive = calcYear.tablePersonAannualRetirementBenefitOnlyAalive + personA.monthlyRetirementPayment
          calcYear.tablePersonAannualSurvivorBenefit = calcYear.tablePersonAannualSurvivorBenefit + personA.monthlySurvivorPayment
          calcYear.tablePersonAannualMotherFatherBenefit = calcYear.tablePersonAannualMotherFatherBenefit + personA.monthlyMotherFatherPayment
          for (let child of scenario.children){
            calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive = calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive + child.monthlyChildPayment
          }
        }
        if (personAaliveBoolean === false && personBaliveBoolean === true){
          calcYear.tablePersonBannualSurvivorBenefit = calcYear.tablePersonBannualSurvivorBenefit + personB.monthlySurvivorPayment
          calcYear.tablePersonBannualMotherFatherBenefit = calcYear.tablePersonBannualMotherFatherBenefit + personB.monthlyMotherFatherPayment
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

      //if printOutputTable is true, and this is survivor scenario, and right now we're doing calc for personAalive=true and personBalive=false...
      if (printOutputTable === true && scenario.maritalStatus=="survivor" && personAaliveBoolean === true && personBaliveBoolean === false){
        //if this is personA's survivorBenefitDate, pass along monthlySurvivorPayment for the sake of generating the solution set (need to know if benefit > 0)
        if (calcYear.date.valueOf() == personA.survivorBenefitDate.valueOf()){
          personA.survivorBenefitInMonthOfEntitlement = personA.monthlySurvivorPayment
        }
        //if this is personA's motherFatherBenefitDate, pass along monthlyMotherFatherPayment for same reason as above
        if (personA.motherFatherBenefitDate && calcYear.date.valueOf() == personA.motherFatherBenefitDate.valueOf()){
          personA.motherFatherBenefitInMonthOfEntitlement = personA.monthlyMotherFatherPayment
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
      savedCalculationYear.tablePersonAannualRetirementBenefitOnlyAalive = calcYear.tablePersonAannualRetirementBenefitOnlyAalive
      savedCalculationYear.tablePersonAannualSpousalBenefit = calcYear.tablePersonAannualSpousalBenefit
      savedCalculationYear.tablePersonAannualSurvivorBenefit = calcYear.tablePersonAannualSurvivorBenefit
      savedCalculationYear.tablePersonAannualMotherFatherBenefit = calcYear.tablePersonAannualMotherFatherBenefit
      savedCalculationYear.tablePersonBannualRetirementBenefit = calcYear.tablePersonBannualRetirementBenefit
      savedCalculationYear.tablePersonBannualSpousalBenefit = calcYear.tablePersonBannualSpousalBenefit
      savedCalculationYear.tablePersonBannualSurvivorBenefit = calcYear.tablePersonBannualSurvivorBenefit
      savedCalculationYear.tablePersonBannualMotherFatherBenefit = calcYear.tablePersonBannualMotherFatherBenefit
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
    calcYear.tablePersonAannualRetirementBenefitOnlyAalive = savedCalculationYear.tablePersonAannualRetirementBenefitOnlyAalive
    calcYear.tablePersonAannualSpousalBenefit = savedCalculationYear.tablePersonAannualSpousalBenefit
    calcYear.tablePersonAannualSurvivorBenefit = savedCalculationYear.tablePersonAannualSurvivorBenefit
    calcYear.tablePersonAannualMotherFatherBenefit = savedCalculationYear.tablePersonAannualMotherFatherBenefit
    calcYear.tablePersonBannualRetirementBenefit = savedCalculationYear.tablePersonBannualRetirementBenefit
    calcYear.tablePersonBannualSpousalBenefit = savedCalculationYear.tablePersonBannualSpousalBenefit
    calcYear.tablePersonBannualSurvivorBenefit = savedCalculationYear.tablePersonBannualSurvivorBenefit
    calcYear.tablePersonBannualMotherFatherBenefit = savedCalculationYear.tablePersonBannualMotherFatherBenefit
    calcYear.tableTotalAnnualChildBenefitsBothParentsAlive = savedCalculationYear.tableTotalAnnualChildBenefitsBothParentsAlive
    calcYear.tableTotalAnnualChildBenefitsBothParentsDeceased = savedCalculationYear.tableTotalAnnualChildBenefitsBothParentsDeceased
    calcYear.tableTotalAnnualChildBenefitsOnlyPersonAalive = savedCalculationYear.tableTotalAnnualChildBenefitsOnlyPersonAalive
    calcYear.tableTotalAnnualChildBenefitsOnlyPersonBalive = savedCalculationYear.tableTotalAnnualChildBenefitsOnlyPersonBalive
  }

  whenShouldPVcalculationStart(scenario:CalculationScenario, personA:Person, personB?:Person):MonthYearDate{
    let startDate:MonthYearDate
    let childUnder16orDisabled:boolean = this.birthdayService.checkForChildUnder16orDisabledOnGivenDate(scenario, this.today)
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

    else if (scenario.maritalStatus == "survivor"){
      //If possibility for retroactive application into last year, Jan 1 of last year
      if (//possible retroactive cases:
        (this.today >= personA.FRA) //personA can file retroactively for retirement because they have reached FRA
        || ( //or...
        personB.dateOfDeath.getFullYear() < this.today.getFullYear() && //personB died last year or earlier and...
          (childWhoHasntFiled === true //Child can file retroactive
          || (personA.isOnDisability === true && personA.initialAge >= 50 && personA.hasFiledAsSurvivor === false) //or personA can file retroactive survivor because they're disabled and at least age 50 (such that "no retroactive before FRA" rule doesn't apply)
          || (childUnder16orDisabled === true && personA.hasFiledAsMotherFather === false)) //or personA can file retroactive mother/father
        )
      ){
        startDate = new MonthYearDate(this.today.getFullYear()-1, 0)//Jan 1 of last year
      }
      else { //(i.e., no possibility for retroactive application into last year) 
        //Jan1 of retirementBenefitDate year or Jan1 of survivorBenefitDate year if earlier
        if (personA.retirementBenefitDate < personA.survivorBenefitDate){
          startDate = new MonthYearDate(personA.retirementBenefitDate.getFullYear(), 0)
        }
        else {
          startDate = new MonthYearDate(personA.survivorBenefitDate.getFullYear(), 0)
        }
        //...but no later than Jan1 of this year if there's a child under 16 or disabled (because there will be child benefits and mother/father benefits this year).
        if (childUnder16orDisabled === true && startDate > new MonthYearDate(this.today.getFullYear(), 0)){
          startDate = new MonthYearDate(this.today.getFullYear(), 0)//Jan 1 of this year
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
    if (cashflowYear <= thisYear){
        presentValue = futureValue
      }
    else {
      //Just go by difference in year values, ignoring months.
        //For example, next year's benefits should be discounted by 1 year. Some might be as much as 23 months in future. But some might only be 1 month in future.
      presentValue = futureValue / Math.pow((1 + discountRate),(cashflowYear - thisYear))
    }
    return presentValue
  }

  applyDeductionsAndReductions(scenario:CalculationScenario, calcYear:CalculationYear, personA:Person, personAaliveBoolean:boolean, personB:Person, personBaliveBoolean:boolean){
    //See OrderOfReductions.txt for a discussion of the reasoning behind all this
    if (personAaliveBoolean === true && personBaliveBoolean === true){
        //Adjust each person's monthlyPayment as necessary for family max
          this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
        //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
          this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForOwnEntitlement(personA, personB)
        //Redo family max application
          this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
        //Adjust spousal monthlyPayment fields as necessary for age
          this.benefitService.adjustSpousalBenefitsForAge(scenario, personA, personB)
        //Adjust as necessary for earnings test (and tally months withheld)
          this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
        //Adjust spousal/survivor monthlyPayment fields for GPO
          this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForGPO(personA, personB)
    }
    else if (personAaliveBoolean === true && personBaliveBoolean === false){
        //If there is no reduction for age...
        if (personA.survivorBenefitDate >= personA.survivorFRA || calcYear.date < personA.survivorBenefitDate){
          //There's no spousal right now, since we're assuming B is deceased. So "no reduction for age" just means personA isn't getting widow(er) yet, or personA reached FRA before filing for widow(er).
            //Mother/father not an issue, since it's not reduced for age.
          //Adjust each person's monthlyPayment as necessary for family max
            this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust survivor benefit for RIB-LIM (i.e., for early entitlement of deceased person, if applicable)
            this.benefitService.adjustSurvivorBenefitsForRIB_LIM(personA, personB)
          //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForOwnEntitlement(personA, personB)
          //Adjust as necessary for earnings test (and tally months withheld)
            this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Redo family max application
            this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust spousal/survivor monthlyPayment fields for GPO
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForGPO(personA, personB)
        }
        else {//i.e., there is reduction for age
          //Adjust each person's monthlyPayment as necessary for family max
            this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Redo family max application
            this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust survivor benefit for age (i.e., for early entitlement of still-living person, if applicable)
            personA = this.benefitService.adjustSurvivorBenefitsForAge(scenario, personA)
          //Adjust survivor benefit for RIB-LIM (i.e., for early entitlement of deceased person, if applicable)
            this.benefitService.adjustSurvivorBenefitsForRIB_LIM(personA, personB)
          //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForOwnEntitlement(personA, personB)
          //Adjust as necessary for earnings test (and tally months withheld)
            this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust spousal/survivor monthlyPayment fields for GPO
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForGPO(personA, personB)
        }
    }
    else if (personAaliveBoolean === false && personBaliveBoolean === true){
        //If there is no reduction for age...
        if (personB.survivorBenefitDate >= personB.survivorFRA || calcYear.date < personB.survivorBenefitDate){
          //There's no spousal right now, since we're assuming A is deceased. So "no reduction for age" just means personB isn't getting widow(er) yet, or personB reached FRA before filing for widow(er).
            //Mother/father not an issue, since it's not reduced for age.
          //Adjust each person's monthlyPayment as necessary for family max
            this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust survivor benefit for RIB-LIM (i.e., for early entitlement of deceased person, if applicable)
            this.benefitService.adjustSurvivorBenefitsForRIB_LIM(personB, personA)
          //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForOwnEntitlement(personA, personB)
          //Adjust as necessary for earnings test (and tally months withheld)
            this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Redo family max application
            this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust spousal/survivor monthlyPayment fields for GPO
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForGPO(personA, personB)
        }
        else {//i.e., there is reduction for age
          //Adjust each person's monthlyPayment as necessary for family max
            this.familyMaximumService.applyFamilyMaximumCouple(1, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Redo family max application
            this.familyMaximumService.applyFamilyMaximumCouple(2, scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust survivor benefit for age (i.e., for early entitlement of still-living person, if applicable)
            personA = this.benefitService.adjustSurvivorBenefitsForAge(scenario, personB)
          //Adjust survivor benefit for RIB-LIM (i.e., for early entitlement of deceased person, if applicable)
            this.benefitService.adjustSurvivorBenefitsForRIB_LIM(personB, personA)
          //Adjust spousal/survivor monthlyPayment fields as necessary for own entitlement
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForOwnEntitlement(personA, personB)
          //Adjust as necessary for earnings test (and tally months withheld)
            this.earningsTestService.applyEarningsTestCouple(scenario, calcYear, personA, personAaliveBoolean, personB, personBaliveBoolean)
          //Adjust spousal/survivor monthlyPayment fields for GPO
            this.benefitService.adjustSpousalSurvivorMotherFatherBenefitsForGPO(personA, personB)
        }
    }
  }








}
