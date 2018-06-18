export class claimingSolution {
    solutionPV:number
    spouseAretirementSolutionDate:Date
    spouseAretirementSolutionAmount:number
    spouseAretirementSolutionAgeYears:number
    spouseAretirementSolutionAgeMonths:number
    spouseBretirementSolutionDate:Date
    spouseBretirementSolutionAmount:number
    spouseBretirementSolutionAgeYears:number
    spouseBretirementSolutionAgeMonths:number
    spouseAspousalSolutionDate:Date
    spouseAspousalSolutionAmount:number
    spouseAspousalSolutionAgeYears:number
    spouseAspousalSolutionAgeMonths:number
    spouseBspousalSolutionDate:Date
    spouseBspousalSolutionAmount:number
    spouseBspousalSolutionAgeYears:number
    spouseBspousalSolutionAgeMonths:number
  }

  /*
Object for each claiming suggestion? {
  typeOfBenefit: string //retirementAlone, retirementReplacingSpousal, spousalAlone, spousalWithRetirement, survivor
  person: string //spouseA or spouseB
  date: Date
  amount: number
  ageYears: string
  ageMonths: string
  message: string //build one of messages below
}

"You should file for your retirement benefit to begin 4/2023, at age 63 and 6 months. (Monthly benefit: $800)"
"You should file for your spousal benefit to begin 4/2023, at age 63 and 6 months. (Monthly benefit: $800, in addition to your monthly retirement benefit)"
"You should file for your spousal benefit to begin 4/2023, at age 66. (Monthly benefit: $800)" <--- restricted app
"You should file for your retirement benefit to begin 4/2023, at age 70. (Monthly benefit: $800, replacing your spousal benefit)"

"Your spouse should file for his/her retirement benefit to begin 4/2023, at age 63 and 6 months. (Monthly benefit: $800)"
"Your spouse should file for his/her spousal benefit to begin 4/2023, at age 63 and 6 months. (Monthly benefit: $800, in addition to his/her monthly retirement benefit)"
"Your spouse should file for his/her spousal benefit to begin 4/2023, at age 66. (Monthly benefit: $800)" <--- restricted app
"Your spouse should file for his/her retirement benefit to begin 4/2023, at age 70. (Monthly benefit: $800, replacing his/her spousal benefit)"

"In the event that you predecease your spouse, he/she will be able to file for a survivor benefit. In combination with his/her retirement benefit, your surviving spouse would then receive a total of $800 per month -- assuming he/she waits at least until full retirement age to file for that survivor benefit."
"In the event that your spouse predeceases you, you will be able to file for a survivor benefit. In combination with your retirement benefit, you would then receive a total of $800 per month -- assuming you waut at least until your full retirement age to file for that survivor benefit."

Build an array of these objects, then just access the message field in the HTML?
*/