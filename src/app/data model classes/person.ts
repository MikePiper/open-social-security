import {MonthYearDate} from "./monthyearDate"

export class Person {
    //fixed fields
    id:string
    actualBirthDate: Date
    PIA: number = 1000
    SSbirthDate: MonthYearDate
    FRA: MonthYearDate
    survivorFRA: MonthYearDate
    initialAge: number //as in, "age on the date they're filling out the form" whereas age/ageRounded/ageLastBirthday are all variables that get changed throughout process as we age the person from one year to the next
    initialAgeRounded: number
    mortalityTable: number[]
    receivesNonCoveredPension: boolean = false
    governmentPension: number = 0
    nonWEP_PIA: number = 0 //This is the PIA *without* WEP, used for calculating survivor benefits on this person's work record.
    nonWEPretirementBenefit:number //The person will never actually receive this. It is what their retirement benefit WOULD have been without WEP. Calculated for use in determining survivor benefits on their work record.
    quitWorkDate: MonthYearDate = new MonthYearDate (1, 0, 1) //This also gets set as "way in past" via resetHiddenInputs(). This default value is mostly here so tests (which dont call that function) can run.
    monthlyEarnings: number = 0
    hasFiled:boolean = false
    isOnDisability: boolean = false //true only if disabled and expecting to be on disability until FRA
    familyMaximum: number
    AIME: number //AIME as calculated in the year that entitlement began. Only used in disability scenarios (for calculating disability-related family max)
    declineSpousal: boolean = false
    childInCareSpousal: boolean = false
    declineSuspension:boolean = false
    entitledToRetirement:boolean //just the results of whether calcYear.date >= person.retirementBenefitDate


    //Everything below has to get reset or recalculated for each PV calc
        age: number //as in, "age as of current calculation year"
        hasHadGraceYear:boolean = false


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

