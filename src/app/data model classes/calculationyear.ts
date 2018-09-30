import {MonthYearDate} from "./monthyearDate"

export class CalculationYear {
    //This class is only for things that get reset each year (e.g., months of a benefit)
    date: MonthYearDate //( Jan 1 of year in question)
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



    annualWithholdingDueToPersonAearnings: number
    annualWithholdingDueToPersonBearnings: number
    personAgraceYear: boolean = false
    personBgraceYear: boolean = false
    personAoverWithholding: number = 0//These amounts get used as an add-back in output table (only in table??)
    personBoverWithholding: number = 0//These amounts get used as an add-back in output table

    //Sums for calculating PV (lumps everybody's total benefit amount into one sum, per mortality scenario)
    annualBenefitSinglePersonAlive: number = 0
    annualBenefitSinglePersonDeceased: number = 0
    annualBenefitBothAlive: number = 0
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
    tableTotalAnnualChildBenefits: number = 0

    constructor(date:MonthYearDate) {
        this.date = date
    }

}