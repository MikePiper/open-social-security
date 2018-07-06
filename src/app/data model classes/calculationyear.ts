export class CalculationYear {
    date: Date //( Jan 1 of year in question)

    //PersonA
        //personAage: number
        //personAageRounded: number
        //personAageLastBirthday: number
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
        //personBage: number
        //personBageRounded: number
        //personBageLastBirthday: number
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
    //monthsWithheld: number = 0 (Not sure this fits here. It's not for one year but rather an ongoing sum of monthsWithheld.)
    //graceYear: boolean = false
    //hasHadGraceYear: boolean = false (Not sure this fits here either.)

    constructor(date:Date) {
        this.date = date
    }
}