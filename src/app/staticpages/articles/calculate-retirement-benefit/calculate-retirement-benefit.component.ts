import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-calculate-retirement-benefit',
  templateUrl: './calculate-retirement-benefit.component.html',
  styles: []
})
export class CalculateRetirementBenefitComponent implements OnInit {

  constructor(private titleService:Title) {
    this.titleService.setTitle("How to Calculate a Social Security Benefit, When You Retire at a Different Age Than You File for Retirement Benefits");
  }

  ngOnInit() {
  }

}
