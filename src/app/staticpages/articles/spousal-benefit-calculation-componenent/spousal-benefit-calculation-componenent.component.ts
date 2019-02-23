import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-spousal-benefit-calculation-componenent',
  templateUrl: './spousal-benefit-calculation-componenent.component.html',
  styles: []
})
export class SpousalBenefitCalculationComponenentComponent implements OnInit {

  constructor(private titleService:Title) {
    this.titleService.setTitle("How Are Social Security Spousal Benefits Calculated?");
  } 

  ngOnInit() {
  }

}
