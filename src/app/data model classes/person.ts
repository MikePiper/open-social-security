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
    governmentPension: number = 0
    quitWorkDate: MonthYearDate = new MonthYearDate (1, 0, 1) //This also gets set as "way in past" via resetHiddenInputs(). This default value is mostly here so tests (which dont call that function) can run.
    monthlyEarnings: number = 0
    hasFiled:boolean = false
    isOnDisability: boolean = false //true only if disabled and expecting to be on disability until FRA
    familyMaximum: number
    AIME: number //AIME as calculated in the year that entitlement began. Only used in disability scenarios (for calculating disability-related family max)
    declineSpousal: boolean = false
    declineSuspension:boolean = false

    //Everything below has to get reset or recalculated for each PV calc
        age: number //as in, "age as of current calculation year"
        hasHadGraceYear:boolean = false

        //These are all the fields that will get eliminated
            initialRetirementBenefit: number = 0 //Can be calculated immediately in PV calc.
            retirementBenefitAfterARF: number = 0 //Can be calculated after we know Person's earnings test results (i.e., once they reach their FRA)
            retirementBenefitWithDRCsfromSuspension: number = 0 //Can be calculated after we know person's earnings test results and after endSuspension date has been reached.

            spousalBenefitWithoutRetirement: number = 0 //By definition this is after-ARF. Can be calculated immediately.
            spousalBenefitWithRetirementPreARF: number = 0 //Can be calculated immediately.
            spousalBenefitWithRetirementAfterARF: number = 0 //Can be calculated after we know Person's earnings test results (i.e., once they reach their FRA)
            spousalBenefitWithSuspensionDRCRetirement: number = 0 //Can be calculated after we know person's earnings test results and after endSuspension date has been reached.

            //Survivor benefit amounts have to get recalculated when *either* person reaches their FRA or end suspension date
            survivorBenefitWithoutRetirement: number = 0 //This is after ARF also, since we're assuming survivor benefits aren't claimed until FRA.
            survivorBenefitWithRetirementPreARF: number = 0
            survivorBenefitWithRetirementAfterARF: number = 0
            survivorBenefitWithSuspensionDRCRetirement: number = 0

    fixedRetirementBenefitDate: MonthYearDate //if they have already filed or are on disability and will be until FRA
    retirementBenefitDate: MonthYearDate //date for which we test various choices, if no fixed date
        DRCsViaSuspension: number = 0
        beginSuspensionDate: MonthYearDate = new MonthYearDate(1900, 0, 1) //When testing in "one is fixed" maximize functions, this is basically just going to be "FRA but no earlier than today"   Benefit IS suspended for this month
        endSuspensionDate: MonthYearDate = new MonthYearDate(1900, 0, 1) //this is a variable that will be iterated. Benefit is NOT suspended for this month
    spousalBenefitDate: MonthYearDate
    adjustedRetirementBenefitDate: MonthYearDate
    adjustedSpousalBenefitDate: MonthYearDate

    childBenefitDate:MonthYearDate

    //new benefit amount fields -- for using in new system where benefit amount just gets overwritten when recalculated
    retirementBenefit:number = 0
    monthlyRetirementPayment:number = 0
    monthlySpousalPayment:number = 0
    monthlySurvivorPayment:number = 0
    monthlyChildPayment:number = 0
        originalBenefit:number = 0 //"original benefit" in the sense as used in family max application. (That is, this is a number that can change from one month to the next.)
    monthsRetirementWithheld:number = 0 //for earnings test
    monthsSpousalWithheld:number = 0 //for earnings test

    constructor(id:string){
        this.id = id
    }

}

