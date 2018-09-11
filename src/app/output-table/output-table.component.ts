import { Component, OnInit, Input } from '@angular/core'
import { CalculationScenario } from '../data model classes/calculationscenario'
import { Person } from '../data model classes/person'

@Component({
  selector: 'app-output-table',
  templateUrl: './output-table.component.html',
  styleUrls: ['./output-table.component.css']
})
export class OutputTableComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  
  @Input() scenario:CalculationScenario
  @Input() personA:Person
  @Input() personB:Person

}
