import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ArticlesComponent} from './articles.component';

const routes: Routes = [
  {
    path: ':slug',
    component: ArticlesComponent,
  },
  {
    path: '**',
    component: ArticlesComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArticlesRoutingModule {}

