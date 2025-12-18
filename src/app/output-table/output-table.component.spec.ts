import { waitForAsync, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { OutputTableComponent } from './output-table.component'

describe('OutputTableComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [OutputTableComponent]
    })
    .compileComponents()
  }))

  it('should be created', inject([OutputTableComponent], (component: OutputTableComponent) => {
    expect(component).toBeTruthy()
  }))

  
})
