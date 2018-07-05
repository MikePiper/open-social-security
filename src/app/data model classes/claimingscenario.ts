export class ClaimingScenario {
    //PersonA
        personAretirementBenefitDate: Date
        personAretirementBenefit: number = 0
        personAspousalBenefitDate: Date
        personAspousalBenefitWithoutRetirement: number = 0
        personAspousalBenefitWithRetirement: number = 0
        personAsurvivorBenefitWithoutRetirement: number = 0
        personAsurvivorBenefitWithRetirement: number = 0

        personAadjustedRetirementBenefitDate: Date
        personAretirementBenefitAfterARF: number = 0
        personAadjustedSpousalBenefitDate: Date
        personAspousalBenefitWithoutRetirementAfterARF: number = 0
        personAspousalBenefitWithRetirementAfterARF: number = 0
        personAsurvivorBenefitWithoutRetirementAfterARF: number = 0
        personAsurvivorBenefitWithRetirementAfterARF: number = 0

        personAdeclineSpousal: boolean = false

    //PersonB
        personBretirementBenefitDate: Date
        personBretirementBenefit: number = 0
        personBspousalBenefitDate: Date
        personBspousalBenefitWithoutRetirement: number = 0
        personBspousalBenefitWithRetirement: number = 0
        personBsurvivorBenefitWithoutRetirement: number = 0
        personBsurvivorBenefitWithRetirement: number = 0

        personBadjustedRetirementBenefitDate: Date
        personBretirementBenefitAfterARF: number = 0
        personBadjustedSpousalBenefitDate: Date
        personBspousalBenefitWithoutRetirementAfterARF: number = 0
        personBspousalBenefitWithRetirementAfterARF: number = 0
        personBsurvivorBenefitWithoutRetirementAfterARF: number = 0
        personBsurvivorBenefitWithRetirementAfterARF: number = 0

        personBdeclineSpousal: boolean = false
}

//Possible fields for "year" object or some such
    //age: number
    //ageRounded: number
    //ageLastBirthday: number
    //denominatorAge: number Is this a variable in a class??
    //probabilityAlive: number Is this a variable in a class??
    //withholdingAmount: number Is this a variable in a class??
    //monthsWithheld: number = 0 Is this a variable in a class??
    //graceYear: boolean = false Is this a variable in a class??
    //hasHadGraceYear: boolean = false
    //annualRetirementBenefit: number Variable for calculationYear?
    //annualSpousalBenefit: number Variable for calculationYear?
    //annualSurvivorBenefit: number Variable for calculationYear?