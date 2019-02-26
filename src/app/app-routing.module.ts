import { NgModule }             from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'

const routes: Routes = [
  { path: '', pathMatch:'full', component: HomeComponent },
  { path: '', loadChildren: './staticpages/staticpages.module#StaticPagesModule' },
  { path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {



}