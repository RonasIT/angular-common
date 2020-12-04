export class AuthCredentials {
  public email?: string;
  public password: string;

  constructor(authCredentials?: Partial<AuthCredentials>) {
    Object.assign(this, authCredentials);
  }
}
