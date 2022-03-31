import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Person } from '../data model classes/person';
import { BirthdayService } from '../birthday.service';
import { MonthYearDate } from '../data model classes/monthyearDate';

@Component({
  selector: 'app-childinputs',
  templateUrl: './childinputs.component.html',
  styleUrls: ['./childinputs.component.css']
})
export class ChildinputsComponent implements OnInit {

  constructor(private birthdayService:BirthdayService) { }

  ngOnInit() {
    this.getInputs()//Run this here in case a person checks "yes" for children and never changes the related DoB or disability inputs. (If we don't run it, children birthdates will be undefined)
  }

  @Input() child: Person
  @Input() personA: Person
  @Input() personB: Person
  @Output() childChange: EventEmitter<Person> = new EventEmitter<Person>()

  today:MonthYearDate = new MonthYearDate()

  inputMonths: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  inputDays: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
              16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
  inputYears = [
              1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
              1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969,
              1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979,
              1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
              1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
              2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
              2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
              2020, 2021, 2022]

  DoBinputMonth:number = 4
  DoBinputDay:number = 15
  DoBinputYear:number = 2010


  getInputs(){
    this.child.actualBirthDate = new Date (this.child.DoBinputYear, this.child.DoBinputMonth-1, this.child.DoBinputDay-1)
    this.child.SSbirthDate = this.birthdayService.findSSbirthdate(this.child.DoBinputMonth, this.child.DoBinputDay, this.child.DoBinputYear)
    this.childChange.emit(this.child)
  }



}
