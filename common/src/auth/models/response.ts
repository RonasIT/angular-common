import { AbstractUser } from '../../user';

export class AuthResponse<User extends AbstractUser> {
  public user?: User;

  constructor(authResponse?: Partial<AuthResponse<User>>) {
    Object.assign(this, authResponse);
  }
}
