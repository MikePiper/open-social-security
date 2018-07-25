import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing'
import { TableOutputComponent } from './tableoutput.component'
import { ClaimingScenario } from '../data model classes/claimingscenario'

describe('TableoutputComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [TableOutputComponent]
    })
    .compileComponents()
  }))


  it('should be created', inject([TableOutputComponent], (component: TableOutputComponent) => {
    component.scenario = new ClaimingScenario
    expect(component).toBeTruthy()
  }))
  

})
