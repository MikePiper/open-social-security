import { NgModule }             from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { AboutComponent } from './staticpages/about/about.component';
import { ContactComponent } from './staticpages/contact/contact.component';
import { LegalComponent } from './staticpages/legal/legal.component';

const routes: Routes = [
            //scully is working with these four below
            { path: 'about', component: AboutComponent },
            { path: 'contact', component: ContactComponent },
            { path: 'legal', component: LegalComponent },
            { path: '', pathMatch:'full', component: HomeComponent },
  //{ path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { initialNavigation: 'enabled' }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {



}