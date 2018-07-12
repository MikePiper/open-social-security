export class Person {
    id:string

    actualBirthDate: Date
    PIA: number = 1000

    SSbirthDate: Date
    FRA: Date
    survivorFRA: Date

    initialAge: number //as in, "age on the date they're filling out the form" whereas age/ageRounded/ageLastBirthday are all variables that get changed throughout process as we age the person from one year to the next
    initialAgeRounded: number
    //age: number //as in, "age as of current calculation year"
    //ageRounded: number
    //ageLastBirthday: number

    mortalityTable: number[]

    governmentPension: number = 0

    quitWorkDate: Date
    monthlyEarnings: number = 0
    hasHadGraceYear:boolean = false

    initialRetirementBenefit: number = 0
    retirementBenefitAfterARF: number = 0
    retirementBenefitWithDRCsfromSuspension: number = 0

    spousalBenefitWithoutRetirement: number = 0
    spousalBenefitWithRetirement: number = 0
    survivorBenefitWithoutRetirement: number = 0
    survivorBenefitWithRetirement: number = 0


    spousalBenefitWithoutRetirementAfterARF: number = 0
    spousalBenefitWithRetirementAfterARF: number = 0
    survivorBenefitWithoutRetirementAfterARF: number = 0
    survivorBenefitWithRetirementAfterARF: number = 0

    retirementBenefitDate: Date
        DRCsViaSuspension: number = 0
        beginSuspensionDate: Date = new Date(1900, 0, 1) //When testing in "one is fixed" maximize functions, this is basically just going to be "FRA but no earlier than today"   Benefit IS suspended for this month
        endSuspensionDate: Date = new Date(1900, 0, 1) //this is a variable that will be iterated      Benefit is NOT suspended for this month
    spousalBenefitDate: Date
    adjustedRetirementBenefitDate: Date
    adjustedSpousalBenefitDate: Date

    constructor(id:string){
        this.id = id
    }

}

