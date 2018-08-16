import { Component, OnInit, Input } from '@angular/core'
import { ClaimingScenario } from '../data model classes/claimingscenario'
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
  
  @Input() scenario:ClaimingScenario
  @Input() personA:Person
  @Input() personB:Person

}
