import { InjectionToken } from '@angular/core';
import { CookieOptions } from './models';

export class CookieConfig {
  public defaultOptions?: CookieOptions;
  public requestToken?: InjectionToken<Request>;
  public responseToken?: InjectionToken<Response>;
}
