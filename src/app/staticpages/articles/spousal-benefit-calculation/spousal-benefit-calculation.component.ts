import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-spousal-benefit-calculation',
  templateUrl: './spousal-benefit-calculation.component.html',
  styles: []
})
export class SpousalBenefitCalculationComponent implements OnInit {

  constructor(private titleService:Title) {
    this.titleService.setTitle("How Are Social Security Spousal Benefits Calculated?");
  } 

  ngOnInit() {
  }

}
