import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';

import { ArticlesComponent } from './articles.component';


describe('ArticlesComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArticlesComponent]
    })
  })

    it('should be created', inject([ArticlesComponent], (component: ArticlesComponent) => {
        expect(component).toBeTruthy()
    }))
  });
