import { Routes } from '@angular/router';
import { ArticlesHomeComponent } from './articles/articles-home/articles-home.component';
import { DelayingSocialSecurity8ReturnComponent } from './articles/delaying-social-security8-return/delaying-social-security8-return.component';
import { SimilarPIAsComponent } from './articles/similar-pias/similar-pias.component';
import { SpousalBenefitCalculationComponenentComponent } from './articles/spousal-benefit-calculation-componenent/spousal-benefit-calculation-componenent.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { LegalComponent } from './legal/legal.component';



export const routes: Routes = [
    { path: 'about', component: AboutComponent},
    { path: 'contact', component: ContactComponent},
    { path: 'legal', component: LegalComponent},
    { path: 'articles', pathMatch: 'full', component: ArticlesHomeComponent },
    { path: 'articles/8-return', component: DelayingSocialSecurity8ReturnComponent },
    { path: 'articles/social-security-planning-similar-earnings-history', component: SimilarPIAsComponent },
    { path: 'articles/spousal-benefit-calculation', component: SpousalBenefitCalculationComponenentComponent },
    { path: '**', redirectTo: '', pathMatch: 'full'}
];