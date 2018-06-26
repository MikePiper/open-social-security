import { TestBed, inject } from '@angular/core/testing';

import { EarningsTestService } from './earningstest.service';

describe('EarningstestService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EarningsTestService]
    });
  });

  it('should be created', inject([EarningsTestService], (service: EarningsTestService) => {
    expect(service).toBeTruthy();
  }));


  //Test calculateWithholding function (remember that Grace Year rule is implemented elsewhere. Not worried about it here.)
  it('should calculate withholding as zero when quit work date is in a prior year (FRA is in future)', inject([EarningsTestService], (service: EarningsTestService) => { 
    let currentCalculationDate:Date = new Date (2019, 0, 1) //January 1, 2019
    let quitWorkDate:Date = new Date (2018, 7, 1) //August 1, 2018
    let FRA:Date = new Date (2020, 4, 1) //May 1, 2020
    let monthlyEarnings:number = 10000
    expect(service.calculateWithholding(currentCalculationDate, quitWorkDate, FRA, monthlyEarnings))
        .toEqual(0)
  }))

  it('should calculate withholding as zero when FRA is in a prior year (quiteWorkDate is in future)', inject([EarningsTestService], (service: EarningsTestService) => { 
    let currentCalculationDate:Date = new Date (2019, 0, 1) //January 1, 2019
    let quitWorkDate:Date = new Date (2020, 7, 1) //August 1, 2020
    let FRA:Date = new Date (2018, 4, 1) //May 1, 2018
    let monthlyEarnings:number = 10000
    expect(service.calculateWithholding(currentCalculationDate, quitWorkDate, FRA, monthlyEarnings))
        .toEqual(0)
  }))

  it('should calculate withholding properly when quitWorkDate is this year, FRA is in future year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let currentCalculationDate:Date = new Date (2019, 0, 1) //January 1, 2019
    let quitWorkDate:Date = new Date (2019, 7, 1) //August 1, 2019
    let FRA:Date = new Date (2020, 4, 1) //May 1, 2020
    let monthlyEarnings:number = 10000
    expect(service.calculateWithholding(currentCalculationDate, quitWorkDate, FRA, monthlyEarnings))
        .toEqual(26480) //7 months x $10,000 per month = 70k earnings. Minus 17,040 = 52,960. Divided by 2 is 26,480
  }))

  it('should calculate withholding properly when quitWorkDate is this year, FRA is later this year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let currentCalculationDate:Date = new Date (2019, 0, 1) //January 1, 2019
    let quitWorkDate:Date = new Date (2019, 7, 1) //August 1, 2019
    let FRA:Date = new Date (2019, 10, 1) //Nov 1, 2019
    let monthlyEarnings:number = 10000
    expect(service.calculateWithholding(currentCalculationDate, quitWorkDate, FRA, monthlyEarnings))
        .toBeCloseTo(8213.33, 1) //7 months x $10,000 per month = 70k earnings. Minus 45,360 = 24,640. Divided by 3 is 8213.33
  }))

  it('should calculate withholding properly when FRA is this year (only count earnings up to FRA) and quitWorkDate is in future', inject([EarningsTestService], (service: EarningsTestService) => { 
    let currentCalculationDate:Date = new Date (2019, 0, 1) //January 1, 2019
    let quitWorkDate:Date = new Date (2020, 7, 1) //August 1, 2020
    let FRA:Date = new Date (2019, 9, 1) //Oct 1, 2019
    let monthlyEarnings:number = 10000
    expect(service.calculateWithholding(currentCalculationDate, quitWorkDate, FRA, monthlyEarnings))
        .toEqual(14880) //9 months x $10,000 per month = 90k earnings. Minus 45,360 = 44,640. Divided by 3 is 14,880
  }))

  //Test isGraceYear() for single person
  it('should return false for graceYear in year before quitWorkDate', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date (2024, 0, 1)
    let retirementBenefitDate:Date = new Date (2022, 4, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate))
        .toEqual(false)
  }))

  it('should return false for graceYear in year before retirementBenefitDate', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date(2026, 0, 1)
    let retirementBenefitDate:Date = new Date(2027, 3, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate))
        .toEqual(false)
  }))

  it('should return false for graceYear if hasHadGraceYear is true, even if it would otherwise be grace year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = true
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date(2026, 0, 1)
    let retirementBenefitDate:Date = new Date(2025, 8, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate))
        .toEqual(false)
  }))

  it('should return true for graceYear in a grace year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date(2025, 0, 1)
    let retirementBenefitDate:Date = new Date(2025, 8, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate))
        .toEqual(true)
  }))
  
  //Test isGraceYear() for use in a calculateCouplePV scenario
  it('should return false for graceYear in year before quitWorkDate', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date (2024, 0, 1)
    let retirementBenefitDate:Date = new Date (2022, 4, 1)
    let spousalBenefitDate:Date = new Date (2022, 4, 1)
    let survivorBenefitDate:Date = new Date (2022, 4, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate, spousalBenefitDate, survivorBenefitDate))
        .toEqual(false)
  }))

  it('should return false for graceYear in year before any of benefitDates', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date (2025, 0, 1)
    let retirementBenefitDate:Date = new Date (2026, 4, 1)
    let spousalBenefitDate:Date = new Date (2026, 4, 1)
    let survivorBenefitDate:Date = new Date (2026, 4, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate, spousalBenefitDate, survivorBenefitDate))
        .toEqual(false)
  }))

  it('should return false for graceYear if hasHadGraceYear is true, even if it would otherwise be grace year', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = true
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date (2025, 0, 1)
    let retirementBenefitDate:Date = new Date (2024, 4, 1)
    let spousalBenefitDate:Date = new Date (2024, 4, 1)
    let survivorBenefitDate:Date = new Date (2026, 4, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate, spousalBenefitDate, survivorBenefitDate))
        .toEqual(false)
  }))

  it('should return true for graceYear in a grace year, triggered by retirement benefit starting', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date (2025, 0, 1)
    let retirementBenefitDate:Date = new Date (2024, 4, 1)
    let spousalBenefitDate:Date = new Date (2028, 4, 1)
    let survivorBenefitDate:Date = new Date (2028, 4, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate, spousalBenefitDate, survivorBenefitDate))
        .toEqual(true)
  }))

  it('should return true for graceYear in a grace year, triggered by spousal benefit starting', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date (2025, 0, 1)
    let retirementBenefitDate:Date = new Date (2026, 4, 1)
    let spousalBenefitDate:Date = new Date (2024, 4, 1)
    let survivorBenefitDate:Date = new Date (2028, 4, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate, spousalBenefitDate, survivorBenefitDate))
        .toEqual(true)
  }))

  it('should return true for graceYear in a grace year, triggered by survivor benefit starting', inject([EarningsTestService], (service: EarningsTestService) => { 
    let hasHadGraceYear:boolean = false
    let quitWorkDate:Date = new Date(2025, 4, 1)
    let currentCalculationDate:Date = new Date (2025, 0, 1)
    let retirementBenefitDate:Date = new Date (2028, 4, 1)
    let spousalBenefitDate:Date = new Date (2028, 4, 1)
    let survivorBenefitDate:Date = new Date (2024, 4, 1)
    expect(service.isGraceYear(hasHadGraceYear, quitWorkDate, currentCalculationDate, retirementBenefitDate, spousalBenefitDate, survivorBenefitDate))
        .toEqual(true)
  }))
});
