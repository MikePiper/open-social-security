import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app-routing.module';
import { BirthdayService } from './birthday.service';
import { BenefitService } from './benefit.service';
import { CalculatePvService } from './calculate-PV.service';
import { EarningsTestService } from './earningstest.service';
import { MortalityService } from './mortality.service';
import { SolutionSetService } from './solutionset.service';
import { MaximizePVService } from './maximize-pv.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    BirthdayService,
    BenefitService,
    CalculatePvService,
    EarningsTestService,
    MortalityService,
    SolutionSetService,
    MaximizePVService,
  ]
};
