import { Injectable } from '@angular/core';

@Injectable()
export class BirthdayService {

  constructor() { }




findSSbirthdate(inputMonth, inputDay, inputYear) {
let SSbirthDate: Date = new Date(inputYear, inputMonth-1, 1)
  //If born on 1st of a month, birth month is prior month.
  if (inputDay == 1)
    {
    SSbirthDate.setMonth(SSbirthDate.getMonth()-1)
    }
    return SSbirthDate
  }


findFRA(SSbirthDate:Date){
  let FRAdate: Date
  FRAdate = new Date(SSbirthDate)
  let beginDate = new Date ('January 1, 1943')
  let endDate = new Date ('December 31, 1954')
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 66*12)}
  beginDate = new Date ('January 1, 1955')
  endDate = new Date ('December 31, 1955')
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 2)}
  beginDate = new Date ('January 1, 1956')
  endDate = new Date ('December 31, 1956')
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 4)}
  beginDate = new Date ('January 1, 1957')
  endDate = new Date ('December 31, 1957')
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 6)}
  beginDate = new Date ('January 1, 1958')
  endDate = new Date ('December 31, 1958')
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 8)}
  beginDate = new Date ('January 1, 1959')
  endDate = new Date ('December 31, 1959')
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 10)}
  beginDate = new Date ('January 1, 1960')
  if (SSbirthDate >= beginDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 67*12)}

  return FRAdate
   }

   findSurvivorFRA (SSbirthDate:Date){
    let madeUpDate: Date = new Date(SSbirthDate.getFullYear()-2, SSbirthDate.getMonth(), 1)
    let survivorFRA: Date = new Date(this.findFRA(madeUpDate))
    survivorFRA.setFullYear(survivorFRA.getFullYear()+2)
    return survivorFRA
   }
}
