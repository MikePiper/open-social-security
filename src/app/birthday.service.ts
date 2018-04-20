import { Injectable } from '@angular/core';

@Injectable()
export class BirthdayService {

  constructor() { }

SSbirthYear: number
SSbirthMonth: number
SSbirthDate: Date
FRAdate: Date

findSSbirthdate(inputMonth, inputDay, inputYear) {
  if (inputDay == 1 && inputMonth == 1)
    {this.SSbirthMonth = 12
    this.SSbirthYear = inputYear - 1}
  else if (inputDay == 1 && inputMonth > 1)
    {this.SSbirthMonth = inputMonth - 1
    this.SSbirthYear = inputYear}
  else {
    this.SSbirthMonth = inputMonth
    this.SSbirthYear = inputYear}

    this.SSbirthDate = new Date(this.SSbirthMonth + "-01-" + this.SSbirthYear);

    console.log("SSbirthMonth: " + this.SSbirthMonth)
    console.log("SSbirthYear: " + this.SSbirthYear)
    return this.SSbirthDate
  }


findFRA(){
  this.FRAdate = new Date(this.SSbirthDate)
  let beginDate = new Date ('January 1, 1943')
  let endDate = new Date ('December 31, 1954')
  if (this.SSbirthDate >= beginDate && this.SSbirthDate <= endDate)
    {this.FRAdate.setMonth(this.FRAdate.getMonth() + 66*12)}
  beginDate = new Date ('January 1, 1955')
  endDate = new Date ('December 31, 1955')
  if (this.SSbirthDate >= beginDate && this.SSbirthDate <= endDate)
      {this.FRAdate.setMonth(this.FRAdate.getMonth() + 66*12 + 2)}
  beginDate = new Date ('January 1, 1956')
  endDate = new Date ('December 31, 1956')
  if (this.SSbirthDate >= beginDate && this.SSbirthDate <= endDate)
      {this.FRAdate.setMonth(this.FRAdate.getMonth() + 66*12 + 4)}
  beginDate = new Date ('January 1, 1957')
  endDate = new Date ('December 31, 1957')
  if (this.SSbirthDate >= beginDate && this.SSbirthDate <= endDate)
      {this.FRAdate.setMonth(this.FRAdate.getMonth() + 66*12 + 6)}
  beginDate = new Date ('January 1, 1958')
  endDate = new Date ('December 31, 1958')
  if (this.SSbirthDate >= beginDate && this.SSbirthDate <= endDate)
      {this.FRAdate.setMonth(this.FRAdate.getMonth() + 66*12 + 8)}
  beginDate = new Date ('January 1, 1959')
  endDate = new Date ('December 31, 1959')
  if (this.SSbirthDate >= beginDate && this.SSbirthDate <= endDate)
      {this.FRAdate.setMonth(this.FRAdate.getMonth() + 66*12 + 10)}
  beginDate = new Date ('January 1, 1960')
  if (this.SSbirthDate >= beginDate)
      {this.FRAdate.setMonth(this.FRAdate.getMonth() + 67*12)}

  return this.FRAdate
   }
}
