import {Component, OnInit, Input} from '@angular/core'
import {ClaimingScenario} from '../data model classes/claimingscenario'

@Component({
  selector: 'app-debugtable',
  templateUrl: './debugtable.component.html',
  styleUrls: ['./debugtable.component.css']
})
export class DebugTableComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  @Input() scenario:ClaimingScenario

}
