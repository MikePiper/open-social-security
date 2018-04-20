import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { InputFormComponent } from './input-form/input-form.component';
import { BenefitService } from './benefit.service';
import { AppRoutingModule } from './/app-routing.module';
import { BirthdayService } from './birthday.service';
import { AboutComponent } from './about/about.component';
import { PresentvalueService } from './presentvalue.service';


@NgModule({
  declarations: [
    AppComponent,
    InputFormComponent,
    AboutComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [BenefitService, BirthdayService, PresentvalueService],
  bootstrap: [AppComponent]
})
export class AppModule { }
