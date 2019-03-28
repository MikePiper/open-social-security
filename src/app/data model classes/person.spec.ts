import {TestBed} from '@angular/core/testing'
import {Person} from "./person"
import {MonthYearDate} from "./monthYearDate"
import {MortalityService} from "../mortality.service"

let mortalityService:MortalityService
let person:Person

describe('person', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MortalityService]
    })
    mortalityService = TestBed.get(MortalityService)
    person = new Person("A") 
  })

  it('ssAgeAtDate should return appropriate values', () => {

    let age:number
    let date: MonthYearDate

    person.SSbirthDate = new MonthYearDate(2001, 0) // January, 2001

    date = new MonthYearDate(2002, 6) // July, 2000
    age = person.ssAgeAtDate(date)
    expect(age).toBeCloseTo(1.5,5)

    date = new MonthYearDate(2010, 6) // July, 2000
    age = person.ssAgeAtDate(date)
    expect(age).toBeCloseTo(9.5,5)

    person.SSbirthDate = new MonthYearDate(2001, 8) // September, 2001

    date = new MonthYearDate(2002, 5) // June, 2000
    age = person.ssAgeAtDate(date)
    expect(age).toBeCloseTo(0.75,5)

    date = new MonthYearDate(2012, 9) // June, 2000
    age = person.ssAgeAtDate(date)
    expect(age).toBeCloseTo(11 + 1/12,5)
  })
 
  it('ssAgeAtBeginYear should return appropriate values', () => {

    let age:number
    person.SSbirthDate = new MonthYearDate(2001, 0) // January, 2001

    age = person.ssAgeAtBeginYear(2001)
    expect(age).toBeCloseTo(0, 5)

    age = person.ssAgeAtBeginYear(2010)
    expect(age).toBeCloseTo(9, 5)

    person.SSbirthDate = new MonthYearDate(2001, 2) // March, 2001

    age = person.ssAgeAtBeginYear(2002)
    expect(age).toBeCloseTo(0.833333, 5)

    age = person.ssAgeAtBeginYear(2011)
    expect(age).toBeCloseTo(9.833333, 5)

    
  })

  
  it('probabilityAliveBeginYear should return accurate results from table', () => {
    person.SSbirthDate = new MonthYearDate(2001, 0)
    // Probability Alive with Base Year 2001
    person.probabilityAliveArray = [1.000,0.900,0.800,0.700,0.600,0.500,0.400,0.300,0.200,0.100,0.000]
    person.probabilityAliveBaseYear = 2001
    person.probabilityAliveLatestYear = 2011

    expect(person.probabilityAliveAtBeginYear(2000)).toBe(0)
    expect(person.probabilityAliveAtBeginYear(2001)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2002)).toBeCloseTo(0.9,5)
    expect(person.probabilityAliveAtBeginYear(2006)).toBeCloseTo(0.5,5)
    expect(person.probabilityAliveAtBeginYear(2010)).toBeCloseTo(0.1,5)
    expect(person.probabilityAliveAtBeginYear(2011)).toBe(0)
    expect(person.probabilityAliveAtBeginYear(2015)).toBe(0)

    person.SSbirthDate = new MonthYearDate(2005, 0)
    // Probability Alive with Base Year 2008
    person.probabilityAliveArray = [1.000,0.857,0.714,0.571,0.429,0.286,0.143,0.000]
    person.probabilityAliveBaseYear = 2008
    person.probabilityAliveLatestYear = 2015

    expect(person.probabilityAliveAtBeginYear(2004)).toBe(0)
    expect(person.probabilityAliveAtBeginYear(2005)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2008)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2011)).toBeCloseTo(0.571,3)
    expect(person.probabilityAliveAtBeginYear(2012)).toBeCloseTo(0.429,3)
    expect(person.probabilityAliveAtBeginYear(2014)).toBeCloseTo(0.143,3)
    expect(person.probabilityAliveAtBeginYear(2015)).toBe(0)
    expect(person.probabilityAliveAtBeginYear(2020)).toBe(0)

  })

  it('initializeProbabilityAliveTable [ezTable, DOB (2001, 0), baseDate (2004, 0)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = [100,90,80,70,60,50,40,30,20,10,0] 
    person.SSbirthDate = new MonthYearDate(2001, 0)
    let baseDate: MonthYearDate = new MonthYearDate(2004, 0)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2004)
    expect(person.probabilityAliveLatestYear).toBe(2011)
    
    // Probability Alive with baseDate (2004, 0) 
    let expectedArray = [1, 0.85714, 0.71429, 0.571429, 0.42857, 
      0.28571, 0.14286,	0]

    // Would like to check generated array against expected, but following check does not work
    // expect(person.probabilityAliveArray).toEqual(expectedArray)
    // because Jasmine doesn't provide 'closeTo' testing of arrays, and match is not exact, so:
    // One option: actual.every((x, i) => expect(x).toBeCloseTo(expected[i]));
    // Another option: actual.forEach((x, i) => expect(x).toBeCloseTo(expected[i]))
    person.probabilityAliveArray.forEach((x: number, i: number) => expect(x).toBeCloseTo(expectedArray[i], 5))

    // before born
    expect(person.probabilityAliveAtBeginYear(2000)).toBe(0)
    // born this date, but before base year
    expect(person.probabilityAliveAtBeginYear(2001)).toBe(1)
    // base year
    expect(person.probabilityAliveAtBeginYear(2004)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2006)).toBeCloseTo(0.7143, 4)
    expect(person.probabilityAliveAtBeginYear(2007)).toBeCloseTo(0.5714, 4)
    expect(person.probabilityAliveAtBeginYear(2009)).toBeCloseTo(0.2857, 4)
    // last year of array
    expect(person.probabilityAliveAtBeginYear(2011)).toBe(0)
    // after array
    expect(person.probabilityAliveAtBeginYear(2014)).toBe(0)
  })

  it('initializeProbabilityAliveTable [ezTable, DOB (2001, 8), baseDate (2004, 0)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = [100,90,80,70,60,50,40,30,20,10,0] 
    person.SSbirthDate = new MonthYearDate(2001, 8)
    let baseDate: MonthYearDate = new MonthYearDate(2004, 0)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2004)
    expect(person.probabilityAliveLatestYear).toBe(2012)
    
    // before born
    expect(person.probabilityAliveAtBeginYear(2000)).toBe(0)
    // base year
    expect(person.probabilityAliveAtBeginYear(2004)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2006)).toBeCloseTo(0.7391, 4)
    expect(person.probabilityAliveAtBeginYear(2007)).toBeCloseTo(0.6087, 4)
    expect(person.probabilityAliveAtBeginYear(2009)).toBeCloseTo(0.3478, 4)
    // last year of array
    expect(person.probabilityAliveAtBeginYear(2012)).toBe(0)
    // after array
    expect(person.probabilityAliveAtBeginYear(2014)).toBe(0)
  })

  it('initializeProbabilityAliveTable [ezTable, DOB (2002, 4), baseDate (2004, 3)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = [100,90,80,70,60,50,40,30,20,10,0] 
    person.SSbirthDate = new MonthYearDate(2002, 4)
    let baseDate: MonthYearDate = new MonthYearDate(2004, 3)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2004)
    expect(person.probabilityAliveLatestYear).toBe(2013)
    
    // not born yet
    expect(person.probabilityAliveAtBeginYear(2002)).toBe(0)
    // born, but before base year
    expect(person.probabilityAliveAtBeginYear(2003)).toBe(1)
    // base year
    expect(person.probabilityAliveAtBeginYear(2004)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2006)).toBeCloseTo(0.7835, 4)
    expect(person.probabilityAliveAtBeginYear(2007)).toBeCloseTo(0.6598, 4)
    expect(person.probabilityAliveAtBeginYear(2009)).toBeCloseTo(0.4124, 4)
    // last year in array
    expect(person.probabilityAliveAtBeginYear(2013)).toBe(0)
    // after end of array
    expect(person.probabilityAliveAtBeginYear(2016)).toBe(0)
  })

  it('initializeProbabilityAliveTable [ezTable, DOB (2003, 8), baseDate (2005, 9)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = [100,90,80,70,60,50,40,30,20,10,0] 
    person.SSbirthDate = new MonthYearDate(2003, 8)
    let baseDate: MonthYearDate = new MonthYearDate(2005, 9)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2005)
    expect(person.probabilityAliveLatestYear).toBe(2014)
    
    // not born yet
    expect(person.probabilityAliveAtBeginYear(2003)).toBe(0)
    // born, but before base year
    expect(person.probabilityAliveAtBeginYear(2004)).toBe(1)
    // base year
    expect(person.probabilityAliveAtBeginYear(2005)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2006)).toBeCloseTo(0.9684, 4)
    expect(person.probabilityAliveAtBeginYear(2007)).toBeCloseTo(0.8421, 4)
    expect(person.probabilityAliveAtBeginYear(2009)).toBeCloseTo(0.5895, 4)
    // last year in array
    expect(person.probabilityAliveAtBeginYear(2014)).toBe(0)
    // after array
    expect(person.probabilityAliveAtBeginYear(2018)).toBe(0)
  })

  it('initializeProbabilityAliveTable [ezTable, DOB (2003, 0), baseDate (2005, 9)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = [100,90,80,70,60,50,40,30,20,10,0] 
    person.SSbirthDate = new MonthYearDate(2003, 0)
    let baseDate: MonthYearDate = new MonthYearDate(2005, 9)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2005)
    expect(person.probabilityAliveLatestYear).toBe(2013)
    
    // just born
    expect(person.probabilityAliveAtBeginYear(2003)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2004)).toBe(1)
    // base year
    expect(person.probabilityAliveAtBeginYear(2005)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2006)).toBeCloseTo(0.9655, 4)
    expect(person.probabilityAliveAtBeginYear(2007)).toBeCloseTo(0.8276, 4)
    expect(person.probabilityAliveAtBeginYear(2009)).toBeCloseTo(0.5517, 4)
    // last year in array
    expect(person.probabilityAliveAtBeginYear(2013)).toBe(0)
    // after array
    expect(person.probabilityAliveAtBeginYear(2018)).toBe(0)
  })

  // Basic process seems to work
  // Now let's try some real world examples
  it('initializeProbabilityAliveTable [maleSSAtable, DOB (1951, 0), baseDate (2017, 9)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) 
    person.SSbirthDate = new MonthYearDate(1951, 0)
    let baseDate: MonthYearDate = new MonthYearDate(2017, 9)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2017)
    
    // not yet born
    expect(person.probabilityAliveAtBeginYear(1950)).toBe(0)
    // just born
    expect(person.probabilityAliveAtBeginYear(1951)).toBe(1)
    // base year
    expect(person.probabilityAliveAtBeginYear(2017)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2023)).toBeCloseTo(0.8922, 4)
    expect(person.probabilityAliveAtBeginYear(2025)).toBeCloseTo(0.8411, 4)
    expect(person.probabilityAliveAtBeginYear(2027)).toBeCloseTo(0.7839, 4)
    // after array
    expect(person.probabilityAliveAtBeginYear(1955 + 120)).toBe(0)
  })

  it('initializeProbabilityAliveTable [maleSSAtable, DOB (1956, 4), baseDate (2019, 9)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) 
    person.SSbirthDate = new MonthYearDate(1956, 4)
    let baseDate: MonthYearDate = new MonthYearDate(2019, 9)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2019)
    
    // not yet born
    expect(person.probabilityAliveAtBeginYear(1956)).toBe(0)
    // just born
    expect(person.probabilityAliveAtBeginYear(1957)).toBe(1)
    // base year
    expect(person.probabilityAliveAtBeginYear(2019)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2023)).toBeCloseTo(0.9503, 4)
    expect(person.probabilityAliveAtBeginYear(2025)).toBeCloseTo(0.9152, 4)
    expect(person.probabilityAliveAtBeginYear(2027)).toBeCloseTo(0.8757, 4)
    // after array
    expect(person.probabilityAliveAtBeginYear(1956 + 120)).toBe(0)
  })

  it('initializeProbabilityAliveTable [maleSSAtable, DOB (1961, 8), baseDate (2021,9)] should create appropriate table and give accurate results.', () => {

    // sample mortality table
    person.mortalityTable = mortalityService.determineMortalityTable ("male", "SSA", 0) 
    person.SSbirthDate = new MonthYearDate(1961, 8)
    let baseDate: MonthYearDate = new MonthYearDate(2021, 9)
    person.initializeProbabilityAliveArray(baseDate)

    expect(person.probabilityAliveBaseYear).toBe(2021)
    
    // not yet born
    expect(person.probabilityAliveAtBeginYear(1961)).toBe(0)
    // just born
    expect(person.probabilityAliveAtBeginYear(1962)).toBe(1)
    // base year
    expect(person.probabilityAliveAtBeginYear(2019)).toBe(1)
    expect(person.probabilityAliveAtBeginYear(2023)).toBeCloseTo(0.9854 , 4)
    expect(person.probabilityAliveAtBeginYear(2025)).toBeCloseTo(0.9598, 4)
    expect(person.probabilityAliveAtBeginYear(2027)).toBeCloseTo(0.9315, 4)
    // after array
    expect(person.probabilityAliveAtBeginYear(1961 + 120)).toBe(0)
  })


})