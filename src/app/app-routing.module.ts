import { NgModule }             from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'

const routes: Routes = [
  { path: '', pathMatch:'full', component: HomeComponent },
  { path: '', loadChildren: './staticpages/staticpages.module#StaticPagesModule' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {



}