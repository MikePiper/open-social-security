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
  let beginDate: Date
  let endDate: Date
  FRAdate = new Date(SSbirthDate)

  endDate = new Date (1937, 11, 31)
  if (SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 65*12)}

  beginDate = new Date (1938, 0, 1)
  endDate = new Date (1938, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 65*12 + 2)}

  beginDate = new Date (1939, 0, 1)
  endDate = new Date (1939, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 65*12 + 4)}

  beginDate = new Date (1940, 0, 1)
  endDate = new Date (1940, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 65*12 + 6)}

  beginDate = new Date (1941, 0, 1)
  endDate = new Date (1941, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 65*12 + 8)}

  beginDate = new Date (1942, 0, 1)
  endDate = new Date (1942, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 65*12 + 10)}

  beginDate = new Date (1943, 0, 1)
  endDate = new Date (1954, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
    {FRAdate.setMonth(FRAdate.getMonth() + 66*12)}

  beginDate = new Date (1955, 0, 1)
  endDate = new Date (1955, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 2)}

  beginDate = new Date (1956, 0, 1)
  endDate = new Date (1956, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 4)}

  beginDate = new Date (1957, 0, 1)
  endDate = new Date (1957, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 6)}

  beginDate = new Date (1958, 0, 1)
  endDate = new Date (1958, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 8)}

  beginDate = new Date (1959, 0, 1)
  endDate = new Date (1959, 11, 31)
  if (SSbirthDate >= beginDate && SSbirthDate <= endDate)
      {FRAdate.setMonth(FRAdate.getMonth() + 66*12 + 10)}

  beginDate = new Date (1960, 0, 1)
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
