import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title }  from '@angular/platform-browser';
import { BookPromoComponent } from './book-promo/book-promo.component';

@NgModule({
  imports: [CommonModule],
  exports: [BookPromoComponent],
  declarations: [BookPromoComponent],
  providers: [Title]
})
export class SharedModule { }
