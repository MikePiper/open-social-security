import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
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
import { ChildinputsComponent } from './childinputs/childinputs.component';
import { SharedModule } from './shared/shared.module';
import { AboutComponent } from './staticpages/about/about.component';
import { ContactComponent } from './staticpages/contact/contact.component';
import { LegalComponent } from './staticpages/legal/legal.component';
import { ScullyLibModule } from '@scullyio/ng-lib';
import { RangeComponent } from './range/range.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    OutputTableComponent,
    ChildinputsComponent,
    AboutComponent,
    ContactComponent,
    LegalComponent,
    RangeComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    HttpClientModule,
    FormsModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    SharedModule,
    AppRoutingModule,
    ScullyLibModule,
    BrowserAnimationsModule
  ],
  exports: [],
  providers: [BenefitService, BirthdayService, PresentValueService, EarningsTestService, MortalityService, SolutionSetService],
  bootstrap: [AppComponent]
})
export class AppModule { }
