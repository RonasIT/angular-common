import { AbstractUser } from '../../user';
import { ApiService } from '../../api';
import { AuthService } from '../auth.service';
import { JwtExceptions } from '../enums';
import {
  catchError,
  share,
  switchMap
} from 'rxjs/operators';
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
    private apiService: ApiService,
    private authConfig: AuthConfig,
    private authService: AuthService<AbstractUser>
  ) { }

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(request)
      .pipe(
        catchError((response: HttpErrorResponse) => {
          if (
            response.status === HttpStatusCode.Unauthorized &&
            response.error.error === JwtExceptions.TOKEN_EXPIRED &&
            !this.authConfig.unauthorizedRoutes.includes(response.url)
          ) {
            return this.authService
              .refreshToken()
              .pipe(
                switchMap(() => next.handle(request))
              );
          }

          return throwError(response);
        })
      );
  }
}
