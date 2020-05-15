import { Person } from "./person";
import { MonthYearDate } from "./monthyearDate";

// EndSuspensionDates less than this value are placeholders, not actual dates
let minimumEndSuspensionDate: MonthYearDate = new MonthYearDate(1950, 1);

export class ClaimDates {
    //This class stores information about claims for a person or a couple

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

    benefitDatesString(): string {
        // TODO: get actual dates, possibly using techniques in solutionset.service
        let benefitDatesArray: any = []; // empty array
        let hasPersonB: boolean = false; // assume there's only personA
        
        if (this.personBRetirementDate) {
            hasPersonB = true;    // OK, there is  personB            
        }

        benefitDatesArray.push(['You (retirement) ', this.personARetirementDate]);
        if (hasPersonB && (this.personASpousalDate.getFullYear() > 1950)) { // a real date - not a placeholder
            // if (this.personASpousalDate.valueOf() != this.personARetirementDate.valueOf()) {
            if (!this.personASpousalDate.equals(this.personARetirementDate)) {
                // include spousalDate only if different from retirementDate
                // because if they are the same, it usually means the spousalDate is just a placeholder 
                benefitDatesArray.push(['You (spousal) ', this.personASpousalDate]);
            }
        }
        if (this.personABeginSuspensionDate.valueOf() < this.personAEndSuspensionDate.valueOf()) {
            benefitDatesArray.push(['You (begin suspension) ', this.personABeginSuspensionDate]);
            benefitDatesArray.push(['You (end suspension) ', this.personAEndSuspensionDate]);
        }
        if (hasPersonB) {
            benefitDatesArray.push(['Your spouse (retirement) ', this.personBRetirementDate]);
            if (this.personBSpousalDate.getFullYear() > 1950) { // a real date - not a placeholder
                // if (this.personBSpousalDate.valueOf() != this.personBRetirementDate.valueOf()) {
                if (!this.personBSpousalDate.equals(this.personBRetirementDate)) {
                    // include spousalDate only if different from retirementDate
                    // because if they are the same, it usually means the spousalDate is just a placeholder 
                    benefitDatesArray.push(['Your spouse (spousal) ', this.personBSpousalDate]);
                }
            }
            if (this.personBBeginSuspensionDate.valueOf() < this.personBEndSuspensionDate.valueOf()) {
                benefitDatesArray.push(['Your spouse (begin suspension) ', this.personBBeginSuspensionDate]);
                benefitDatesArray.push(['Your spouse (end suspension) ', this.personBEndSuspensionDate]);
            }
        }

        benefitDatesArray.sort(function (a, b) {
            // subract dates to get a value that is either negative, positive, or zero
            // a[0] and b[0] are strings describing the type of "claim" - retirement, spousal or suspension
            // a[1] and b[1] are dates of those claims
            let dif: number = a[1].valueOf() - b[1].valueOf();
            if (dif == 0) {
                if (a[0].includes("retirement")) {
                    return -1;  // retirement comes before spousal and suspension
                } else if (b[0].includes("retirement")) {
                    return 1;
                } else {
                    return 0
                }
            } else  {
                return dif;
            }
        })

        let result:string = "";

        for (let i = 0; i < benefitDatesArray.length; i++) {
            result += benefitDatesArray[i][0] + benefitDatesArray[i][1].toString() + ', ';
        }

        return result;
    }

}