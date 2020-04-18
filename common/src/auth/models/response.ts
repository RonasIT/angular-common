import { AbstractUser } from '../../user';

export class AuthResponse<User extends AbstractUser> {
  public token: string;
  public user: User;
  public ttl?: number;
  public refresh_ttl?: number;

  constructor(authResponse?: Partial<AuthResponse<User>>) {
    Object.assign(this, authResponse);
  }
}
