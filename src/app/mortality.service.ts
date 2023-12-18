import {Injectable} from '@angular/core'
import { MonthYearDate } from './data model classes/monthyearDate'
import {Person} from './data model classes/person'


//This is defined here as a limited group of explicit options so that if something is ever input as a typo elsewhere (eg "SS2016") it will throw an error
export type mortalityTableOption = "fixed" | "NS1" | "NS2" | "SSA" | "SSA2016" | "SSA2017" | "SSA2019" | "SSA2020" | "SM1" | "SM2"

@Injectable({
  providedIn: 'root'
})
export class MortalityService {

  constructor() { }

  calculateProbabilityAlive(person:Person, age:number){//"age" here is age as of beginning of year in question. person.initialAgeRounded is rounded age as of date filling out form
    //Calculate probability of being alive at end of age in question
    let ageLastBirthday:number = Math.floor(age)
    let probabilityAlive:number = //need probability of being alive at end of "currentCalculationDate" year
      (person.mortalityTable[ageLastBirthday + 1] * (1 - (age%1)) //eg if user is 72 and 4 months at beginning of year, we want probability of living to end of 72 * 8/12 (because they're 72 for 8 months of year) and probability of living to end of 73 * (4/12)
    + person.mortalityTable[ageLastBirthday + 2] * (age%1))
    * person.baseMortalityFactor

    //If using assumed age at death (mortality table has just 1 for every year, then 0 for age of death, whereas normal mortality table starts with 100,000 lives)
    //Find that assumed age at death. Then see whether person is beyond that age and if so, set probability of being alive to 0. (We're assuming they live through the calendar year in which they reach assumed age of death.)
    if (person.mortalityTable[0] == 1){
      let assumedDeathAge:number = person.mortalityTable.findIndex(x => x == 0)
      if (age > assumedDeathAge){
        probabilityAlive = 0
      }
      else {
        probabilityAlive = 1
      }
    }

    return Number(probabilityAlive)
  }


  calculateBaseMortalityFactor(person:Person):number{
    let baseMortalityFactor:number
    baseMortalityFactor = 1 / person.mortalityTable[Math.floor(person.initialAge)]
    return baseMortalityFactor
  }


  determineMortalityTable (gender:string, mortalityInput:mortalityTableOption, assumedDeathAge:number) {
    let mortalityTable: number[] = []
    if (gender == "male") {
      if (mortalityInput == "NS1") {mortalityTable = this.maleNS1}
      if (mortalityInput == "NS2") {mortalityTable = this.maleNS2}
      if (mortalityInput == "SSA") {mortalityTable = this.male2015SSAtable}
      if (mortalityInput === "SSA2016") {mortalityTable = this.male2016SSAtable}
      if (mortalityInput === "SSA2017") {mortalityTable = this.male2017SSAtable}
      if (mortalityInput === "SSA2019") {mortalityTable = this.male2019SSAtable}
      if (mortalityInput === "SSA2020") {mortalityTable = this.male2020SSAtable}
      if (mortalityInput == "SM1") {mortalityTable = this.maleSM1}
      if (mortalityInput == "SM2") {mortalityTable = this.maleSM2}
    }
    if (gender == "female") {
      if (mortalityInput == "NS1") {mortalityTable = this.femaleNS1}
      if (mortalityInput == "NS2") {mortalityTable = this.femaleNS2}
      if (mortalityInput == "SSA") {mortalityTable = this.female2015SSAtable}
      if (mortalityInput === "SSA2016") {mortalityTable = this.female2016SSAtable}
      if (mortalityInput === "SSA2017") {mortalityTable = this.female2017SSAtable}
      if (mortalityInput === "SSA2019") {mortalityTable = this.female2019SSAtable}
      if (mortalityInput === "SSA2020") {mortalityTable = this.female2020SSAtable}
      if (mortalityInput == "SM1") {mortalityTable = this.femaleSM1}
      if (mortalityInput == "SM2") {mortalityTable = this.femaleSM2}
    }
    if (mortalityInput == "fixed") {
      mortalityTable = this.createMortalityTable(assumedDeathAge)
    }
    
    return mortalityTable
  }


  createMortalityTable(deathAge:number){
    let yearInTable: number = 0
    let newMortTable: number[] = []
    while (yearInTable < 140 ) {
      if (yearInTable < deathAge) {
        newMortTable.push(1) //Lives remaining at every year before death age is 1 (100% probability alive)
      } else {
        newMortTable.push(0) //Lives remaining at every year beginning with death age is 0 (0% probability alive) -- we're assuming they die as soon as they reach death age
      }
      yearInTable = yearInTable + 1
    }
    return newMortTable
  }

  findAssumedDeathAge(person:Person):number{
    //If person isn't using an assumed death age, return undefined
    if (person.mortalityTable[0] > 1){
      return undefined
    }
    else {
      return person.mortalityTable.findIndex(index => index == 0)
    }
  }

  findAssumedDeathDate(person:Person):MonthYearDate{
    //If person isn't using an assumed death age, return undefined
    if (person.mortalityTable[0] > 1){
      return undefined
    }
    else {
      let assumedDeathDate:MonthYearDate
      let assumedDeathAge:number = this.findAssumedDeathAge(person)
      assumedDeathDate = new MonthYearDate(person.SSbirthDate.getFullYear() + assumedDeathAge + 1, 0)//We assume they die in January of the following year (i.e., they live through the calendar year in question).
      return assumedDeathDate
    }
  }

//Lives remaining out of 100k, from SSA 2020 period life table
// from https://www.ssa.gov/oact/STATS/table4c6.html
male2020SSAtable = [
  100000,
  99416,
  99376,
  99350,
  99330,
  99313,
  99299,
  99287,
  99276,
  99265,
  99254,
  99241,
  99227,
  99209,
  99187,
  99156,
  99113,
  99053,
  98972,
  98868,
  98745,
  98607,
  98456,
  98298,
  98132,
  97961,
  97783,
  97599,
  97406,
  97205,
  96994,
  96773,
  96544,
  96308,
  96066,
  95817,
  95561,
  95294,
  95016,
  94725,
  94422,
  94107,
  93781,
  93445,
  93096,
  92732,
  92348,
  91937,
  91493,
  91016,
  90507,
  89964,
  89380,
  88747,
  88062,
  87323,
  86528,
  85673,
  84757,
  83777,
  82730,
  81614,
  80423,
  79160,
  77828,
  76434,
  74986,
  73479,
  71910,
  70274,
  68565,
  66773,
  64895,
  62919,
  60827,
  58578,
  56198,
  53685,
  51047,
  48277,
  45397,
  42420,
  39360,
  36224,
  33015,
  29767,
  26518,
  23316,
  20197,
  17200,
  14370,
  11746,
  9364,
  7269,
  5487,
  4023,
  2862,
  1975,
  1323,
  861,
  545,
  335,
  200,
  115,
  64,
  34,
  17,
  8,
  4,
  2,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]

female2020SSAtable = [
  100000,
  99509,
  99478,
  99458,
  99442,
  99430,
  99419,
  99409,
  99399,
  99390,
  99381,
  99372,
  99362,
  99349,
  99335,
  99318,
  99297,
  99271,
  99240,
  99202,
  99159,
  99111,
  99058,
  99001,
  98940,
  98875,
  98806,
  98732,
  98654,
  98570,
  98480,
  98383,
  98281,
  98171,
  98055,
  97933,
  97805,
  97670,
  97526,
  97375,
  97215,
  97047,
  96867,
  96678,
  96478,
  96264,
  96035,
  95788,
  95522,
  95237,
  94931,
  94601,
  94242,
  93852,
  93430,
  92975,
  92486,
  91958,
  91385,
  90768,
  90103,
  89389,
  88625,
  87812,
  86948,
  86032,
  85063,
  84037,
  82945,
  81781,
  80537,
  79197,
  77748,
  76180,
  74479,
  72615,
  70603,
  68440,
  66120,
  63618,
  60931,
  58058,
  55007,
  51779,
  48372,
  44790,
  41054,
  37203,
  33299,
  29388,
  25522,
  21771,
  18209,
  14903,
  11912,
  9292,
  7067,
  5237,
  3780,
  2657,
  1821,
  1214,
  784,
  490,
  296,
  171,
  95,
  50,
  25,
  12,
  5,
  2,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]



//Lives remaining out of 100k, from SSA 2019 period life table
// from https://www.ssa.gov/oact/STATS/table4c6.html
male2019SSAtable = [
  100000,
  99392,
  99350,
  99324,
  99305,
  99289,
  99275,
  99262,
  99249,
  99238,
  99227,
  99218,
  99207,
  99193,
  99171,
  99139,
  99096,
  99041,
  98974,
  98894,
  98801,
  98695,
  98575,
  98444,
  98306,
  98162,
  98014,
  97861,
  97703,
  97540,
  97371,
  97196,
  97015,
  96828,
  96635,
  96435,
  96228,
  96013,
  95791,
  95561,
  95324,
  95078,
  94821,
  94553,
  94272,
  93975,
  93661,
  93327,
  92970,
  92585,
  92168,
  91718,
  91230,
  90700,
  90123,
  89495,
  88812,
  88074,
  87277,
  86421,
  85506,
  84527,
  83483,
  82377,
  81214,
  79996,
  78717,
  77371,
  75956,
  74475,
  72924,
  71293,
  69570,
  67744,
  65804,
  63739,
  61534,
  59181,
  56686,
  54059,
  51307,
  48423,
  45405,
  42264,
  39016,
  35684,
  32293,
  28878,
  25477,
  22138,
  18913,
  15857,
  13022,
  10453,
  8184,
  6237,
  4624,
  3335,
  2341,
  1603,
  1072,
  699,
  444,
  273,
  163,
  94,
  52,
  28,
  14,
  7,
  3,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]

female2019SSAtable = [
  100000,
  99495,
  99461,
  99440,
  99423,
  99409,
  99397,
  99386,
  99376,
  99366,
  99357,
  99347,
  99337,
  99326,
  99312,
  99295,
  99275,
  99251,
  99223,
  99192,
  99156,
  99116,
  99071,
  99022,
  98971,
  98916,
  98859,
  98800,
  98736,
  98668,
  98594,
  98514,
  98428,
  98336,
  98239,
  98136,
  98028,
  97913,
  97792,
  97665,
  97532,
  97394,
  97247,
  97092,
  96926,
  96748,
  96556,
  96348,
  96123,
  95880,
  95617,
  95332,
  95023,
  94688,
  94323,
  93926,
  93495,
  93028,
  92523,
  91980,
  91396,
  90767,
  90091,
  89370,
  88609,
  87809,
  86965,
  86067,
  85107,
  84073,
  82955,
  81739,
  80414,
  78975,
  77419,
  75739,
  73916,
  71934,
  69788,
  67476,
  64992,
  62321,
  59449,
  56378,
  53116,
  49672,
  46061,
  42304,
  38429,
  34480,
  30509,
  26581,
  22766,
  19135,
  15756,
  12686,
  9981,
  7670,
  5756,
  4222,
  3029,
  2121,
  1448,
  961,
  618,
  384,
  230,
  132,
  73,
  38,
  19,
  9,
  4,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]
//Lives remaining out of 100k, from SSA 2017 period life table
// from https://www.ssa.gov/oact/STATS/table4c6.html
male2017SSAtable = [
  100000,
  99370,
  99327,
  99298,
  99276,
  99260,
  99245,
  99232,
  99219,
  99208,
  99197,
  99188,
  99177,
  99162,
  99139,
  99105,
  99059,
  99001,
  98929,
  98845,
  98746,
  98633,
  98506,
  98367,
  98220,
  98067,
  97910,
  97746,
  97579,
  97406,
  97229,
  97048,
  96862,
  96672,
  96478,
  96278,
  96072,
  95860,
  95641,
  95417,
  95188,
  94951,
  94706,
  94450,
  94178,
  93890,
  93581,
  93250,
  92893,
  92505,
  92082,
  91622,
  91122,
  90577,
  89986,
  89345,
  88651,
  87903,
  87098,
  86236,
  85316,
  84333,
  83286,
  82177,
  81013,
  79795,
  78518,
  77172,
  75755,
  74263,
  72691,
  71027,
  69261,
  67384,
  65390,
  63272,
  61015,
  58611,
  56065,
  53383,
  50573,
  47629,
  44553,
  41361,
  38074,
  34718,
  31321,
  27915,
  24539,
  21241,
  18070,
  15080,
  12322,
  9837,
  7656,
  5798,
  4269,
  3057,
  2129,
  1445,
  958,
  619,
  388,
  237,
  140,
  80,
  44,
  23,
  11,
  5,
  2,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
  ]

//Lives remaining out of 100k, from SSA 2017 period life table
// from https://www.ssa.gov/oact/STATS/table4c6.html
female2017SSAtable = [
  100000,
  99477,
  99443,
  99422,
  99406,
  99392,
  99379,
  99368,
  99358,
  99348,
  99339,
  99330,
  99320,
  99309,
  99295,
  99278,
  99257,
  99232,
  99203,
  99170,
  99132,
  99090,
  99044,
  98993,
  98938,
  98880,
  98820,
  98756,
  98689,
  98617,
  98540,
  98458,
  98370,
  98278,
  98181,
  98079,
  97973,
  97861,
  97743,
  97619,
  97488,
  97348,
  97200,
  97042,
  96872,
  96690,
  96494,
  96282,
  96052,
  95802,
  95529,
  95231,
  94907,
  94554,
  94171,
  93755,
  93304,
  92816,
  92292,
  91734,
  91143,
  90515,
  89846,
  89134,
  88375,
  87568,
  86703,
  85774,
  84774,
  83696,
  82533,
  81272,
  79900,
  78413,
  76809,
  75079,
  73207,
  71177,
  68981,
  66613,
  64068,
  61328,
  58385,
  55251,
  51946,
  48487,
  44887,
  41159,
  37326,
  33424,
  29503,
  25627,
  21866,
  18294,
  14982,
  11987,
  9363,
  7136,
  5308,
  3854,
  2735,
  1893,
  1276,
  835,
  529,
  323,
  190,
  107,
  58,
  29,
  14,
  6,
  3,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
  ]


//Lives remaining out of 100k, from SSA 2016 period life table
male2016SSAtable = [
  100000,
  99364,
  99321,
  99292,
  99269,
  99252,
  99237,
  99222,
  99209,
  99197,
  99187,
  99178,
  99169,
  99156,
  99135,
  99103,
  99060,
  99004,
  98934,
  98850,
  98751,
  98635,
  98504,
  98360,
  98210,
  98055,
  97898,
  97738,
  97575,
  97408,
  97238,
  97063,
  96885,
  96703,
  96516,
  96325,
  96127,
  95923,
  95712,
  95495,
  95272,
  95042,
  94801,
  94549,
  94282,
  93998,
  93694,
  93369,
  93016,
  92631,
  92209,
  91747,
  91243,
  90694,
  90098,
  89452,
  88754,
  88001,
  87193,
  86329,
  85407,
  84422,
  83372,
  82263,
  81102,
  79893,
  78630,
  77303,
  75904,
  74421,
  72843,
  71158,
  69360,
  67447,
  65419,
  63274,
  60998,
  58583,
  56034,
  53360,
  50567,
  47648,
  44604,
  41447,
  38196,
  34873,
  31504,
  28121,
  24762,
  21472,
  18303,
  15307,
  12535,
  10030,
  7826,
  5941,
  4385,
  3147,
  2198,
  1496,
  994,
  644,
  406,
  248,
  147,
  84,
  46,
  24,
  12,
  6,
  3,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]

//Lives remaining out of 100k, from SSA 2016 period life table
female2016SSAtable = [
  100000,
  99467,
  99431,
  99407,
  99390,
  99375,
  99361,
  99349,
  99338,
  99328,
  99319,
  99310,
  99300,
  99289,
  99275,
  99258,
  99236,
  99211,
  99181,
  99147,
  99109,
  99067,
  99021,
  98971,
  98918,
  98861,
  98802,
  98740,
  98674,
  98605,
  98530,
  98451,
  98367,
  98278,
  98184,
  98085,
  97980,
  97869,
  97752,
  97628,
  97499,
  97362,
  97217,
  97061,
  96894,
  96713,
  96516,
  96303,
  96070,
  95815,
  95536,
  95231,
  94899,
  94538,
  94148,
  93728,
  93275,
  92788,
  92267,
  91714,
  91127,
  90503,
  89837,
  89128,
  88375,
  87574,
  86719,
  85801,
  84811,
  83739,
  82573,
  81301,
  79911,
  78404,
  76781,
  75038,
  73159,
  71128,
  68936,
  66576,
  64042,
  61318,
  58395,
  55284,
  52001,
  48562,
  44980,
  41271,
  37459,
  33580,
  29685,
  25835,
  22098,
  18546,
  15245,
  12253,
  9622,
  7378,
  5525,
  4042,
  2892,
  2020,
  1374,
  909,
  582,
  361,
  215,
  123,
  67,
  35,
  17,
  8,
  3,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

//Lives remaining out of 100k, from SSA 2015 period life table
male2015SSAtable = [
  100000,
  99362,
  99317,
  99289,
  99266,
  99249,
  99234,
  99219,
  99206,
  99194,
  99184,
  99174,
  99164,
  99151,
  99131,
  99100,
  99059,
  99006,
  98941,
  98863,
  98771,
  98663,
  98542,
  98410,
  98272,
  98131,
  97989,
  97844,
  97698,
  97547,
  97393,
  97235,
  97072,
  96906,
  96736,
  96562,
  96383,
  96198,
  96006,
  95809,
  95603,
  95389,
  95164,
  94925,
  94671,
  94397,
  94102,
  93784,
  93436,
  93054,
  92632,
  92168,
  91659,
  91103,
  90501,
  89851,
  89150,
  88396,
  87588,
  86724,
  85802,
  84819,
  83772,
  82663,
  81498,
  80277,
  78995,
  77644,
  76216,
  74704,
  73100,
  71393,
  69574,
  67640,
  65592,
  63426,
  61130,
  58693,
  56117,
  53406,
  50564,
  47585,
  44475,
  41251,
  37939,
  34566,
  31158,
  27748,
  24374,
  21079,
  17915,
  14934,
  12186,
  9714,
  7549,
  5706,
  4193,
  2996,
  2083,
  1410,
  932,
  600,
  376,
  228,
  134,
  76,
  42,
  22,
  11,
  5,
  2,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

female2015SSAtable = [
  100000,
  99463,
  99427,
  99405,
  99388,
  99375,
  99364,
  99353,
  99343,
  99334,
  99325,
  99316,
  99306,
  99295,
  99281,
  99264,
  99243,
  99217,
  99188,
  99156,
  99120,
  99080,
  99037,
  98990,
  98941,
  98890,
  98836,
  98779,
  98719,
  98656,
  98588,
  98515,
  98437,
  98354,
  98267,
  98175,
  98080,
  97978,
  97870,
  97756,
  97633,
  97502,
  97360,
  97207,
  97041,
  96861,
  96665,
  96452,
  96220,
  95965,
  95686,
  95380,
  95047,
  94686,
  94296,
  93877,
  93425,
  92939,
  92420,
  91870,
  91289,
  90673,
  90017,
  89317,
  88569,
  87769,
  86910,
  85982,
  84978,
  83889,
  82706,
  81414,
  80004,
  78475,
  76827,
  75058,
  73150,
  71088,
  68862,
  66466,
  63895,
  61131,
  58167,
  55013,
  51688,
  48207,
  44585,
  40838,
  36992,
  33085,
  29167,
  25303,
  21563,
  18020,
  14740,
  11781,
  9192,
  6998,
  5199,
  3771,
  2673,
  1848,
  1243,
  812,
  514,
  313,
  184,
  103,
  55,
  28,
  13,
  6,
  2,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleNS1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99878, 
  99752, 
  99621, 
  99486, 
  99346, 
  99200, 
  99046, 
  98882, 
  98707, 
  98518, 
  98313, 
  98093, 
  97858, 
  97612, 
  97352, 
  97078, 
  96785, 
  96469, 
  96121, 
  95735, 
  95307, 
  94833, 
  94307, 
  93726, 
  93085, 
  92376, 
  91588, 
  90708, 
  89717, 
  88598, 
  87332, 
  85902, 
  84296, 
  82501, 
  80505, 
  78291, 
  75838, 
  73126, 
  70141, 
  66872, 
  63302, 
  59421, 
  55230, 
  50742, 
  45995, 
  41062, 
  36045, 
  31069, 
  26266, 
  21767, 
  17683, 
  14094, 
  11015, 
  8421, 
  6283, 
  4563, 
  3220, 
  2204, 
  1461, 
  937, 
  581, 
  349, 
  202, 
  114, 
  62, 
  33, 
  17, 
  9, 
  4, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleNS2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99857, 
  99708, 
  99555, 
  99396, 
  99232, 
  99061, 
  98881, 
  98691, 
  98485, 
  98261, 
  98016, 
  97751, 
  97467, 
  97164, 
  96843, 
  96502, 
  96138, 
  95741, 
  95305, 
  94822, 
  94286, 
  93694, 
  93042, 
  92325, 
  91541, 
  90680, 
  89733, 
  88686, 
  87521, 
  86219, 
  84765, 
  83144, 
  81347, 
  79364, 
  77188, 
  74807, 
  72204, 
  69362, 
  66267, 
  62914, 
  59291, 
  55397, 
  51238, 
  46835, 
  42230, 
  37497, 
  32740, 
  28076, 
  23631, 
  19516, 
  15818, 
  12597, 
  9845, 
  7526, 
  5615, 
  4079, 
  2878, 
  1970, 
  1306, 
  838, 
  520, 
  312, 
  181, 
  101, 
  55, 
  29, 
  15, 
  8, 
  4, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleSM1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99747, 
  99482, 
  99203, 
  98907, 
  98594, 
  98261, 
  97905, 
  97524, 
  97115, 
  96673, 
  96195, 
  95679, 
  95117, 
  94505, 
  93837, 
  93105, 
  92301, 
  91415, 
  90436, 
  89355, 
  88165, 
  86856, 
  85423, 
  83863, 
  82174, 
  80353, 
  78393, 
  76282, 
  74007, 
  71562, 
  68949, 
  66181, 
  63281, 
  60277, 
  57194, 
  54053, 
  50867, 
  47647, 
  44413, 
  41137, 
  37791, 
  34392, 
  30963, 
  27535, 
  24151, 
  20868, 
  17747, 
  14846, 
  12216, 
  9890, 
  7881, 
  6191, 
  4788, 
  3634, 
  2699, 
  1956, 
  1379, 
  944, 
  626, 
  401, 
  249, 
  149, 
  87, 
  49, 
  26, 
  14, 
  7, 
  4, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

maleSM2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99712, 
  99410, 
  99093, 
  98756, 
  98398, 
  98018, 
  97611, 
  97175, 
  96706, 
  96200, 
  95654, 
  95063, 
  94421, 
  93722, 
  92961, 
  92129, 
  91218, 
  90217, 
  89117, 
  87907, 
  86580, 
  85130, 
  83550, 
  81840, 
  80001, 
  78031, 
  75925, 
  73672, 
  71263, 
  68691, 
  65964, 
  63098, 
  60119, 
  57058, 
  53943, 
  50797, 
  47633, 
  44461, 
  41296, 
  38115, 
  34887, 
  31632, 
  28372, 
  25136, 
  21964, 
  18908, 
  16022, 
  13360, 
  10963, 
  8856, 
  7048, 
  5534, 
  4280, 
  3248, 
  2412, 
  1748, 
  1233, 
  844, 
  559, 
  359, 
  223, 
  133, 
  77, 
  43, 
  24, 
  13, 
  7, 
  3, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleNS1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99927, 
  99853, 
  99778, 
  99700, 
  99619, 
  99532, 
  99439, 
  99339, 
  99229, 
  99107, 
  98970, 
  98817, 
  98649, 
  98467, 
  98270, 
  98058, 
  97828, 
  97579, 
  97307, 
  97008, 
  96679, 
  96317, 
  95921, 
  95485, 
  95008, 
  94484, 
  93908, 
  93269, 
  92558, 
  91760, 
  90862, 
  89851, 
  88711, 
  87425, 
  85971, 
  84323, 
  82449, 
  80318, 
  77928, 
  75290, 
  72386, 
  69115, 
  65465, 
  61509, 
  57250, 
  52710, 
  47938, 
  43012, 
  38020, 
  33056, 
  28230, 
  23646, 
  19372, 
  15473, 
  12011, 
  9032, 
  6559, 
  4597, 
  3111, 
  2032, 
  1279, 
  777, 
  455, 
  257, 
  141, 
  75, 
  39, 
  20, 
  10, 
  5, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleNS2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99915, 
  99829, 
  99741, 
  99650, 
  99555, 
  99453, 
  99344, 
  99226, 
  99096, 
  98950, 
  98787, 
  98604, 
  98403, 
  98183, 
  97946, 
  97690, 
  97415, 
  97116, 
  96789, 
  96432, 
  96041, 
  95612, 
  95143, 
  94631, 
  94073, 
  93463, 
  92796, 
  92061, 
  91247, 
  90341, 
  89330, 
  88199, 
  86933, 
  85517, 
  83930, 
  82148, 
  80139, 
  77873, 
  75355, 
  72599, 
  69591, 
  66241, 
  62539, 
  58564, 
  54324, 
  49843, 
  45177, 
  40401, 
  35605, 
  30876, 
  26318, 
  22028, 
  18046, 
  14414, 
  11189, 
  8414, 
  6110, 
  4282, 
  2898, 
  1893, 
  1192, 
  723, 
  424, 
  240, 
  131, 
  70, 
  36, 
  18, 
  9, 
  5, 
  2, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleSM1 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99841, 
  99673, 
  99493, 
  99297, 
  99083, 
  98851, 
  98595, 
  98316, 
  98012, 
  97677, 
  97312, 
  96912, 
  96473, 
  95990, 
  95457, 
  94869, 
  94220, 
  93504, 
  92714, 
  91844, 
  90887, 
  89838, 
  88689, 
  87435, 
  86075, 
  84606, 
  83022, 
  81316, 
  79489, 
  77543, 
  75476, 
  73281, 
  70953, 
  68487, 
  65878, 
  63126, 
  60207, 
  57086, 
  53755, 
  50222, 
  46526, 
  42743, 
  38871, 
  34929, 
  31014, 
  27181, 
  23490, 
  20006, 
  16783, 
  13858, 
  11262, 
  9010, 
  7082, 
  5454, 
  4111, 
  3030, 
  2182, 
  1529, 
  1035, 
  676, 
  426, 
  258, 
  151, 
  86, 
  47, 
  25, 
  13, 
  7, 
  3, 
  2, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

femaleSM2 = [
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  100000, 
  99800, 
  99588, 
  99360, 
  99111, 
  98838, 
  98541, 
  98215, 
  97857, 
  97465, 
  97035, 
  96564, 
  96049, 
  95484, 
  94864, 
  94184, 
  93437, 
  92619, 
  91722, 
  90743, 
  89674, 
  88511, 
  87248, 
  85884, 
  84414, 
  82839, 
  81159, 
  79373, 
  77474, 
  75466, 
  73356, 
  71142, 
  68820, 
  66388, 
  63841, 
  61179, 
  58404, 
  55490, 
  52407, 
  49148, 
  45724, 
  42173, 
  38579, 
  34936, 
  31260, 
  27640, 
  24125, 
  20768, 
  17625, 
  14738, 
  12137, 
  9846, 
  7871, 
  6187, 
  4765, 
  3591, 
  2647, 
  1907, 
  1336, 
  904, 
  591, 
  372, 
  226, 
  132, 
  75, 
  41, 
  22, 
  11, 
  6, 
  3, 
  1, 
  1, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0, 
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]



}
