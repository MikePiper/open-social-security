export class Person {
    //Only want fields that are *fixed* throughout this entire process. So no benefit dates or benefit amounts. This way a "Person" object is always the same through entire process. Allows memoization.
    actualBirthDate: Date
    PIA: number = 1000

    SSbirthDate: Date
    FRA: Date
    survivorFRA: Date
    initialAge: number //as in, "age on the date they're filling out the form" whereas age/ageRounded/ageLastBirthday are all variables that get changed throughout process as we age the person from one year to the next
    initialAgeRounded: number

    mortalityTable: number[]

    governmentPension: number = 0

    quitWorkDate: Date
    monthlyEarnings: number = 0


    constructor(){

    }

}

