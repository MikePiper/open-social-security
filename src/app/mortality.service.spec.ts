import { TestBed, inject } from '@angular/core/testing'
import { MortalityService } from './mortality.service'


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
    expect(table[83]).toEqual(1)
    expect(table[84]).toEqual(0)
  }))


})
