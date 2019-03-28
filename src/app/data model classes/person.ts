import {MonthYearDate} from "./monthyearDate"
import {CalculationScenario} from "./calculationscenario"

export class Person {
    id:string
    actualBirthDate: Date
    SSbirthDate: MonthYearDate
    FRA: MonthYearDate
    survivorFRA: MonthYearDate

    PIA: number = 1000
        //If eligibleForNonCoveredPension === true, person has the two fields below, and we pick between them to determine which is the person's PIA at a given time and for a given purpose
        WEP_PIA:number
        nonWEP_PIA:number

    initialAge: number //as in, "age on the date they're filling out the form" whereas age/ageRounded/ageLastBirthday are all variables that get changed throughout process as we age the person from one year to the next
    initialAgeRounded: number
    age: number //as in, "age as of current calculation year"
    mortalityTable: number[]

    endCalcAge: number // age at which to end calculation of benefits
    endTestDate: MonthYearDate // last date at which to check possible benefit filing - at person's age 70, or assumedAgeAtDeath, if earlier
    endCalcDate: MonthYearDate // last date at which to calculate benefits

    eligibleForNonCoveredPension:boolean = false
    entitledToNonCoveredPension:boolean = false
    nonCoveredPensionDate:MonthYearDate //Date on which noncovered pension begins
    governmentPension: number = 0

    quitWorkDate: MonthYearDate = new MonthYearDate (1, 0) //This also gets set as "way in past" via resetHiddenInputs(). This default value is mostly here so tests (which dont call that function) can run.
    monthlyEarnings: number = 0
    hasHadGraceYear:boolean = false

    hasFiled:boolean = false
    isOnDisability: boolean = false //true only if disabled and expecting to be on disability until FRA

    familyMaximum: number
    AIME: number //AIME as calculated in the year that entitlement began. Only used in disability scenarios (for calculating disability-related family max)

    declineSpousal: boolean = false
    childInCareSpousal: boolean = false
    declineSuspension:boolean = false
    entitledToRetirement:boolean //just the results of whether calcYear.date >= person.retirementBenefitDate

    fixedRetirementBenefitDate: MonthYearDate //if they have already filed or are on disability and will be until FRA
    retirementBenefitDate: MonthYearDate //date for which we test various choices, if no fixed date
        DRCsViaSuspension: number = 0
        beginSuspensionDate: MonthYearDate = new MonthYearDate(1900, 0, 1) //When testing in "one is fixed" maximize functions, this is basically just going to be "FRA but no earlier than today"   Benefit IS suspended for this month
        endSuspensionDate: MonthYearDate = new MonthYearDate(1900, 0, 1) //this is a variable that will be iterated. Benefit is NOT suspended for this month
        suspendingBenefits:boolean = false //Is true if they will be suspending benefits at all during a particular PV calc.
    spousalBenefitDate: MonthYearDate
    adjustedRetirementBenefitDate: MonthYearDate
    adjustedSpousalBenefitDate: MonthYearDate

    childBenefitDate:MonthYearDate

    //benefit amount fields. benefit amount just gets overwritten when recalculated
    retirementBenefit:number = 0
    nonWEPretirementBenefit:number //This is what their retirement benefit WOULD have been without WEP. This is only used for determining survivor benefits on their work record.
    monthlyRetirementPayment:number = 0
    monthlySpousalPayment:number = 0
    monthlySurvivorPayment:number = 0
    monthlyChildPayment:number = 0
        originalBenefit:number = 0 //"original benefit" in the sense as used in family max application. (That is, this is a number that can change from one month to the next.)
    retirementARFcreditingMonths:number = 0 //for earnings test
    spousalARFcreditingMonths:number = 0 //for earnings test and for months with child-in-care: (See POMS RS 00615.482)

    constructor(id:string){
        this.id = id
    }

  probabilityAliveArray: number[] = null
  probabilityAliveBaseDate: MonthYearDate
  probabilityAliveBaseYear: number
  probabilityAliveLatestYear: number

  setEndDates(scenario: CalculationScenario) {
    let deceasedByAge: number = this.mortalityTable.findIndex(item => item == 0)
    if (deceasedByAge > 70) {
      this.endTestDate = new MonthYearDate(this.SSbirthDate.getFullYear() + 70, this.SSbirthDate.getMonth())
    } else {
      // If they chose assumed death at 68, "deceasedByAge" will be 69. 
      // But we want last possible filing date suggested to be 68, so we subtract 1 in following line.          
      // TODO: could determine when benefits to children end, but take maximum, just to be safe 
      this.endTestDate = new MonthYearDate(this.SSbirthDate.getFullYear() + deceasedByAge - 1, this.SSbirthDate.getMonth())
    }
    if (scenario.children.length > 0) {
      // may need to calculate to maximum age if there is a disabled child
      // TODO: check for disabled 
      // TODO: If no disabled children, set endCalcDate to later of deceasedByDate or date youngest child turns 18
      this.endCalcAge = 115
      this.endCalcDate = new MonthYearDate(this.SSbirthDate.getFullYear() + 115, this.SSbirthDate.getMonth())
    } else {
      this.endCalcAge = deceasedByAge
      this.endCalcDate = new MonthYearDate(this.SSbirthDate.getFullYear() + deceasedByAge, this.SSbirthDate.getMonth())
    }
  }

  // returns the Social Security age in years (with fraction for partial year) of this person at the given date 
  ssAgeAtDate(date: MonthYearDate): number {
    let age: number = (date.getFullYear() - this.SSbirthDate.getFullYear())
      + (date.getMonth() - this.SSbirthDate.getMonth()) / 12
    return age
  }

  // returns the Social Security age in years (with fraction for partial year) of this person at the start of the given year 
  ssAgeAtBeginYear(year: number) {
    let age: number = (year - this.SSbirthDate.getFullYear())
      - this.SSbirthDate.getMonth() / 12
    return age
  }

  probabilityAliveAtBeginYear(year: number): number {
    // NOTE: Before calling this function, ensure that this.probabilityAliveArray exists 
    // and is based on the parameters of the scenario 
    let probability: number
    let birthYear = this.SSbirthDate.getFullYear()
    // a rather complicated check for the unlikely possibilty of checking before the person was born
    if ((year < birthYear) || ((year == birthYear) && (this.SSbirthDate.getMonth() > 0))) {
      probability = 0 // before birthdate
    } else if (year <= this.probabilityAliveBaseYear) {
      probability = 1
    } else if (year >= this.probabilityAliveLatestYear) {
      probability = 0
    } else {
      probability = this.probabilityAliveArray[year - this.probabilityAliveBaseYear]
    }
    return probability
  }

  // initializes array containing probability of this person being alive at the beginning of a given year
  // baseDate is the date to which probabilities are referenced, typically the date at which calculations are being made
  // Initializing the probabilityAliveArray and using it to calculate year-begin probabilityAlive will not save 
  // much time (if any) on a single PV calculation, but it should save considerable time in a maximizePV calculation
  initializeProbabilityAliveArray(baseDate: MonthYearDate): void {
    //Calculate probability of being alive at beginning of each year from baseDate to last year of mortality table

    this.probabilityAliveArray = new Array() as Array<number>
    // this.probabilityAliveArray: number[100]
    this.probabilityAliveBaseDate = baseDate
    let baseAge: number = this.ssAgeAtDate(baseDate)
    let baseIndex: number = Math.floor(baseAge)
    let arrayYear = baseDate.getFullYear()
    this.probabilityAliveBaseYear = arrayYear

    let birthMonth = this.SSbirthDate.getMonth()
    this.probabilityAliveLatestYear = this.probabilityAliveBaseYear

    // determine the number of people in the mortality table at baseAge
    let baseFraction: number = baseAge % 1 // the fraction portion of baseAge
    let baseYearCount = this.mortalityTable[baseIndex]
    let nextYearCount = this.mortalityTable[baseIndex + 1]
    let baseCount: number = baseYearCount - (baseYearCount - nextYearCount) * baseFraction

    // the factor by which to multiply the person count at the beginning of each year to calculate probability at that year
    // We create a factor so we can multiply rather than divide because multiplication is usually faster than dividing
    let baseFactor: number = 1 / baseCount

    let beginFraction // fractional part of age at beginning of each full year
    if (birthMonth == 0) {
      beginFraction = 0
    } else {
      beginFraction = (12 - birthMonth) / 12
    }

    // first array entry is always 1
    this.probabilityAliveArray.push(1)

    // start calculating at the year after the base year
    let mortalityIndex = Math.floor(this.ssAgeAtBeginYear(this.probabilityAliveBaseYear)) + 1

    let thisCount = this.mortalityTable[mortalityIndex]
    let nextCount: number
    let countAtAge: number
    let probabilityAlive: number

    while (thisCount > 0) { // some people still alive at arrayYear
      mortalityIndex++
      arrayYear++
      nextCount = this.mortalityTable[mortalityIndex]
      countAtAge = thisCount - ((thisCount - nextCount) * beginFraction)
      probabilityAlive = countAtAge * baseFactor
      this.probabilityAliveArray.push(probabilityAlive)
      thisCount = nextCount
    }

    // last array element will be 0
    this.probabilityAliveArray.push(0)
    this.probabilityAliveLatestYear = this.probabilityAliveBaseYear + this.probabilityAliveArray.length - 1

  }


}

