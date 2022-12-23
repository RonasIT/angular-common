import { AbstractUser } from '../../user';
import { AuthService } from '../auth.service';
import { JwtExceptions } from '../enums';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpStatusCode
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthConfig } from '../config';

@Injectable()
export class TokenExpiredInterceptor implements HttpInterceptor {
  constructor(
    private authConfig: AuthConfig,
    private authService: AuthService<AbstractUser>
  ) { }

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(request)
      .pipe(
        catchError((response: HttpErrorResponse) => {
          if (response.status === HttpStatusCode.Unauthorized &&
            !this.authConfig.unauthorizedRoutes.includes(response.url)
          ) {
            if (response.error.error === JwtExceptions.TOKEN_EXPIRED) {
              return this.authService
                .refreshToken()
                .pipe(
                  switchMap(() => next.handle(request))
                );
            }

            this.authService.unauthorize();
          }

          return throwError(response);
        })
      );
  }
}
