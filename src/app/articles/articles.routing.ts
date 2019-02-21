import { Routes } from '@angular/router';
import { ArticlesHomeComponent } from './articles-home/articles-home.component';
import { DelayingSocialSecurity8ReturnComponent } from './delaying-social-security8-return/delaying-social-security8-return.component';
import { SimilarPIAsComponent } from './similar-pias/similar-pias.component';
import { SpousalBenefitCalculationComponenentComponent } from './spousal-benefit-calculation-componenent/spousal-benefit-calculation-componenent.component';



export const routes: Routes = [
    { path: '', component: ArticlesHomeComponent },
    { path: '8-return', component: DelayingSocialSecurity8ReturnComponent },
    { path: 'social-security-planning-similar-earnings-history', component: SimilarPIAsComponent },
    { path: 'spousal-benefit-calculation', component: SpousalBenefitCalculationComponenentComponent }
];