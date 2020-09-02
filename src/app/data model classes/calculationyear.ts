import {MonthYearDate} from "./monthyearDate"

export class CalculationYear {
    //This class is only for things that get reset each year (e.g., months of a benefit)
    date: MonthYearDate
    isInPast:boolean //Gets set in couple PV calc when .date is changed. Used for performance sake so we don't have to repeatedly check whether calcYear.date >= today
    debugTableRow: number[] = []


    annualWithholdingDuetoSinglePersonEarnings: number
    annualWithholdingDueToPersonAearningsBothAlive: number
        annuannualWithholdingDueToPersonAearningsOnlyAalive:number //calculated the same as the field above. But needs to be a separate total so we can subtract from it separately as amounts get withheld in such scenarios.
    annualWithholdingDueToPersonBearningsBothAlive: number
        annuannualWithholdingDueToPersonBearningsOnlyBalive:number //calculated the same as the field above. But needs to be a separate total so we can subtract from it separately as amounts get withheld in such scenarios.
    personAgraceYear: boolean = false
    personBgraceYear: boolean = false

    //Sums for calculating PV (lumps everybody's total benefit amount into one sum, per mortality scenario)
    annualBenefitSinglePersonAlive: number = 0
    annualBenefitSinglePersonDeceased: number = 0
    annualBenefitBothAlive: number = 0
    annualBenefitBothDeceased: number = 0
    annualBenefitOnlyPersonAalive: number = 0
    annualBenefitOnlyPersonBalive: number = 0
    annualPV: number = 0

    //person-by-person sums for table output (Assumes any parents are alive -- aside from survivor benefit amounts)
    tablePersonAannualRetirementBenefit: number = 0
        tablePersonAannualRetirementBenefitOnlyAalive:number = 0//this is used instead of the above field, in cases in which personA is already a survivor when using calculator
    tablePersonAannualSpousalBenefit: number = 0
    tablePersonAannualSurvivorBenefit: number = 0
    tablePersonAannualMotherFatherBenefit: number = 0
    tablePersonBannualRetirementBenefit: number = 0
    tablePersonBannualSpousalBenefit: number = 0
    tablePersonBannualSurvivorBenefit: number = 0
    tablePersonBannualMotherFatherBenefit: number = 0

        //Note that these mirror the PV-related sums above, because we need a different sum for each case
        tableTotalAnnualChildBenefitsSingleParentAlive: number = 0
        tableTotalAnnualChildBenefitsSingleParentDeceased: number = 0
        tableTotalAnnualChildBenefitsBothParentsAlive: number = 0
        tableTotalAnnualChildBenefitsBothParentsDeceased: number = 0
        tableTotalAnnualChildBenefitsOnlyPersonAalive: number = 0
        tableTotalAnnualChildBenefitsOnlyPersonBalive: number = 0

    constructor(date:MonthYearDate) {
        this.date = date
    }


}