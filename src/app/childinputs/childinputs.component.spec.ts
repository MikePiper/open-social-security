import { TestBed, inject } from '@angular/core/testing';
import { ChildinputsComponent } from './childinputs.component';
import { BirthdayService } from '../birthday.service';

describe('ChildinputsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChildinputsComponent, BirthdayService]
    })
  })

    it('should be created', inject([ChildinputsComponent], (component: ChildinputsComponent) => {
        expect(component).toBeTruthy()
    }))
  });
