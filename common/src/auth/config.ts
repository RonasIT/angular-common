export class AuthConfig {
  public unauthorizedRoutes: Array<string>;
  public authService: any;
  public unauthenticatedRoute?: string;
  public disableRedirectAfterUnauthorize?: boolean;
  public authenticatedRoute?: string;
  public loginEndpoint?: string;
  public refreshTokenEndpoint?: string;
  public refreshTokenEndpointMethod?: 'get' | 'post';
  public isAuthenticatedField?: string;
  public rememberField?: string;
}
