import { AuthConfig } from './config';
import { AuthCredentials, AuthResponse } from './models';
import { RefreshTokenMode } from './enums';
import { AbstractUser, UserService } from '../user';
import { ApiService } from '../api';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class AuthService<User extends AbstractUser> {
  public get token$(): Observable<string> {
    return this._token$;
  }

  public get isTokenRefreshing$(): Observable<boolean> {
    return this._isTokenRefreshing$;
  }

  public get isAuthenticated$(): Observable<boolean> {
    return this._token$.pipe(
      map((token) => !!token)
    );
  }

  protected _token$: Observable<string>;
  protected _isTokenRefreshing$: Observable<boolean>;

  protected tokenSubject: BehaviorSubject<string>;
  protected isTokenRefreshingSubject: BehaviorSubject<boolean>;

  constructor(
    protected apiService: ApiService,
    protected authConfig: AuthConfig,
    protected router: Router,
    protected userService: UserService<User>
  ) {
    this.tokenSubject = new BehaviorSubject(localStorage.getItem('token'));
    this._token$ = this.tokenSubject.asObservable();

    this.isTokenRefreshingSubject = new BehaviorSubject(false);
    this._isTokenRefreshing$ = this.isTokenRefreshingSubject.asObservable();
  }

  public authorize(credentials: AuthCredentials): Observable<AuthResponse<User>> {
    return this.apiService
      .post<AuthResponse<User>>(this.authConfig.loginEndpoint ?? '/login', credentials)
      .pipe(
        map((response) => new AuthResponse<User>({
          ...response,
          user: this.userService.plainToUser(response?.user, { groups: ['main'] })
        })),
        tap((response) => {
          this.setToken(response.token);
          this.userService.setProfile(response.user);
        })
      );
  }

  public unauthorize(): void {
    this.resetToken();
    this.userService.resetProfile();

    this.router.navigate([this.authConfig.unauthenticatedRoute ?? '/login']);
  }

  public refreshToken(): Observable<HttpResponse<void>> {
    this.isTokenRefreshingSubject.next(true);

    return this.apiService
      .get<HttpResponse<void>>(this.authConfig.refreshTokenEndpoint ?? '/auth/refresh', {}, {
        observe: 'response'
      })
      .pipe(
        tap((response) => {
          const refreshTokenMode = this.authConfig.refreshTokenMode ?? RefreshTokenMode.HEADER;
          const token = (refreshTokenMode === RefreshTokenMode.HEADER)
            ? response.headers.get(this.authConfig.refreshTokenNewTokenField ?? 'Authorization').split(' ')[1]
            : response.body[this.authConfig.refreshTokenNewTokenField ?? 'token'];

          this.setToken(token);

          this.isTokenRefreshingSubject.next(false);
        }),
        catchError((error) => {
          this.isTokenRefreshingSubject.next(false);

          return throwError(error);
        })
      );
  }

  public setToken(token: string): void {
    localStorage.setItem('token', token);
    this.tokenSubject.next(token);
  }

  public resetToken(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }
}
