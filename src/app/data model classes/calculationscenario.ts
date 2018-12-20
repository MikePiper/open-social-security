import { Person } from "./person";
import { MonthYearDate } from "./monthyearDate";

export class CalculationScenario {
//This is just variables/fields that don't fit under Person object or under CalculationYear object (i.e., things that don't get reset each year, but which don't belong to a Person object)

    discountRate: number
    maritalStatus: string = "single"
    numberOfChildren:number = 0
    children:Person[] = []
    youngestChildTurns16date:MonthYearDate
    disabledChild:boolean = false
    benefitCutAssumption: boolean = false
        benefitCutYear: number = 2034
        benefitCutPercentage: number = 23
    outputTable: any[][] = []
    outputTableComplete:boolean = false


    setChildrenArray(childrenArray:Person[], today:MonthYearDate){
        this.children = []
        //Have to do it this wonky way using scenario.numberOfChildren, because childrenArray always has 4 objects in it, even if there are no actual children.
        for (let i:number = 0; i < this.numberOfChildren; i++){ 
            this.children.push(childrenArray[i])
        }

        setTimeout( () => {//Need to have a timeout here, because we have to let the getinputs() function from the childinputs component finish running, otherwise child objects have no SSbirthdate fields
            //calculate ages of children
            for (let child of this.children){
                child.age = (today.getMonth() - child.SSbirthDate.getMonth() + 12 * (today.getFullYear() - child.SSbirthDate.getFullYear()) )/12
            }

            //calculate youngestChildTurns16date
            let latestSSbirthdate:MonthYearDate = this.children[0].SSbirthDate
            for (let child of this.children){
                if (child.SSbirthDate > latestSSbirthdate){
                    latestSSbirthdate = new MonthYearDate(child.SSbirthDate)
                }
            }
            this.youngestChildTurns16date = new MonthYearDate(latestSSbirthdate.getFullYear()+16, latestSSbirthdate.getMonth())

            //set disabledChild boolean
            this.disabledChild = false
            for (let child of childrenArray){
                if (child.isOnDisability === true){
                    this.disabledChild = true
                }
            }
        }, 25)
    }
}




