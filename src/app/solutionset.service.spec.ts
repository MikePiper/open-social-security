import {TestBed, inject} from '@angular/core/testing'
import {SolutionSetService} from './solutionset.service'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './data model classes/solutionset'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {MonthYearDate} from "./data model classes/monthyearDate"
import { BirthdayService } from './birthday.service';


describe('SolutionSetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SolutionSetService, SolutionSet, BenefitService, BirthdayService]
    })
  })

  it('should be created', inject([SolutionSetService], (service: SolutionSetService) => {
    expect(service).toBeTruthy()
  }))


//Test generateSingleSolutionSet
  it('SolutionSet object should have PV that was passed in', inject([SolutionSetService], (service: SolutionSetService) => {
    let person:Person = new Person("A")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "single"
    person.SSbirthDate = new MonthYearDate(1960, 3, 1) //April 1, 1960
    person.FRA = new MonthYearDate(2027, 3, 1) //FRA April 1, 2027
    person.PIA = 2000
    let savedPV:number = 180000 //Just completely making this PV up
    person.retirementBenefitDate = new MonthYearDate(2029, 5, 1) //2 years and 2 months after FRA, for no particular reason
    expect(service.generateSingleSolutionSet(scenario, person, savedPV).solutionPV)
      .toEqual(savedPV)
  }))

  it('SolutionSet object should have appropriate date saved', inject([SolutionSetService], (service: SolutionSetService) => {
    let person:Person = new Person("A") 
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "single"
    person.SSbirthDate = new MonthYearDate(1960, 3, 1) //April 1, 1960
    person.FRA = new MonthYearDate(2027, 3, 1) //FRA April 1, 2027
    person.PIA = 2000
    let savedPV:number = 180000 //Just completely making this PV up
    person.retirementBenefitDate = new MonthYearDate(2029, 5, 1) //2 years and 2 months after FRA, for no particular reason
    let wrongDate:MonthYearDate = new MonthYearDate (2028, 4, 1)
    expect(service.generateSingleSolutionSet(scenario, person, savedPV).solutionsArray[0].date)
      .toEqual(person.retirementBenefitDate)
    expect(service.generateSingleSolutionSet(scenario, person, savedPV).solutionsArray[0].date)
      .not.toEqual(wrongDate)
  }))
  

  //test generateCoupleSolutionSet
  it('SolutionSet object should have appropriate date saved as earliest date', inject([SolutionSetService], (service: SolutionSetService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new MonthYearDate(1960, 3, 1) //April 1, 1960
    personB.SSbirthDate = new MonthYearDate(1960, 3, 1) //April 1, 1960
    personA.FRA = new MonthYearDate(2027, 3, 1) //FRA April 1, 2027
    personB.FRA = new MonthYearDate(2027, 3, 1) //FRA April 1, 2027
    personA.PIA = 1200
    personB.PIA = 1900
    personA.initialAge = 58
    personB.initialAge = 58
    personA.retirementBenefitDate = new MonthYearDate(2031, 5, 1) //no particular reason for any of these dates
    personB.retirementBenefitDate = new MonthYearDate(2030, 5, 1)
    personA.spousalBenefitDate = new MonthYearDate(2033, 5, 1)
    personB.spousalBenefitDate = new MonthYearDate(2035, 5, 1)
    personA.beginSuspensionDate = new MonthYearDate(1900, 0, 1)
    personA.endSuspensionDate = new MonthYearDate(1900, 0, 1)
    personB.beginSuspensionDate = new MonthYearDate(1900, 0, 1)
    personB.endSuspensionDate = new MonthYearDate(1900, 0, 1)
    let savedPV: number = 380000 //completely making this up
    personA.governmentPension = 0
    personB.governmentPension = 0
    expect(service.generateCoupleSolutionSet(scenario, personA, personB, savedPV).solutionsArray[0].date)
      .toEqual(personB.retirementBenefitDate)
  }))


})
