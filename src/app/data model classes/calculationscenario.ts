import { Person } from "./person";

export class CalculationScenario {
//This is just variables/fields that don't fit under Person object or under CalculationYear object (i.e., things that don't get reset each year, but which don't belong to a Person object)

    discountRate: number
    maritalStatus: string = "single"
    numberOfChildren:number = 0
    children:Person[] = []
    benefitCutAssumption: boolean = false
        benefitCutYear: number = 2034
        benefitCutPercentage: number = 23
    outputTable: any[][] = []
    outputTableComplete:boolean = false
    childUnder18onPersonAspousalBenefitDate:boolean //used for sake of determining when to start counting early entitlement months for spousal benefit (i.e., start on spousal benefit date, or start at later date?)
    childUnder18onPersonBspousalBenefitDate:boolean //ditto

}




