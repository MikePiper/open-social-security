export class ClaimingScenario {
//could be all the stuff below. Or could omit benefit amounts and ARF-adjusted dates
//Or maybe this is just variables/fields that don't fit under Person object or under CalculationYear object

    discountRate: number
    maritalStatus: string = "single"

    //PersonA
        personAhasFiled: boolean = false
            //hasFiled must be here, rather than in Person class. Since the fixed/flexible function in SolutionSetService does not know which Person object is which, if "hasFiled" comes through on a person object,
            //it will never know. It needs "personAhasfiled" to come through on scenario object so it can figure out which spouse is which for purpose of creating output.
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




