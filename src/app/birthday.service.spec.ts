import { TestBed, inject } from '@angular/core/testing'
import { BirthdayService } from './birthday.service'
import {MonthYearDate} from "./data model classes/monthyearDate"

describe('BirthdayService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BirthdayService]
    })
  })

  it('should be created', inject([BirthdayService], (service: BirthdayService) => {
    expect(service).toBeTruthy()
  }))

  //testing findSSbirthdate
      it('should determine correct DoB with mid-month birthday', inject([BirthdayService], (service: BirthdayService) => { 
        let correctDoB:MonthYearDate = new MonthYearDate(1956, 2, 1)  //correct SSbirthday is March 1, 1956
        expect(service.findSSbirthdate(3, 25, 1956)) //user inputs 3/25/1956
            .toEqual(correctDoB)
      }))

      it('should determine correct DoB with 1st of month birthday', inject([BirthdayService], (service: BirthdayService) => { 
        let correctDoB:MonthYearDate = new MonthYearDate(1956, 2, 1) //correct SSbirthday is March 1 1956, given first of month DoB
        expect(service.findSSbirthdate(4, 1, 1956)) //user inputs 4/1/1956
            .toEqual(correctDoB)
      }))

      it('should determine correct DoB with Jan 1 birthday', inject([BirthdayService], (service: BirthdayService) => { 
        let correctDoB:MonthYearDate = new MonthYearDate(1956, 11, 1) //correct SSbirthday is Dec 1 1956, given January 1 1957 DoB
        expect(service.findSSbirthdate(1, 1, 1957)) //user inputs 1/1/1957
            .toEqual(correctDoB)
      }))


    //testing findFRA
    it('should determine correct FRA with mid-month birthday', inject([BirthdayService], (service: BirthdayService) => { 
      let SSbirthDate:MonthYearDate = new MonthYearDate (1956, 2, 1) //user inputs 3/25/1956 
      let correctFRA:MonthYearDate = new MonthYearDate(2022, 6, 1)  //correct FRA is July 1, 2022 (FRA of 66 and 4 months given 1956 DoB)
      expect(service.findFRA(SSbirthDate)) 
          .toEqual(correctFRA)
    }))

    it('should determine correct FRA with 1st of month birthday', inject([BirthdayService], (service: BirthdayService) => { 
      let SSbirthDate:MonthYearDate = new MonthYearDate (1960, 2, 1) //user inputs 4/1/1960 
      let correctFRA:MonthYearDate = new MonthYearDate(2027, 2, 1) //correct FRA is March 1, 2027 (FRA of 67 given 1960 DoB)
      expect(service.findFRA(SSbirthDate)) 
          .toEqual(correctFRA)
    }))

    it('should determine correct FRA with Jan 1 birthday', inject([BirthdayService], (service: BirthdayService) => { 
      let SSbirthDate:MonthYearDate = new MonthYearDate (1957, 11, 1) //user inputs 1/1/1958 
      let correctFRA:MonthYearDate = new MonthYearDate(2024, 5, 1) //correct FRA is June 1, 2024 (FRA of 66 and 6 months given 1957 SSbirthday)
      expect(service.findFRA(SSbirthDate)) 
          .toEqual(correctFRA)
    }))


})
