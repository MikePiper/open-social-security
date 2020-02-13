import { Component } from '@angular/core';
import { MonthYearDate } from './data model classes/monthyearDate';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  today:MonthYearDate = new MonthYearDate()
}
