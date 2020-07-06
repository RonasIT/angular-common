import { Expose } from 'class-transformer';

export class UserPasswords {
  @Expose({ name: 'old_password' })
  public currentPassword: string;

  public password: string;
  public confirm: string;
}
