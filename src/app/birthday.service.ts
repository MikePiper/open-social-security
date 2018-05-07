import { Injectable } from '@angular/core';

@Injectable()
export class BirthdayService {

  constructor() { }




findSSbirthdate(inputMonth, inputDay, inputYear) {
let SSbirthYear: number
let SSbirthMonth: number
let SSbirthDate: Date
  //If born on January 1, birth month is December of prior year.
  if (inputDay == 1 && inputMonth == 1)
    {SSbirthMonth = 12
    SSbirthYear = inputYear - 1}
  //If born on 1st of a month other than January, birth month is prior month, same year.
  else if (inputDay == 1 && inputMonth > 1)
    {SSbirthMonth = inputMonth - 1
    SSbirthYear = inputYear}
  //If born on any day other than first of month, birth month is just month of birth.
  else {
    SSbirthMonth = inputMonth
    SSbirthYear = inputYear}

  //Have to subtract 1 from month here, because javascript Date wants 0-11 as month options, whereas what we got from user is in 1-12 format.
  SSbirthDate = new Date(SSbirthYear, SSbirthMonth - 1, 1);

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
}
