import {TestBed, ComponentFixture} from '@angular/core/testing'
import {AboutComponent} from '../about/about.component'



describe('AboutComponent', () => {
  let component: AboutComponent
  let fixture: ComponentFixture<AboutComponent>


    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AboutComponent]   // ✅ Import it instead of declaring
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(AboutComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
})