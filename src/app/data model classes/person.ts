export class Person {
    //fixed fields
    id:string
    actualBirthDate: Date
    PIA: number = 1000
    SSbirthDate: Date
    FRA: Date
    survivorFRA: Date
    initialAge: number //as in, "age on the date they're filling out the form" whereas age/ageRounded/ageLastBirthday are all variables that get changed throughout process as we age the person from one year to the next
    initialAgeRounded: number
    mortalityTable: number[]
    governmentPension: number = 0
    quitWorkDate: Date
    monthlyEarnings: number = 0
    isDisabled: boolean = false //true only if disabled and expecting to be on disability until FRA



    //ageRounded: number
    //ageLastBirthday: number

    //Everything below has to get reset or recalculated for each PV calc
    age: number //as in, "age as of current calculation year"
    hasHadGraceYear:boolean = false

    initialRetirementBenefit: number = 0
    retirementBenefitAfterARF: number = 0
    retirementBenefitWithDRCsfromSuspension: number = 0

    spousalBenefitWithoutRetirement: number = 0 //By definition this is after-ARF.
    spousalBenefitWithRetirementPreARF: number = 0
    spousalBenefitWithRetirementAfterARF: number = 0
    spousalBenefitWithSuspensionDRCRetirement: number = 0

    survivorBenefitWithoutRetirement: number = 0 //This is after ARF also, since we're assuming survivor benefits aren't claimed until FRA.
    survivorBenefitWithRetirementPreARF: number = 0
    survivorBenefitWithRetirementAfterARF: number = 0
    survivorBenefitWithSuspensionDRCRetirement: number = 0

    fixedRetirementBenefitDate: Date //if they have already filed or are on disability and will be until FRA
    retirementBenefitDate: Date //date for which we test various choices, if no fixed date
        DRCsViaSuspension: number = 0
        beginSuspensionDate: Date = new Date(1900, 0, 1) //When testing in "one is fixed" maximize functions, this is basically just going to be "FRA but no earlier than today"   Benefit IS suspended for this month
        endSuspensionDate: Date = new Date(1900, 0, 1) //this is a variable that will be iterated. Benefit is NOT suspended for this month
    spousalBenefitDate: Date
    adjustedRetirementBenefitDate: Date
    adjustedSpousalBenefitDate: Date

    constructor(id:string){
        this.id = id
    }

}

