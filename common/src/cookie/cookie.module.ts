import { ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { CookieConfig } from './config';
import { CookieService } from './cookie.service';
import { CookieOptions } from './models';
import { REQUEST, RESPONSE } from './tokens';

@NgModule({
  providers: [
    CookieService
  ]
})
export class CookieModule {
  static forRoot(config?: CookieConfig): ModuleWithProviders<CookieModule> {
    const providers: Array<Provider> = [];

    if (config?.defaultOptions) {
      providers.push({ provide: CookieOptions, useValue: config?.defaultOptions });
    }

    if (config?.requestToken && config?.responseToken) {
      providers.push(
        { provide: REQUEST, useExisting: config.requestToken },
        { provide: RESPONSE, useExisting: config.responseToken }
      );
    }

    return {
      ngModule: CookieModule,
      providers
    };
  }
}
