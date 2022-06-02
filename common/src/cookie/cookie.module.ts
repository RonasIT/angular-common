import { ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { CookieConfig } from './config';
import { CookieOptions } from './models';
import { REQUEST, RESPONSE } from './tokens';

@NgModule()
export class CookieModule {
  static forRoot(config?: CookieConfig): ModuleWithProviders<CookieModule> {
    const providers: Array<Provider> = [
      { provide: CookieOptions, useValue: config?.defaultOptions }
    ];

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
