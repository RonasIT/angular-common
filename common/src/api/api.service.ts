import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forOwn, isObject, keys } from 'lodash';
import { Observable } from 'rxjs';
import { ModuleConfig } from './config';

@Injectable()
export class ApiService {
  public get apiUrl(): string {
    return this.config.apiUrl;
  }

  public get trailingSlash(): string {
    return (this.config.trailingSlash) ? '/' : '';
  }

  public get fileKeys(): Array<string> {
    return this.config.fileKeys ?? ['file', 'files'];
  }

  constructor(
    private httpClient: HttpClient,
    private config: ModuleConfig
  ) { }

  public get<T = any>(endpoint: string, params: any = {}, options: object = {}): Observable<T> {
    params = this.prepareHttpParams(params);

    return this.httpClient.get<T>(`${this.apiUrl}${endpoint}${this.trailingSlash}`, {
      params,
      ...options
    });
  }

  public post<T = any>(endpoint: string, data: any = {}, options: object = {}): Observable<T> {
    const params = (this.hasFiles(data)) ? this.convertToFormData(data) : data;

    return this.httpClient.post<T>(`${this.apiUrl}${endpoint}${this.trailingSlash}`, params, options);
  }

  public put<T = any>(endpoint: string, data: any = {}, options: object = {}): Observable<T> {
    if (this.hasFiles(data)) {
      const params = this.convertToFormData(data, false);
      params.append('_method', 'PUT');

      return this.httpClient.post<T>(`${this.apiUrl}${endpoint}${this.trailingSlash}`, params, options);
    } else {
      return this.httpClient.put<T>(`${this.apiUrl}${endpoint}${this.trailingSlash}`, data, options);
    }
  }

  public delete<T = any>(endpoint: string, params: any = {}, options: object = {}): Observable<T> {
    params = this.prepareHttpParams(params);

    return this.httpClient.delete<T>(`${this.apiUrl}${endpoint}${this.trailingSlash}`, {
      params,
      ...options
    });
  }

  private prepareHttpParams(params: any): HttpParams {
    let httpParams = new HttpParams();

    forOwn(params, (value, key) => {
      if (isObject(value)) {
        if (this.config.enableArrayKeys) {
          const nestedHttpParams = this.prepareHttpParams(value);
          nestedHttpParams.keys().forEach((nestedKey) => {
            const startKeyIndex = nestedKey.indexOf('[');
            const parameterKey = (startKeyIndex === -1)
              ? `[${nestedKey}]`
              : `[${nestedKey.substring(0, startKeyIndex)}]${nestedKey.substring(startKeyIndex)}`;

            httpParams = httpParams.append(`${key}${parameterKey}`, nestedHttpParams.get(nestedKey));
          });
        } else {
          forOwn(value, (item) => {
            httpParams = httpParams.append(`${key}[]`, item);
          });
        }
      } else if (typeof value === 'boolean') {
        httpParams = httpParams.append(key, value ? '1' : '0');
      } else if (value === null) {
        httpParams = httpParams.append(key, '');
      } else if (typeof value !== 'undefined') {
        httpParams = httpParams.append(key, value);
      }
    });

    return httpParams;
  }

  private convertToFormData(data: object, isNested: boolean = false): FormData {
    const formData = new FormData();
    forOwn(data, (objectValue: any, objectKey) => {
      const appendKey = (isNested) ? `[${objectKey}]` : objectKey;
      if (objectValue instanceof File) {
        formData.append(appendKey, objectValue, objectValue.name);
      } else if (typeof objectValue === 'object') {
        const formattedObject = this.convertToFormData(objectValue, true);
        formattedObject.forEach((formDataValue, formDataKey) => {
          formData.append(`${appendKey}${formDataKey}`, formDataValue);
        });
      } else if (typeof objectValue !== 'undefined') {
        formData.append(appendKey, objectValue);
      }
    });

    return formData;
  }

  private hasFiles(data: any): boolean {
    return typeof data === 'object'
      && keys(data).some((key) => this.fileKeys.includes(key));
  }
}
