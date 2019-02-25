import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollapseModule, BsDropdownModule } from 'ngx-bootstrap';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { BenefitService } from './benefit.service';
import { AppRoutingModule } from './app-routing.module';
import { BirthdayService } from './birthday.service';
import { PresentValueService } from './presentvalue.service';
import { HttpClientModule } from '@angular/common/http';
import { EarningsTestService } from './earningstest.service';
import { MortalityService } from './mortality.service';
import { SolutionSetService } from './solutionset.service';
import { OutputTableComponent } from './output-table/output-table.component';
import { CsvModule } from '@ctrl/ngx-csv';
import { ChildinputsComponent } from './childinputs/childinputs.component';
import { SharedModule } from './shared/shared.module';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    OutputTableComponent,
    ChildinputsComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    HttpClientModule,
    FormsModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    CsvModule,
    SharedModule,
    AppRoutingModule,
  ],
  exports: [],
  providers: [BenefitService, BirthdayService, PresentValueService, EarningsTestService, MortalityService, SolutionSetService],
  bootstrap: [AppComponent]
})
export class AppModule { }
