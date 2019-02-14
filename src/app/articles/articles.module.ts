import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routes } from './articles.routing';
import { RouterModule } from '@angular/router';
import { DelayingSocialSecurity8ReturnComponent } from './delaying-social-security8-return/delaying-social-security8-return.component';
import { ArticlesHomeComponent } from './articles-home/articles-home.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  declarations: [DelayingSocialSecurity8ReturnComponent, ArticlesHomeComponent]
})
export class ArticlesModule { }
