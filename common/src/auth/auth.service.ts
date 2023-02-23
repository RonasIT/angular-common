import { AuthConfig } from './config';
import { AuthCredentials, AuthResponse } from './models';
import { AbstractUser, UserService } from '../user';
import { ApiService } from '../api';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { finalize, map, share, switchMap, tap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { instanceToPlain } from 'class-transformer';
import { CookieService } from '../cookie';

@Injectable()
export class AuthService<User extends AbstractUser> {
  public static DEFAULT_LOGIN_ENDPOINT: string = '/login';
  public static DEFAULT_UNAUTHENTICATED_ROUTE: string = '/';
  public static DEFAULT_IS_AUTHENTICATED_FIELD: string = 'is_authenticated';
  public static DEFAULT_REFRESH_TOKEN_ENDPOINT: string = '/auth/refresh';
  public static DEFAULT_REMEMBER_FIELD: string = 'remember';
  public static DEFAULT_COOKIES_EXPIRATION_DAYS: number = 365;

  public get isTokenRefreshing$(): Observable<boolean> {
    return this._isTokenRefreshing$;
  }

  public get isAuthenticated$(): Observable<boolean> {
    return this._isAuthenticated$;
  }

  /**
   * @deprecated Please use TTL and Refresh TTL values from the backend instead of a hardcoded expiration time.
   */
  public get defaultCookiesExpiresDate(): Date {
    return new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * (this.authConfig.cookiesExpirationDays ?? AuthService.DEFAULT_COOKIES_EXPIRATION_DAYS));
  }

  protected _isAuthenticated$: Observable<boolean>;
  protected _isTokenRefreshing$: Observable<boolean>;

  protected isAuthenticatedSubject: BehaviorSubject<boolean>;
  protected isTokenRefreshingSubject: BehaviorSubject<boolean>;

  protected apiService: ApiService;
  protected authConfig: AuthConfig;
  protected router: Router;
  protected userService: UserService<User>;
  protected cookieService: CookieService;

  private refreshTokenResponse$: Observable<HttpResponse<AuthResponse<User>>> | null;

  constructor() {
    this.apiService = inject(ApiService);
    this.authConfig = inject(AuthConfig);
    this.router = inject(Router);
    this.userService = inject(UserService);
    this.cookieService = inject(CookieService);

    const isAuthenticated = this.getIsAuthenticatedFromStorage();

    this.isAuthenticatedSubject = new BehaviorSubject(isAuthenticated);
    this._isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    this.isTokenRefreshingSubject = new BehaviorSubject(false);
    this._isTokenRefreshing$ = this.isTokenRefreshingSubject.asObservable();
  }

  public authorize<T>(credentials: AuthCredentials & T, remember: boolean = true): Observable<AuthResponse<User>> {
    return this.apiService
      .post<object>(this.authConfig.loginEndpoint ?? AuthService.DEFAULT_LOGIN_ENDPOINT, {
        ...instanceToPlain(credentials),
        remember: +remember
      })
      .pipe(
        switchMap((response) => this.manuallyAuthorize(response, remember))
      );
  }

  public manuallyAuthorize(_authResponse: object, remember: boolean = true): Observable<AuthResponse<User>> {
    return of(_authResponse)
      .pipe(
        map((response) => this.getAuthResponse(response)),
        tap((authResponse) => {
          this.setIsAuthenticated(authResponse, remember);
          this.userService.setProfile(authResponse.user);
        })
      );
  }

  public unauthorize(): void {
    this.resetIsAuthenticated();
    this.resetRemember();
    this.userService.resetProfile();

    if (!this.authConfig.disableRedirectAfterUnauthorize) {
      this.router.navigate([this.authConfig.unauthenticatedRoute ?? AuthService.DEFAULT_UNAUTHENTICATED_ROUTE]);
    }
  }

  public refreshToken(): Observable<HttpResponse<AuthResponse<User>>> {
    if (this.refreshTokenResponse$) {
      return this.refreshTokenResponse$;
    }

    this.isTokenRefreshingSubject.next(true);

    const method = this.authConfig.refreshTokenEndpointMethod ?? 'get';

    this.refreshTokenResponse$ = this.apiService[method]<HttpResponse<AuthResponse<User>>>
      (
        this.authConfig.refreshTokenEndpoint ?? AuthService.DEFAULT_REFRESH_TOKEN_ENDPOINT,
        {},
        {
          observe: 'response'
        }
      )
      .pipe(
        share(),
        tap((response) => {
          const authResponse = this.getAuthResponse(response.body);
          const remember = this.getRemember();

          this.setIsAuthenticated(authResponse, remember);
        }),
        finalize(() => {
          this.refreshTokenResponse$ = null;
          this.isTokenRefreshingSubject.next(false);
        })
      );

    return this.refreshTokenResponse$;
  }

  public setIsAuthenticated(authResponse: AuthResponse<User>, remember: boolean = true): void {
    this.setRemember(authResponse, remember);
    this.cookieService.put(this.authConfig.isAuthenticatedField ?? AuthService.DEFAULT_IS_AUTHENTICATED_FIELD, 'true', {
      expires: this.getExpiresForCookies(authResponse, remember)
    });

    this.isAuthenticatedSubject.next(true);
  }

  public resetIsAuthenticated(): void {
    this.cookieService.remove(this.authConfig.isAuthenticatedField ?? AuthService.DEFAULT_IS_AUTHENTICATED_FIELD);

    this.isAuthenticatedSubject.next(false);
  }

  public resetRemember(): void {
    this.cookieService.remove(this.authConfig.rememberField ?? AuthService.DEFAULT_REMEMBER_FIELD);
  }

  private getIsAuthenticatedFromStorage(): boolean {
    const isAuthenticated = this.cookieService.get(this.authConfig.isAuthenticatedField ?? AuthService.DEFAULT_IS_AUTHENTICATED_FIELD);

    return isAuthenticated === 'true';
  }

  private getRemember(): boolean {
    const remember = this.cookieService.get(this.authConfig.rememberField ?? AuthService.DEFAULT_REMEMBER_FIELD);

    return remember === 'true';
  }

  private setRemember(authResponse: AuthResponse<User>, remember: boolean): void {
    this.cookieService.put(this.authConfig.rememberField ?? AuthService.DEFAULT_REMEMBER_FIELD, String(remember), {
      expires: this.getExpiresForCookies(authResponse, remember)
    });
  }

  private getAuthResponse(response: object): AuthResponse<User> {
    return new AuthResponse<User>({
      ...response,
      user: this.userService.plainToUser(response['user'], { groups: ['main'] })
    });
  }

  private getExpiresForCookies(authResponse: AuthResponse<User>, remember: boolean): Date {
    return (remember)
      ? (authResponse.ttl && authResponse.refresh_ttl)
        ? this.getCurrentDatePlusMinutes(authResponse.ttl + authResponse.refresh_ttl)
        : this.defaultCookiesExpiresDate
      : null;
  }

  private getCurrentDatePlusMinutes(minutes: number): Date {
    return new Date(new Date().getTime() + minutes * 60000); // 60,000 milliseconds in a minute;
  }
}
