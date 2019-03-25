import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-child-in-care-spousal',
  templateUrl: './child-in-care-spousal.component.html',
  styles: []
})
export class ChildInCareSpousalComponent implements OnInit {

  constructor(private titleService:Title) {
    this.titleService.setTitle("How Do Social Security Child-in-Care Spousal Benefits Work?");
  }

  ngOnInit() {
  }

}
