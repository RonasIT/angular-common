import { AbstractUser } from '../../user';

export class AuthResponse<User extends AbstractUser> {
  public ttl?: number;
  public refresh_ttl?: number;
  public user?: User;

  constructor(authResponse?: Partial<AuthResponse<User>>) {
    Object.assign(this, authResponse);
  }
}
