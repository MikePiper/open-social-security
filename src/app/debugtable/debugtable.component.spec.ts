import { async, TestBed, inject } from '@angular/core/testing'
import { DebugTableComponent } from './debugtable.component'
import { CalculationScenario } from '../data model classes/calculationscenario'

describe('DebugTableComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [DebugTableComponent]
    })
    .compileComponents()
  }))


  it('should be created', inject([DebugTableComponent], (component: DebugTableComponent) => {
    component.scenario = new CalculationScenario
    expect(component).toBeTruthy()
  }))
  

})
