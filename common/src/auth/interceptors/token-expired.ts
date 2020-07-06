import { AbstractUser } from '../../user';
import { ApiService } from '../../api';
import { AuthService } from '../auth.service';
import {
  catchError,
  filter,
  mapTo,
  switchMap,
  take,
  withLatestFrom
} from 'rxjs/operators';
import {
  EMPTY,
  Observable,
  of,
  throwError
} from 'rxjs';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isNull } from 'lodash';
import { JwtExceptions } from '../enums';
import { JwtHelperService, JwtInterceptor } from '@auth0/angular-jwt';

@Injectable()
export class TokenExpiredInterceptor implements HttpInterceptor {
  constructor(
    private apiService: ApiService,
    private authService: AuthService<AbstractUser>,
    private jwtHelperService: JwtHelperService,
    private jwtInterceptor: JwtInterceptor
  ) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.shouldInterceptRequest(request)) {
      return next.handle(request);
    }

    return this.authService.token$
      .pipe(
        take(1),
        switchMap((token) => {
          if (!this.shouldRefreshToken(token) || this.isRefreshTokenRequest(request)) {
            return next.handle(request);
          }

          return this.refreshTokenAndHandleRequest(request, next);
        }),
        catchError((response: HttpErrorResponse) => {
          if (response.status === 401) {
            if (response.error.error === JwtExceptions.TOKEN_EXPIRED) {
              return this.refreshTokenAndHandleRequest(request, next);
            }

            this.authService.unauthorize();
          }

          return throwError(response);
        })
      );
  }

  private shouldInterceptRequest(request: HttpRequest<any>): boolean {
    return this.jwtInterceptor.isWhitelistedDomain(request) &&
      !this.jwtInterceptor.isBlacklistedRoute(request);
  }

  private isRefreshTokenRequest(request: HttpRequest<any>): boolean {
    return request.url === `${this.apiService.apiUrl}/auth/refresh`;
  }

  private shouldRefreshToken(token: string): boolean {
    return !!token && this.jwtHelperService.isTokenExpired(token);
  }

  private refreshTokenAndHandleRequest(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.isTokenRefreshing$
      .pipe(
        withLatestFrom(this.authService.token$),
        take(1),
        switchMap(([isTokenRefreshing, token]) => {
          if (isTokenRefreshing) {
            return of(token);
          }

          return this.authService.refreshToken()
            .pipe(mapTo(token));
        }),
        switchMap((token) => {
          return this.authService.token$
            .pipe(
              filter((newToken) => newToken !== token),
              take(1),
              switchMap((token) => {
                if (isNull(token)) {
                  return EMPTY;
                }

                return this.jwtInterceptor.intercept(request, next);
              })
            );
        })
      );
  }
}
