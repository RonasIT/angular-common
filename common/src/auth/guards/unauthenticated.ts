import { AbstractUser } from '../../user';
import { AuthService } from '../auth.service';
import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class UnauthenticatedGuard implements CanActivate {
  constructor(
    private authService: AuthService<AbstractUser>,
    private router: Router
  ) {}

  public canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$
      .pipe(
        tap((isAuthenticated) => {
          if (isAuthenticated) {
            this.router.navigate(['/']);
          }
        }),
        map((isAuthenticated) => !isAuthenticated)
      );
  }
}
