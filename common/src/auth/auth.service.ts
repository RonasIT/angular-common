import { AuthConfig } from './config';
import { AuthCredentials, AuthResponse } from './models';
import { RefreshTokenMode } from './enums';
import { AbstractUser, UserService } from '../user';
import { ApiService } from '../api';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { classToPlain } from 'class-transformer';

@Injectable()
export class AuthService<User extends AbstractUser> {
  public static DEFAULT_LOGIN_ENDPOINT: string = '/login';
  public static DEFAULT_UNAUTHENTICATED_ROUTE: string = '/';
  public static DEFAULT_TOKEN_FIELD: string = 'token';
  public static DEFAULT_REFRESH_TOKEN_FIELD: string = 'refresh_token';
  public static DEFAULT_REFRESH_TOKEN_ENDPOINT: string = '/auth/refresh';

  public get token$(): Observable<string> {
    return this._token$;
  }

  public get refreshToken$(): Observable<string> {
    return this._refreshToken$;
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
  protected _refreshToken$: Observable<string>;

  protected tokenSubject: BehaviorSubject<string>;
  protected refreshTokenSubject: BehaviorSubject<string>;
  protected isTokenRefreshingSubject: BehaviorSubject<boolean>;

  protected apiService: ApiService;
  protected authConfig: AuthConfig;
  protected router: Router;
  protected userService: UserService<User>;

  constructor(
    protected injector: Injector
  ) {
    this.apiService = this.injector.get(ApiService);
    this.authConfig = this.injector.get(AuthConfig);
    this.router = this.injector.get(Router);
    this.userService = this.injector.get(UserService);

    const [token, refreshToken] = this.getTokensFromStorage();

    this.tokenSubject = new BehaviorSubject(token);
    this._token$ = this.tokenSubject.asObservable();

    this.refreshTokenSubject = new BehaviorSubject(refreshToken);
    this._refreshToken$ = this.refreshTokenSubject.asObservable();

    this.isTokenRefreshingSubject = new BehaviorSubject(false);
    this._isTokenRefreshing$ = this.isTokenRefreshingSubject.asObservable();
  }

  public authorize<T>(credentials: AuthCredentials & T, remember: boolean = true): Observable<AuthResponse<User>> {
    return this.apiService
      .post<object>(this.authConfig.loginEndpoint ?? AuthService.DEFAULT_LOGIN_ENDPOINT, classToPlain(credentials))
      .pipe(
        switchMap((response) => this.manuallyAuthorize(response, remember))
      );
  }

  public manuallyAuthorize(authResponse: object, remember: boolean = true): Observable<AuthResponse<User>> {
    return of(authResponse)
      .pipe(
        map((response) => new AuthResponse<User>({
          token: response[this.authConfig.tokenField ?? AuthService.DEFAULT_TOKEN_FIELD],
          refreshToken: response[this.authConfig.refreshTokenField ?? AuthService.DEFAULT_REFRESH_TOKEN_FIELD],
          user: this.userService.plainToUser(response['user'], { groups: ['main'] })
        })),
        tap((authResponse) => {
          this.setToken(authResponse.token, authResponse.refreshToken, remember);
          this.userService.setProfile(authResponse.user);
        })
      );
  }

  public unauthorize(): void {
    this.resetTokens();
    this.resetRemember();
    this.userService.resetProfile();

    this.router.navigate([this.authConfig.unauthenticatedRoute ?? AuthService.DEFAULT_UNAUTHENTICATED_ROUTE]);
  }

  public refreshToken(): Observable<HttpResponse<void>> {
    this.isTokenRefreshingSubject.next(true);

    return this
      .refreshToken$
      .pipe(
        take(1),
        switchMap((refreshToken) => {
          const data = {};
          if (refreshToken) {
            data[this.authConfig.refreshTokenField ?? AuthService.DEFAULT_REFRESH_TOKEN_FIELD] = refreshToken;
          }

          const method = this.authConfig.refreshTokenEndpointMethod ?? 'get';

          return this.apiService[method]
            <HttpResponse<void>>(
              this.authConfig.refreshTokenEndpoint ?? AuthService.DEFAULT_REFRESH_TOKEN_ENDPOINT,
              data,
              {
                observe: 'response'
              }
            )
            .pipe(
              tap((response) => {
                const refreshTokenMode = this.authConfig.refreshTokenMode ?? RefreshTokenMode.HEADER;
                const token = (refreshTokenMode === RefreshTokenMode.HEADER)
                  ? response.headers.get('Authorization').split(' ')[1]
                  : response.body[this.authConfig.tokenField ?? AuthService.DEFAULT_TOKEN_FIELD];

                const remember = this.getRemember();

                this.setToken(token, undefined, remember);
                this.isTokenRefreshingSubject.next(false);
              }),
              catchError((error) => {
                this.isTokenRefreshingSubject.next(false);

                return throwError(error);
              })
            )
        })
      );
  }

  public setToken(token: string, refreshToken?: string, remember: boolean = true): void {
    const storage = (remember) ? localStorage : sessionStorage;

    storage.setItem('remember', String(remember));

    storage.setItem(this.authConfig.tokenField ?? AuthService.DEFAULT_TOKEN_FIELD, token);
    this.tokenSubject.next(token);

    if (refreshToken) {
      storage.setItem(this.authConfig.refreshTokenField ?? AuthService.DEFAULT_REFRESH_TOKEN_FIELD, refreshToken);
      this.refreshTokenSubject.next(refreshToken);
    }
  }

  public resetTokens(): void {
    localStorage.removeItem(this.authConfig.tokenField ?? AuthService.DEFAULT_TOKEN_FIELD);
    sessionStorage.removeItem(this.authConfig.tokenField ?? AuthService.DEFAULT_TOKEN_FIELD);
    this.tokenSubject.next(null);

    localStorage.removeItem(this.authConfig.refreshTokenField ?? AuthService.DEFAULT_REFRESH_TOKEN_FIELD);
    sessionStorage.removeItem(this.authConfig.refreshTokenField ?? AuthService.DEFAULT_REFRESH_TOKEN_FIELD);
    this.refreshTokenSubject.next(null);
  }

  public resetRemember(): void {
    localStorage.removeItem('remember');
    sessionStorage.removeItem('remember');
  }

  public getTokensFromStorage(): [string, string] {
    let token = localStorage.getItem(this.authConfig.tokenField ?? AuthService.DEFAULT_TOKEN_FIELD);
    if (!token) {
      token = sessionStorage.getItem(this.authConfig.tokenField ?? AuthService.DEFAULT_TOKEN_FIELD);
    }

    let refreshToken = localStorage.getItem(this.authConfig.refreshTokenField ?? AuthService.DEFAULT_REFRESH_TOKEN_FIELD);
    if (!refreshToken) {
      refreshToken = sessionStorage.getItem(this.authConfig.refreshTokenField ?? AuthService.DEFAULT_REFRESH_TOKEN_FIELD);
    }

    return [token, refreshToken];
  }

  public getRemember(): boolean {
    let remember = localStorage.getItem('remember');
    if (!remember) {
      remember = sessionStorage.getItem('remember');
    }

    return remember === 'true';
  }
}
