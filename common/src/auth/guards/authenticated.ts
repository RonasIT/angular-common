import { AbstractUser } from '../../user';
import { AuthConfig } from '../config';
import { AuthService } from '../auth.service';
import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private authConfig: AuthConfig,
    private authService: AuthService<AbstractUser>,
    private router: Router
  ) { }

  public canActivate(): Observable<boolean> {
    return this.authService
      .isAuthenticated$
      .pipe(
        tap((isAuthenticated) => {
          if (!isAuthenticated) {
            this.router.navigate([this.authConfig.unauthenticatedRoute ?? '/login']);
          }
        }),
        map((isAuthenticated) => isAuthenticated)
      );
  }
}
