import { Person } from "./person";
import { MonthYearDate } from "./monthyearDate";
import { Range } from "./range";

//This is defined here as 4 explicit options so that if something is ever input as a typo elsewhere (eg "sngle") it will throw an error
type maritalStatusOption = "single" | "married" | "divorced" | "survivor"

export class CalculationScenario {
//This is just variables/fields that don't fit under Person object or under CalculationYear object (i.e., things that don't get reset each year, but which don't belong to a Person object)

    discountRate: number
    maritalStatus:maritalStatusOption = "single"
    numberOfChildren:number = 0
    children:Person[] = []
    youngestChildTurns16date:MonthYearDate
    disabledChild:boolean = false
    benefitCutAssumption: boolean = false
        benefitCutYear: number = 2033
        benefitCutPercentage: number = 23

    // properties to allow calculation and storage 
    // of both Cut and NoCut results for range of options
        cutFactor: number = 1 - (this.benefitCutPercentage / 100)   // multiply benefit by this number to calculate the benefit after cut
        decutFactor: number = 1 / this.cutFactor    // multiply an already-cut benefit to determine the benefit without the cut    

    restrictedApplicationPossible: boolean = false; // true if, for a given couple, a person may claim their spousal benefit before their own benefit
    
    // object containing data on the range of possible options 
    range: Range; 

    setBenefitCutFactors(): void {
        this.cutFactor = 1 - (this.benefitCutPercentage / 100);
        this.decutFactor = 1 / this.cutFactor;
    }

    setChildrenArray(childrenArray:Person[], today:MonthYearDate){
        this.children = []
        if (this.numberOfChildren > 0){
            //Have to do it this wonky way using scenario.numberOfChildren, because childrenArray always has 6 objects in it, even if there are no actual children.
            for (let i:number = 0; i < this.numberOfChildren; i++){ 
                this.children.push(childrenArray[i])
            }
            //calculate ages of children
            for (let child of this.children){
                if (!child.SSbirthDate){child.SSbirthDate = new MonthYearDate(2000, 3)} //This is here just so following line doesn't throw a console error when childinputs.component is initialized for first time. This nonsense date (equal to default for child DoB inputs) will be overridden by the getInputs() function in childinputs component.
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
        }

    }
}




