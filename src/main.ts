import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { provideHttpClient } from '@angular/common/http';

// SERVICES
import { BirthdayService } from './app/birthday.service';
import { BenefitService } from './app/benefit.service';
import { CalculatePvService } from './app/calculate-PV.service';
import { EarningsTestService } from './app/earningstest.service';
import { MortalityService } from './app/mortality.service';
import { SolutionSetService } from './app/solutionset.service';
import { MaximizePVService } from './app/maximize-pv.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // ✅ GLOBAL SERVICES (replacement for AppModule.providers)
    BirthdayService,
    BenefitService,
    CalculatePvService,
    EarningsTestService,
    MortalityService,
    SolutionSetService,
    MaximizePVService,
  ]
}).catch(err => console.error(err));
