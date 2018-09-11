import {Component, OnInit, Input} from '@angular/core'
import {CalculationScenario} from '../data model classes/calculationscenario'

@Component({
  selector: 'app-debugtable',
  templateUrl: './debugtable.component.html',
  styleUrls: ['./debugtable.component.css']
})
export class DebugTableComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  @Input() scenario:CalculationScenario

}
