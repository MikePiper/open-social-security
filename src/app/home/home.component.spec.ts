import {TestBed, inject} from '@angular/core/testing'
import {HomeComponent} from './home.component'
import {BirthdayService} from '../birthday.service'
import {PresentValueService} from '../presentvalue.service'
import {MortalityService} from '../mortality.service'
import {BenefitService} from '../benefit.service'
import {FREDresponse} from '../data model classes/fredresponse'
import {HttpClient} from '@angular/common/http'
import {Person} from '../data model classes/person';


describe('HomeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HomeComponent, BirthdayService, PresentValueService, MortalityService, BenefitService, FREDresponse, {provide: HttpClient, useValue: HttpClientStub }]
    })
  })

    let HttpClientStub: Partial<HttpClient>


    it('should be created', inject([HomeComponent], (component: HomeComponent) => {
        expect(component).toBeTruthy()
    }))


})