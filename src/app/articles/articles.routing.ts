import { Routes } from '@angular/router';
import { ArticlesHomeComponent } from './articles-home/articles-home.component';
import { DelayingSocialSecurity8ReturnComponent } from './delaying-social-security8-return/delaying-social-security8-return.component';



export const routes: Routes = [
    { path: '', component: ArticlesHomeComponent },
    { path: '8-return', component: DelayingSocialSecurity8ReturnComponent }
];