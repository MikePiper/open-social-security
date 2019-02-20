import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-similar-pias',
  templateUrl: './similar-pias.component.html',
  styles: []
})
export class SimilarPIAsComponent implements OnInit {

  constructor(private titleService:Title) {
    this.titleService.setTitle("Social Security Planning for a Couple with Similar Earnings History");
  }

  ngOnInit() {
  }

}
