import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { localAuthInterceptor } from './app/services/local-auth';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([localAuthInterceptor]))
  ]
}).catch(err => console.error(err));
