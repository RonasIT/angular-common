import { AuthConfig } from './config';
import { AuthenticatedGuard, UnauthenticatedGuard } from './guards';
import { AuthService } from './auth.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { TokenExpiredInterceptor } from './interceptors';

@NgModule({
  providers: [
    AuthenticatedGuard,
    UnauthenticatedGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenExpiredInterceptor,
      deps: [AuthConfig, AuthService],
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
