import {TestBed} from '@angular/core/testing'
import {MonthYearDate} from "./monthyearDate"


describe('monthYearDate', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: []
    })
  })
  it('setMonth should set month/year appropriately when adding 12 months to April', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 3)
    date.setMonth(date.getMonth()+12)
    expect(date.getFullYear()).toEqual(2016)
    expect(date.getMonth()).toEqual(3)
  })

  it('setMonth should set month/year appropriately when adding 25 months to April', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 3)
    date.setMonth(date.getMonth()+25)
    expect(date.getFullYear()).toEqual(2017)
    expect(date.getMonth()).toEqual(4)
  })

  it('setMonth should set month/year appropriately when adding 12 months to January', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 0)
    date.setMonth(date.getMonth()+12)
    expect(date.getFullYear()).toEqual(2016)
    expect(date.getMonth()).toEqual(0)
  })

  it('setMonth should set month/year appropriately when adding 24 months to January', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 0)
    date.setMonth(date.getMonth()+24)
    expect(date.getFullYear()).toEqual(2017)
    expect(date.getMonth()).toEqual(0)
  })

  it('setMonth should set month/year appropriately when adding 12 months to December', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 11)
    date.setMonth(date.getMonth()+12)
    expect(date.getFullYear()).toEqual(2016)
    expect(date.getMonth()).toEqual(11)
  })

  it('setMonth should set month/year appropriately when adding 25 months to December', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 11)
    date.setMonth(date.getMonth()+25)
    expect(date.getFullYear()).toEqual(2018)
    expect(date.getMonth()).toEqual(0)
  })

  it('setMonth should set month/year appropriately when subtracting 7 months from December', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 11)
    date.setMonth(date.getMonth()-7)
    expect(date.getFullYear()).toEqual(2015)
    expect(date.getMonth()).toEqual(4)
  })

  it('setMonth should set month/year appropriately when subtracting 12 months from December', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 11)
    date.setMonth(date.getMonth()-12)
    expect(date.getFullYear()).toEqual(2014)
    expect(date.getMonth()).toEqual(11)
  })

  it('setMonth should set month/year appropriately when subtracting 14 months from December', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 11)
    date.setMonth(date.getMonth()-14)
    expect(date.getFullYear()).toEqual(2014)
    expect(date.getMonth()).toEqual(9)
  })

  it('setMonth should set month/year appropriately when subtracting 12 months from January', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 0)
    date.setMonth(date.getMonth()-12)
    expect(date.getFullYear()).toEqual(2014)
    expect(date.getMonth()).toEqual(0)
  })

  it('setMonth should set month/year appropriately when subtracting 13 months from January', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 0)
    date.setMonth(date.getMonth()-13)
    expect(date.getFullYear()).toEqual(2013)
    expect(date.getMonth()).toEqual(11)
  })

  it('setMonth should set month/year appropriately when subtracting 14 months from January', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 0)
    date.setMonth(date.getMonth()-14)
    expect(date.getFullYear()).toEqual(2013)
    expect(date.getMonth()).toEqual(10)
  })

  it('setMonth should set month/year appropriately when subtracting 14 months from March', () => {
    let date:MonthYearDate = new MonthYearDate(2015, 2)
    date.setMonth(date.getMonth()-14)
    expect(date.getFullYear()).toEqual(2014)
    expect(date.getMonth()).toEqual(0)
  })
})