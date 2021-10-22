export class ErrorCollection {

    //Error variables relating to primary form
    personAfixedRetirementDateError:string
    personBfixedRetirementDateError:string
    personAfixedMotherFatherDateError:string
    personAfixedSurvivorDateError:string
    personAassumedDeathAgeError:string
    personBassumedDeathAgeError:string


    //error varibles relating to custom date form
    customPersonAretirementDateError:string
    customPersonBretirementDateError:string
    customPersonAspousalDateError:string
    customPersonBspousalDateError:string
    customPersonAbeginSuspensionDateError:string
    customPersonBbeginSuspensionDateError:string
    customPersonAendSuspensionDateError:string
    customPersonBendSuspensionDateError:string
    customPersonASurvivorDateError:string

    hasErrors:boolean

    constructor(){
    }
}