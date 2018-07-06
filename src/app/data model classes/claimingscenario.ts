export class ClaimingScenario {
//could be all the stuff below. Or could omit benefit amounts and ARF-adjusted dates

    discountRate: number
    maritalStatus: string = "single"

    //PersonA
        personAhasFiled: boolean = false
            //hasFiled has to be here, rather than on person class. Since the fixed/flexible function does not know which spouse is which, if "hasFiled" comes through on a person object,
            //it will never know. It needs "personAhasfiled" to come through on scenario object so it can figure out which spouse is which, later on, for purpose of creating output.
        /*
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
        */

    //PersonB
        personBhasFiled: boolean = false

        /*
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
        */
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