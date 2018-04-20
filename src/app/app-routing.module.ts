import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {InputFormComponent} from './input-form/input-form.component'
import { AboutComponent } from './about/about.component';

const routes: Routes = [
  { path: '', component: InputFormComponent },
  { path: 'about', component: AboutComponent}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {



}