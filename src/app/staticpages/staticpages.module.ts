import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routes } from './staticpages.routing';
import { RouterModule } from '@angular/router';
import { DelayingSocialSecurity8ReturnComponent } from './articles/delaying-social-security8-return/delaying-social-security8-return.component';
import { ArticlesHomeComponent } from './articles/articles-home/articles-home.component';
import { SharedModule } from '../shared/shared.module';
import { SimilarPIAsComponent } from './articles/similar-pias/similar-pias.component';
import { SpousalBenefitCalculationComponenentComponent } from './articles/spousal-benefit-calculation-componenent/spousal-benefit-calculation-componenent.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { LegalComponent } from './legal/legal.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  declarations: [
    AboutComponent,
    ContactComponent,
    LegalComponent,
    DelayingSocialSecurity8ReturnComponent,
    ArticlesHomeComponent,
    SimilarPIAsComponent,
    SpousalBenefitCalculationComponenentComponent
  ]
})
export class StaticPagesModule { }
