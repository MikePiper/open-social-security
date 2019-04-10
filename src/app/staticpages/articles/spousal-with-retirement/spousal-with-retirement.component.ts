import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-spousal-with-retirement',
  templateUrl: './spousal-with-retirement.component.html',
  styles: []
})
export class SpousalWithRetirementComponent implements OnInit {

  constructor(private titleService:Title) {
    this.titleService.setTitle("Can You Get Social Security Spousal Benefits AND Retirement Benefits?");
  }

  ngOnInit() {
  }

}
