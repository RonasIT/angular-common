import { AbstractUser } from '../../user';
import { AuthConfig } from '../config';
import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';

export function jwtOptionsFactory(config: AuthConfig, authService: AuthService<AbstractUser>): object {
  return {
    tokenGetter: () => {
      return authService.token$
        .pipe(take(1))
        .toPromise();
    },
    whitelistedDomains: config.whitelistedDomains,
    blacklistedRoutes: config.unauthorizedRoutes
  };
}
