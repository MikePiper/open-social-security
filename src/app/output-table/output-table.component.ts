import { Component, OnInit, Input } from '@angular/core';
import { CalculationScenario } from '../data model classes/calculationscenario';
import { Person } from '../data model classes/person';
import { ClaimStrategy } from '../data model classes/claimStrategy';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-output-table',
  templateUrl: './output-table.component.html',
  styleUrls: ['./output-table.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OutputTableComponent implements OnInit {

  @Input() personA: Person;
  @Input() personB: Person;
  @Input() claimStrategy: ClaimStrategy;
  @Input() scenario: CalculationScenario;

  constructor() { }

  ngOnInit() { }

  // Track function for table rows to avoid NG0955 errors
  trackRowByIndex(index: number, row: any[]): number {
    return index;
  }

  // Track function for table cells to avoid NG0955 errors
  trackCellByIndex(index: number, cell: any): number {
    return index;
  }
}
