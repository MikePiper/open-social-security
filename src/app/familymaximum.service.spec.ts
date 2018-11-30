import { TestBed, inject } from '@angular/core/testing';
import { FamilyMaximumService } from './familymaximum.service';
import { Person } from './data model classes/person';
import { MonthYearDate } from './data model classes/monthyearDate';
import { CalculationScenario } from './data model classes/calculationscenario';
import { CalculationYear } from './data model classes/calculationyear';
import { BenefitService } from './benefit.service';
import { BirthdayService } from './birthday.service';

describe('FamilyMaximumService', () => {
  let service:FamilyMaximumService
  let benefitService:BenefitService
  let birthdayService:BirthdayService
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FamilyMaximumService, BenefitService, BirthdayService]
    })
    service = TestBed.get(FamilyMaximumService)
    benefitService = TestBed.get(BenefitService)
    birthdayService = TestBed.get(BirthdayService)
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



  //Testing applyFamilyMaximumCouple()
    it('should reduce spousal and child benefits appropriately for family max', () => {
      let scenario:CalculationScenario = new CalculationScenario()
      let calcYear:CalculationYear = new CalculationYear(new MonthYearDate(2018,10))
      scenario.maritalStatus = "married"
      let personA:Person = new Person("A")
      let personB:Person = new Person("B")
      let child1:Person = new Person("1")
      let child2:Person = new Person("2")
      scenario.children = [child1, child2]
      personA.SSbirthDate = new MonthYearDate(1955, 9) //born Oct 1955
      personB.SSbirthDate = new MonthYearDate(1955, 9) //born Oct 1955
      personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
      personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
      personA.PIA = 1000
      personB.PIA = 400
      child1.age = 10
      child2.age = 10
      child1.monthlyChildPayment = 500
      child2.monthlyChildPayment = 500
      child1.originalBenefit = 500
      child2.originalBenefit = 500
      personA.retirementBenefitDate = new MonthYearDate(2018, 8)
      personB.retirementBenefitDate = new MonthYearDate(2018, 8)
      personA.spousalBenefitDate = new MonthYearDate(2018, 8)
      personB.spousalBenefitDate = new MonthYearDate(2018, 8)
      personB.monthlyRetirementPayment = 315 //FRA is 66 and 2 months (so Dec 2021). Filing 39 months early. Gets 78.75% of PIA
      personB.monthlySpousalPayment = 500 //This is the "original benefit" amount.  Gets reduced for age later.
      personA = service.calculateFamilyMaximum(personA) //Turns 62 in 2017, so bend points are $1,131	$1,633	$2,130. Family max = 150% x 1000 = 1500
      personB = service.calculateFamilyMaximum(personB) //Turns 62 in 2017, so bend points are $1,131	$1,633	$2,130. Family max = 150% x 400 = 600
      service.applyFamilyMaximumCouple(1, scenario, calcYear, personA, true, personB, true)
      //Combined family max is $2100. That's $1100 for personB and 2 children, or $366.67 each.
      benefitService.adjustSpousalAndSurvivorBenefitsForOwnEntitlement(personA, personB)
      //personB's spousal benefit now adjusted downward by great of PIA ($400) or retirementBenefit ($315). So it's reduced to zero.
      service.applyFamilyMaximumCouple(2, scenario, calcYear, personA, true, personB, true)
      //Now we have $1100 available between child1 and child2. So they should each be able to get their full $500 child benefit.
      benefitService.adjustSpousalBenefitsForAge(personA, personB)
      //$0 is adjusted downward for filing 39 months early. Gets 73.75% of $0
      expect(scenario.children[0].monthlyChildPayment)
        .toEqual(500)
      expect(scenario.children[1].monthlyChildPayment)
        .toEqual(500)
      expect(personB.monthlySpousalPayment)
        .toEqual(0)
    })

    it('should apply family maximum appropriately for couple with 3 children (example from POMS)', () => {
      //comes from EXAMPLE 3. Dually Entitled Beneficiary with Zero Payable and a Combined Family Maximum https://secure.ssa.gov/poms.nsf/lnx/0300615768
      let scenario:CalculationScenario = new CalculationScenario()
      let calcYear:CalculationYear = new CalculationYear(new MonthYearDate(2018,10))
      scenario.maritalStatus = "married"
      let personA:Person = new Person("A")
      let personB:Person = new Person("B")
      let child1:Person = new Person("1")
      let child2:Person = new Person("2")
      let child3:Person = new Person("3")
      scenario.children = [child1, child2, child3]
      personA.SSbirthDate = new MonthYearDate(1950, 9) //born Oct 1950
      personB.SSbirthDate = new MonthYearDate(1950, 9) //born Oct 1950
      personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
      personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
      personA.PIA = 400
      personB.PIA = 160
      personA.monthlyRetirementPayment = 400
      personB.monthlyRetirementPayment = 160
      child1.age = 10
      child2.age = 10
      child3.age = 10
      child1.monthlyChildPayment = 200
      child2.monthlyChildPayment = 200
      child3.monthlyChildPayment = 200
      child1.originalBenefit = 200
      child2.originalBenefit = 200
      child3.originalBenefit = 200
      personB.monthlySpousalPayment = 200
      personA.retirementBenefitDate = new MonthYearDate(personA.FRA) //Filing at FRA for retirement
      personB.retirementBenefitDate = new MonthYearDate(personB.FRA) //Filing at FRA for retirement
      personA.spousalBenefitDate = new MonthYearDate(personB.FRA) //Filing at later of two retirementBenefitDates (which are the same actually)
      personB.spousalBenefitDate = new MonthYearDate(personB.FRA) //Filing at later of two retirementBenefitDates (which are the same actually)
      personA.familyMaximum = 650 //Just comes from example in POMS. Not calculated.
      personB.familyMaximum = 280 //Just comes from example in POMS. Not calculated.
      service.applyFamilyMaximumCouple(1, scenario, calcYear, personA, true, personB, true)
      benefitService.adjustSpousalAndSurvivorBenefitsForOwnEntitlement(personA, personB)
      service.applyFamilyMaximumCouple(2, scenario, calcYear, personA, true, personB, true)
      expect(scenario.children[0].monthlyChildPayment)
        .toBeCloseTo(176.67, 1)
      expect(scenario.children[1].monthlyChildPayment)
        .toBeCloseTo(176.67, 1)
      expect(scenario.children[2].monthlyChildPayment)
        .toBeCloseTo(176.67, 1)
      expect(personB.monthlySpousalPayment)
        .toEqual(0)
    })

    it('should apply family maximum appropriately for couple with 1 child (example from POMS)', () => {
      //comes from EXAMPLE 4. Dually Entitled Beneficiary with Partial Payable and a Combined Family Maximum https://secure.ssa.gov/poms.nsf/lnx/0300615768
      let scenario:CalculationScenario = new CalculationScenario()
      let calcYear:CalculationYear = new CalculationYear(new MonthYearDate(2018,10))
      scenario.maritalStatus = "married"
      let personA:Person = new Person("A")
      let personB:Person = new Person("B")
      let child1:Person = new Person("1")
      scenario.children = [child1]
      personA.SSbirthDate = new MonthYearDate(1950, 9) //born Oct 1950
      personB.SSbirthDate = new MonthYearDate(1950, 9) //born Oct 1950
      personA.FRA = birthdayService.findFRA(personA.SSbirthDate)
      personB.FRA = birthdayService.findFRA(personB.SSbirthDate)
      personA.PIA = 400
      personB.PIA = 160
      personA.monthlyRetirementPayment = 400
      personB.monthlyRetirementPayment = 160
      child1.age = 10
      child1.monthlyChildPayment = 200
      child1.originalBenefit = 200
      personB.monthlySpousalPayment = 200
      personA.retirementBenefitDate = new MonthYearDate(personA.FRA) //Filing at FRA for retirement
      personB.retirementBenefitDate = new MonthYearDate(personB.FRA) //Filing at FRA for retirement
      personA.spousalBenefitDate = new MonthYearDate(personB.FRA) //Filing at later of two retirementBenefitDates (which are the same actually)
      personB.spousalBenefitDate = new MonthYearDate(personB.FRA) //Filing at later of two retirementBenefitDates (which are the same actually)
      personA.familyMaximum = 650 //Just comes from example in POMS. Not calculated.
      personB.familyMaximum = 280 //Just comes from example in POMS. Not calculated.
      service.applyFamilyMaximumCouple(1, scenario, calcYear, personA, true, personB, true)
      benefitService.adjustSpousalAndSurvivorBenefitsForOwnEntitlement(personA, personB)
      service.applyFamilyMaximumCouple(2, scenario, calcYear, personA, true, personB, true)
      expect(scenario.children[0].monthlyChildPayment)
        .toEqual(200)
      expect(personB.monthlySpousalPayment)
        .toEqual(40)
    })
    // The PIA is $400 and the maximum is $650 for a numberholder, spouse and one child. The rates are $400 for A and $125 each for B and C1.
    // B and C1 become entitled on her record. Her PIA is $160 and the maximum is $280. Because she is age 66, she is entitled to an unreduced benefit of $160.
    // When the maximums are combined, both B and C1 are entitled to their original benefit of $200. B's benefit is reduced to $40 because of her own PIA. C1 receives the full $200.
    // The total payable on the first record is $640 ($400 to A, $40 to B and $200 to C1) plus B's own PIA of $160 for a total of $800.

    // Under the new rule, when we disregard B's entitlement, C1 is increased to $200.00 even without a CFM.
    // However combining the maximums allows B's rate to increase to $40 just as it did under the old rule. The CFM applies because the family receives more with the CFM.

})
