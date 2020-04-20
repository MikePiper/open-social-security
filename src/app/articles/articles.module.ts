import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ScullyLibModule} from '@scullyio/ng-lib';
import {ArticlesRoutingModule} from './articles-routing.module';
import {ArticlesComponent} from './articles.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ArticlesComponent],
  imports: [CommonModule, ArticlesRoutingModule, ScullyLibModule, SharedModule],
})
export class ArticlesModule {}
