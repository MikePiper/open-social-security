import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookPromoComponent } from './book-promo/book-promo.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [BookPromoComponent],
  declarations: [BookPromoComponent]
})
export class SharedModule { }
