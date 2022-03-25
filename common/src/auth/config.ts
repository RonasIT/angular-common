import { RefreshTokenMode } from './enums';

export class AuthConfig {
  public allowedDomains: Array<string>;
  public disallowedRoutes: Array<string | RegExp>;
  public authService: Function;
  public unauthenticatedRoute?: string;
  public authenticatedRoute?: string;
  public loginEndpoint?: string;
  public refreshTokenEndpoint?: string;
  public refreshTokenEndpointMethod?: 'get' | 'post';
  public refreshTokenMode?: RefreshTokenMode;
  public tokenField?: string;
  public refreshTokenField?: string;
}
