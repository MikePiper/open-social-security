import { Person } from "./person";
import { MonthYearDate } from "./monthyearDate";

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


    setChildrenArray(childrenArray:Person[], today:MonthYearDate){
        this.children = []
        for (let child of childrenArray){
            this.children.push(child)
            child.age = (today.getMonth() - child.SSbirthDate.getMonth() + 12 * (today.getFullYear() - child.SSbirthDate.getFullYear()) )/12
        }
        //sort children by age
        this.children.sort(function(a,b){
            return a.age - b.age
        })
    }
}




