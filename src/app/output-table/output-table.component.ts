import { Component, OnInit, Input } from '@angular/core'
import { CalculationScenario } from '../data model classes/calculationscenario'
import { Person } from '../data model classes/person'
import { ClaimStrategy } from '../data model classes/claimStrategy'

@Component({
  selector: 'app-output-table',
  templateUrl: './output-table.component.html',
  styleUrls: ['./output-table.component.css']
})
export class OutputTableComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  

  @Input() personA:Person
  @Input() personB:Person
  @Input() claimStrategy:ClaimStrategy
  @Input() scenario:CalculationScenario

}
