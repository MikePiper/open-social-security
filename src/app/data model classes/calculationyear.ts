export class CalculationYear {
    //This class is only for things that get reset each year (e.g., months of a benefit, rather than a person's age)
    date: Date //( Jan 1 of year in question)


    //PersonA
        //monthsOfPersonAretirement
        //monthsOfPersonAspousal
            //monthsOfPersonAspousalWithRetirement
            //monthsOfPersonAspousalWithoutRetirement
        //monthsOfPersonAsurvivor
            //monthsOfPersonAsurvivorWithRetirement
            //monthsOfPersonAsurvivorWithoutRetirement
        //personAprobabilityAlive: number
        //personAannualRetirementBenefit: number
        //personAannualSpousalBenefit: number
        //personAannualSurvivorBenefit: number


    //PersonB
        //monthsOfPersonBretirement
        //monthsOfPersonBspousal
            //monthsOfPersonBspousalWithRetirement
            //monthsOfPersonBspousalWithoutRetirement
        //monthsOfPersonBsurvivor
            //monthsOfPersonBsurvivorWithRetirement
            //monthsOfPersonBsurvivorWithoutRetirement
        //personBprobabilityAlive: number
        //personBannualRetirementBenefit: number
        //personBannualSpousalBenefit: number
        //personBannualSurvivorBenefit: number


    //withholdingAmount: number
    //monthsWithheld: number = 0 (This doesn't fit here. It's not for one year but rather an ongoing sum of monthsWithheld.)
    //graceYear: boolean = false
    //hasHadGraceYear: boolean = false (This doesn't fit here either.)

    constructor(date:Date) {
        this.date = date
    }
}