import {MonthYearDate} from "./monthyearDate"

export class CalculationYear {
    //This class is only for things that get reset each year (e.g., months of a benefit)
    date: MonthYearDate
    isInPast:boolean //Gets set in couple PV calc when .date is changed. Used for performance sake so we don't have to repeatedly check whether calcYear.date >= today
    debugTableRow: number[] = []

    //PersonA
        //retirement
            monthsOfPersonAretirementPreARF:number = 0
            monthsOfPersonAretirementPostARF:number = 0
            monthsOfPersonAretirementWithSuspensionDRCs:number = 0
        //spousal
            monthsOfPersonAspousalWithoutRetirement: number = 0 //By definition this is after-ARF.
            monthsOfPersonAspousalWithRetirementPreARF: number = 0
            monthsOfPersonAspousalWithRetirementPostARF: number = 0
            monthsOfPersonAspousalWithRetirementwithSuspensionDRCs: number = 0
        //survivor
            monthsOfPersonAsurvivorWithoutRetirement: number = 0 //This is after ARF also, since we're assuming survivor benefits aren't claimed until FRA.
            monthsOfPersonAsurvivorWithRetirementPostARF: number = 0
            monthsOfPersonAsurvivorWithRetirementwithSuspensionDRCs: number = 0

    //PersonB
        //retirement
            monthsOfPersonBretirementPreARF:number = 0
            monthsOfPersonBretirementPostARF:number = 0
            monthsOfPersonBretirementWithSuspensionDRCs:number = 0
        //spousal
            monthsOfPersonBspousalWithoutRetirement: number = 0 //By definition this is after-ARF.
            monthsOfPersonBspousalWithRetirementPreARF: number = 0
            monthsOfPersonBspousalWithRetirementPostARF: number = 0
            monthsOfPersonBspousalWithRetirementwithSuspensionDRCs: number = 0
        //survivor
            monthsOfPersonBsurvivorWithoutRetirement: number = 0 //This is after ARF also, since we're assuming survivor benefits aren't claimed until FRA.
            monthsOfPersonBsurvivorWithRetirementPostARF: number = 0
            monthsOfPersonBsurvivorWithRetirementwithSuspensionDRCs: number = 0


    annualWithholdingDuetoSinglePersonEarnings: number
    annualWithholdingDueToPersonAearningsBothAlive: number
        annuannualWithholdingDueToPersonAearningsOnlyAalive:number //calculated the same as the field above. But needs to be a separate total so we can subtract from it separately as amounts get withheld in such scenarios.
    annualWithholdingDueToPersonBearningsBothAlive: number
        annuannualWithholdingDueToPersonBearningsOnlyBalive:number //calculated the same as the field above. But needs to be a separate total so we can subtract from it separately as amounts get withheld in such scenarios.
    personAgraceYear: boolean = false
    personBgraceYear: boolean = false
    personAoverWithholding: number = 0//These amounts no longer used in monthly PV calc
    personBoverWithholding: number = 0//These amounts no longer used in monthly PV calc

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
    tablePersonAannualSpousalBenefit: number = 0
    tablePersonAannualSurvivorBenefit: number = 0
    tablePersonBannualRetirementBenefit: number = 0
    tablePersonBannualSpousalBenefit: number = 0
    tablePersonBannualSurvivorBenefit: number = 0
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