import { Person } from "./person";
import { MonthYearDate } from "./monthyearDate";

/*
This code is contributed to the project by Brian Courts, copyright 2020, released under MIT license.
https://github.com/brian-courts
*/

// EndSuspensionDates less than this value are placeholders, not actual dates
let minimumEndSuspensionDate: MonthYearDate = new MonthYearDate(1950, 1);

export class ClaimStrategy {
    //This class stores information about claims for a person or a couple
    //Takes one or more person objects in the constructor, pulls the relevant dates off that/those object(s), and saves the dates as fields on this object
    //Then we can reference this single object as a collection of filing dates later
    //Also saves the PV (and "cut" PV when necessary), as well as the outputTable that are calculated for the strategy

    personA:Person
    personB:Person

    personARetirementDate: MonthYearDate;
    personASpousalDate: MonthYearDate;
    personAchildInCareSpousalDate: MonthYearDate;
    personABeginSuspensionDate: MonthYearDate;
    personAEndSuspensionDate: MonthYearDate;
    
    personBRetirementDate: MonthYearDate;
    personBSpousalDate: MonthYearDate;
    personBchildInCareSpousalDate: MonthYearDate;
    personBBeginSuspensionDate: MonthYearDate;
    personBEndSuspensionDate: MonthYearDate;

    PV: number = 0 //This is the present value calculated for the strategy, given the inputs used.
    pvNoCut: number = 0 //If user chooses to assume a benefit cut, this field is used to save what the PV of the strategy would be if there were NOT a cut, for the sake of the range component output
    //In a no-cut scenario, pvNoCut will just have same value as the PV field

    outputTable: any[][] = []
    outputTableComplete:boolean = false

    constructor(personA: Person, personB?: Person) {
        this.personA = personA
        this.personARetirementDate = new MonthYearDate(personA.retirementBenefitDate);
        this.personASpousalDate = new MonthYearDate(personA.spousalBenefitDate);
        if (personA.childInCareSpousalBenefitDate) {this.personAchildInCareSpousalDate = new MonthYearDate(personA.childInCareSpousalBenefitDate)}
        this.personABeginSuspensionDate = new MonthYearDate(personA.beginSuspensionDate);
        this.personAEndSuspensionDate = new MonthYearDate(personA.endSuspensionDate);
    
        if (personB) {
            this.personB = personB
            this.personBRetirementDate = new MonthYearDate(personB.retirementBenefitDate);
            this.personBSpousalDate = new MonthYearDate(personB.spousalBenefitDate);
            if (personB.childInCareSpousalBenefitDate) {this.personBchildInCareSpousalDate  = new MonthYearDate(personB.childInCareSpousalBenefitDate)}
            this.personBBeginSuspensionDate = new MonthYearDate(personB.beginSuspensionDate);
            this.personBEndSuspensionDate = new MonthYearDate(personB.endSuspensionDate);
        }
    }

    indexDateA(): MonthYearDate { //date at which person A's own retirement benefits begin (or re-start)
        let indexDate:MonthYearDate
        //if personA has no PIA, we index based on their spousal benefit
        if (this.personA.PIA == 0){
            indexDate = new MonthYearDate(this.personASpousalDate)
        }
        else {//i.e., personA has a PIA
            if (this.personAEndSuspensionDate > minimumEndSuspensionDate) {
                indexDate = new MonthYearDate(this.personAEndSuspensionDate)
            }
            else {
                indexDate = new MonthYearDate(this.personARetirementDate)
            }
        }
        return indexDate
    }

    indexDateB(): MonthYearDate { //date at which person B's own retirement benefits begin (or re-start)
        let indexDate:MonthYearDate
        if (this.personB){
            //if personB has no PIA, we index based on their spousal benefit
            if (this.personB.PIA == 0){
                indexDate = new MonthYearDate(this.personBSpousalDate)
            }
            else {//i.e., personB has a PIA
                if (this.personBEndSuspensionDate > minimumEndSuspensionDate) {
                    indexDate = new MonthYearDate(this.personBEndSuspensionDate)
                }
                else {
                    indexDate = new MonthYearDate(this.personBRetirementDate)
                }
            }
            return indexDate
        }
        else {//i.e., there is no personB
            return null
        }
    }

}