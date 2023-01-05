import { InjectionToken } from '@angular/core';
import { CookieOptions } from './models';
import { Request, Response } from 'express';

export class CookieConfig {
  public defaultOptions?: CookieOptions;
  public requestToken?: InjectionToken<Request>;
  public responseToken?: InjectionToken<Response>;
}
