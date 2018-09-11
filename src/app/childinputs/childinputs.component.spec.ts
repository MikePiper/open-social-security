import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildinputsComponent } from './childinputs.component';

describe('ChildinputsComponent', () => {
  let component: ChildinputsComponent;
  let fixture: ComponentFixture<ChildinputsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChildinputsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildinputsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
