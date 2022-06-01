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
    const cookies: Record<string, string> = {};

    if (this.cookieString?.length) {
      const splits = this.cookieString.split(/; ?/);
      for (const split of splits) {
        const [key, value] = split.split('=');
        cookies[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }

    return cookies;
  }

  public put(key: TKey, value: string, _options?: CookieOptions): void {
    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)};`;
    const options = this.getOptions(_options);

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

  public putObject(key: TKey, value: object, _options?: CookieOptions): void {
    const stringifiedObject = JSON.stringify(value);
    this.put(key, stringifiedObject, _options);
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
}