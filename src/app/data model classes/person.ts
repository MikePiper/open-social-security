import {MonthYearDate} from "./monthyearDate"

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
    baseMortalityFactor: number //calculated as 1/lives remaining at initial age. We multiply this factor by livesRemaining at given age to determine probabilityAlive at that age. 
    age: number //as in, "age as of current calculation year"
    mortalityTable: number[]

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
    childInCareSpousal: boolean = false//reflects whether a person will be getting child-in-care spousal benefits at any point during the PV calculation. Doesn't reflect whether they're getting them on any particular date.
    declineSuspension:boolean = false
    entitledToRetirement:boolean //just the results of whether calcYear.date >= person.retirementBenefitDate

    fixedRetirementBenefitDate: MonthYearDate //if they have already filed or are on disability and will be until FRA
    retirementBenefitDate: MonthYearDate //date for which we test various choices, if no fixed date
        DRCsViaSuspension: number = 0
        beginSuspensionDate: MonthYearDate = new MonthYearDate(1900, 0, 1) //When testing in "one is fixed" maximize functions, this is basically just going to be "FRA but no earlier than today"   Benefit IS suspended for this month
        endSuspensionDate: MonthYearDate = new MonthYearDate(1900, 0, 1) //this is a variable that will be iterated. Benefit is NOT suspended for this month
        suspendingBenefits:boolean = false //Is true if they will be suspending benefits at all during a particular PV calc.
    spousalBenefitDate: MonthYearDate //if there is a child in care, this represents the date on which normal (non-child-in-care spousal benefits) would begin
    childInCareSpousalBenefitDate: MonthYearDate
    adjustedRetirementBenefitDate: MonthYearDate //adjusted as in "after ARF" from earnings test
    adjustedSpousalBenefitDate: MonthYearDate //adjusted as in "after ARF" from earnings test
    survivorBenefitDate: MonthYearDate //used in cases in which person using calculator is already widow(er). Vary this date and retirementBenefitDate in maximize function
 
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

}

