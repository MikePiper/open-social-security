import { TestBed, inject } from '@angular/core/testing'
import { HomeComponent } from './home.component'
import {BirthdayService} from '../birthday.service'
import {PresentValueService} from '../presentvalue.service'
import {MortalityService} from '../mortality.service'
import {BenefitService} from '../benefit.service'
import {SolutionSet} from '../solutionset'
import {FREDresponse} from '../fredresponse'
import {HttpClient} from '@angular/common/http'


describe('HomeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HomeComponent, BirthdayService, PresentValueService, MortalityService, BenefitService, SolutionSet, FREDresponse, {provide: HttpClient, useValue: HttpClientStub }]
    })
  })

    let HttpClientStub: Partial<HttpClient>


    it('should be created', inject([HomeComponent], (component: HomeComponent) => {
        expect(component).toBeTruthy()
    }))

    //TODO: check onSubmit()
    //TODO: check customDates()
    //TODO: check getPrimaryFormInputs()
    //TODO: check checkValidRetirementInputs()
    //TODO: check checkValidSpousalInputs()
    //TODO: check resetWorkInputs()
    //TODO: check resetFixedRetirementDateInputs()



})