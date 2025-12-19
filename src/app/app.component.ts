import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MonthYearDate } from './data model classes/monthyearDate';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  today:MonthYearDate = new MonthYearDate()
}
