import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectFlags, Injector, PLATFORM_ID } from '@angular/core';
import { Request, Response } from 'express';
import { castArray, entries, isEmpty, isNil } from 'lodash';
import { CookieOptions } from './models';
import { REQUEST, RESPONSE } from './tokens';

@Injectable()
export class CookieService<TKey extends string = string> {
  public get cookieString(): string {
    return this.isDocumentAccessible ? this.document.cookie : this.getServerCookie();
  }

  protected document: Document;
  protected platformID: object;
  protected request: Request;
  protected response: Response;
  protected defaultOptions: CookieOptions;
  protected isDocumentAccessible: boolean;

  constructor(
    protected injector: Injector
  ) {
    this.document = this.injector.get(DOCUMENT);
    this.platformID = this.injector.get(PLATFORM_ID);
    this.request = this.injector.get(REQUEST, undefined, InjectFlags.Optional);
    this.response = this.injector.get(RESPONSE, undefined, InjectFlags.Optional);
    this.defaultOptions = this.injector.get(CookieOptions, undefined, InjectFlags.Optional);
    this.isDocumentAccessible = isPlatformBrowser(this.platformID);
  }

  public get(key: TKey): string {
    const regExp: RegExp = this.getCookieRegExp(encodeURIComponent(key));
    const result: RegExpExecArray = regExp.exec(this.cookieString);

    return (result)
      ? decodeURIComponent(result[1])
      : null;
  }

  public getObject(key: TKey): object | null {
    try {
      const parsedObject = JSON.parse(this.get(key));
      if (!isEmpty(parsedObject)) {
        return parsedObject;
      }

      return null;
    } catch {
      return null;
    }
  }

  public getAll(): Record<string, string> {
    return this.parseCookieString(this.cookieString);
  }

  public hasKey(key: TKey): boolean {
    return !!this.get(key);
  }

  public put(key: TKey, value: string, _options?: CookieOptions): void {
    const options = this.getOptions(_options);

    if (isNil(value)) {
      return this.remove(key, options);
    }

    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)};`;

    if (options.expires) {
      cookieString += `expires=${options.expires.toUTCString()};`;
    }

    if (options.maxAge) {
      cookieString += `Max-Age=${options.maxAge};`;
    }

    if (options.path) {
      cookieString += `path=${options.path};`;
    }

    if (options.domain) {
      cookieString += `domain=${options.domain};`;
    }

    if (options.secure) {
      cookieString += 'secure;';
    }

    if (options.sameSite) {
      cookieString += `sameSite=${options.sameSite};`;
    }

    if (this.isDocumentAccessible) {
      this.document.cookie = cookieString;
    } else {
      this.response.cookie(key, value, options);
    }
  }

  public putObject(key: TKey, value: object, options?: CookieOptions): void {
    const stringifiedObject = (value) ? JSON.stringify(value) : null;
    this.put(key, stringifiedObject, options);
  }

  public remove(key: TKey, _options?: CookieOptions): void {
    const options = this.getOptions(_options);
    if (this.isDocumentAccessible) {
      this.put(key, '', { ...options, expires: new Date('Thu, 01 Jan 1970 00:00:01 GMT') });
    } else {
      this.response.clearCookie(key, options);
    }
  }

  public removeAll(options: CookieOptions): void {
    const cookies = this.getAll();

    for (const cookieKey of Object.keys(cookies)) {
      this.remove(cookieKey as TKey, options);
    }
  }

  protected getCookieRegExp(key: string): RegExp {
    const escapedKey: string = key.replace(/([\[\]\{\}\(\)\|\=\;\+\?\,\.\*\^\$])/gi, '\\$1');

    return new RegExp('(?:^' + escapedKey + '|;\\s*' + escapedKey + ')=(.*?)(?:;|$)', 'g');
  }

  protected getOptions(customOptions?: CookieOptions): CookieOptions {
    return Object.assign({}, this.defaultOptions, customOptions);
  }

  private parseCookieString(cookieString: string): Record<string, string> {
    const cookieArray = cookieString?.split(/; ?/) || [];

    return this.parseCookieArray(cookieArray);
  }

  private parseCookieArray(cookieArray: Array<string>): Record<string, string> {
    const cookies: Record<string, string> = {};

    if (cookieArray?.length) {
      for (const cookie of cookieArray) {
        const [key, value] = cookie.split('=');
        cookies[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }

    return cookies;
  }

  private getServerCookie(): string {
    const oldCookies = this.parseCookieString(this.request?.headers?.cookie);

    const browserResponseCookies = (this.response?.getHeader('Set-Cookie') || []) as string | Array<string>;
    const newCookies = this.parseCookieArray(castArray(browserResponseCookies));

    const mergedCookies = Object.assign(oldCookies, newCookies);

    return entries(mergedCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
}
