import {TestBed, inject} from '@angular/core/testing'
import {MortalityService} from './mortality.service'
import {Person} from './data model classes/person'
import { CalculationScenario } from './data model classes/calculationscenario';


describe('MortalityService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MortalityService]
    })
  })

  it('should be created', inject([MortalityService], (service: MortalityService) => {
    expect(service).toBeTruthy();
  }))


  //check that determineMortalityTable() gets the right table -- check via an indexed value
  it('should get the correct mortality table', inject([MortalityService], (service: MortalityService) => {
    let table = service.determineMortalityTable("female", "SSA", 0)
    expect(table[7])
        .toEqual(99353)
  }))

  it('should get the correct mortality table', inject([MortalityService], (service: MortalityService) => {
    let table = service.determineMortalityTable("male", "NS2", 0)
    expect(table[50])
        .toEqual(98691)
  }))

  //check method for creating mortality table
  it('should correctly create a mortality table using assumed death age', inject([MortalityService], (service: MortalityService) => {
    let table = service.createMortalityTable(83)
    expect(table[82]).toEqual(1)
    expect(table[83]).toEqual(0)
    expect(table[84]).toEqual(0)
  }))


  //check that calculateProbabilityAlive() does math appropriately
  it('should accurately calculate probability alive', inject([MortalityService], (service: MortalityService) => {
    let scenario:CalculationScenario = new CalculationScenario()
    scenario.maritalStatus = "single"
    let person:Person = new Person("A")
    person.initialAge = 62
    person.initialAgeRounded = 62
    person.mortalityTable = service.determineMortalityTable("female", "SSA", 0)
    person.baseMortalityFactor = service.calculateBaseMortalityFactor(person)
    let age = 80
    expect(service.calculateProbabilityAlive(person, age))
        .toBeCloseTo(0.6791, 4) //Lives at 62 is 90,017. Lives at 81 (i.e., end of age 80) is 61,131. 61131/90017 = 0.6791
  }))

})
