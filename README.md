# Ronas IT Angular Common

Common Angular services for communicating with backend, authentication and user managing.

## Live demo

In progress...

## About the library

__Ronas IT Angular Common__ working with cookies. One of the main advantages of this approach is that cookies can be HTTP-only. It makes them read-protected on the client side, that improves safety against any Cross-site scripting (XSS) attacks. Cookie-based authentication allows using this services in Server-Side Rendering (SSR) applications.

## Getting Started

### Installation

Install Ronas IT Angular Common:

```bash
npm i @ronas-it/angular-common --save
```

### Usage

#### ApiModule

1. Add `ApiModule` to `AppModule` imports:

```ts
import { ApiModule } from '@ronas-it/angular-common';
import { configuration } from '@configuration';

@NgModule({
  imports: [
    ApiModule.forRoot({
      apiUrl: configuration.api.url
    }),
    ...
  ],
  ...
})
export class AppModule { }
```

2. Inject `ApiService` and use it:

```ts
import { ApiService } from '@ronas-it/angular-common';
import { Injectable } from '@angular/core';

@Injectable()
export class ProductService {
  constructor(
    private apiService: ApiService
  ) { }

  public delete(id: number): Observable<void> {
    return this.apiService.delete(`/products/${id}`);
  }

  ...
}
```

#### CookieModule

1. Add `CookieModule` to `AppModule` imports:

```ts
import { CookieModule } from '@ronas-it/angular-common';

@NgModule({
  imports: [
    CookieModule.forRoot({
      defaultOptions: { path: '/', /* other cookie options ... */ }
    }),
    ...
  ],
  ...
})
export class AppModule { }
```

2. Inject `CookieService` and use it:

```ts
import { BehaviorSubject, Subject } from 'rxjs';
import { CookieService } from '@ronas-it/angular-common';
import { Injectable } from '@angular/core';

@Injectable()
export class CookiePopupFacade {
  private isCookiesAccepted$: Subject<boolean>;

  constructor(
    private cookieService: CookieService
  ) { 
    this.isCookiesAccepted$ = new BehaviorSubject(this.cookieService.get('isCookiesAccepted') === 'true');
  }

  public acceptCookies(): void {
    this.isCookiesAccepted$.next(true);

    this.cookieService.put('isCookiesAccepted', 'true', { maxAge: 4e10 });
  }

  ...
}
```

3. (SSR Only) Add providers for `REQUEST` and `RESPONSE` injection tokens from
`@nguniversal/express-engine/tokens` in `server.ts`:

```ts
server.get('*', (req, res) => {
  res.render(indexHtml, {
    req,
    res,
    providers: [
      {
        provide: APP_BASE_HREF,
        useValue: req.baseUrl
      },
      {
        provide: REQUEST,
        useValue: req
      },
      {
        provide: RESPONSE,
        useValue: res
      }
    ]
  });
});
```

4. (SSR Only) Set `requestToken` and `responseToken` parameters in the `CookieModule` config:

```ts
import { CookieModule } from '@ronas-it/angular-common';
import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';

@NgModule({
  imports: [
    CookieModule.forRoot({
      defaultOptions: { /* ... */ },
      requestToken: REQUEST,
      responseToken: RESPONSE
    }),
    ...
  ],
  ...
})
export class AppModule { }
```

#### UserModule

_Note: This module depends on `ApiModule` and `AuthModule`. Please make sure to
install them prior to installing this module._

1. Create a `User` model and extend it from `AbstractUser`:

```ts
import { AbstractUser } from '@ronas-it/angular-common';
import { Expose } from 'class-transformer';

export class User extends AbstractUser {
  @Expose({ groups: ['main'] })
  public id: number;

  @Expose({ groups: ['main'] })
  public name: string;

  @Expose({ groups: ['main'] })
  public email: string;
}
```

2. Create a `UserService` and extend it from `CommonUserService`:

```ts
import { UserService as CommonUserService } from '@ronas-it/angular-common';

@Injectable()
export class UserService extends CommonUserService<User> {
  /* Define custom methods or override existing methods here. */
}
```

3. Create a `UserModule` and add `CommonUserModule` to imports:

```ts
import { NgModule } from '@angular/core';
import { User } from './models';
import { UserModule as CommonUserModule } from '@ronas-it/angular-common';
import { UserService } from './user.service';

@NgModule({
  imports: [
    CommonUserModule.forRoot({
      userModel: User,
      userService: UserService
    }),
    ...
  ],
  ...
})
export class UserModule { }
```

4. Inject `UserService` and use it:

```ts
import { Action } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthService } from '@shared/auth';
import { catchError, filter, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models';
import { userActions } from './actions';
import { UserService } from '../user.service';

@Injectable()
export class UserEffects {
  public refreshProfile$: Observable<Action> = createEffect(
    () => this.actions$.pipe(
      ofType(userActions.refreshProfile),
      withLatestFrom(this.authService.isAuthenticated$),
      filter(([_, isAuthenticated]) => isAuthenticated),
      switchMap(() => {
        return this.userService.refreshProfile()
          .pipe(
            mergeMap((user: User) => [
              userActions.updateProfile({ profile: user }),
              userActions.refreshProfileSuccess()
            ]),
            catchError((response: HttpErrorResponse) => of(userActions.refreshProfileFailure({ response })))
          );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private userService: UserService
  ) { }
}
```

#### AuthModule

_Note: This module depends on `ApiModule`, `CookieModule` and `UserModule`. Please make sure to
install them prior to installing this module._

1. Create an `AuthService` and extend it from `CommonAuthService`:

```ts
import { AuthService as CommonAuthService } from '@ronas-it/angular-common';
import { Injectable } from '@angular/core';
import { User } from '@shared/user';

@Injectable()
export class AuthService extends CommonAuthService<User> {
  /* Define custom methods or override existing methods here. */
}
```

2. Create an `AuthModule` and add `CommonAuthModule` to imports:

```ts
import { AuthModule as CommonAuthModule } from '@ronas-it/angular-common';
import { AuthService } from './auth.service';
import { configuration } from '@configuration';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [
    CommonAuthModule.forRoot({
      unauthorizedRoutes: configuration.api.unauthorized_routes,
      authService: AuthService,

      // Optionally, you can pass `unauthenticatedRoute` parameter that
      // specifies the route to redirect to after logout or when a user is
      // not authenticated to view some page. By default it is set to `/login`.
      unauthenticatedRoute: '/'
    }),
    ...
  ],
  ...
})
export class AuthModule { }
```

3. Inject `AuthService` and use it:

```ts
import { Action } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { authActions } from './actions';
import { AuthService } from '../auth.service';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class AuthEffects {
  public authorize$: Observable<Action> = createEffect(
    () => this.actions$.pipe(
      ofType(authActions.authorize),
      exhaustMap((action) => {
        return this.authService
          .authorize(action.credentials)
          .pipe(
            map((response) => authActions.authSuccess({ response })),
            catchError((response) => of(authActions.authFailure({ response })))
          );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService
  ) { }
}
```

## API

### ApiModule

#### Config

```ts
ApiModule.forRoot(config: ApiConfig)
```

##### ApiConfig

Name | Type | Required | Description
--- | --- | --- | ---
`apiUrl` | `string` | Yes | Endpoint that allows you to access an API
`trailingSlash` | `boolean` | No | The need for trailing slash (`https://api.your-service.com/login/` for example)
`enableArrayKeys` | `boolean` | No | Enabling array keys for http params
`fileKeys` | `Array<string>` | No | List of the file keys for http params

#### ApiService

Field | Type
--- | --- 
`apiUrl` | `string`
`trailingSlash` | `string`
`fileKeys` | `Array<string>`

Method | Arguments | Return type
--- | --- | --- 
`get<T>` | `endpoint: string, params: any, options: object` | `Observable<T>` 
`post<T>` | `endpoint: string, data: any, options: object` | `Observable<T>` 
`put<T>` | `endpoint: string, data: any, options: object` | `Observable<T>` 
`delete<T>` | `endpoint: string, params: any, options: object` | `Observable<T>` 

### CookieModule

#### Config

```ts
CookieModule.forRoot(config: CookieConfig)
```

##### CookieConfig

Name | Type | Required | Description
--- | --- | --- | ---
`defaultOptions` | `CookieOptions` | No | Cookie options that will be used if not specified in the `put` method 
`requestToken` | `InjectionToken<Request>` | No | `Request` injection token from `@nguniversal/express-engine/tokens` for cookies support in SSR
`responseToken` | `InjectionToken<Response>` | No | `Response` injection token from `@nguniversal/express-engine/tokens` for cookies support in SSR

##### CookieOptions

Name | Type
--- | ---
`maxAge` | `number`
`expires` | `Date`
`path` | `string`
`domain` | `string`
`secure` | `boolean`
`sameSite` | `boolean \| 'lax' \| 'strict' \| 'none'`

#### CookieService\<TKey extends string = string>

Field | Type
--- | --- 
`cookieString` | `string`

Method | Arguments | Return type
--- | --- | --- 
`get` | `key: TKey` | `string \| null` 
`getObject` | `key: TKey` | `object \| null` 
`getAll` | | `Record<string, string>` 
`hasKey` | `key: TKey` | `boolean` 
`put` | `key: TKey, value: string, options?: CookieOptions` | `void`
`putObject` | `key: TKey, value: object, options?: CookieOptions` | `void`
`remove` | `key: TKey, options?: CookieOptions` | `void`
`removeAll` | `options?: CookieOptions` | `void`

### AuthModule

#### Config

```ts
CommonAuthModule.forRoot(config: AuthConfig)
```

##### AuthConfig

Name | Type | Required | Description
--- | --- | --- | ---
`unauthorizedRoutes` | `Array<string>` | Yes | Routes that don't need authorization (public routes, e.g. login, registration and forgot password pages)
`authService` | `new (...args: Array<any>) => any` | Yes | Service that will be used in your app
`unauthenticatedRoute` | `string` | No | Route to redirect to after logout or when a user is not authenticated to view some page. By default it is set to `/login`
`disableRedirectAfterUnauthorize` | `boolean` | No | Whether to redirect to `unauthenticatedRoute` after logout or when a user is not authenticated to view some page. By default it is set to `false`
`authenticatedRoute` | `string` | No | Route to redirect after successful login
`loginEndpoint` | `string` | No | Endpoint for login, e.g. `/api/token`
`refreshTokenEndpoint` | `string` | No | Endpoint for refreshing token, e.g. `/api/token/refresh`
`refreshTokenEndpointMethod` | `'get' \| 'post'` | No | HTTP Method that will be used for calling endpoint to refresh token
`isAuthenticatedField` | `string` | No | Field for cookie
`rememberField` | `string` | No | Field for cookie
`cookiesExpirationDays` | `number` | No | Expiration for authentication cookies when call authorize with remember flag set to true. By default it is set to 365

#### AuthService\<User extends AbstractUser>

Static constant | Type
--- | --- 
`DEFAULT_LOGIN_ENDPOINT` | `string`
`DEFAULT_UNAUTHENTICATED_ROUTE` | `string`
`DEFAULT_IS_AUTHENTICATED_FIELD` | `string`
`DEFAULT_REFRESH_TOKEN_ENDPOINT` | `string`
`DEFAULT_REMEMBER_FIELD` | `string`
`DEFAULT_COOKIES_EXPIRATION_DAYS` | `number`

Field | Type
--- | --- 
`isTokenRefreshing$` | `Observable<boolean>`
`isAuthenticated$` | `Observable<boolean>`
`cookiesExpiresDate` | `Date`

Method | Arguments | Return type
--- | --- | --- 
`authorize<T>` | `credentials: AuthCredentials & T, remember: boolean` | `Observable<AuthResponse<User>>` 
`manuallyAuthorize` | `authResponse: object, remember: boolean = true` | `Observable<AuthResponse<User>>` 
`unauthorize` | | `void` 
`refreshToken` | | `Observable<HttpResponse<void>>` 
`setIsAuthenticated` | `remember: boolean` | `void`
`resetIsAuthenticated` | | `void`
`resetRemember` | | `void`

#### AuthCredentials

Field | Type | Required
--- | --- | ---
`email` | `string` | No
`password` | `string` | Yes

#### AuthResponse\<User extends AbstractUser>

Field | Type | Required
--- | --- | ---
`user` | `User` | No

### UserModule

#### Config

```ts
UserModule.forRoot(config: UserConfig)
```

##### UserConfig

Name | Type | Required | Description
--- | --- | --- | ---
`userModel` | `new (user: any) => any` | Yes | Model (class) for user
`userService` | `new (...args: Array<any>) => any` | Yes | Your UserService implementation
`profileRelations` | `Array<string>` | No | Relations for getting profile request. For example: `/profile?with[]=company&with[]=clients`
`profileRelationsKey` | `string` | No | `with` by default

#### UserService\<User extends AbstractUser>

Field | Type
--- | --- 
`profile$` | `Observable<User>`

Method | Arguments | Return type
--- | --- | --- 
`refreshProfile` | | `Observable<User>` 
`loadProfile` | | `Observable<User>` 
`updateProfile` | `user: User` | `Observable<void>` 
`updatePassword` | `userPasswords: UserPasswords` | `Observable<void>` 
`setProfile` | `user: User` | `void`
`patchProfile` | `user: Partial<User>` | `void`
`resetRemember` | | `void`
`resetProfile` | | `void`
`userToPlain` | `user: User, options?: ClassTransformOptions` | `Object`
`plainToUser` | `plain: object, options?: ClassTransformOptions` | `User` 

#### AbstractUser

Field | Type | Required
--- | --- | ---
`id` | `number \| string` | Yes

## Contributing

Contributions to Ronas IT Angular Common are welcome. The contribution guide can be found in the [Contributing guide](CONTRIBUTING.md).

## License

Ronas IT Angular Common is open-sourced software licensed under the [MIT license](LICENSE).

