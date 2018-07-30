import {TestBed, inject} from '@angular/core/testing'
import {SolutionSetService} from './solutionset.service'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './data model classes/solutionset'
import {Person} from './data model classes/person'
import {ClaimingScenario} from './data model classes/claimingscenario'


describe('SolutionSetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SolutionSetService, SolutionSet, BenefitService]
    })
  })

  it('should be created', inject([SolutionSetService], (service: SolutionSetService) => {
    expect(service).toBeTruthy()
  }))


//Test generateSingleSolutionSet
  it('SolutionSet object should have PV that was passed in', inject([SolutionSetService], (service: SolutionSetService) => {
    let person:Person = new Person("A")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "single"
    let SSbirthDate:Date = new Date(1960, 3, 1) //April 1, 1960
    person.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    person.PIA = 2000
    let savedPV:number = 180000 //Just completely making this PV up
    let savedClaimingDate:Date = new Date(2029, 5, 1) //2 years and 2 months after FRA, for no particular reason
    expect(service.generateSingleSolutionSet(scenario, SSbirthDate, person, savedPV, savedClaimingDate).solutionPV)
      .toEqual(savedPV)
  }))

  it('SolutionSet object should have appropriate date saved', inject([SolutionSetService], (service: SolutionSetService) => {
    let person:Person = new Person("A") 
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "single"
    let SSbirthDate:Date = new Date(1960, 3, 1) //April 1, 1960
    person.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    person.PIA = 2000
    let savedPV:number = 180000 //Just completely making this PV up
    let savedClaimingDate:Date = new Date(2029, 5, 1) //2 years and 2 months after FRA, for no particular reason
    let wrongDate:Date = new Date (2028, 4, 1)
    expect(service.generateSingleSolutionSet(scenario, SSbirthDate, person, savedPV, savedClaimingDate).solutionsArray[0].date)
      .toEqual(savedClaimingDate)
    expect(service.generateSingleSolutionSet(scenario, SSbirthDate, person, savedPV, savedClaimingDate).solutionsArray[0].date)
      .not.toEqual(wrongDate)
  }))
  

  //test generateCoupleSolutionSet
  it('SolutionSet object should have appropriate date saved as earliest date', inject([SolutionSetService], (service: SolutionSetService) => {
    let personA:Person = new Person("A")
    let personB:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario()
    scenario.maritalStatus = "married"
    personA.SSbirthDate = new Date(1960, 3, 1) //April 1, 1960
    personB.SSbirthDate = new Date(1960, 3, 1) //April 1, 1960
    personA.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    personB.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    personA.PIA = 1200
    personB.PIA = 1900
    let spouseAsavedRetirementDate: Date = new Date(2031, 5, 1) //no particular reason for any of these dates
    let spouseBsavedRetirementDate: Date = new Date(2030, 5, 1)
    let spouseAsavedSpousalDate: Date = new Date(2033, 5, 1)
    let spouseBsavedSpousalDate: Date = new Date(2035, 5, 1)
    let personAsavedEndSuspensionDate: Date = new Date(1900, 0, 1)
    let personBsavedEndSuspensionDate: Date = new Date(1900, 0, 1)
    let personAsavedBeginSuspensionDate: Date = new Date(1900, 0, 1)
    let personBsavedBeginSuspensionDate: Date = new Date(1900, 0, 1)
    let savedPV: number = 380000 //completely making this up
    personA.governmentPension = 0
    personB.governmentPension = 0
    expect(service.generateCoupleSolutionSet(scenario, personA, personB,
      spouseAsavedRetirementDate, spouseBsavedRetirementDate, spouseAsavedSpousalDate, spouseBsavedSpousalDate,
      personAsavedBeginSuspensionDate, personAsavedEndSuspensionDate, personBsavedBeginSuspensionDate, personBsavedEndSuspensionDate, savedPV).solutionsArray[0].date)
      .toEqual(spouseBsavedRetirementDate)
  }))


  //test generateCoupleOneHasFiledSolutionSet
  it('SolutionSet object should have appropriate date saved as earliest date', inject([SolutionSetService], (service: SolutionSetService) => {
    let flexibleSpouse:Person = new Person("A")
    let fixedSpouse:Person = new Person("B")
    let scenario:ClaimingScenario = new ClaimingScenario
    scenario.maritalStatus = "divorced"
    scenario.personAhasFiled = false
    scenario.personBhasFiled = true
    flexibleSpouse.SSbirthDate = new Date(1960, 3, 1) //April 1, 1960
    flexibleSpouse.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    fixedSpouse.SSbirthDate = new Date(1960, 3, 1) //April 1, 1960
    fixedSpouse.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    flexibleSpouse.PIA = 1200
    fixedSpouse.PIA = 1900
    let flexibleSpouseSavedRetirementDate: Date = new Date(2033, 5, 1) //no particular reason for any of these dates
    let fixedSpouseRetirementBenefitDate: Date = new Date(2030, 5, 1)
    let flexibleSpouseSavedSpousalDate: Date = new Date(2031, 5, 1)
    let fixedSpouseSavedSpousalDate: Date = new Date(2031, 5, 1)
    let savedPV: number = 380000 //completely making this up
    flexibleSpouse.governmentPension = 0
    fixedSpouse.governmentPension = 0
    expect(service.generateCoupleOneHasFiledSolutionSet(flexibleSpouse, fixedSpouse, scenario,
      flexibleSpouseSavedRetirementDate, flexibleSpouseSavedSpousalDate, fixedSpouseRetirementBenefitDate, fixedSpouseSavedSpousalDate, savedPV).solutionsArray[0].date)
      .toEqual(flexibleSpouseSavedSpousalDate)
  }))

})
