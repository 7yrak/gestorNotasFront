import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { kovaInterceptor } from './app/services/kova-auth';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([kovaInterceptor]))
  ]
}).catch(err => console.error(err));
