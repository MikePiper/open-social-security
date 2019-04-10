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
import { AboutComponent } from './staticpages/about/about.component';
import { ContactComponent } from './staticpages/contact/contact.component';
import { LegalComponent } from './staticpages/legal/legal.component';
import { DelayingSocialSecurity8ReturnComponent } from './staticpages/articles/delaying-social-security8-return/delaying-social-security8-return.component';
import { ArticlesHomeComponent } from './staticpages/articles/articles-home/articles-home.component';
import { SimilarPIAsComponent } from './staticpages/articles/similar-pias/similar-pias.component';
import { SpousalBenefitCalculationComponenentComponent } from './staticpages/articles/spousal-benefit-calculation-componenent/spousal-benefit-calculation-componenent.component';
import { ChildInCareSpousalComponent } from './staticpages/articles/child-in-care-spousal/child-in-care-spousal.component';
import { CalculateRetirementBenefitComponent } from './staticpages/articles/calculate-retirement-benefit/calculate-retirement-benefit.component';
import { SpousalWithRetirementComponent } from './staticpages/articles/spousal-with-retirement/spousal-with-retirement.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    OutputTableComponent,
    ChildinputsComponent,
    AboutComponent,
    ContactComponent,
    LegalComponent,
    DelayingSocialSecurity8ReturnComponent,
    ArticlesHomeComponent,
    SimilarPIAsComponent,
    SpousalBenefitCalculationComponenentComponent,
    ChildInCareSpousalComponent,
    CalculateRetirementBenefitComponent,
    SpousalWithRetirementComponent
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
