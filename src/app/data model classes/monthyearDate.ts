/*
This class exists in the hope of speeding up date processing relative to javascript's native date objects. 
*/

export class MonthYearDate {

    month:number
    year:number

    /*
    options for constructor:
        () for today
        (year, month)
        (year, month, day) <- day just gets ignored
        (MonthYearDate object)
    */
    constructor(param1?, param2?, param3?){
        if (!param1 && !param2 && !param3){//if no parameters, create MonthYearDate object for today
            var today:Date = new Date()
            this.year = today.getFullYear()
            this.month = today.getMonth()
        }
        else if (!isNaN(param1) && !isNaN(param2)){//there is at least one parameter (due to prior check) and params 1 and 2 are numbers
            this.year = Number(param1)
            this.month = Number(param2)
            if (param1 % 1 != 0 || param1 < 0){
                this.year = undefined
            }
            if (param2 % 1 != 0 || param2 < 0 || param2 > 11 ){
                this.month = undefined
            }
        }
        else if (typeof param1 == "object"){//param1 and param2 aren't numbers.
            this.year = param1.getFullYear()
            this.month = param1.getMonth()
        }
    }


    
    getFullYear():number{
        return Number(this.year)
    }

    getMonth():number{
        return Number(this.month)
    }

    setFullYear(year:number){
        if (year % 1 != 0 || year < 0){
            throw new Error("Invalid year for monthYearDate object")
        }
        else {
            this.year = year
        }
    }

    setMonth(month:number){
        if (month % 1 != 0){
            throw new Error("Invalid month for monthYearDate object")
        }
        else if (month >= 0 && month <= 11){
            this.month = month
        }
        else if (month < 0){
            var subtractedYears:number = Math.floor(month/12)
            this.year = Number(this.year) + Number(subtractedYears)
            if (month % 12 == 0){
                this.month = 0
            }
            else {
                this.month = (month % 12) + 12 //Have to add 12 to get back to a positive figure. For example if we're using -4 or -16 as month paramter, we want this.month to be 8
            }
        }
        else if (month > 11) {
            var addedYears:number = Math.floor(month/12)
            this.year = Number(this.year) + Number(addedYears)
            this.month = month % 12
        }
    }

    plusMonths(months: number): MonthYearDate {
        let newDate: MonthYearDate = new MonthYearDate(this);
        newDate.setMonth(this.getMonth() + months);
        return newDate;
    }

    yearMonthString(): string { // two-digit month at end for easier sorting, e,g, 2015/09 or 2015/10
        if (this.month < 9) {
            return this.year + '/' + "0" + (this.month + 1)
        }
        else return this.year + '/' + this.month + 1
    }

    toString(): string { // e.g. 9/2015 or 10/2015
        return (this.month + 1) + '/' + this.year;
    }

    //for the sake of using greaterthan/lessthan/equalto comparisons
    //For greater than or less than, can just compare the two date objects
    //To check if equal, use == and valueOf() DONT FORGET THE PARENTHESES ex if (monthYearDateObject1.valueOf() == monthYearDateObject2.valueOf())
    valueOf():number{
        return Number(this.year * 12 + this.month)
    }

    equals(other: MonthYearDate): boolean {
        return (this.year == other.year) && (this.month == other.month);
    }


}