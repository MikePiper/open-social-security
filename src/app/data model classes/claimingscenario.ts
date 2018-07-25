export class ClaimingScenario {
//This is just variables/fields that don't fit under Person object or under CalculationYear object (i.e., things that don't get reset each year, but which don't belong to a Person object)

    discountRate: number
    maritalStatus: string = "single"
    initialCalcDate: Date

    //PersonA
        personAhasFiled: boolean = false
            //hasFiled must be here, rather than in Person class. Since the fixed/flexible function in SolutionSetService does not know which Person object is which, if "hasFiled" comes through on a person object,
            //it will never know. It needs "personAhasfiled" to come through on scenario object so it can figure out which spouse is which for purpose of creating output.

        //personAdeclineSpousal: boolean = false


    //PersonB
        personBhasFiled: boolean = false


        //personBdeclineSpousal: boolean = false

        tableOutput: number[][] = []
}




