import {TestBed, inject} from '@angular/core/testing'
import {SolutionSetService} from './solutionset.service'
import {BenefitService} from './benefit.service'
import {SolutionSet} from './solutionset'
import {Person} from './person';


describe('ClaimingsolutionService', () => {
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
    let person:Person = new Person() 
    let maritalStatus: string = "single"
    let SSbirthDate:Date = new Date(1960, 3, 1) //April 1, 1960
    person.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    let PIA:number = 2000
    let savedPV:number = 180000 //Just completely making this PV up
    let savedClaimingDate:Date = new Date(2029, 5, 1) //2 years and 2 months after FRA, for no particular reason
    expect(service.generateSingleSolutionSet(maritalStatus, SSbirthDate, person, PIA, savedPV, savedClaimingDate).solutionPV)
      .toEqual(savedPV)
  }))

  it('SolutionSet object should have appropriate date saved', inject([SolutionSetService], (service: SolutionSetService) => {
    let person:Person = new Person() 
    let maritalStatus: string = "single"
    let SSbirthDate:Date = new Date(1960, 3, 1) //April 1, 1960
    person.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    let PIA:number = 2000
    let savedPV:number = 180000 //Just completely making this PV up
    let savedClaimingDate:Date = new Date(2029, 5, 1) //2 years and 2 months after FRA, for no particular reason
    let wrongDate:Date = new Date (2028, 4, 1)
    expect(service.generateSingleSolutionSet(maritalStatus, SSbirthDate, person, PIA, savedPV, savedClaimingDate).solutionsArray[0].date)
      .toEqual(savedClaimingDate)
    expect(service.generateSingleSolutionSet(maritalStatus, SSbirthDate, person, PIA, savedPV, savedClaimingDate).solutionsArray[0].date)
      .not.toEqual(wrongDate)
  }))
  

  //test generateCoupleSolutionSet
  it('SolutionSet object should have appropriate date saved as earliest date', inject([SolutionSetService], (service: SolutionSetService) => {
    let personA:Person = new Person()
    let personB:Person = new Person()
    let maritalStatus:string = "married"
    let spouseASSbirthDate: Date = new Date(1960, 3, 1) //April 1, 1960
    let spouseBSSbirthDate: Date = new Date(1960, 3, 1) //April 1, 1960
    personA.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    personB.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    let spouseAPIA: number = 1200
    let spouseBPIA: number = 1900
    let spouseAsavedRetirementDate: Date = new Date(2031, 5, 1) //no particular reason for any of these dates
    let spouseBsavedRetirementDate: Date = new Date(2030, 5, 1)
    let spouseAsavedSpousalDate: Date = new Date(2033, 5, 1)
    let spouseBsavedSpousalDate: Date = new Date(2035, 5, 1)
    let savedPV: number = 380000 //completely making this up
    let spouseAgovernmentPension: number = 0
    let spouseBgovernmentPension:number = 0
    expect(service.generateCoupleSolutionSet(maritalStatus, personA, personB, spouseASSbirthDate, spouseBSSbirthDate, spouseAPIA, spouseBPIA,
      spouseAsavedRetirementDate, spouseBsavedRetirementDate, spouseAsavedSpousalDate, spouseBsavedSpousalDate, savedPV, spouseAgovernmentPension, spouseBgovernmentPension).solutionsArray[0].date)
      .toEqual(spouseBsavedRetirementDate)
  }))


  //test generateCoupleOneHasFiledSolutionSet
  it('SolutionSet object should have appropriate date saved as earliest date', inject([SolutionSetService], (service: SolutionSetService) => {
    let flexibleSpouse:Person = new Person()
    let fixedSpouse:Person = new Person()
    let maritalStatus:string = "divorced"
    let spouseAhasFiled:boolean = false
    let spouseBhasFiled:boolean = true
    let flexibleSpouseSSbirthDate: Date = new Date(1960, 3, 1) //April 1, 1960
    flexibleSpouse.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    let fixedSpouseSSbirthDate: Date = new Date(1960, 3, 1) //April 1, 1960
    fixedSpouse.FRA = new Date(2027, 3, 1) //FRA April 1, 2027
    let flexibleSpousePIA: number = 1200
    let fixedSpousePIA: number = 1900
    let flexibleSpouseSavedRetirementDate: Date = new Date(2033, 5, 1) //no particular reason for any of these dates
    let fixedSpouseRetirementBenefitDate: Date = new Date(2030, 5, 1)
    let flexibleSpouseSavedSpousalDate: Date = new Date(2031, 5, 1)
    let fixedSpouseSavedSpousalDate: Date = new Date(2031, 5, 1)
    let savedPV: number = 380000 //completely making this up
    let flexibleSpouseGovernmentPension: number = 0
    let fixedSpouseGovernmentPension: number = 0
    expect(service.generateCoupleOneHasFiledSolutionSet(maritalStatus, flexibleSpouse, fixedSpouse, spouseAhasFiled, spouseBhasFiled, flexibleSpousePIA, fixedSpousePIA,
      flexibleSpouseSSbirthDate, fixedSpouseSSbirthDate, flexibleSpouseGovernmentPension, fixedSpouseGovernmentPension,
      flexibleSpouseSavedRetirementDate, flexibleSpouseSavedSpousalDate, fixedSpouseRetirementBenefitDate, fixedSpouseSavedSpousalDate, savedPV).solutionsArray[0].date)
      .toEqual(flexibleSpouseSavedSpousalDate)
  }))

})
