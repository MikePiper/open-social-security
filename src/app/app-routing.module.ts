import { NgModule }             from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { AboutComponent } from './staticpages/about/about.component';
import { ContactComponent } from './staticpages/contact/contact.component';
import { LegalComponent } from './staticpages/legal/legal.component';
import { ArticlesHomeComponent } from './staticpages/articles/articles-home/articles-home.component';
import { DelayingSocialSecurity8ReturnComponent } from './staticpages/articles/delaying-social-security8-return/delaying-social-security8-return.component';
import { SimilarPIAsComponent } from './staticpages/articles/similar-pias/similar-pias.component';
import { SpousalBenefitCalculationComponenentComponent } from './staticpages/articles/spousal-benefit-calculation-componenent/spousal-benefit-calculation-componenent.component';

const routes: Routes = [
  { path: '', pathMatch:'full', component: HomeComponent },
  // { path: '', loadChildren: './staticpages/staticpages.module#StaticPagesModule' },
  { path: 'about', component: AboutComponent},
  { path: 'contact', component: ContactComponent},
  { path: 'legal', component: LegalComponent},
  { path: 'articles', pathMatch: 'full', component: ArticlesHomeComponent },
  { path: 'articles/8-return', component: DelayingSocialSecurity8ReturnComponent },
  { path: 'articles/social-security-planning-similar-earnings-history', component: SimilarPIAsComponent },
  { path: 'articles/spousal-benefit-calculation', component: SpousalBenefitCalculationComponenentComponent },
  //{ path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, {initialNavigation: 'enabled'}) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {



}