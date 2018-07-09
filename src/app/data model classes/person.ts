export class Person {
    actualBirthDate: Date
    PIA: number = 1000

    SSbirthDate: Date
    FRA: Date
    survivorFRA: Date

    initialAge: number //as in, "age on the date they're filling out the form" whereas age/ageRounded/ageLastBirthday are all variables that get changed throughout process as we age the person from one year to the next
    initialAgeRounded: number
    //age: number //as in, "age as of current calculation year"
    //ageRounded: number
    //ageLastBirthday: number

    mortalityTable: number[]

    governmentPension: number = 0

    quitWorkDate: Date
    monthlyEarnings: number = 0


    constructor(){

    }

}

