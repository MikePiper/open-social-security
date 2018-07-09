export class CalculationYear {
    //This class is only for things that get reset each year (e.g., months of a benefit, rather than a person's age)
    date: Date //( Jan 1 of year in question)


    //PersonA
        monthsOfPersonAretirement: number
        monthsOfPersonAspousal: number
            monthsOfPersonAspousalWithRetirement: number
            monthsOfPersonAspousalWithoutRetirement: number
        monthsOfPersonAsurvivor: number
            monthsOfPersonAsurvivorWithRetirement: number
            monthsOfPersonAsurvivorWithoutRetirement: number

        personAannualRetirementBenefit: number = 0
        personAannualSpousalBenefit: number = 0
        personAannualSurvivorBenefit: number = 0

        personAoverWithholding: number = 0

    //PersonB
        monthsOfPersonBretirement: number
        monthsOfPersonBspousal: number
            monthsOfPersonBspousalWithRetirement: number
            monthsOfPersonBspousalWithoutRetirement: number
        monthsOfPersonBsurvivor: number
            monthsOfPersonBsurvivorWithRetirement: number
            monthsOfPersonBsurvivorWithoutRetirement: number

        personBannualRetirementBenefit: number = 0
        personBannualSpousalBenefit: number = 0
        personBannualSurvivorBenefit: number = 0

        personBoverWithholding: number = 0


    //withholdingAmount: number
    //monthsWithheld: number = 0 (This doesn't fit here. It's not for one year but rather an ongoing sum of monthsWithheld.)
    //graceYear: boolean = false
    //hasHadGraceYear: boolean = false (This doesn't fit here either.)

    constructor(date:Date) {
        this.date = date
    }
}