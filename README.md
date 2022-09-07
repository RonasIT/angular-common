# Ronas IT Angular Common

Common Angular services for communicating with backend, authentication and user managing.

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

##### ApiConfig API

Name | Type | Required | Description
--- | --- | --- | ---
`apiUrl` | `string` | Yes | Endpoint that allows you to access an API
`trailingSlash` | `boolean` | No | The need for trailing slash (`https://api.your-service.com/login/` for example)
`enableArrayKeys` | `boolean` | No | Enabling array keys for http params
`fileKeys` | `Array<string>` | 290 | List of the file keys for http params

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

_Note: This module depends on `ApiModule` and `UserModule`. Please make sure to
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
      allowedDomains: configuration.api.allowed_domains,
      disallowedRoutes: configuration.api.disallowed_routes,
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

##### AuthConfig API

Name | Type | Required | Description
--- | --- | --- | ---
`unauthorizedRoutes` | `Array<string>` | Yes | Routes that don't need authorization (public routes, e.g. login, registration and forgot password pages)
`authService` | `Function` | Yes | 290
`unauthenticatedRoute` | `string` | No | Route to redirect to after logout or when a user is not authenticated to view some page. By default it is set to `/login`
`authenticatedRoute` | `string` | No | Route to redirect after successful login
`loginEndpoint` | `string` | No |
`refreshTokenEndpoint` | `string` | No |
`refreshTokenEndpointMethod` | `'get' \| 'post'` | No |
`isAuthenticatedField` | `string` | No | Field for cookie
`rememberField` | `string` | No | Field for cookie

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
