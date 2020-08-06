import { RefreshTokenMode } from './enums';

export class AuthConfig {
  public allowedDomains: Array<string>;
  public disallowedRoutes: Array<string>;
  public authService: Function;
  public unauthenticatedRoute?: string;
  public loginEndpoint?: string;
  public refreshTokenEndpoint?: string;
  public refreshTokenMode?: RefreshTokenMode;
  public tokenField?: string;
  public refreshTokenField: string;
}
