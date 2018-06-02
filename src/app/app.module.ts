import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollapseModule, BsDropdownModule } from 'ngx-bootstrap';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { BenefitService } from './benefit.service';
import { AppRoutingModule } from './/app-routing.module';
import { BirthdayService } from './birthday.service';
import { AboutComponent } from './about/about.component';
import { PresentvalueService } from './presentvalue.service';
import { ContactComponent } from './contact/contact.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    ContactComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot()
  ],
  providers: [BenefitService, BirthdayService, PresentvalueService],
  bootstrap: [AppComponent]
})
export class AppModule { }
