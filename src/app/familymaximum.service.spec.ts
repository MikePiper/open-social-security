import { TestBed, inject } from '@angular/core/testing';
import { FamilyMaximumService } from './familymaximum.service';
import { Person } from './data model classes/person';
import { MonthYearDate } from './data model classes/monthyearDate';
import { CalculationScenario } from './data model classes/calculationscenario';

describe('FamilyMaximumService', () => {
  let service:FamilyMaximumService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FamilyMaximumService]
    })
    service = TestBed.get(FamilyMaximumService)
  })


    //Testing calculatePIAfromAIME()
    it('should calculate PIA appropriately from AIME with PIA below first bend point', () => {
      expect(service.calculatePIAfromAIME(700, 2015))
          .toEqual(630)
      //First bend point is 826 in 2015. 700 * 0.9 = 630
    })
  
    it('should calculate PIA appropriately from AIME with PIA between first and second bend points', () => {
      expect(service.calculatePIAfromAIME(3000, 2013))
          .toEqual(1418.78)
      //Bend points in 2013 are 791 and 4768. 791 * 0.9 + (3000 - 791) * 0.32 = 1418.78
    })
  
    it('should calculate PIA appropriately from AIME with PIA above second bend point', () => {
      expect(service.calculatePIAfromAIME(6000, 2018))
          .toEqual(2336.59)
      //Bend points in 2018 are 895 and 5397. 0.9 * 895 + 0.32 * (5397-895) + 0.15 * (6000-5397) = 2336.59
    })
  
    //Testing calculateFamilyMaximum()
    it('calculateFamilyMaximum() should calculate AIME appropriately in scenario with PIA below first bend point', () => {
      let person:Person = new Person("A")
      person.isOnDisability = true
      person.fixedRetirementBenefitDate = new MonthYearDate(2015, 5, 13)
      person.PIA = 700
      expect(service.calculateFamilyMaximum(person).AIME)
          .toBeCloseTo(760.25, 1)
      //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0.
      //700 / 1.02 / 1.003 / 1 = 684.22 <- PIAbeforeCOLAs
      //In 2015, PIA bend points were $826 and $4980
      //684.22 / 0.9 = $760.25
    })
  
    it('calculateFamilyMaximum() should calculate AIME appropriately in disability scenario with PIA between first and second bend points', () => {
      let person:Person = new Person("A")
      person.isOnDisability = true
      person.fixedRetirementBenefitDate = new MonthYearDate(2015, 5, 13)
      person.PIA = 1000
      expect(service.calculateFamilyMaximum(person).AIME)
          .toBeCloseTo(1557.44, 1)
      //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0.
      //1000 / 1.02 / 1.003 / 1 = 977.46 <- PIAbeforeCOLAs
      //In 2015, PIA bend points were $826 and $4980
      //AIME = 977.46/0.32 - 1.8125 * 826 = 1557.44
      //reverse check: AIME of 1557.44 -> 0.9 x 826 + 0.32 x (1557.44 - 826) = $977.46 Good!
    })
  
    it('calculateFamilyMaximum() should calculate AIME appropriately in disability scenario with PIA beyond second bend point', () => {
      let person:Person = new Person("A")
      person.isOnDisability = true
      person.fixedRetirementBenefitDate = new MonthYearDate(2013, 5, 13)
      person.PIA = 2400
      expect(service.calculateFamilyMaximum(person).AIME)
          .toBeCloseTo(6688.4, 1)
      //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0. 2014 COLA = 1.7%. 2013 COLA = 1.5%.
      //2400 / 1.02 / 1.003 / 1 / 1.017 / 1.015 = 2272.60 <- PIAbeforeCOLAs
      //In 2013, PIA bend points were $791 and $4768
      //AIME = (2272.60 - 0.58*791 - 0.17*4768) / 0.15 = $6688.4
      //reverse check: AIME of 6688.4 -> 0.9*791 + 0.32*(4768-791) + 0.15*(6688.4-4768) = 2272.6 Good!
    })
  
    it('calculateFamilyMaximum() should calculate family maximum appropriately for person on disability', () => {
      let person:Person = new Person("A")
      person.isOnDisability = true
      person.fixedRetirementBenefitDate = new MonthYearDate(2015, 5, 13)
      person.PIA = 2000
      expect(service.calculateFamilyMaximum(person).familyMaximum)
          .toBeCloseTo(2977.46, 1)
      //2017 COLA = 2%. 2016 COLA = 0.3%. 2015 COLA = 0.
      //2000 / 1.02 / 1.003 / 1  = 1954.92 <- PIAbeforeCOLAs
      //In 2015, PIA bend points were $826 and $4980
      //AIME = 1954.92/0.32 - 1.8125 * 826 = 4612
      //85% of AIME = 3920.2
      //family max (before COLAs) is lesser of 85% of AIME (3920.2) or 150% of PIAbeforeCOLA (2932.38) = 2932.38
      //Now we add back COLAs (2000 - 1954.92 = 45.08)
      //2932.38 + 45.08 = 2977.46
    })
  
    it('calculateFamilyMaximum() should calculate family maximum appropriately based on normal retirement benefit', () => {
      let person:Person = new Person("A")
      person.SSbirthDate = new MonthYearDate(1952, 4, 1)//Person born in May 1952.
      person.PIA = 2000
      expect(service.calculateFamilyMaximum(person).familyMaximum)
          .toBeCloseTo(3501.24, 1)
      //person reaches 62 in 2014
      //Family max bend points in 2014: 1042,	1505, 1962
      //manual calc: 1.5 * 1042 + 2.72 * (1505 - 1042) + 1.34 * (1962 - 1505) + 1.75 * (2000 - 1962) = 3501.24
    })
  
  
    //testing calculateCombinedFamilyMaximum()
    it('should calculate combined family maximum appropriately in scenario where it is just sum of two maximums', () => {
      let personA:Person = new Person("A")
      let personB:Person = new Person("B")
      personA.familyMaximum = 1000
      personB.familyMaximum = 1500
      expect(service.calculateCombinedFamilyMaximum(personA, personB, 2016))
          .toEqual(2500)
      //Limit for combinedFamilyMax in 2016 was 4995.20, per POMS RS 00615.770. So we just combine the two
    })
  
    it('should calculate combined family maximum appropriately in scenario where it is just sum of two maximums', () => {
      let personA:Person = new Person("A")
      let personB:Person = new Person("B")
      personA.familyMaximum = 2500
      personB.familyMaximum = 2500
      expect(service.calculateCombinedFamilyMaximum(personA, personB, 2013))
          .toBeCloseTo(4708, 0)
      //Limit for combinedFamilyMax in 2013 was 4708.30, per POMS RS 00615.770. So we use that limit in this case.
    })
  
    //testing applyFamilyMaximumSingle()
    it('should apply family maximum appropriately when there are multiple kids', () => {
        let person:Person = new Person("A")
        let child1:Person = new Person("1")
        let child2:Person = new Person("2")
        child1.age = 10
        child2.age = 10
        child1.monthlyChildPayment = 500 //Considering a still-alive scenario here
        child2.monthlyChildPayment = 500
        let scenario:CalculationScenario = new CalculationScenario()
        scenario.children = [child1, child2]
        person.PIA = 1000
        person.SSbirthDate = new MonthYearDate(1984, 5)
        person = service.calculateFamilyMaximum(person)
        let amountLeftForRestOfFamily = person.familyMaximum - person.PIA
        scenario = service.applyFamilyMaximumSingle(scenario, amountLeftForRestOfFamily)
        expect(scenario.children[0].monthlyChildPayment)
            .toEqual(250)
        //Family max is 1500. 500 will be split among 2 kids
        })
});
