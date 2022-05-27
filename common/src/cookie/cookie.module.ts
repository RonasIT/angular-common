import { ModuleWithProviders, NgModule } from '@angular/core';
import { CookieOptions } from './models';

@NgModule()
export class CookieModule {
  static forRoot(defaultOptions?: CookieOptions): ModuleWithProviders<CookieModule> {
    return {
      ngModule: CookieModule,
      providers: [
        { provide: CookieOptions, useValue: defaultOptions }
      ]
    };
  }
}
