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
        else if (!isNaN(param1) && !isNaN(param2))//there is at least one parameter (due to prior check) and params 1 and 2 are numbers
        {
            if (param1 % 1 != 0 || param1 < 0){
                throw new Error("Invalid year for monthYearDate object")
            }
            if (param2 % 1 != 0 || param2 < 0 || param2 > 11 ){
                throw new Error("Invalid month for monthYearDate object")
            }
            this.year = param1
            this.month = param2
        }
        else if (typeof param1 == "object"){//param1 and param2 aren't numbers.
            this.year = param1.getFullYear()
            this.month = param1.getMonth()
        }
    }



    getFullYear(){
        return this.year
    }

    getMonth(){
        return this.month
    }

    setFullYear(year:number){
        if (year % 1 != 0 || year < 0){
            throw new Error("Invalid year for monthYearDate object")
        }
        this.year = year
    }

    setMonth(month:number){
        if (month % 1 != 0 || month < 0 ){
            throw new Error("Invalid month for monthYearDate object")
        }
        if (month <= 11){
            this.month = month
        }
        else {
            var addedYears:number = Math.floor(month/12)
            this.year = Number(this.year) + Number(addedYears)
            this.month = month % 12
        }
    }

    //for the sake of using greaterthan/lessthan/equalto comparisons
    valueOf() {
        return this.year * 12 + this.month
    }


}