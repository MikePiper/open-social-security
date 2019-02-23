import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-delaying-social-security8-return',
  templateUrl: './delaying-social-security8-return.component.html',
  styles: []
})
export class DelayingSocialSecurity8ReturnComponent implements OnInit {

  constructor(private titleService:Title) {
    this.titleService.setTitle("Why Delaying Social Security Doesn't Provide an 8% Return");
  }

  ngOnInit() {
  }

}
