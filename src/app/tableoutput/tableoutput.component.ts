import {Component, OnInit, Input} from '@angular/core'
import {ClaimingScenario} from '../data model classes/claimingscenario'

@Component({
  selector: 'app-tableoutput',
  templateUrl: './tableoutput.component.html',
  styleUrls: ['./tableoutput.component.css']
})
export class TableOutputComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  @Input() scenario:ClaimingScenario

}
