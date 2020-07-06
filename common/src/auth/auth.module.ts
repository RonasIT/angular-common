import { ApiService } from '../api';
import { AuthConfig } from './config';
import { AuthenticatedGuard, UnauthenticatedGuard } from './guards';
import { AuthService } from './auth.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  JWT_OPTIONS,
  JwtHelperService,
  JwtInterceptor,
  JwtModule
} from '@auth0/angular-jwt';
import { jwtOptionsFactory } from './factories';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TokenExpiredInterceptor } from './interceptors';

@NgModule({
  imports: [
    HttpClientModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [AuthConfig, AuthService]
      }
    }),
    RouterModule
  ],
  providers: [
    AuthenticatedGuard,
    UnauthenticatedGuard,
    JwtInterceptor,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenExpiredInterceptor,
      deps: [ApiService, AuthService, JwtHelperService, JwtInterceptor],
      multi: true
    }
  ]
})
export class AuthModule {
  static forRoot(config: AuthConfig): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
        { provide: AuthConfig, useValue: config },
        { provide: AuthService, useExisting: config.authService }
      ]
    };
  }
}
