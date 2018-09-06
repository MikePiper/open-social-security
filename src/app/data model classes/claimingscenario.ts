import {MonthYearDate} from "./monthyearDate"

export class ClaimingScenario {
//This is just variables/fields that don't fit under Person object or under CalculationYear object (i.e., things that don't get reset each year, but which don't belong to a Person object)

    discountRate: number
    maritalStatus: string = "single"
    initialCalcDate: MonthYearDate
    benefitCutAssumption: boolean = false
        benefitCutYear: number = 2034
        benefitCutPercentage: number = 23


        outputTable: any[][] = []
        outputTableComplete:boolean = false
}




