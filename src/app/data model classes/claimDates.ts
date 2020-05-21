import { Person } from "./person";
import { MonthYearDate } from "./monthyearDate";

// EndSuspensionDates less than this value are placeholders, not actual dates
let minimumEndSuspensionDate: MonthYearDate = new MonthYearDate(1950, 1);

export class ClaimDates {
    //This class stores information about claims for a person or a couple
    //Takes one or more person objects in the constructor, pulls the relevant dates off that/those object(s), and saves the dates as fields on this object
    //Then we can reference this single object as a collection of filing dates later

    personARetirementDate: MonthYearDate;
    personASpousalDate: MonthYearDate;
    personABeginSuspensionDate: MonthYearDate;
    personAEndSuspensionDate: MonthYearDate;
    
    personBRetirementDate: MonthYearDate;
    personBSpousalDate: MonthYearDate;
    personBBeginSuspensionDate: MonthYearDate;
    personBEndSuspensionDate: MonthYearDate;

    constructor(personA: Person, personB?: Person) {
        this.personARetirementDate = new MonthYearDate(personA.retirementBenefitDate);
        this.personASpousalDate = new MonthYearDate(personA.spousalBenefitDate);
        this.personABeginSuspensionDate = new MonthYearDate(personA.beginSuspensionDate);
        this.personAEndSuspensionDate = new MonthYearDate(personA.endSuspensionDate);
    
        if (personB) {
            this.personBRetirementDate = new MonthYearDate(personB.retirementBenefitDate);
            this.personBSpousalDate = new MonthYearDate(personB.spousalBenefitDate);
            this.personBBeginSuspensionDate = new MonthYearDate(personB.beginSuspensionDate);
            this.personBEndSuspensionDate = new MonthYearDate(personB.endSuspensionDate);
        }
    }

    indexDateA(): MonthYearDate {
        if (this.personAEndSuspensionDate > minimumEndSuspensionDate) {
            return this.personAEndSuspensionDate;
        } else {
            return this.personARetirementDate;
        }
    }

    indexDateB(): MonthYearDate {
        if (this.personBRetirementDate) {
            if (this.personBEndSuspensionDate > minimumEndSuspensionDate) {
                return this.personBEndSuspensionDate;
            } else {
                return this.personBRetirementDate;
            }
        } else {
            return null;
        }
    }

}