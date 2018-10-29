import {TestBed, ComponentFixture} from '@angular/core/testing'
import {AboutComponent} from '../about/about.component'



describe('AboutComponent', () => {
  let component: AboutComponent
  let fixture: ComponentFixture<AboutComponent>


  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AboutComponent]
    })

    fixture = TestBed.createComponent(AboutComponent)
    component = fixture.componentInstance

  })


    it('should be created', () => {
        expect(component).toBeTruthy()
    })


})