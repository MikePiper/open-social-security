export class Person {
    actualBirthDate: Date
    PIA: number = 1000

    SSbirthDate: Date
    FRA: Date
    survivorFRA: Date

    //age: number
    //ageRounded: number
    //ageLastBirthday: number
    initialAge: number //as in, "age on the date they're filling out the form" whereas age/ageRounded/ageLastBirthday are all variables that get changed throughout process as we age the person from one year to the next
    initialAgeRounded: number

    mortalityTable: number[]

    //hasFiled: boolean = false
    //fixedRetirementBenefitMonth: number
    //ixedRetirementBenefitYear: number
    //fixedRetirementBenefitDate: Date

    governmentPension: number = 0

    //working: boolean = false
    //quitWorkYear: number
    //quitWorkMonth: number
    //quitWorkDate: Date
    //monthlyEarnings: number = 0
    //hasHadGraceYear: boolean = false

    //retirementBenefit: number
    //adjustedRetirementBenefitDate: Date
    //retirementBenefitAfterARF: number

    //customRetirementBenefitMonth: number
    //customRetirementBenefitYear: number
    //customRetirementBenefitDate: Date

    constructor(){

    }

}
    //denominatorAge: number Is this a variable in a class??
    //probabilityAlive: number Is this a variable in a class??
    //withholdingAmount: number Is this a variable in a class??
    //monthsWithheld: number = 0 Is this a variable in a class??
    //graceYear: boolean = false Is this a variable in a class??
    //annualRetirementBenefit: number Variable for calculationYear?
    //annualSpousalBenefit: number Variable for calculationYear?
    //annualSurvivorBenefit: number Variable for calculationYear?

export class MarriedPerson extends Person {
    //spousalBenefitWithoutRetirement: number
    //spousalBenefitWithRetirement: number
    //survivorBenefitWithoutRetirement: number
    //survivorBenefitWithRetirement: number
    //adjustedSpousalBenefitDate: Date
    //spousalBenefitWithoutRetirementAfterARF: number
    //spousalBenefitWithRetirementAfterARF: number
    //survivorBenefitWithoutRetirementAfterARF: number
    //survivorBenefitWithRetirementAfterARF: number

    //customSpousalBenefitMonth: number
    //customSpousalBenefitYear: number
    //customSpousalBenefitDate: Date
    //declineSpousal: boolean = false
}