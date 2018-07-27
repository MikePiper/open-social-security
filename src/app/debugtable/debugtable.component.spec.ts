import { async, TestBed, inject } from '@angular/core/testing'
import { DebugTableComponent } from './debugtable.component'
import { ClaimingScenario } from '../data model classes/claimingscenario'

describe('DebugTableComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [DebugTableComponent]
    })
    .compileComponents()
  }))


  it('should be created', inject([DebugTableComponent], (component: DebugTableComponent) => {
    component.scenario = new ClaimingScenario
    expect(component).toBeTruthy()
  }))
  

})
