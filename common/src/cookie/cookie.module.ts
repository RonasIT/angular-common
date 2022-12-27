import { ModuleWithProviders, NgModule, Optional, Provider } from '@angular/core';
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
        {
          provide: REQUEST,
          deps: [[Optional, config.requestToken]],
          useFactory: (request: Request) => request
        },
        {
          provide: RESPONSE,
          deps: [[Optional, config.responseToken]],
          useFactory: (response: Response) => response
        }
      );
    }

    return {
      ngModule: CookieModule,
      providers
    };
  }
}
