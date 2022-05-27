import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectFlags, Injector, PLATFORM_ID } from '@angular/core';
import { Request, Response } from 'express';
import { isEmpty } from 'lodash';
import { CookieOptions } from './models';
import { REQUEST, RESPONSE } from './tokens';

@Injectable()
export class CookieService<TKey extends string = string> {
  protected document: Document;
  protected platformID: object;
  protected request: Request;
  protected response: Response;
  protected defaultOptions: CookieOptions;
  protected isDocumentAccessible: boolean;

  protected get cookieString(): string {
    return this.isDocumentAccessible ? this.document.cookie : this.request.headers.cookie;
  }

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

  public check(key: TKey): boolean {
    const regExp: RegExp = this.getCookieRegExp(encodeURIComponent(key));

    return regExp.test(this.cookieString);
  }

  public get(key: TKey): string {
    if (this.check(key)) {
      const regExp: RegExp = this.getCookieRegExp(encodeURIComponent(key));
      const result: RegExpExecArray = regExp.exec(this.cookieString);

      return decodeURIComponent(result[1]);
    }

    return null;
  }

  public getObject(name: TKey): object | null {
    try {
      const parsedObject = JSON.parse(this.get(name));
      if (!isEmpty(parsedObject)) {
        return parsedObject;
      }

      return null;
    } catch {
      return null;
    }
  }

  public getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};

    if (this.cookieString?.length) {
      const splits = this.cookieString.split(/; ?/);
      for (const split of splits) {
        const currentCookie = split.split('=');
        cookies[decodeURIComponent(currentCookie[0])] = decodeURIComponent(currentCookie[1]);
      }
    }

    return cookies;
  }

  public put(name: TKey, value: string, _options?: CookieOptions): void {
    let cookieString = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';';
    const options = this.getOptions(_options);

    if (options.expires) {
      cookieString += 'expires=' + options.expires.toUTCString() + ';';
    }

    if (options.maxAge) {
      cookieString += 'Max-Age=' + options.maxAge + ';';
    }

    if (options.path) {
      cookieString += 'path=' + options.path + ';';
    }

    if (options.domain) {
      cookieString += 'domain=' + options.domain + ';';
    }

    if (options.secure) {
      cookieString += 'secure;';
    }

    if (options.sameSite) {
      cookieString += 'sameSite=' + options.sameSite + ';';
    }

    if (this.isDocumentAccessible) {
      this.document.cookie = cookieString;
    } else {
      this.response.cookie(name, value, options);
    }
  }

  public putObject(name: TKey, value: object, _options?: CookieOptions): void {
    const stringifiedObject = JSON.stringify(value);
    this.put(name, stringifiedObject, _options);
  }

  public remove(name: TKey, _options?: CookieOptions): void {
    const options = this.getOptions(_options);
    if (this.isDocumentAccessible) {
      this.put(name, '', { ...options, expires: new Date('Thu, 01 Jan 1970 00:00:01 GMT') });
    } else {
      this.response.clearCookie(name, options);
    }
  }

  public removeAll(options: CookieOptions): void {
    const cookies = this.getAll();

    for (const cookieName of Object.keys(cookies)) {
      this.remove(cookieName as TKey, options);
    }
  }

  protected getCookieRegExp(name: string): RegExp {
    const escapedName: string = name.replace(/([\[\]\{\}\(\)\|\=\;\+\?\,\.\*\^\$])/gi, '\\$1');

    return new RegExp('(?:^' + escapedName + '|;\\s*' + escapedName + ')=(.*?)(?:;|$)', 'g');
  }

  protected getOptions(customOptions?: CookieOptions): CookieOptions {
    return Object.assign({}, this.defaultOptions, customOptions);
  }
}
